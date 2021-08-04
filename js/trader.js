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
        this.breakoutThreshold  = 0.1;
        this.numCancels         = 0;
        this.riskTolerance      = 0.025 //How much in percentage (value * 100) a position must be down before we close it.
        this.profitTarget       = 0.03 //How much in percentage a position must be up before we take profit.
        this.previousSentiment  = this.bias;
        this.strategy           = STRAT_DEFAULT;
        this.mentality          = Math.trunc(RANDOM_RANGE(MENT_DEFAULT, MENT_NERVOUS));
        this.recentBailout      = false;
        this.undecided          = false; //Trader will not participate if undecided.

        this.giveUpTime         = this.strategy == STRAT_DIP ? Math.trunc(RANDOM_RANGE(10000, 20000)) : RANDOM_RANGE(1000, 2000);
        this.giveUpTimer        = this.giveUpTime;
        this.coolDownTimer      = 0; //How long we wait after a loss until taking another trade.
        this.coolDownTime       = 10000;
    }

    updateBias(buyChance){
        const dice = Math.random();
		this.bias = dice <= buyChance ? BUY : SEL;
    }

    updateSentiment(){
        const dataSeries = orderbook.dataSeries;
        const previousCandle = dataSeries[dataSeries.length - 2];

        if(isBullish(previousCandle)){
            this.previousSentiment = BUY;
        }
        else if(isBearish(previousCandle)){
            this.previousSentiment = SEL;
        }
        
    }

    updateStrategy(){
        if(this.bias == BUY){
            if(this.previousSentiment == BUY){
                this.strategy = STRAT_DIP;
            }
            else{
                this.strategy = STRAT_DEFAULT;
            }
        }
        else{
            if(this.previousSentiment == SEL){
                this.strategy = STRAT_DIP;
            }
            else{
                this.strategy = STRAT_DEFAULT;
            }
        }
    }
}