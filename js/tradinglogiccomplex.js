function tradingLogicComplex(){
    
    
    var ask = orderbook.bestAsk();
    var bid = orderbook.bestBid();

    var id = Math.trunc(RANDOM_RANGE(1, numTraders - 1));
    var acc = BROKER.accounts.get(id);
    var pos = acc.positions.get(SYMBOL);

    let trader = traders[id];

    var price = 0;
    var sizes = [100, 100, 250, 250, 500, 1000];
    var size = sizes[Math.trunc(RANDOM_RANGE(0, 5))];
    var side = BUY;
    var type = LMT;

    var sentiment = Math.random() < generator.val ? SEL : BUY;
	
    if(pos){
        //If current sentiment has changed and there are open orders, cancel them.
        if(trader.previousSentiment != sentiment && acc.openOrderSize > 0){
            EXCHANGE.cancel(id, SYMBOL);
            BROKER.registerCancel(id);
            trader.previousSentiment = sentiment;
        }
		else if(acc.openOrderSize != 0){
			//Stop accounts from sending orders out when they already have one out.
			return undefined;
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
                price = ask.price + RANDOM_RANGE(0.00, 0.1);
            }
            else{
                //Short position is desired to be covered in a buy-market.
                side = CVR;
                if(acc.openOrderSize > 0){
                    EXCHANGE.cancel(id, SYMBOL);
                    BROKER.registerCancel(id);
                }
                //type = MKT;
                price = ask.price + 1.00;
            }
        }
        else{
            if(pos.side == SHT){
                //Short position is desired to be covered in a sell-market.
                side = CVR;
                price = bid.price - RANDOM_RANGE(0.00, 0.1);
            }
            else{
                //Long position is desired to be sold in a sell-market.
                side = SEL;
                if(acc.openOrderSize > 0){
                    EXCHANGE.cancel(id, SYMBOL);
                    BROKER.registerCancel(id);
                }

                //type = MKT;
                price = bid.price - 1.00;
            }
        }

        size = Math.abs(pos.sizeIn);
    }
    else{
		if(acc.openOrderSize == 0){
			let bias = traders[id].bias;
			side = bias == BUY ? BUY : SHT;
			
			const located = acc.locatedShares.get(SYMBOL);
			
			if(side == SHT && (!BROKER.allowNakedShort && located == undefined)){
				return undefined;
			}
			
			if(sentiment == BUY){
				price = ask.price + RANDOM_RANGE(0.00, 0.1);
			}
			else{
				price = bid.price - RANDOM_RANGE(0.00, 0.1);
			}

			trader.previousSentiment = sentiment;
			trader.updateBias(orderbook);
		}
		else{
			return undefined;
		}
        
    }

    
    return new Order(id, SYMBOL, k_ename, price, size, side, type);
}