function tradingLogicComplex2(){

	const id = Math.trunc(RANDOM_RANGE(1, numTraders - 1));
	
	const bid = orderbook.bestBid();
	const ask = orderbook.bestAsk();
	const acc = BROKER.accounts.get(id);
	const trader = traders[id];
	let openOrders = acc.openOrderSize > 0;
	let order = undefined;
	
	if(acc){
		const pos = acc.positions.get(SYMBOL);
		
		//Cancel open orders if the current price is too far from a placed order.
		if(openOrders){
			const difference = acc.openOrderSide == SHT ? ((acc.openOrderPrice - ask.price) / acc.openOrderPrice) : ((acc.openOrderPrice - bid.price) / acc.openOrderPrice);
			if(Math.abs(difference) >= 0.1){
				EXCHANGE.cancel(id, SYMBOL);
				BROKER.registerCancel(id);
			}
		}

		if(orderbook.halted){
			EXCHANGE.cancel(trader.id, SYMBOL);
			BROKER.registerCancel(trader.id);
			return undefined;
		}

		if(pos){
			order = trader.actionPos(pos, orderbook);
		}
		else{
			if(openOrders){
				return undefined;
			}
			order = trader.actionNoPos(orderbook);
		}
	}
	
	return order;
}