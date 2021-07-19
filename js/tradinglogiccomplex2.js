function tradingLogicComplex2(){

	const id = Math.trunc(RANDOM_RANGE(1, numTraders - 1));
	
	const bid = orderbook.bestBid();
	const ask = orderbook.bestAsk();
	const acc = BROKER.accounts.get(id);
	const trader = traders[id];
	const openOrders = acc.openOrderSize > 0;

	const sizes = [100, 250, 500, 1000];
	let price = 1.0;
	let size = sizes[Math.trunc(RANDOM_RANGE(0, 4))];
	let side = FLT;
	let type = LMT;

	var sentiment = Math.random() < generator.val ? SEL : BUY;

	if(acc){
		const pos = acc.positions.get(SYMBOL);

		if(pos){
			const gain = pos.side == BUY ? ((bid.price - pos.avgPriceIn) / pos.avgPriceIn) * 100 : ((pos.avgPriceIn - ask.price) / pos.avgPriceIn) * 100;
			if(openOrders){
				if(gain <= trader.riskTolerance){
					EXCHANGE.cancel(id, SYMBOL);
					BROKER.registerCancel(id);
				}
			}

			if(pos.side == BUY){
				if(gain <= -trader.riskTolerance){
					type = MKT;
				}
				else{
					price = pos.avgPriceIn + trader.profitTarget * pos.avgPriceIn;
				}
				side = SEL;
			}
			else{
				if(gain <= -trader.riskTolerance){
					type = MKT;
				}
				else{
					price = pos.avgPriceIn - trader.profitTarget * pos.avgPriceIn;
				}
				side = CVR;
			}

			size = pos.totalSize; //This might cause a problem where the open position display shows negative size.
		}
		else{

			if(openOrders){
				return undefined;
			}

			type = LMT;
			if(trader.bias == BUY){
				price = ask.price;
				side = BUY;
			}else{
				price = bid.price;
				side = SHT;
			}

			trader.previousSentiment = sentiment;
			trader.updateBias(orderbook);
		}
	}
	
	NEXT_ID = NEXT_ID + 1 < numTraders - 1 ? NEXT_ID + 1 : 1;
	return new Order(id, SYMBOL, k_ename, price, size, side, type);
}