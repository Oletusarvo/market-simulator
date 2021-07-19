function tradingLogicComplex(){
    
    
    var ask = orderbook.bestAsk();
    var bid = orderbook.bestBid();

    var id = Math.trunc(RANDOM_RANGE(1, numTraders - 1));
    var acc = BROKER.accounts.get(id);
    var pos = acc.positions.get(SYMBOL);

    let trader = traders[id];

    var price = 1.0;
    var sizes = [100, 100, 250, 250, 500, 1000];
    var size = sizes[Math.trunc(RANDOM_RANGE(0, 5))];
    var side = BUY;
    var type = LMT;

    var sentiment = Math.random() < generator.val ? SEL : BUY;
	let skip = false;
    if(pos){
        if(acc.openOrderSize != 0){
            /*
                If trader is down their risk tolerance, cancel open orders and bail.
            */

            if(pos.side == SHT){
                if(ask){
                    pos.calcGain(ask.price);
                    const gain = pos.gain;
                    if(gain <= -(trader.riskTolerance * 100)){
                        EXCHANGE.cancel(id, SYMBOL);
                        BROKER.registerCancel(id);
                        type = MKT;
                        side = CVR;
                        skip = true;
                    }
                    else{
                        return undefined;
                    }
                }
            }
            else if(pos.side == BUY){
                if(bid){
                    pos.calcGain(bid.price);
                    const gain = pos.gain;

                    if(gain <= -(trader.riskTolerance * 100)){
                        EXCHANGE.cancel(id, SYMBOL);
                        BROKER.registerCancel(id);
                        type = MKT;
                        side = SEL;
                        skip = true;
                    }
                    else{
                        return undefined;
                    }
                }
            }
		}
        
        /*
            A market maker ensures there are always orders on both sides. 
            Update these to not check for orders.
        */
		if(!skip){
            if(sentiment == BUY){
                if(pos.side == BUY){
                    /*
                        Long position is desired to be sold in a buy-market.
                        
                    */
    
                    side = SEL;
                    const percentage = RANDOM_RANGE(0.00, 0.05);
                    price = ask.price + ask.price * percentage;
                }
                else{
                    //Short position is desired to be covered in a buy-market.
                    side = CVR;
                    type = MKT;
                    price = 1.00;
                }
            }
            else{
                if(pos.side == SHT){
                    //Short position is desired to be covered in a sell-market.
                    side = CVR;
                    const percentage = RANDOM_RANGE(0.00, 0.05);
                    price = bid.price - bid.price * percentage;
                }
                else{
                    //Long position is desired to be sold in a sell-market.
                    side = SEL;
                    type = MKT;
                    price = 1.00;
                }
            }
        }
       

        size = Math.abs(pos.sizeIn) - pos.sizeOut;
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
				price = ask.price + ask.price * RANDOM_RANGE(0.00, 0.01);
                
			}
			else{
				price = bid.price - bid.price * RANDOM_RANGE(0.00, 0.01);
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