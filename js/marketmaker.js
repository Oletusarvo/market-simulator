/*
    Work in progress.

    The purpose of a market maker is to ensure liquidity in the market
    by being ready to sell and buy at any time.
*/

class MarketMaker{
    constructor(exchange){
        this.exchange = exchange;
        this.spread = 0; 
        this.depth = 2;
    }

    createMarket(symbol){
        let orderbook = this.exchange.getOrderBook(symbol);
        
        let bid         = orderbook.bestBid();
        let ask         = orderbook.bestAsk();
        let lastSell    = orderbook.lastSell;
        let lastBuy     = orderbook.lastBuy;
        let last        = orderbook.last;

        //Add sell orders
        //Define starting price
        let price = 0;
        if(!ask && !bid){

            /*
                Both the bid and the ask are empty.
                There are two possible scenarios: They are empty, but there have been orders on them previously.
                Determine the price based on the most recent transaction.

                The second scenario is that no trades have taken place yet, in which case the price must be arbitrary.
            */

            if(last){
                price = last.price + 0.01;
                let order = new Order(-1, symbol, this.exchange.name, price, 100, SHT, LMT);

                //Fill the ask side.
                while(orderbook.ask.size < this.depth){
                    order.price = price;
                    this.exchange.execute(order);
                    price += this.spread;
                }

                //Fill the bid side.
                price = orderbook.bestAsk().price - this.spread;
                while(orderbook.bid.size < this.depth){
                    order.price = price;
                    this.exchange.execute(order);
                    price -= this.spread;
                }
            }
            else{
                price = parseFloat((Math.random() * 10).toFixed(2));
                
                //Fill the ask side.
                while(orderbook.ask.size < this.depth){
                    let order = new Order(-1, symbol, this.exchange.name, price, 100, SHT, LMT);
                    this.exchange.execute(order);
                    price += this.spread;
                }

                //Fill the bid side.
                price = orderbook.bestAsk().price - this.spread;
                while(orderbook.bid.size < this.depth){
                    let order = new Order(-1, symbol, this.exchange.name, price, 100, BUY, LMT);
                    this.exchange.execute(order);
                    price -= this.spread;
                }
            }
        }
        else{
            /*
                One side has orders on it and the other does not, or both have orders on them.
            */

            if(!ask){
                
                /*
                    The ask is empty either because no sell orders have yet been placed, or all sell orders were filled, implying 
                    the stock is moving up.
                */

                if(orderbook.priceHistory.length == 0){
                    let price = bid.price + this.spread;
                    while(orderbook.ask.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, SHT, LMT);
                        this.exchange.execute(order);
                        price += this.spread;
                    }
                }
                else{
                    //Price just moved up. Refill the ask.
                    let price = lastBuy.price + 0.01;
                    while(orderbook.ask.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, SHT, LMT);
                        this.exchange.execute(order);
                        price += this.spread;
                    }

                    //The bid has to come up towards the ask.
                    orderbook.cancelBuy(-1);
                    ask = orderbook.bestAsk();
                    price = ask.price - this.spread;
                    while(orderbook.bid.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, BUY, LMT);
                        this.exchange.execute(order);
                        price -= this.spread;
                    }
                }
            }
            else if(!bid){

                /*
                    The bid is empty either because no buy orders have yet been placed, or all buy orders were filled, implying
                    the stock is moving down.
                */

                if(orderbook.priceHistory.length == 0){
                    //This block is propably never reached.
                    let price = parseFloat((ask.price - this.spread).toFixed(2));
                    while(orderbook.bid.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, BUY, LMT);
                        this.exchange.execute(order);
                        price -= this.spread;
                    }
                }
                else{
                    //Price just moved down. Refill the bid.
                    let price = lastSell.price - 0.01;
                    while(orderbook.bid.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, BUY, LMT);
                        this.exchange.execute(order);
                        price -= this.spread;
                    }

                    //The ask has to come down towards the bid.
                    orderbook.cancelSell(-1);
                    bid = orderbook.bestBid();
                    price = bid.price + this.spread;

                    while(orderbook.ask.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, SHT, LMT);
                        this.exchange.execute(order);
                        price += this.spread;
                    }
                }  
            }
            else{
                /*
                    Both sides have orders on them. Fill them out so there are this.depth orders on both sides.
                    One side shall be filled from the top up and the other from the back down, based
                    on the recent trend direction.
                */

                let direction = orderbook.lastDirection;

                if(direction == BUY){
                    //Last transaction was a buy order. Fill the bid side to approach the ask side.
                    orderbook.cancelBuy(-1);
                    let price = ask.price - this.spread;
                    while(orderbook.bid.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, BUY, LMT);
                        this.exchange.execute(order);
                        price -= this.spread;
                    }
                    
                    //Add new orders to the end of the ask side.
                    price = Array.from(orderbook.ask.values()).pop().price + 0.01;
                    while(orderbook.ask.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, SHT, LMT);
                        this.exchange.execute(order);
                        price += this.spread;
                    }
                }
                else if(direction == SEL){
                    //Last transaction was a sell order. Fill the ask side to approach the bid side.
                    orderbook.cancelSell(-1);
                    let price = bid.price + this.spread;
                    while(orderbook.ask.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, bid.shareSize, SHT, LMT);
                        this.exchange.execute(order);
                        price += this.spread;
                    }

                    //Add new orders to the end of the bid side.
                    price = Array.from(orderbook.bid.values()).pop().price - 0.01;
                    while(orderbook.bid.size < this.depth){
                        let order = new Order(-1, symbol, this.exchange.name, price, 100, BUY, LMT);
                        this.exchange.execute(order);
                        price -= this.spread;
                    }
                }
            }
        }
    }
}