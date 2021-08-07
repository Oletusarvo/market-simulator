class Candle{
    constructor(price){
        this.open = price;
        this.low = price;
        this.high = price;
        this.closep = price;
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