class Position{
    constructor(symbol){
        this.symbol         = symbol;
        this.avgPriceIn     = 0;
		this.avgPriceOut    = 0;
        this.sizeIn         = 0;
        this.sizeOut        = 0;
        this.side           = FLT;
        this.id             = -1;
        this.gain           = 0;
        this.sentiment      = FLT;
        this.realized       = 0;
		
		this.totalSize      = 0;
        this.sharesAvailable = 0; //If the account has offered shares to be borrowed, this is used to limit how much of the position can be closed.
    }

    calcGain(price){
        if(this.side == SHT){
            this.gain = ((this.avgPriceIn - price) / this.avgPriceIn) * 100;
        }
        else{
            this.gain = ((price - this.avgPriceIn) / this.avgPriceIn) * 100;
        }
    }
}