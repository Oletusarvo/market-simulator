function tradingLogicSimple(){
    randomRange = (min, max) => Math.random() * (max - min) + min;
    var ask = orderbook.bestAsk();
    var bid = orderbook.bestBid();
    var id = Math.trunc(randomRange(1, numTraders - 1));
    var acc = broker.accounts.get(id);
    var pos = acc.positions.get(k_symbol);

    let price = 0;
    var sizes = [100, 100, 100, 250, 500];
    var size = sizes[Math.trunc(randomRange(0, 4))];
    var side = BUY;
    var type = LMT;

    var sentiment = Math.random() < generator.val ? SEL : BUY;
    var trader = traders[id];

    if(sentiment != trader.previousSentiment && acc.openOrderSize > 0){
        console.log("Canceling order");
        exchange.cancel(id, k_symbol);
        broker.registerCancel(id);
    }

    if(pos){
        if(pos.side == BUY){
            side = SEL;
            if(sentiment == BUY){
                price = pos.avgPriceIn + 0.05;
            }
            else{
                price = pos.avgPriceIn;
                type = MKT;
            }
            
        }
        else{
            side = CVR;
            if(sentiment == SEL){
                price = pos.avgPriceIn - 0.05;
            }
            else{
                price = pos.avgPriceIn;
                type = MKT;
            } 
        }

        size = Math.abs(pos.sizeIn);
    }
    else{
        let bias = sentiment;
        side = bias == SEL ? SHT : BUY;
        if(bias == BUY){
            price = ask ? ask.price : bid ? bid.price : 4.99;
        }
        else{
            price = bid ? bid.price : ask ? ask.price : 5.00;
        }
    }

   trader.previousSentiment = sentiment;
    return new Order(id, k_symbol, k_ename, price, size, side, type);
}