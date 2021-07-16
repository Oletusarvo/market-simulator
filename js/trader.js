class Trader{
    constructor(id){
        this.lastCanceledPrice  = 0;
        this.bias               = Math.random() < 0.5 ? SEL : BUY;
        this.id                 = id;
        this.confidence         = 1; //Value between 0 and 1
        this.threshold          = Math.random(); //How confident the trader must be before taking a position.
        this.numCancels         = 0;
        this.riskTolerance      = 0.025 //How much in percentage (value * 100) a position must be down before we close it.
        this.profitTarget       = 0.05 //How much in percentage a position must be up before we take profit.
        this.previousSentiment  = FLT;
    }

    updateBias(orderbook){
        //Set bias to be opposite of the apparent sentiment.
        this.bias = orderbook.numBuy > orderbook.numSell ? SEL : BUY;
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