function drawCandleSingle(candle, visualizer){
    if(candle && candle.low && candle.high && candle.open && candle.closep){
        
        const open = candle.open;
        const close = candle.closep;
        const high = candle.high;
        const low = candle.low;

        const ctx = visualizer.getContext("2d");
        const linex = visualizer.width / 2;
        const y = visualizer.height / 2;

        //Length of the line representing the wicks
        const lineLowPos = y + ((open - low) * visualizer.height / 2);
        const lineHighPos = y - ((high - open) * visualizer.height / 2);

        //Candle dimensions
        const candleHeight = (open - close) * visualizer.height / 2;
        const candleWidth = 20;
        ctx.clearRect(0,0, visualizer.width, visualizer.height);

        ctx.fillStyle = close >= open ? "green" : "red";

        ctx.beginPath();
        ctx.moveTo(linex, lineLowPos);
        ctx.lineTo(linex, lineHighPos);
        ctx.stroke();

        //Draw candle body
        

        ctx.fillRect(visualizer.width / 2 - candleWidth / 2, y, candleWidth, candleHeight);
    }
    
}

function drawCandlePos(candle, xpos, ypos, candlew, visualizer){
    const open = candle.open;
    const close = candle.closep;
    const high = candle.high;
    const low = candle.low;

    if(candle && high && low && close && open){
        const ctx = visualizer.getContext("2d");
        const linex = xpos;
        const y = ypos;

        //Length of the line representing the wicks
        const lineLowPos = y + ((open - low) * visualizer.height / 2);
        const lineHighPos = y - ((high - open) * visualizer.height / 2);

        //Candle dimensions
        const candleHeight = (open - close) * visualizer.height / 2;
        const candleWidth = candlew;

        ctx.fillStyle = close >= open ? "green" : "red";

        ctx.beginPath();
        ctx.moveTo(linex, lineLowPos);
        ctx.lineTo(linex, lineHighPos);
        ctx.stroke();

        //Draw candle body
        

        ctx.fillRect(xpos - candleWidth / 2, y, candleWidth, candleHeight);
    }
}

function drawDataRange(dataSeries, lookback, visualizer){
    const len = dataSeries.length - 1; // Ignore the candle currently forming.
    const offset = 15; //How far appart individual candles are on the x-axis.
    const candleWidth = 20;
    let currentXpos = offset;

    for(let c = len - lookback; c < len; ++c){
        const previousCandle = dataSeries[c - 1];
        const candle = dataSeries[c];
        let currentYpos = previousCandle && previousCandle.close ? (candle.close - previousCandle.close) * visualizer.height / 2 : visualizer.height / 2;

        drawCandlePos(candle, currentXpos, currentYpos, candleWidth, visualizer);

        currentXpos += 2 * offset + candleWidth;
    }
}