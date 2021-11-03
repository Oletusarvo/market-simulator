const COLOR_RED = 0;
const COLOR_GREEN = 1;
const hammerMultiplier = 1.7;

const BULL_FLAG = 0;
const BEAR_FLAG = 1;

class Candle{
    constructor(open, low = null, high = null, close = null){

        if(low == null && high == null && close == null){
            this.open_price = this.low_price = this.high_price = this.close_price = open;
        }
        else{
            this.open_price = open;
            this.low_price = low;
            this.high_price = high;
            this.close_price = close;
        }

        this.previous = null;
        this.next = null;
        this.volume = 0;
        this.color = this.close_price > this.open_price ? COLOR_GREEN : COLOR_RED;
    }

    update(price, volume){
        this.low_price = price < this.low_price ? price : this.low_price;
        this.high_price = price > this.high_price ? price : this.high_price;
        this.volume = volume;
        this.close_price = price;
    }

    close(price){
        this.close_price = price;
    }

    getRange(){
        return this.high_price - this.low_price;
    }

    getMagnitude(){
        return this.volume / this.getRange();
    }

    bullish(){
        return this.isHammer() || this.close_price > this.open_price;
    }

    bearish(){
        return this.isInvertedHammer() || this.close_price < this.open_price;
    }

    isHammer(){
        //A hammer candle has a long lower wick and short upper wick.
        const candle = this;
        const color = candle.open_price > candle.closep ? COLOR_GREEN : COLOR_RED;
    
        let result = false;
    
       
        if(color == COLOR_GREEN){
            let lowerWickLen = candle.open_price - candle.low_price;
            let upperWickLen = candle.high_price - candle.close_price;
            let bodyLen = candle.close_price - candle.open_price;
    
            result = upperWickLen * hammerMultiplier < lowerWickLen && bodyLen < lowerWickLen;
        }
        else{
            let lowerWickLen = candle.close_price - candle.low_price;
            let upperWickLen = candle.high_price - candle.open_price;
            let bodyLen = candle.open_price - candle.close_price;
    
            result = upperWickLen * hammerMultiplier < lowerWickLen && bodyLen < lowerWickLen;
        }
    
        return result;
    }
    
    isInvertedHammer(){
        //An inverted hammer candle has a long upper wick and short lower wick.
        const candle = this;
        const color = candle.open_price > candle.close_price ? COLOR_RED : COLOR_GREEN;
    
        let result = false;
    
        if(color == COLOR_GREEN){
            let lowerWickLen = candle.open_price - candle.low_price;
            let upperWickLen = candle.high_price - candle.close_price;
            let bodyLen = candle.close_price - candle.open_price;
    
            
            result = lowerWickLen * hammerMultiplier < upperWickLen && bodyLen < upperWickLen;
        }
        else{
            let lowerWickLen = candle.close_price - candle.low_price;
            let upperWickLen = candle.high_price - candle.open_price;
            let bodyLen = candle.open_price - candle.close_price;
    
            result = lowerWickLen * hammerMultiplier < upperWickLen && bodyLen < upperWickLen;
        }
    
        return result;
    }
    
    isDoji(){
        //A doji candle shall be interpreted as a candle with long wicks and the body is smaller than the length of the individual wicks.
        const candle = this;
        const color = candle.close_price >= candle.open_price ? COLOR_GREEN : COLOR_RED;
    
        let result = false;
    
        if(color == COLOR_GREEN){
            let upperWickLen = candle.high_price - candle.close_price;
            let lowerWickLen = candle.open_price - candle.low_price;
            let bodyLen = candle.close_price - candle.open_price;
    
            result = bodyLen < upperWickLen && bodyLen < lowerWickLen;
        }
        else{
            let upperWickLen = candle.high_price - candle.open_price;
            let lowerWickLen = candle.open_price - candle.low_price;
            let bodyLen = candle.open_price - candle.close_price;
    
            result = bodyLen < upperWickLen && bodyLen < lowerWickLen;
        }
    
        return result;
    }

    upperWickLen(){
        return this.color == COLOR_GREEN ? this.high_price - this.close_price : this.high_price - this.open_price;
    }

    lowerWickLen(){
        return this.color == COLOR_GREEN ? this.open_price - this.low : this.close_price - this.low_price;
    }

    bodyLen(){
        return this.color == COLOR_GREEN ? this.close_price - this.open_price : this.open_price - this.close_price;
    }
}

class CandlePattern{
    constructor(){
        this.candles = [];
    }

    reset(arr){
        this.candles = [...arr];
        this.bullish = false;
        this.bearish = false;

    }

    push(candle){
        this.candles.push(candle)
    }

    open(){
        return this.candles[0].open;
    }

    close(){
        const len = this.candles.length;
        return this.candles[len - 1].closep;
    }

    isPiercingLine(){
        const candles = pattern.candles;

        if(candles.length != 2){
            return false;
        }

        const firstCandle = candles[0];
        const lastCandle = candles[1];

        return ((this.bullish = lastCandle.close_price > firstCandle.open_price && lastCandle.close_price < firstCandle.high_price) 
        || (this.bearish = lastCandle.close_price < firstCandle.open_price && lastCandle.close_price > firstCandle.low_price));
    }

    IsThreeWhiteSoldiers(pattern){
        //INCOMPLETE
        const candles = pattern.candles;
    
        if(candles.length != 3){
            return false;
        }
    
        let numGreen = 0;
        for(candle of candles){
            if(candle.close_price > candle.open_price){
                numGreen++;
            }
        }
    
        return this.bullish = numGreen == 3;
    }

    gain(){
        const len = this.candles.length;

        let total = 0;
        
        for(let i = 0; i < len; ++i){
            const candle = this.candles[i];
            const gain = candle.close_price - candle.open_price;
            total += gain;
        }

        return total;
    }

    isBullflag(){
        //Has at least one big green candle at the beggining.

        //Pullback starts at first red candle. The combined drop in value of the pullback can be no more than half of the gain before it.

        
        const candles = this.candles;
        const firstCandle = candles[0];
        
        
        if(firstCandle.bullish()){
            
            let pole = new CandlePattern();
            let pullback = new CandlePattern();

            for(candle of candles){
                if(candle.close_price < candle.previous.close_price){
                    //Part of pullback
                    pullback.push(candle);
                }
                else{
                    //Part of pole
                    pole.push(candle);
                }
            }

            if(pole.candles.length == 0 || pullback.candles.length == 0){
                return false;
            }

            this.bearish = !(this.bullish = pullback.close() > pole.open());

            const pullbackGain = pullback.gain();
            const poleGain = pole.gain();

            return -pullbackGain < poleGain / 2;
        }
        else{
            return false;
        }

        
        
    }

    isBearflag(){
        //Has at least one big red candle at the beggining.

        //Pullback starts at first green candle. The combined gain in value of the pullback can be no more than half of the loss before it.

        
        const candles = this.candles;
        const firstCandle = candles[0];
        
        
        if(firstCandle.bearish()){
            
            let pole = new CandlePattern();
            let pullback = new CandlePattern();

            for(candle of candles){
                if(!candle.bearish()){
                    //Part of pullback
                    pullback.push(candle);
                }
                else{
                    //Part of pole
                    pole.push(candle);
                }
            }

            if(pole.candles.length == 0 || pullback.candles.length == 0){
                return false;
            }

            this.bullish = !(this.bearish = pullback.close() < pole.open());

            return -pullback.gain() > pole.gain() / 2;
        }
        else{
            return false;
        }
    }

    bullish(){
        return this.isBullflag();
    }

    bearish(){
        return this.isBearflag();
    }

   
}



function isBullish(candle){
    const color = candle.close > candle.open ? COLOR_GREEN : COLOR_RED;
    const bodyLen = color == COLOR_GREEN ? candle.closep - candle.open : candle.open - candle.closep;
    const upperWickLen = color == COLOR_GREEN ? candle.high - candle.closep : candle.high - candle.open;
    //const lowerWickLen = color == COLOR_GREEN ? candle.open - candle.low : candle.close - candle.low;

    return color == COLOR_GREEN && (upperWickLen < bodyLen || isHammer(candle) || (isInvertedHammer(candle) && SENTIMENT == SEL));
}

function isBearish(candle){
    const color = candle.close > candle.open ? COLOR_GREEN : COLOR_RED;
    const bodyLen = color == COLOR_GREEN ? candle.closep - candle.open : candle.open - candle.closep;
    //const upperWickLen = color == COLOR_GREEN ? candle.high - candle.close : candle.high - candle.open;
    const lowerWickLen = color == COLOR_GREEN ? candle.open - candle.low : candle.closep - candle.low;

    return color == COLOR_RED && (lowerWickLen < bodyLen || isInvertedHammer(candle) || (isHammer(candle) && SENTIMENT == BUY));
}

function calcRange(candle){
    return candle.high - candle.low;
}



function patterIsPiercingLine(pattern){
    
    
}

function patternIsBullish(dataSeries, lookback){
    const dataLen = dataSeries.length;
    const beginCandle = dataSeries[dataLen - lookback];
    const endCandle = dataSeries[dataLen - 2];

    return beginCandle && endCandle ? (endCandle.closep > beginCandle.open) : false;
}

function patternIsBearish(dataSeries, lookback){
    const dataLen = dataSeries.length;
    const beginCandle = dataSeries[dataLen - lookback];
    const endCandle = dataSeries[dataLen - 2];

    return beginCandle && endCandle ? (endCandle.closep < beginCandle.open) : false;
}

function patternIsDoubleTop(dataSeries, lookback){
    const dataLen = dataSeries.length;

    //Find the top to compare to
    const rangeHigh = 0;
    const end = dataLen - 1; //Ignore the last candle in the range, as it is the one currently forming.
    for(let i = dataLen - lookback; i < end; ++i){
        const candle = dataSeries[i];
        const high = candle.high;
        if(candle && high){
            rangeHigh = high > rangeHigh ? high : rangeHigh;
        }
    }

    //Find instances of the same high
    let num = 0;
    for(let i = dataLen - lookback; i < end; ++i){
        const candle = dataSeries[i];
        const high = candle.high;
        if(candle && high){
            if(high == rangeHigh){
                num++;
            }
        }
    }

    return num == 2;
}

function patternIsDoubleBottom(dataSeries, lookback){
    const dataLen = dataSeries.length;

    //Find the top to compare to
    const rangeLow = Number.MAX_VALUE;
    const end = dataLen - 1; //Ignore the last candle in the range, as it is the one currently forming.
    for(let i = dataLen - lookback; i < end; ++i){
        const candle = dataSeries[i];
        const low = candle.low;
        if(candle && low){
            rangeHigh = low > rangeLow ? low : rangeLow;
        }
    }

    //Find instances of the same high
    let num = 0;
    for(let i = dataLen - lookback; i < end; ++i){
        const candle = dataSeries[i];
        const low = candle.low;
        if(candle && low){
            if(low == rangeLow){
                num++;
            }
        }
    }

    return num == 2;
}

function patternIsTripleTop(dataSeries, lookback){
    const dataLen = dataSeries.length;

    //Find the top to compare to
    const rangeHigh = 0;
    const end = dataLen - 1; //Ignore the last candle in the range, as it is the one currently forming.
    for(let i = dataLen - lookback; i < end; ++i){
        const candle = dataSeries[i];
        const high = candle.high;
        if(candle && high){
            rangeHigh = high > rangeHigh ? high : rangeHigh;
        }
    }

    //Find instances of the same high
    let num = 0;
    for(let i = dataLen - lookback; i < end; ++i){
        const candle = dataSeries[i];
        const high = candle.high;
        if(candle && high){
            if(high == rangeHigh){
                num++;
            }
        }
    }

    return num == 3;
}

function patternIsTripleBottom(dataSeries, lookback){
    const dataLen = dataSeries.length;

    //Find the top to compare to
    const rangeLow = Number.MAX_VALUE;
    const end = dataLen - 1; //Ignore the last candle in the range, as it is the one currently forming.
    for(let i = dataLen - lookback; i < end; ++i){
        const candle = dataSeries[i];
        const low = candle.low;
        if(candle && low){
            rangeHigh = low > rangeLow ? low : rangeLow;
        }
    }

    //Find instances of the same high
    let num = 0;
    for(let i = dataLen - lookback; i < end; ++i){
        const candle = dataSeries[i];
        const low = candle.low;
        if(candle && low){
            if(low == rangeLow){
                num++;
            }
        }
    }

    return num == 3;
}

function patternGain(dataSeries, lookback){
    
}