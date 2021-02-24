function tradingLogicComplex(){
    randomRange = (min, max) => Math.random() * (max - min) + min;
    
    var ask = orderbook.bestAsk();
    var bid = orderbook.bestBid();

    var id = Math.trunc(randomRange(1, numTraders - 1));
    var acc = broker.accounts.get(id);
    var pos = acc.positions.get(k_symbol);

    let trader = traders[id];

    var price = 0;
    var sizes = [100, 100, 250, 250, 500, 1000];
    var size = sizes[Math.trunc(randomRange(0, 5))];
    var side = BUY;
    var type = LMT;

    var sentiment = Math.random() < generator.val ? SEL : BUY;

    if(pos){
        //If current sentiment has changed and there are open orders, cancel them.
        if(trader.previousSentiment != sentiment && acc.openOrderSize > 0){
            console.log("Canceling order for account " + id);
            exchange.cancel(id, k_symbol);
            broker.registerCancel(id);
            trader.previousSentiment = sentiment;
        }
        
        /*
            A market maker ensures there are always orders on both sides. 
            Update these to not check for orders.
        */

        if(sentiment == BUY){
            if(pos.side == BUY){
                /*
                    Long position is desired to be sold in a buy-market.
                    
                */

                side = SEL;
                price = ask.price + randomRange(0.00, 0.1);
            }
            else{
                //Short position is desired to be covered in a buy-market.
                side = CVR;
                if(acc.openOrderSize > 0){
                    exchange.cancel(id, k_symbol);
                    broker.registerCancel(id);
                }
                //type = MKT;
                price = ask.price + 1.00;
            }
        }
        else{
            if(pos.side == SHT){
                //Short position is desired to be covered in a sell-market.
                side = CVR;
                price = bid.price - randomRange(0.00, 0.1);
            }
            else{
                //Long position is desired to be sold in a sell-market.
                side = SEL;
                if(acc.openOrderSize > 0){
                    exchange.cancel(id, k_symbol);
                    broker.registerCancel(id);
                }

                //type = MKT;
                price = bid.price - 1.00;
            }
        }

        size = Math.abs(pos.sizeIn);
    }
    else{
        let bias = traders[id].bias;
        side = bias == BUY ? BUY : SHT;

        if(sentiment == BUY){
            price = ask.price + randomRange(0.00, 0.1);
        }
        else{
            price = bid.price - randomRange(0.00, 0.1);
        }

        trader.previousSentiment = sentiment;
        trader.updateBias(orderbook);
    }

    
    return new Order(id, k_symbol, k_ename, price, size, side, type);
}