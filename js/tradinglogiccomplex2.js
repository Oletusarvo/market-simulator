function tradingLogicComplex2(){

	const id = Math.trunc(RANDOM_RANGE(1, numTraders - 1));
	
	const bid = orderbook.bestBid();
	const ask = orderbook.bestAsk();
	const acc = BROKER.accounts.get(id);
	const trader = traders[id];
	let openOrders = acc.openOrderSize > 0;
	const direction = (orderbook.numBuy - orderbook.numSell) >= 0 ? BUY : SEL;

	const sizes = [100, 250, 500, 1000];
	let price = 1.0;
	let size = sizes[Math.trunc(RANDOM_RANGE(0, 4))];
	let side = FLT;
	let type = LMT;

	var sentiment = Math.random() < generator.val ? SEL : BUY;

	if(acc){
		const pos = acc.positions.get(SYMBOL);
		if(openOrders){
			const difference = acc.openOrderSide == SHT ? acc.openOrderPrice - ask.price : bid.price - acc.openOrderPrice;
			if(difference >= 0.2){
				EXCHANGE.cancel(id, SYMBOL);
				BROKER.registerCancel(id);
			}
		}

		if(pos){
			const gain = pos.side == BUY ? ((bid.price - pos.avgPriceIn) / pos.avgPriceIn) * 100 : ((pos.avgPriceIn - ask.price) / pos.avgPriceIn) * 100;
			if(openOrders){
				if(gain <= -trader.riskTolerance){
					EXCHANGE.cancel(id, SYMBOL);
					BROKER.registerCancel(id);
				}
				else{
					return undefined;
				}
			}

			if(pos.side == BUY){
				if(gain <= -trader.riskTolerance){
					type = MKT;
					trader.bias = SEL;
				}
				else{
					price = pos.avgPriceIn + trader.profitTarget * pos.avgPriceIn * RANDOM_RANGE(0.05, 1.0);
					//price = pos.avgPriceIn + MARKETMAKER.increment * 5;
				}
				side = SEL;
			}
			else{
				if(gain <= -trader.riskTolerance){
					type = MKT;
					trader.bias = BUY;
				}
				else{
					price = pos.avgPriceIn - trader.profitTarget * pos.avgPriceIn * RANDOM_RANGE(0.05, 1.0);
					//price = pos.avgPriceIn - MARKETMAKER.increment * 5;
				}
				side = CVR;
			}

			size = pos.totalSize; //This might cause a problem where the open position display shows negative size.
		}
		else{
			//Cancel open orders if the current price is too far from a placed order.

			if(openOrders){
				return undefined;
			}

			type = LMT;
			const previousCandle = orderbook.dataSeries[orderbook.dataSeries.length - 1];
			const strategy = trader.strategy;

			if(trader.bias == BUY){
				switch(strategy){
					case STRAT_DEFAULT:
						price = ask.price;
					break;

					case STRAT_DIP:{
						if(trader.previousSentiment == SEL){
							price = previousCandle && previousCandle.low ? previousCandle.low : bid.price;
						}
						else if(trader.previousSentiment == BUY){
							price = previousCandle && previousCandle.high ? previousCandle.high : ask.price;
						}
						else{
							price = ask.price;
						}
					}

					default:
						console.log("Unidentified strategy! \'" + startegy + "\'");
						return undefined;

				}
				
				
				side = BUY;
			}else{
				switch(strategy){
					case STRAT_DEFAULT:
						price = bid.price;
					break;

					case STRAT_DIP:{
						if(trader.previousSentiment == BUY){
							price = previousCandle && previousCandle.high ? previousCandle.high : ask.price;
						}
						else if(trader.previousSentiment == SEL){
							price = previousCandle && previousCandle.low ? previousCandle.low : bid.price;
						}
						else{
							price = bid.price;
						}
					}

					default:
						console.log("Unidentified strategy! \'" + startegy + "\'");
						return undefined;

				}
				side = SHT;
			}

			trader.previousSentiment = sentiment;
			trader.updateBias(orderbook);
			trader.lastOpenPrice = price; //Market orders are not put in the order book, but this should not be a problem.
		}
	}
	
	NEXT_ID = NEXT_ID + 1 < numTraders - 1 ? NEXT_ID + 1 : 1;
	return new Order(id, SYMBOL, k_ename, price, size, side, type);
}