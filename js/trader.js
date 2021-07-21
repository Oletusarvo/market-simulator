const STRAT_DEFAULT = 0;
const STRAT_DIP = 1;
const STRAT_BREAKOUT = 2;

const MENT_DEFAULT = 0;
const MENT_NERVOUS = 1;

class Trader{
    constructor(id){
        this.lastCanceledPrice  = 0;
        this.lastOpenPrice      = 0; //At what price the last open order was placed.
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

    action(pos, currentPrice){

        if(pos){
            const priceIn = pos.avgPriceIn;
            if(pos.side == BUY){
                if(currentPrice >= priceIn + priceIn * this.profitTarget || currentPrice <= priceIn - priceIn * this.riskTolerance){
                    return SEL
                }
            }
            else{
                if(currentPrice >= priceIn + priceIn * this.riskTolerance || currentPrice <= priceIn - priceIn * this.profitTarget){
                    return CVR;
                }
            }
        }
        else{
            if(this.confidence >= this.threshold){
                return this.bias;
            }
        }
        
        return FLT;
    }
}