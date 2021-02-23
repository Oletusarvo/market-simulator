class Trader{
    constructor(id){
        this.lastCanceledPrice  = 0;
        this.bias               = Math.random() < 0.5 ? SEL : BUY;
        this.id                 = id;
        this.confidence         = 1; //Value between 0 and 1
        this.threshold          = Math.random(); //How confident the trader must be before taking a position.
        this.numCancels         = 0;
        this.previousSentiment  = FLT;
    }

    updateBias(orderbook){
        //Set bias to be opposite of the apparent sentiment.
        this.bias = orderbook.numBuy > orderbook.numSell ? BUY : SEL;
    }
}