function drawCandleSingle(canvas, candle, pos, cw, hm = 1){
    if(candle && candle.low && candle.high && candle.open && candle.closep){
        
        const open = candle.open;
        const close = candle.closep;
        const high = candle.high;
        const low = candle.low;

        const ctx = canvas.getContext("2d");
        const linex = pos.xpos;
        const y = pos.ypos;

        //Length of the line representing the wicks
        const lineLowPos = y + ((open - low) * canvas.height * hm);
        const lineHighPos = y - ((high - open) * canvas.height * hm);

        //Candle dimensions
        const candleHeight = (open - close) * canvas.height * hm;
        const candleWidth = cw;

        //While updating, only erase the part where the live candle is forming.
        ctx.clearRect(pos.xpos - (cw / 2), 0, pos.xpos + (cw / 2), canvas.height);

        ctx.fillStyle = close >= open ? "green" : "red";

        ctx.beginPath();
        ctx.moveTo(linex, lineLowPos);
        ctx.lineTo(linex, lineHighPos);
        ctx.stroke();

        //Draw candle body
        

        ctx.fillRect(pos.xpos - candleWidth / 2, y, candleWidth, candleHeight);
    }
    
}

function drawDataRange(dataSeries, lookback, canvas){
    const len = dataSeries.length; // Ignore the candle currently forming.
    const offset = 25; //How far appart individual candles are on the x-axis.
    const centery = canvas.height / 2;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let nextXpos = offset;
    let nextYpos = centery;

    let pos = new CandlePos(nextXpos, nextYpos);

    const end = len; //Ignore the candle currently forming. We'll draw that elsewhere.
    const start = len - lookback;
    

    for(let c = start; c < end; ++c){
        const candle = dataSeries[c];

        const open = candle.open;
        const close = candle.closep;

        const cw = 20;
        const hm = 0.25;


        drawCandleSingle(canvas, candle, pos, cw, hm);
        
        nextXpos += offset;
        nextYpos += (open - close) * canvas.height * hm;

        pos.xpos = nextXpos;
        pos.ypos = nextYpos;
    }

    return pos;
}