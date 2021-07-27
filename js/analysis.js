const COLOR_RED = 0;
const COLOR_GREEN = 1;

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
    const color = candle.open > candle.close ? COLOR_GREEN : COLOR_RED;

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
    const color = candle.close >= candle.open ? COLOR_GREEN : COLOR_RED;

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
    const color = candle.close > candle.open ? COLOR_GREEN : COLOR_RED;
    const bodyLen = color == COLOR_GREEN ? candle.close - candle.open : candle.open - candle.close;
    const upperWickLen = color == COLOR_GREEN ? candle.high - candle.close : candle.high - candle.open;
    //const lowerWickLen = color == COLOR_GREEN ? candle.open - candle.low : candle.close - candle.low;

    return (color == COLOR_GREEN && upperWickLen < bodyLen) || isHammer(candle);
}

function isBearish(candle){
    const color = candle.close > candle.open ? COLOR_GREEN : COLOR_RED;
    const bodyLen = color == COLOR_GREEN ? candle.close - candle.open : candle.open - candle.close;
    //const upperWickLen = color == COLOR_GREEN ? candle.high - candle.close : candle.high - candle.open;
    const lowerWickLen = color == COLOR_GREEN ? candle.open - candle.low : candle.close - candle.low;

    return (color == COLOR_RED && lowerWickLen < bodyLen) || isInvertedHammer(candle);
}

function patternIsBullish(dataSeries, lookback){
    const dataLen = dataSeries.length;
    const beginCandle = dataSeries[dataLen - lookback];
    const endCandle = dataSeries[dataLen - 2];

    return beginCandle && endCandle ? (endCandle.close > beginCandle.open) : false;
}

function patternIsBearish(dataSeries, lookback){
    const dataLen = dataSeries.length;
    const beginCandle = dataSeries[dataLen - lookback];
    const endCandle = dataSeries[dataLen - 2];

    return beginCandle && endCandle ? (endCandle.close < beginCandle.open) : false;
}