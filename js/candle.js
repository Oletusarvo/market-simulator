class Candle{
    constructor(open, low = null, high = null, close = null){

        if(low == null && high == null && close == null){
            this.open = this.low = this.high = this.closep = open;
        }
        else{
            this.open = open;
            this.low = low;
            this.high = high;
            this.closep = close;
        }
        
        this.volume = 0;
    }

    update(price, volume){
        this.low = price < this.low ? price : this.low;
        this.high = price > this.high ? price : this.high;
        this.volume = volume;
        this.closep = price;
    }

    close(price){
        this.closep = price;
    }
}

class CandlePos{
    constructor(xpos, ypos){
        this.xpos = xpos;
        this.ypos = ypos;
    }
}