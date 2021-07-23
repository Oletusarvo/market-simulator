function tradingLogicComplex2(){

	const id = Math.trunc(RANDOM_RANGE(1, numTraders - 1));
	
	const bid = orderbook.bestBid();
	const ask = orderbook.bestAsk();
	const acc = BROKER.accounts.get(id);
	const trader = traders[id];
	let openOrders = acc.openOrderSize > 0;

	let price = 1.0;
	let size = 0;
	let type = LMT;
	let side = FLT;

	if(acc){
		//Cancel open orders if the current price is too far from a placed order.
		if(openOrders){
			const difference = acc.openOrderSide == SHT ? ((acc.openOrderPrice - ask.price) / acc.openOrderPrice) : ((acc.openOrderPrice - bid.price) / acc.openOrderPrice);
			if(Math.abs(difference) >= 0.05){
				EXCHANGE.cancel(id, SYMBOL);
				BROKER.registerCancel(id);
				openOrder = acc.openOrderSize > 0;
			}
		}

		if(orderbook.halted){
			EXCHANGE.cancel(trader.id, SYMBOL);
			BROKER.registerCancel(trader.id);
			//openOrder = acc.openOrderSize > 0;
			return undefined;
		}

		const pos = acc.positions.get(SYMBOL);
		if(pos){
			const gain = pos.side == BUY ? ((bid.price - pos.avgPriceIn) / pos.avgPriceIn) : ((pos.avgPriceIn - ask.price) / pos.avgPriceIn);
        
			if(openOrders){
				trader.giveUpTimer -= 1;

				if(gain <= -trader.riskTolerance || trader.giveUpTimer <= 0){
					EXCHANGE.cancel(id, SYMBOL);
					BROKER.registerCancel(id);
					openOrder = acc.openOrderSize > 0;
				}
				else{
					return undefined;
				}
			}

			const strategy = trader.strategy;
			
			if(pos.side == BUY){
				switch(strategy){

					case STRAT_DIP:{
						if(trader.giveUpTimer > 0){
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
						if(gain <= -trader.riskTolerance || trader.giveUpTimer <= 0){
							type = MKT;
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
						if(trader.giveUpTimer > 0){
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
						if(gain <= -trader.riskTolerance || trader.giveUpTimer <= 0){
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

			if(openOrders){
				return undefined;
			}

			type = LMT;
			const previousCandle = orderbook.dataSeries[orderbook.dataSeries.length - 1];
			const strategy = trader.strategy;

			if(trader.bias == BUY){
				switch(strategy){

					case STRAT_DIP:{
						if(trader.previousSentiment == BUY){
							if(previousCandle && previousCandle.low){
								if(orderbook.last && orderbook.last.price <= previousCandle.low){
									price = ask.price;
								}
								else{
									return undefined;
								}
							}
							else{
								return undefined;
							}
						}
						else{
							return undefined;
						}
					}
					break;

					case STRAT_BREAKOUT:{
						if(trader.previousSentiment == BUY){
							if(previousCandle && previousCandle.high){
								if(orderbook.last && orderbook.last.price >= previousCandle.high){
									price = ask.price;
								}
								else{
									return undefined;
								}
							}
							else{
								return undefined;
							}
						}
						else{
							return undefined;
						}
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
					case STRAT_DEFAULT:
						if(trader.previousSentiment == SEL)
							price = bid.price;
						else
							price = ask.price;
					break;

					case STRAT_DIP:{
						if(trader.previousSentiment == SEL){
							if(previousCandle && previousCandle.high){
								if(orderbook.last && orderbook.last.price >= previousCandle.high){
									price = bid.price;
								}
								else{
									return undefined;
								}
							}
							else{
								return undefined;
							}
						}
						else{
							return undefined;
						}
					}
					break;

					case STRAT_BREAKOUT:{
						if(trader.previousSentiment == SHT){
							if(previousCandle && previousCandle.low){
								if(orderbook.last && orderbook.last.price <= previousCandle.low){
									price = bid.price;
								}
								else{
									return undefined;
								}
							}
							else{
								return undefined;
							}
						}
						else{
							return undefined;
						}
					}
					break;

					default:
						console.log("Unidentified strategy! \'" + startegy + "\'");
						return undefined;

				}
				side = SHT;
			}

			//trader.previousSentiment = sentiment;
			trader.updateBias(orderbook);
        	const amount = (acc.getBuyingPower() * 0.6);
        	const sizes = [100, 250, 500, 1000];
        	size = /*sizes[Math.trunc(RANDOM_RANGE(0, 3))];//*/ amount <= 100000 ? Math.floor(amount / price) : Math.floor(100000 / price); //Limit dollar amount.
        	trader.lastOpenPrice = price; //Market orders are not put in the order book, but this should not be a problem.
			trader.giveUpTimer = 3;
		}

		
	}
	
	return new Order(id, SYMBOL, k_ename, price, size, side, type);
}