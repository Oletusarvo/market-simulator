class Chart{
    constructor(canvas, dataSeries){
        this.canvas = canvas;
        this.dataSeries = dataSeries;
        this.currentCandlePos = undefined;
    }

    height(){
        return this.canvas.height;
    }

    width(){
        return this.canvas.width;
    }
}

function drawCandleSingle(canvas, candle, pos, cw, hm = 1){
    if(candle && candle.low && candle.high && candle.open && candle.closep){
        
        const open = candle.open;
        const close = candle.closep;
        const high = candle.high;
        const low = candle.low;


        const ctx = canvas.getContext("2d");
        const linex = Math.ceil(pos.xpos);
        
        const y = Math.ceil(pos.ypos);

        //Length of the line representing the wicks
        let lineLowPos = Math.ceil(y + ((open - low) * canvas.height * hm));
        let lineHighPos = Math.ceil(y - ((high - open) * canvas.height * hm));

        //Candle dimensions
        const candleHeight = (open - close) * canvas.height * hm;
        const candleWidth = cw;

        //While updating, only erase the part where the live candle is forming.
        ctx.clearRect(pos.xpos - (cw / 2), 0, pos.xpos + (cw / 2), canvas.height);

        ctx.fillStyle = close >= open ? "green" : "red";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(linex + 0.5, lineLowPos);
        ctx.lineTo(linex + 0.5, lineHighPos);
        ctx.stroke();

        //Draw candle body
        
        const candleXpos = Math.ceil(pos.xpos - candleWidth / 2);
        ctx.fillRect(candleXpos + 0.5, y, candleWidth, candleHeight);
    }
    
}

function drawVolume(canvas, candle, pos, vw, hm = 1){
    const volume = candle.volume;
    
}

function drawDataRange(dataSeries, lookback, hm, canvas){
    const len = dataSeries.length; // Ignore the candle currently forming.
    const offset = 25; //How far appart individual candles are on the x-axis.
    const centery = canvas.height / 2;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let nextXpos = offset;
    let nextYpos = centery;

    let pos = new CandlePos(nextXpos, nextYpos);

    //Draw the candles from the current one 
    const end = len; //Ignore the candle currently forming. We'll draw that elsewhere.
    const start = len >= lookback ? len - lookback : 0;
    

    for(let c = start; c < end; ++c){
        const candle = dataSeries[c];

        const open = candle.open;
        const close = candle.closep;

        const cw = 20;

        drawCandleSingle(canvas, candle, pos, cw, hm);
        
        nextXpos += offset;
        nextYpos += (open - close) * canvas.height * hm;

        pos.xpos = nextXpos;
        pos.ypos = nextYpos;
    }

    return pos;
}