const STRAT_DEFAULT = 0;
const STRAT_DIP = 1;
const STRAT_BREAKOUT = 2;

const MENT_DEFAULT = 0;
const MENT_NERVOUS = 1;

class Trader{
    constructor(id){
        this.lastCanceledPrice  = 0;
        this.bias               = Math.random() < 0.5 ? SEL : BUY;
        this.id                 = id;
        this.confidence         = 1; //Value between 0 and 1
        this.threshold          = Math.random(); //How confident the trader must be before taking a position.
        this.numCancels         = 0;
        this.riskTolerance      = RANDOM_RANGE(0.02, 0.1) //How much in percentage (value * 100) a position must be down before we close it.
        this.profitTarget       = RANDOM_RANGE(0.05, 0.15) //How much in percentage a position must be up before we take profit.
        this.previousSentiment  = FLT;
        this.strategy           = Math.trunc(RANDOM_RANGE(STRAT_DEFAULT, STRAT_DIP));
        this.mentality          = Math.trunc(RANDOM_RANGE(MENT_DEFAULT, MENT_NERVOUS));
    }

    updateBias(orderbook){
        const dataSeries = orderbook.dataSeries;

        if(orderbook.dataSeries.length >= 2){
            const len = orderbook.dataSeries.length;
            const candle1 = orderbook.dataSeries[len - 2];
            const candle2 = orderbook.dataSeries[len - 1];

            if(candle2.close > candle1.close){
                this.previousSentiment = BUY;
            }
            else{
                this.previousSentiment = SEL;
            }
        }
    }

    actionPos(pos, orderbook){

        const ask = orderbook.bestAsk();
        const bid = orderbook.bestBid();

        let price = 1.0;
        let size = 0;
        let type = LMT;
        let side = FLT;

        const acc = BROKER.accounts.get(this.id);
        let openOrders = acc.openOrderSize > 0;
        const gain = pos.side == BUY ? ((bid.price - pos.avgPriceIn) / pos.avgPriceIn) * 100 : ((pos.avgPriceIn - ask.price) / pos.avgPriceIn) * 100;
        
        if(openOrders){
            if(gain <= -this.riskTolerance){
                EXCHANGE.cancel(this.id, SYMBOL);
                BROKER.registerCancel(this.id);
            }
            else{
                return undefined;
            }
        }

        if(pos.side == BUY){
            if(gain <= -this.riskTolerance){
                type = MKT;
            }
            else if(gain >= this.profitTarget){
                price = bid.price;
                //price = pos.avgPriceIn + MARKETMAKER.increment * 5;
            }
            else{
                return undefined;
            }
            side = SEL;
        }
        else{
            if(gain <= -this.riskTolerance){
                type = MKT;
            }
            else if(gain >= this.profitTarget){
                price = ask.price;
                //price = pos.avgPriceIn - MARKETMAKER.increment * 5;
            }
            else{
                return undefined;
            }
            side = CVR;
        }

        size = pos.totalSize; //This might cause a problem where the open position display shows negative size.

        return new Order(this.id, SYMBOL, k_ename, price, size, side, type);
    }

    actionNoPos(orderbook){

        const ask = orderbook.bestAsk();
        const bid = orderbook.bestBid();
        const acc = BROKER.accounts.get(this.id);

        let price = 1.0;
        let size = 0;
        let type = LMT;
        let side = FLT;

        const previousCandle = orderbook.dataSeries[orderbook.dataSeries.length - 1];

        switch(this.strategy){
            case STRAT_DEFAULT:{
                switch(this.bias){
                    case BUY:{
                        price = ask.price;
                    }

                    case SEL:{
                        if(!orderbook.shortSaleRestriction){
                            price = bid.price;
                        }
                        else{
                            price =  ask.price;
                        }
                    }
                }
            }

            case STRAT_DIP:{
                switch(this.bias){
                    case BUY:{
                        if(this.previousSentiment == SEL){
                            if(!orderbook.shortSaleRestriction)
                                price =  previousCandle && previousCandle.low ? previousCandle.low : bid.price;
                            else
                                price =  previousCandle && previousCandle.high ? previousCandle.high : ask.price;
                        }
                        else if(this.previousSentiment == BUY){
                            price = previousCandle && previousCandle.high ? previousCandle.high : ask.price;
                        }
                        else{
                            price = ask.price;
                        } 
                    }

                    case SEL:{
                        if(this.previousSentiment == BUY){
                            price = previousCandle && previousCandle.high ? previousCandle.high : ask.price;
                        }
                        else if(this.previousSentiment == SEL){
                            if(!orderbook.shortSaleRestriction)
                                price = previousCandle && previousCandle.low ? previousCandle.low : bid.price;
                            else
                               price = previousCandle && previousCandle.high ? previousCandle.high : ask.price;
                        }
                        else{
                            if(!orderbook.shortSaleRestriction)
                               price = bid.price;
                            else{
                                price = ask.price;
                            }
                        }
                    }
                }
            }
        }

        switch(this.bias){
            case BUY:
                side = BUY;
            break;

            case SEL:
                side = SHT;
            break;
        }

        this.updateBias(orderbook);
        const amount = (acc.getBuyingPower() * 0.6);
        size = amount <= 100000 ? Math.floor(amount / price) : Math.floor(100000 / price); //Limit dollar amount.
        this.lastOpenPrice = price; //Market orders are not put in the order book, but this should not be a problem.
    
        return new Order(this.id, SYMBOL, k_ename, price, size, side, type);
    }
}