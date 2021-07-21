class OrderBook{
    constructor(symbol){
        this.symbol         = symbol;
        this.ask            = new Map();
        this.bid            = new Map();
        this.priceHistory   = [];
        this.dataSeries     = [];
        this.open           = 0;
        this.close          = 0;
        this.high           = 0;
        this.low            = Number.MAX_VALUE;
        this.lastSell       = 0;
        this.lastBuy        = 0;
        this.last           = 0;
        this.lastDirection  = FLT;
        this.direction      = FLT;
        this.numBuy         = 0;
        this.numSell        = 0;
        this.precision      = 2;

        this.periodVolume = 0;
    }

    dataSeriesOpen(){
        let candle = new Candle(this.last.price);
        this.periodVolume = 0;
        this.dataSeries.push(candle);
    }

    dataSeriesClose(){
        const candle = this.dataSeries[this.dataSeries.length - 1];
        const lastPriceHistory = this.priceHistory[this.priceHistory.length - 1];

        candle.close(lastPriceHistory.price);
        console.log("Open: " + candle.open + " Low: " + candle.low + " High: " + candle.high + " Close: " + candle.closep + " Volume: " + candle.volume);
    }

    dataSeriesUpdate(){
        let candle = this.dataSeries[this.dataSeries.length - 1];
        const lastPriceHistory = this.priceHistory[this.priceHistory.length - 1];

        if(lastPriceHistory)
            candle.update(lastPriceHistory.price, this.periodVolume);
        else{
            candle.update(this.last, 0);
        }
    }

    cancel(id){
        this.cancelBuy(id);
        this.cancelSell(id);

        this.flush();
    }

    cancelBuy(id){
        let bk = this.bid.keys();
        const bidSize = this.bid.size;

        for(let i = 0; i < bidSize; ++i){
            let k = bk.next().value;
            this.bid.get(k).cancel(id);
        }

        this.flush();
    }

    updatePrecision(){
        if(this.last.price <= 1.00){
            this.precision = 3;
        }
        else if(this.last.price <= 0.1){
            this.precision = 4;
        }
        else if(this.last.price <= 0.01){
            this.precision = 5;
        }
        else if(this.last.price <= 0.001){
            this.precision = 6;
        }
        else{
            this.precision = 2;
        }
    }

    cancelSell(id){
        let ak = this.ask.keys();
        const askSize = this.ask.size;

        for(let i = 0; i < askSize; ++i){
            let k = ak.next().value;
            this.ask.get(k).cancel(id);
        }

        this.flush();
    }

    drawTable(table){
        //const biggerSize = (this.bid.size > this.ask.size) ? this.bid.size : this.ask.size;

        /*
        Add new rows to the table if there are more order queues than free space in it.
        while(table.rows.length - 1 < biggerSize){
            let row = table.insertRow();
            for(let i = 0; i < 4; ++i)
                row.insertCell(i);
        }
        */

        let sortedBidKeys = [];
        let sortedAskKeys = [];

        let bq = this.bid.keys();
        const bidSize = this.bid.size;

        for(let i = 0; i < bidSize; ++i){
            sortedBidKeys.push(bq.next().value);
        }

        let aq = this.ask.keys();
        const askSize = this.ask.size;

        for(let i = 0; i < askSize; ++i){
            sortedAskKeys.push(aq.next().value);
        }


        sortedBidKeys.sort((a, b) => a - b);
        sortedAskKeys.sort((a, b) => b - a);
        //sortedAskKeys.reverse();

        for(let rowNum = 1; rowNum <= 10; ++rowNum){

            let b = this.bid.get(sortedBidKeys.pop());
            let a = this.ask.get(sortedAskKeys.pop());

            if(b){
                table.rows[rowNum].cells[BIDPRICECELL].innerHTML = b.price.toFixed(this.precision);
                table.rows[rowNum].cells[BIDSIZECELL].innerHTML = Math.trunc(b.shareSize / 100);
            }
            else{
                table.rows[rowNum].cells[BIDPRICECELL].innerHTML = ""
                table.rows[rowNum].cells[BIDSIZECELL].innerHTML = ""
            }

            if(a){
                table.rows[rowNum].cells[ASKPRICECELL].innerHTML = a.price.toFixed(this.precision);
                table.rows[rowNum].cells[ASKSIZECELL].innerHTML = Math.trunc(a.shareSize / 100);
            }
            else{
                table.rows[rowNum].cells[ASKPRICECELL].innerHTML = ""
                table.rows[rowNum].cells[ASKSIZECELL].innerHTML = ""
            }
        }
    }

    drawPriceHistory(table){
        //Pre-fill the table with cells.
        if(table.rows.length < 10){
            for(let r = 0; r < 10; ++r){
                let row = table.insertRow();
                //Add three cells on each row. (Price Size Time).
                for(let i = 0; i < 3; ++i){
                    row.insertCell();
                }

            }
        }

        let displayPrices = [];
        if(this.priceHistory.length <= 10){
            const priceHistory = this.priceHistory;

            for(let val of priceHistory)
                displayPrices.push(val);
        }
        else{
            let offset = this.priceHistory.length - 10;
            const priceHistory = this.priceHistory;
            const historyLength = priceHistory.length;

            for(let i = offset; i < historyLength; ++i)
                displayPrices.push(priceHistory[i]);
        }

        //Scroll the transactions so the most recent transaction is at the top.
        displayPrices.reverse();
        //table.rows.era

        //console.log(displayPrices.lenght);

        const displayLength = displayPrices.length;

        for(let i = 0; i < displayLength; ++i){
            let info = displayPrices[i];
            let price = table.rows[i].cells[0];
            let size = table.rows[i].cells[1];
            let time = table.rows[i].cells[2];

            price.innerHTML = info.price.toFixed(this.precision);
            size.innerHTML = info.size;
            time.innerHTML = info.time;
            price.style.color = size.style.color = time.style.color = info.side == BUY ? "lightgreen" : "red";
        }
    }

    addOrder(order){
        switch(order.side){
            case BUY:
            case CVR:{
                let q = this.bid.get(order.price);
                if(q != undefined){
                    q.push(order);
                }
                else{
                    this.bid.set(order.price, new OrderQueue(order.price));
                    this.addOrder(order);
                }
            }
            break;

            case SEL:
            case SHT:{
                let q = this.ask.get(order.price);
                if(q != undefined){
                    q.push(order);
                }
                else{
                    this.ask.set(order.price, new OrderQueue(order.price));
                    this.addOrder(order);
                }
            }   
            break;
        }
    }

    bestAsk(){
        let best = Number.MAX_VALUE;
        let aq = this.ask.keys();
        const askSize = this.ask.size;

        for(let i = 0; i < askSize; ++i){
            let val = aq.next().value;
            best = val < best ? val : best;
        }

        return this.ask.get(best);
    }

    bestBid(){
        let best = 0;
        let bq = this.bid.keys();
        const bidSize = this.bid.size;

        for(let i = 0; i < bidSize; ++i){
            let val = bq.next().value;
            best = val > best ? val : best;
        }

        return this.bid.get(best);
    }

    /*
    lastSell(){
        for(let i = this.priceHistory.length - 1; i > -1; --i){
            let info = this.priceHistory[i];
            if(info.side == SEL){
                return info;
            }
        }

        return null;
    }

    lastBuy(){
        for(let i = this.priceHistory.length - 1; i > -1; --i){
            let info = this.priceHistory[i];
            if(info.side == BUY){
                return info;
            }
        }
    } 
    
    last(){
        if(this.priceHistory.length > 0){
            return this.priceHistory[this.priceHistory.length - 1].price;
        }
        else
            return NaN;
    }
    */

    flush(){
        //Remove all empty queues.
        let emptyBidKeys = [];
        let bk = this.bid.keys();
        const bidSize = this.bid.size;

        for(let i = 0; i < bidSize; ++i){
            let k = bk.next().value;
            let b = this.bid.get(k);
            if(b.shareSize == 0){
                emptyBidKeys.push(k);
            }
        }

        let emptyAskKeys = [];
        let ak = this.ask.keys();
        const askSize = this.ask.size;

        for(let i = 0; i < askSize; ++i){
            let k = ak.next().value;
            let a = this.ask.get(k);

            if(a.shareSize == 0){
                emptyAskKeys.push(k)
            }
        }

        const emptyBidLength = emptyBidKeys.length;

        for(let i = 0; i < emptyBidLength; ++i){
            this.bid.delete(emptyBidKeys[i]);
        }

        const emptyAskLength = emptyAskKeys.length;

        for(let i = 0; i < emptyAskLength; ++i){
            this.ask.delete(emptyAskKeys[i]);
        }

        /*
            Save space by limiting the size of the price history.
        */

        if(this.priceHistory.length > 20){
            this.priceHistory.splice(0, 10);
        }
    }

    
}