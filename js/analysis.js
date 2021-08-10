const COLOR_RED = 0;
const COLOR_GREEN = 1;
const hammerMultiplier = 1.7;

function isHammer(candle){
    //A hammer candle has a long lower wick and short upper wick.
    const color = candle.open > candle.closep ? COLOR_GREEN : COLOR_RED;

    let result = false;

   
    if(color == COLOR_GREEN){
        let lowerWickLen = candle.open - candle.low;
        let upperWickLen = candle.high - candle.closep;
        let bodyLen = candle.closep - candle.open;

        result = upperWickLen * hammerMultiplier < lowerWickLen && bodyLen < lowerWickLen;
    }
    else{
        let lowerWickLen = candle.closep - candle.low;
        let upperWickLen = candle.high - candle.open;
        let bodyLen = candle.open - candle.closep;

        result = upperWickLen * hammerMultiplier < lowerWickLen && bodyLen < lowerWickLen;
    }

    return result;
}

function isInvertedHammer(candle){
    //An inverted hammer candle has a long upper wick and short lower wick.
    const color = candle.open > candle.closep ? COLOR_RED : COLOR_GREEN;

    let result = false;

    if(color == COLOR_GREEN){
        let lowerWickLen = candle.open - candle.low;
        let upperWickLen = candle.high - candle.closep;
        let bodyLen = candle.closep - candle.open;

        
        result = lowerWickLen * hammerMultiplier < upperWickLen && bodyLen < upperWickLen;
    }
    else{
        let lowerWickLen = candle.closep - candle.low;
        let upperWickLen = candle.high - candle.open;
        let bodyLen = candle.open - candle.closep;

        result = lowerWickLen * hammerMultiplier < upperWickLen && bodyLen < upperWickLen;
    }

    return result;
}

function isDoji(candle){
    //A doji candle shall be interpreted as a candle with long wicks and the body is smaller than the length of the individual wicks.
    const color = candle.closep >= candle.open ? COLOR_GREEN : COLOR_RED;

    let result = false;

    if(color == COLOR_GREEN){
        let upperWickLen = candle.high - candle.closep;
        let lowerWickLen = candle.open - candle.low;
        let bodyLen = candle.closep - candle.open;

        result = bodyLen < upperWickLen && bodyLen < lowerWickLen;
    }
    else{
        let upperWickLen = candle.high - candle.open;
        let lowerWickLen = candle.open - candle.low;
        let bodyLen = candle.open - candle.closep;

        result = bodyLen < upperWickLen && bodyLen < lowerWickLen;
    }

    return result;
}

function isBullish(candle){
    const color = candle.close > candle.open ? COLOR_GREEN : COLOR_RED;
    const bodyLen = color == COLOR_GREEN ? candle.closep - candle.open : candle.open - candle.closep;
    const upperWickLen = color == COLOR_GREEN ? candle.high - candle.closep : candle.high - candle.open;
    //const lowerWickLen = color == COLOR_GREEN ? candle.open - candle.low : candle.close - candle.low;

    return (color == COLOR_GREEN && upperWickLen < bodyLen) || isHammer(candle);
}

function isBearish(candle){
    const color = candle.close > candle.open ? COLOR_GREEN : COLOR_RED;
    const bodyLen = color == COLOR_GREEN ? candle.closep - candle.open : candle.open - candle.closep;
    //const upperWickLen = color == COLOR_GREEN ? candle.high - candle.close : candle.high - candle.open;
    const lowerWickLen = color == COLOR_GREEN ? candle.open - candle.low : candle.closep - candle.low;

    return (color == COLOR_RED && lowerWickLen < bodyLen) || isInvertedHammer(candle);
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