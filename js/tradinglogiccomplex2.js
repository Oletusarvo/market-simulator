function tradingLogicComplex2(traderId){
	const id = traderId;
	const trader = traders[id];

	const bid = orderbook.bestBid();
	const ask = orderbook.bestAsk();
	const acc = BROKER.accounts.get(id);

	let price = 1.0;
	let size = 0;
	let type = LMT;
	let side = FLT;

	if(acc){
		const pos = acc.positions.get(SYMBOL);
		const openOrders = acc.openOrderSize > 0;
		const strategy = trader.strategy;

		if(openOrders){
			return undefined;
		}

		if(pos){
			const gain = pos.side == BUY ? ((bid.price - pos.avgPriceIn) / pos.avgPriceIn) : ((pos.avgPriceIn - ask.price) / pos.avgPriceIn);
			
			if(gain < 0){
				trader.coolDownTimer = trader.coolDownTime;
			}

			if(pos.side == BUY){
				switch(strategy){

					case STRAT_DIP:{
						if(!trader.recentBailout){
							const dataLen = orderbook.dataSeries.length;
							const dataSeries = orderbook.dataSeries;
							const nextToLastCandle = dataSeries[dataLen - 2]
							const lastCandle = dataSeries[dataLen - 1];

							if(trader.previousSentiment == BUY){
								price = nextToLastCandle && nextToLastCandle.high ? nextToLastCandle.high : ask.price;
							}
							else{
								price = lastCandle && lastCandle.high ? lastCandle.high : bid.price;
							}
						}
						else{
							type = MKT;
						}
					}
					break;

					default:{
						if(gain <= -trader.riskTolerance || trader.recentBailout){
							type = MKT;
							trader.recentBailout = false;
						}
						else if(gain >= trader.profitTarget){
							price = bid.price;
							//price = pos.avgPriceIn + MARKETMAKER.increment * 5;
						}
						else{
							return undefined;
						}
					}

				}
				
				side = SEL;
			}
			else{

				switch(strategy){
					case STRAT_DIP:{
						if(!trader.recentBailout){
							const dataLen = orderbook.dataSeries.length;
							const dataSeries = orderbook.dataSeries;
							const nextToLastCandle = dataSeries[dataLen - 2]
							const lastCandle = dataSeries[dataLen - 1];

							if(trader.previousSentiment == SEL){
								price = nextToLastCandle && nextToLastCandle.low ? nextToLastCandle.low : bid.price;
							}
							else{
								price = lastCandle && lastCandle.low ? lastCandle.low : ask.price;
							}
						}
						else{
							type = MKT;
						}
					}
					break;

					default:
						if(gain <= -trader.riskTolerance || trader.recentBailout){
							type = MKT;
						}
						else if(gain >= trader.profitTarget){
							price = ask.price;
							//price = pos.avgPriceIn - MARKETMAKER.increment * 5;
						}
						else{
							return undefined;
						}
				}
				
				side = CVR;
			}

			size = pos.totalSize; //This might cause a problem where the open position display shows negative size.
		}
		else{
			//Trader will not participate after a recent loss.
			if(trader.coolDownTimer > 0){
				return undefined;
			}

			type = LMT;
			const dataSeries = orderbook.dataSeries;
			const previousCandle = dataSeries[dataSeries.length - 2];

			if(trader.bias == BUY){
				switch(strategy){

					case STRAT_DIP:{
						/*
							Dip buyers may buy at whole dollars, half dollars or quarter dollars, as well as the low of the previous candle.
							Figure out which one is closest and buy there.
						*/

						const currentBid 		= bid.price;
						const halfDollar 		= Math.floor(currentBid) + 0.5;
						const wholeDollar 		= Math.floor(currentBid);
						const quarterDollar 	= Math.floor(currentBid) + 0.25;
						const threeFourDollar 	= Math.floor(currentBid) + 0.75;

						//If the value is negative, it will cause the trader to buy on the ask once the minimum of the bunch is returned later.
						//Set all negative numbers to MAX_VALUE.
						const MAX_VALUE = Number.MAX_VALUE;
						maxIfNeg = (val) => {return val < 0 ? MAX_VALUE : val;}
						
						const distanceToHalf = maxIfNeg(currentBid - halfDollar);
						const distanceToQuart = maxIfNeg(currentBid - quarterDollar);
						const distanceToWhole = maxIfNeg(currentBid - wholeDollar);
						const distanceToThreeFour = maxIfNeg(currentBid - threeFourDollar);
						const previousCandleValid = previousCandle && previousCandle.low;
						const distanceToCandleLow = previousCandleValid ? maxIfNeg(currentBid - previousCandle.low) : MAX_VALUE;
						const lowIsValid = orderbook.low != NaN;
						const distanceToLow = lowIsValid ? maxIfNeg(currentBid - orderbook.low) : MAX_VALUE;

						const buyOffset = Math.min(distanceToLow, distanceToHalf, distanceToCandleLow, distanceToQuart, distanceToThreeFour, distanceToWhole);
						
						if(trader.previousSentiment == BUY)
							price = currentBid - buyOffset;
						else
							return undefined;
					}
					break;

					default:
						if(trader.previousSentiment == BUY)
							price = ask.price;
						else
							price = bid.price;

				}
				
				
				side = BUY;
			}else{

				//Short biased trader
				switch(strategy){
					case STRAT_DIP:{
						/*
							Pop shorters may short at whole dollars, half dollars or quarter dollars, as well as the high of the previous candle.
							Figure out which one is closest and short there.
						*/

						const currentAsk 		= ask.price;
						const halfDollar 		= Math.floor(currentAsk) + 0.5;
						const wholeDollar 		= Math.floor(currentAsk) + 1;
						const quarterDollar 	= Math.floor(currentAsk) + 0.25;
						const threeFourDollar 	= Math.floor(currentAsk) + 0.75;

						//If the value is negative, it will cause the trader to buy on the ask once the minimum of the bunch is returned later.
						//Set all negative numbers to MAX_VALUE.
						const MAX_VALUE = Number.MAX_VALUE;
						maxIfNeg = (val) => {return val < 0 ? MAX_VALUE : val;}
						
						const distanceToHalf = maxIfNeg(halfDollar - currentAsk);
						const distanceToQuart = maxIfNeg(quarterDollar - currentAsk);
						const distanceToWhole = maxIfNeg(wholeDollar - currentAsk);
						const distanceToThreeFour = maxIfNeg(threeFourDollar - currentAsk);
						const previousCandleValid = previousCandle && previousCandle.high;
						const distanceToCandleHigh = previousCandleValid ? maxIfNeg(previousCandle.high - currentAsk) : MAX_VALUE;
						const highIsValid = orderbook.high != NaN;
						const distanceToHigh = highIsValid ? maxIfNeg(orderbook.high - currentAsk) : MAX_VALUE;

						const shortOffset = Math.min(distanceToHigh, distanceToHalf, distanceToCandleHigh, distanceToQuart, distanceToThreeFour, distanceToWhole);
						if(trader.previousSentiment == SEL)
							price = currentAsk + shortOffset;
						else
							return undefined;
					}
					break;


					default:
						if(trader.previousSentiment == BUY)
							price = ask.price;
						else
							price = bid.price;

				}
				side = SHT;
			}

			//trader.previousSentiment = sentiment;
        	const amount = (acc.getBuyingPower() * 0.6);
        	const sizes = [100, 250, 500, 1000];
        	size = /*sizes[Math.trunc(RANDOM_RANGE(0, 3))];//*/ amount <= 100000 ? Math.floor(amount / price) : Math.floor(100000 / price); //Limit dollar amount.
        	trader.lastOpenPrice = price; //Market orders are not put in the order book, but this should not be a problem.
			trader.giveUpTimer = trader.giveUpTime;
			trader.coolDownTimer = 0;
			trader.recentBailout = false;
		}

		
	}
	
	return new Order(id, SYMBOL, k_ename, price, size, side, type);
}

function updateTraders(){
	for(let i = 1; i < numTraders; ++i){
		const trader = traders[i];
		updateGiveUp(trader);
		updateCoolDown(trader);
		checkCancelOrders(trader);
		updateSentiment(trader);
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
	trader.giveUpTimer -= UPDATE_SPEED;
}

function updateCoolDown(trader){
	trader.coolDownTimer -= UPDATE_SPEED;
}

function updateSentiment(trader){
	trader.updateBias(orderbook);
}