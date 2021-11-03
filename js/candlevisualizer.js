/*
    TODO make chart adapt offset of candes so they dont go off screen.
*/

class Chart{

    //WORK IN PROGRESS
    constructor(canvas, dataSeries){
        this.canvas = canvas;
        this.dataSeries = dataSeries;
        this.currentCandlePos = -1;
        this.currentCandle = undefined;
        this.drawOrigin = new CandlePos(this.canvas.width / 2, this.canvas.height / 2);
        this.hzoom = 1;
        this.vzoom = 1;

        this.advance();
    }

    height(){
        return this.canvas.height;
    }

    width(){
        return this.canvas.width;
    }

    advance(){
        this.currentCandlePos++;
        this.currentCandle = this.dataSeries[this.currentCandlePos];
    }

    drawCandleSingle(){
        const candle = this.currentCandle;
        const pos = this.drawOrigin;
        const hm = this.hzoom;
        const cw = 20;
        const canvas = this.canvas;

        if(candle && candle.low_price && candle.high_price && candle.open_price && candle.close_price){
            
            const open = candle.open_price;
            const close = candle.close_price;
            const high = candle.high_price;
            const low = candle.low_price;
    
    
            const ctx = canvas.getContext("2d");
            const linex = Math.ceil(pos.xpos);
            
            const y = Math.ceil(pos.ypos);
    
            //Length of the line representing the wicks
            let lineLowPos = Math.ceil(y + ((open - low) * canvas.height * hm));
            let lineHighPos = Math.ceil(y - ((high - open) * canvas.height * hm));
    
            //Candle dimensions
            const candleHeight = (open - close) * canvas.height * hm;
            const candleWidth = cw;
    
            //While updating, only erase the part of the canvas where the live candle is forming.
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
}

function drawCandleSingle(canvas, candle, pos, cw, hm = 1){
    if(candle && candle.low_price && candle.high_price && candle.open_price && candle.close_price){
        
        const open = candle.open_price;
        const close = candle.close_price;
        const high = candle.high_price;
        const low = candle.low_price;


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

    let calcOrigin = function(){
        const lastCandle = dataSeries[len - 2];
        const firstCandle = len < lookback ? dataSeries[0] : dataSeries[len - lookback - 1];
        
        if(lastCandle && firstCandle){
            return (canvas.height / 2) + ((lastCandle.open_price - firstCandle.open_price) * hm * canvas.height);
        }
        else{
            return canvas.height / 2;
        }
    }

    //const fullHeight = calcFullSeriesHeight(dataSeries, hm);
    const origin = canvas.height / 2;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let nextXpos = offset;
    let nextYpos = origin;

    let pos = new CandlePos(nextXpos, nextYpos);

    //Draw the candles from the current one 
    const end = len; //Ignore the candle currently forming. We'll draw that elsewhere.
    const start = len >= lookback ? len - lookback : 0;
    

    for(let c = start; c < end; ++c){
        const candle = dataSeries[c];

        const open = candle.open_price;
        const close = candle.close_price;

        const cw = 20;

        drawCandleSingle(canvas, candle, pos, cw, hm);
        
        nextXpos += offset;
        nextYpos += (open - close) * canvas.height * hm;

        pos.xpos = nextXpos;
        pos.ypos = nextYpos;
    }

    return pos;
}