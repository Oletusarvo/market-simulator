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
        this.riskTolerance      = 0.02 //How much in percentage (value * 100) a position must be down before we close it.
        this.profitTarget       = 0.05 //How much in percentage a position must be up before we take profit.
        this.previousSentiment  = this.bias;
        this.strategy           = STRAT_DEFAULT;
        this.mentality          = Math.trunc(RANDOM_RANGE(MENT_DEFAULT, MENT_NERVOUS));

        this.giveUpTimer        = 10000;
    }

    updateBias(orderbook){
        const dataSeries = orderbook.dataSeries;

        if(orderbook.dataSeries.length >= 2){
            const len = dataSeries.length;
            const candle1 = dataSeries[len - 2];
            const candle2 = dataSeries[len - 1];

            if(candle2.close > candle1.close){
                this.previousSentiment = BUY;
            }
            else{
                this.previousSentiment = SEL;
            }
        }
    }

    updateStrategy(orderbook){
        const dataSeries = orderbook.dataSeries;

        if(orderbook.dataSeries.length >= 2){
            const latestCandle = dataSeries[dataSeries.length - 1];
        }
    }
}