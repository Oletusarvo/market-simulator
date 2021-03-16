function tradingLogicPassive(){
    let ask = orderbook.bestAsk();
    let bid = orderbook.bestBid();

    let acc = broker.accounts.get(id);

    if(pos){

    }else{
        if(ask){
            price = ask.price;
        }
    }
}