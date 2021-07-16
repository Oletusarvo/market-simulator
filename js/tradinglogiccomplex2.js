function tradingLogicComplex2(){

	let id = RANDOM_RANGE(1, numTraders - 1);
	
	const bid = orderbook.bestBid();
	const ask = orderbook.bestAsk();
	const acc = BROKER.accounts.get(id);
	const trader = traders[id];

	let price = 0;
	let size = 100;
	let side = FLT;
	let type = LMT;

	if(acc){
		const pos = acc.positions.get(SYMBOL);

		if(pos){
			const action = trader.action(orderbook.last());
			side = action;
			price = action == CVR ? bestAsk : bestBid;
		}
		else{

		}
	}
	else{
		const message = new Message("Account with id \'" + id + "\' does not exist!", "Broker");
		BROKER.addMessage(message);
		return undefined;
	}
	
	return new Order(id, SYMBOL, k_ename, price, size, side, type);
}