function isHammer(candle){
    //A hammer candle has a long lower wick and short upper wick.
    const color = candle.open > candle.close ? 1 : 0;

    let result = false;

    if(color == 1){
        let lowerWickLen = candle.open - candle.low;
        let upperWickLen = candle.high - candle.close;
        let bodyLen = candle.close - candle.open;

        result = upperWickLen * 2 < lowerWickLen && bodyLen < lowerWickLen;
    }
    else{
        let lowerWickLen = candle.close - candle.low;
        let upperWickLen = candle.high - candle.open;
        let bodyLen = candle.open - candle.close;

        result = upperWickLen * 2 < lowerWickLen && bodyLen < lowerWickLen;
    }

    return result;
}

function isInvertedHammer(candle){
    //An inverted hammer candle has a long upper wick and short lower wick.
    const color = candle.open > candle.close ? 1 : 0;

    let result = false;

    if(color == 1){
        let lowerWickLen = candle.open - candle.low;
        let upperWickLen = candle.high - candle.close;
        let bodyLen = candle.close - candle.open;

        result = upperWickLen * 2 > lowerWickLen && bodyLen < upperWickLen;
    }
    else{
        let lowerWickLen = candle.close - candle.low;
        let upperWickLen = candle.high - candle.open;
        let bodyLen = candle.open - candle.close;

        result = upperWickLen * 2 > lowerWickLen && bodyLen < upperWickLen;
    }

    return result;
}

function isDoji(candle){
    //A doji candle shall be interpreted as a candle with long wicks and the body is smaller than the length of the individual wicks.
    const color = candle.close >= candle.open ? 1 : 0; //1 is green and zero is red.

    let result = false;

    if(color == 1){
        let upperWickLen = candle.high - candle.close;
        let lowerWickLen = candle.open - candle.low;
        let bodyLen = candle.close - candle.open;

        result = bodylen < upperWickLen && bodyLen < lowerWickLen;
    }
    else{
        let upperWickLen = candle.high - candle.open;
        let lowerWickLen = candle.open - candle.low;
        let bodyLen = candle.open - candle.close;

        result = bodylen < upperWickLen && bodyLen < lowerWickLen;
    }

    return result;
}

function isBullish(candle){
    return candle.close > candle.open;
}
