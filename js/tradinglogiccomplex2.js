function tradingLogicComplex2(traderId){
	return traders[traderId].generateOrder();
}

function updateTraders(){
	for(let i = 1; i < numTraders; ++i){
		const trader = traders[i];
		updateGiveUp(trader);
		updateCoolDown(trader);
		checkCancelOrders(trader);

		trader.updateStrategy();
	}
}

function checkCancelOrders(trader){
	//Go through all traders accounts and cancel their orders if certain condition are met.
		const id = trader.id;
		const acc = BROKER.accounts.get(id);

		if(acc){
			const openOrders = Math.abs(acc.openOrderSize) > 0;

			if(openOrders){
				const ask = orderbook.bestAsk();
				const bid = orderbook.bestBid();

				if(orderbook.halted){
					EXCHANGE.cancel(id, SYMBOL);
					BROKER.registerCancel(id);
					trader.recentBailout = true;
					//openOrder = acc.openOrderSize > 0;
					return;
				}

				//Cancel open orders if the current price is too far from a placed order.
				const lastPriceValid = orderbook.last;
				const lastPrice = orderbook.last.price;
				const openPrice = acc.openOrderPrice;

				const difference = lastPriceValid ? acc.openOrderSide == SHT ? ((lastPrice - openPrice) / openPrice) : ((openPrice - lastPrice) / openPrice) : 0;
				if(Math.abs(difference) >= 0.05){
					EXCHANGE.cancel(id, SYMBOL);
					BROKER.registerCancel(id);
					return;
				}

				const pos = acc.positions.get(SYMBOL);

				if(pos){

					//Cancel orders if risk tolerance is hit
					const gain = pos.side == BUY ? ((bid.price - pos.avgPriceIn) / pos.avgPriceIn) : ((pos.avgPriceIn - ask.price) / pos.avgPriceIn);
					if(gain <= -trader.riskTolerance){
						EXCHANGE.cancel(id, SYMBOL);
						BROKER.registerCancel(id);
						trader.recentBailout = true;
						return;
					}

					if(trader.giveUpTimer <= 0 && trader.recentBailout == false){
						EXCHANGE.cancel(id, SYMBOL);
						BROKER.registerCancel(id);
						trader.recentBailout = true;
						return;
					}

				}
			}
		
		}
}

function orderDipStrategy(){
	for(let i = 1; i < numTraders; ++i){
		const id = i;
		const trader = traders[id];
		const acc = BROKER.accounts.get(id);

		if(acc.openOrderSize == 0){
			
		}
	}
}

function updateGiveUp(trader){
	const acc = BROKER.accounts.get(trader.id);
	const pos = acc.positions.get(SYMBOL);

	const bid = orderbook.bestBid();
	const ask = orderbook.bestAsk();

	

	if(pos && bid && ask){	
		const previousCandle = orderbook.dataSeries[orderbook.dataSeries.length - 2];

		const gain = pos.side == BUY ? pos.calcGain(bid.price) : pos.calcGain(ask.price);

		if(previousCandle && ((pos.side == SEL && previousCandle.bearish()) || (pos.side == BUY && previousCandle.bullish()))){
			return;
		}

		trader.giveUpTimer -= gain < 0 ? UPDATE_SPEED : UPDATE_SPEED / 3;
	}
	

	
}

function updateResetBalance(trader){
	const acc = BROKER.accounts.get(trader.id);

	if(acc.getBuyingPower() <= 0){
		const bacc = BANK.accounts.get(trader.id);
		if(bacc){
			bacc.balance = 5000;
			acc.cashBuyingPower = bacc.balance;
		}
	}
		
}

function updateCoolDown(trader){
	trader.coolDownTimer -= UPDATE_SPEED;
}

function updateSentiment(){
	const dataSeries = orderbook.dataSeries;
	const len = dataSeries.length;
	const previousCandle = dataSeries[len - 1];

	if(previousCandle){
		if(previousCandle.bullish()){
			SENTIMENT = BUY;
		}
		else if(previousCandle.bearish()){
			SENTIMENT = SEL;
		}
	}
}

function updateSentiment2(){
	/*
		Update sentiment based on biggest candle in a range.
	*/

	const dataSeries = orderbook.dataSeries;
	const len = dataSeries.length;
	const lookback = 10;

	if(lookback <= len){

		//Find the biggest candle.
		const begin = len - lookback;
		let biggest = dataSeries[len - lookback];

		for(let i = begin + 1; i < len; ++i){
			const currentCandle = dataSeries[i];
			if(currentCandle.getMagnitude() > biggest.getMagnitude()){
				biggest = currentCandle;
			}
		}

		if(biggest.bullish()){
			SENTIMENT = BUY;
		}
		else if(biggest.bearish()){
			SENTIMENT = SEL;
		}
	}
}

function updateSentiment3(){
	const lookback = 6;

	const len = orderbook.dataSeries.length;
	const arr = orderbook.dataSeries.slice(len - lookback - 1, len - 2);
}

function updateBias(){
	const dataSeries = orderbook.dataSeries;
	const dataLen = dataSeries.length;
	const sampleRange = 10;

	if(dataLen >= sampleRange + 1){
		let greenCandles = 0; 
		let redCandles = 0;
		let flatCandles = 0;
		for(let c = dataLen - sampleRange - 1; c < dataLen - 1; ++c){
			const candle = dataSeries[c];
			
			if(candle && candle.open && candle.closep){
				const green = candle.bullish();
				const red = candle.bearish();

				if(green){
					greenCandles++;
				}
				else if(red){
					redCandles++;
				}
				else{
					flatCandles++;
				}
			}
		}
		const patternBullish = dataSeries[0].closep < dataSeries[dataLen - 1].closep ? 1 : 0;
		const patternBearish = patternBullish != 1 ? 1 : 0;

		const modifier = 1;
		const greenRatio = greenCandles / sampleRange;
		const redRatio = redCandles / sampleRange;
		const flatRatio = flatCandles / sampleRange;

		const greenParam = greenRatio * Math.PI / 2;
		const redParam = redRatio * Math.PI / 2;
		const flatParam = flatRatio * Math.PI / 2;

		//Sine: Trader bias goes with the apparent trend. Cosine: Trader bias goes against the apparent trend.
		const buyChance = Math.sin(greenParam * modifier);
		const sellChance = Math.sin(redParam * modifier);
		const flatChance = Math.sin(flatParam * modifier);

		for(let i = 1; i < numTraders; ++i){
			const trader = traders[i];
			trader.updateBias(buyChance, sellChance, flatChance);
		}
	}
}

function updateBias2(){
	const dataSeries = orderbook.dataSeries;
	const len = dataSeries.length;
	const sampleRange = 10;

	if(len >= sampleRange){
		const pat = new CandlePattern();
		pat.candles = dataSeries.slice(len - sampleRange, len);
		const gain = pat.gain();

		const threshold = 0.3;

		for(trader of traders){
			if(gain >= threshold){
				trader.updateBias(0.8, 0.25, 0);
			}
			else if(gain <= -threshold){
				trader.updateBias(0.25, 0.8, 0);
				
			}
			else{
				trader.updateBias(0, 0, 1);
			}
		}
		
	}

}

function updateBias3(){
	/*
		Update bias based on biggest candle in a range.
	*/

	const dataSeries = orderbook.dataSeries;
	const len = dataSeries.length;
	const lookback = 10;

	if(lookback <= len){

		//Find the biggest candle.
		const begin = len - lookback;
		let biggest = dataSeries[len - lookback];

		for(let i = begin + 1; i < len; ++i){
			const currentCandle = dataSeries[i];
			if(currentCandle.getRange() > biggest.getRange()){
				biggest = currentCandle;
			}
		}

		let bias = FLT;
		if(biggest.bullish()){
			bias = BUY;
		}
		else if(biggest.bearish()){
			bias = SEL;
		}

		for(trader of traders){
			if(bias == BUY)
				trader.updateBias(0.8, 0.2, 0);
			else if(bias == SEL){
				trader.updateBias(0.2, 0.8, 0);
			}
		}
	}
}