class OrderBook{
    constructor(symbol){
        this.symbol         = symbol;
        this.ask            = new Map();
        this.bid            = new Map();
        this.priceHistory   = [];
        this.dataSeries     = [];
        this.subscribers    = []; //Traders who will receive event updates.
        this.open           = 0;
        this.close          = 0;
        this.high           = 0;
        this.low            = Number.MAX_VALUE;
        this.lastSell       = 0;
        this.lastBuy        = 0;
        this.last           = NaN;
        this.lastDirection  = FLT;
        this.direction      = FLT;
        this.numBuy         = 0;
        this.numSell        = 0;
        this.precision      = 2;

        this.halted         = false;
        this.shortSaleRestriction = false;
        this.haltReferencePrice = NaN;
        this.haltReferencePriceClock = 0;
        this.haltClock = 0;
        this.haltOpenTime = 10000; //Time until a halted stock reopens.
        this.haltingEnabled = false;
        this.haltThreshold = 0.1;

        this.periodVolume = 0;
    }

    update(){
        this.updatePrecision();

        const bid = this.bestBid();
        if(bid && bid.price < 0.1){
            this.shortSaleRestriction = true;
        }
        else{
            this.shortSaleRestriction = false;
        }

        this.dataSeriesUpdate();

        if(this.haltingEnabled){
            if(this.haltReferencePriceClock >= 5000){
                if(this.last != NaN){
                    this.haltReferencePrice = this.last.price;
                }
    
                this.haltReferencePriceClock = 0;
            }
            else{
                this.haltReferencePriceClock += UPDATE_SPEED;
            }
    
            const last = this.last;
            const haltReferencePrice = this.haltReferencePrice;
            const haltThreshold = this.haltThreshold;
            
            //Halt the stock if it surges 10% within a certain period.
            if(!this.halted && last != NaN && ((last.price >= haltReferencePrice + (haltReferencePrice * haltThreshold) || last.price <= haltReferencePrice - (haltReferencePrice * haltThreshold)))){
                this.halted = true;
                this.haltReferencePrice = last.price;
                this.haltOpenTime = 30000;
            }
    
            if(this.halted){
                if(this.haltClock < this.haltOpenTime){
                    this.haltClock += UPDATE_SPEED;
                }
                else{
                    this.haltClock = 0;
                    this.halted = false;
                }
            }
        }
        
    }

    dataSeriesOpen(){
        let candle = new Candle(this.last.price);
        this.periodVolume = 0;
        const previous = this.dataSeries.length - 1;

        const previousCandle = this.dataSeries[previous];
        
        if(previousCandle){
            previousCandle.next = candle;
            candle.previous = previousCandle;
        }
        
        this.dataSeries.push(candle);
    }

    dataSeriesClose(){
        let candle = this.dataSeries[this.dataSeries.length - 1];
        const lastPriceHistory = this.priceHistory[this.priceHistory.length - 1];

        if(this.dataSeries.length == 1){
            candle.open_price = this.open;
            candle.high_price = this.high;
            candle.low_price = this.low;
        }

        candle.close(lastPriceHistory.price);
        console.log(Number(candle.open_price).toLocaleString() + ";" + Number(candle.low_price).toLocaleString() + ";" + Number(candle.high_price).toLocaleString() + ";" + Number(candle.close_price).toLocaleString() + ";" + candle.volume);
    }

    dataSeriesUpdate(){
        const dataLen = this.dataSeries.length;
        const candle = this.dataSeries[dataLen - 1];

        const len = this.priceHistory.length;
        const lastPriceHistory = this.priceHistory[len - 1];

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
        if(this.last.price <= 0.001){
            this.precision = 6;
        }
        else if(this.last.price <= 0.01){
            this.precision = 5;
        }
        else if(this.last.price <= 0.1){
            this.precision = 4;
        }
        else if(this.last.price <= 1.00){
            this.precision = 3;
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

        const drawRows = 10;
        for(let rowNum = 1; rowNum <= drawRows; ++rowNum){

            let b = this.bid.get(sortedBidKeys.pop());
            let a = this.ask.get(sortedAskKeys.pop());

            let bidPriceCell = table.rows[rowNum].cells[BIDPRICECELL];
            let bidSizeCell = table.rows[rowNum].cells[BIDSIZECELL];
            let askPriceCell = table.rows[rowNum].cells[ASKPRICECELL];
            let askSizeCell = table.rows[rowNum].cells[ASKSIZECELL];

            

            if(b){
                bidPriceCell.innerHTML = b.price.toFixed(this.precision);
                const shareSize = b.shareSize <= 100 ? 1 : b.shareSize / 100;
                bidSizeCell.innerHTML = Math.trunc(shareSize);
            }
            else{
                bidPriceCell.innerHTML = ""
                bidSizeCell.innerHTML = ""
            }

            if(a){
                askPriceCell.innerHTML = a.price.toFixed(this.precision);
                const shareSize = a.shareSize <= 100 ? 1 : a.shareSize / 100;
                askSizeCell.innerHTML = Math.trunc(shareSize);
            }
            else{
                askPriceCell.innerHTML = ""
                askSizeCell.innerHTML = ""
            }

            const bidHaltLevel = parseFloat((this.haltReferencePrice - this.haltReferencePrice * this.haltThreshold).toFixed(this.precision));
            const askHaltLevel = parseFloat((this.haltReferencePrice + this.haltReferencePrice * this.haltThreshold).toFixed(this.precision));

            //console.log("Bid halt at: " + bidHaltLevel + " Ask halt at: " + askHaltLevel);
            //bidPriceCell.style.background = bidSizeCell.style.background = b && b.price <= bidHaltLevel ? "red" : "none";
            //askPriceCell.style.background = askSizeCell.style.background = a && a.price >= askHaltLevel ? "red" : "none";
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

    highestAsk(){
        let best = 0;
        let aq = this.ask.keys();
        const askSize = this.ask.size;

        for(let i = 0; i < askSize; ++i){
            let val = aq.next().value;
            best = val > best ? val : best;
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

    lowestBid(){
        let best = Number.MAX_VALUE;
        let bq = this.bid.keys();
        const bidSize = this.bid.size;

        for(let i = 0; i < bidSize; ++i){
            let val = bq.next().value;
            best = val < best ? val : best;
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

    sendEvent(event){
        for(const trader of this.subscribers){
            trader.handleEvent(event);
        }
    }

    
}