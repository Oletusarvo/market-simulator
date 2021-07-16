class Exchange{
    transact(order, queue){
        let otherOrder = queue.front();
        let info = new TransactionInfo();

        info.price      = otherOrder.price;
        info.symbol     = order.symbol;
        info.side       = order.side == BUY || order.side == CVR ? BUY : SEL;
        info.buyer      = (order.side == BUY || order.side == CVR ? order.id : otherOrder.id);
        info.seller     = (order.side == SEL || order.side == SHT ? order.id : otherOrder.id);
        info.time       = "";

        let time = new Date();
        let hours = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
        let minutes = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
        let seconds = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();

        info.time = hours + ":" + minutes + ":" + seconds;
        
        if(order.size > otherOrder.size){
            order.size -= otherOrder.size;
            info.size = otherOrder.size;
        }
        else{
            info.size = order.size;
            order.size = 0;
        }

        this.transactions.push(info);
        queue.reduce(info.size);

        /*
        let stringSide = info.side == SEL ? "Sold" : "Bought";
        if(stringSide == "Sold")
            console.log(info.seller + " sold " + info.size + " shares to " + info.buyer + " at " + info.price);
        else{
            console.log(info.buyer + " bought " + info.size + " shares from " + info.seller + " at " + info.price);
        }
        */
    }

    updateOrderbookData(orderbook){
        if(this.transactions.length > 0){
            let last = this.transactions[this.transactions.length - 1];
            orderbook.high = last.price > orderbook.high ? last.price : orderbook.high;
            orderbook.low = last.price < orderbook.low ? last.price : orderbook.low;
            orderbook.last = last;
            
            if(last.side == SEL){
                orderbook.numSell++;
                orderbook.lastSell = last;
            }
            else{
                orderbook.numBuy++;
                orderbook.lastBuy = last;
            }

            if(orderbook.open == 0){
                orderbook.open = last.price;
            }

            orderbook.lastDirection = last.side;        
        }
    }

    executeBuyMKT(order){
        let orderbook = this.orderbooks.get(order.symbol);
        let seller = orderbook.bestAsk();
        
        while(seller && order.size > 0){
            this.transact(order, seller);
            orderbook.flush();
            seller = orderbook.bestAsk();
            this.updateOrderbookData(orderbook);
        }
    }

    executeBuyLMT(order){
        let orderbook = this.orderbooks.get(order.symbol);
        let seller = orderbook.bestAsk();
        while(seller && order.size > 0){
            if(+seller.price <= +order.price)
                this.transact(order,seller);
            else
                break;
            orderbook.flush();
            seller = orderbook.bestAsk();
            this.updateOrderbookData(orderbook);
        }
    }

    executeSellMKT(order){
        let orderbook = this.orderbooks.get(order.symbol);
        let buyer = orderbook.bestBid();

        while(buyer && order.size > 0){
            this.transact(order, buyer);
            orderbook.flush();
            buyer = orderbook.bestBid();

            this.updateOrderbookData(orderbook);
        }
    }

    executeSellLMT(order){
        let orderbook = this.orderbooks.get(order.symbol);
        let buyer = orderbook.bestBid();
        while(buyer && order.size > 0){
            if(+buyer.price >= +order.price)
                this.transact(order,buyer);
            else
                break;
            orderbook.flush();
            buyer = orderbook.bestBid(); 
            this.updateOrderbookData(orderbook);
        }
    }

    executeBuy(order){
        switch(order.type){
            case MKT:
                this.executeBuyMKT(order);
            break;

            case LMT:
                this.executeBuyLMT(order);
            break;
        }
    }

    executeSell(order){
        switch(order.type){
            case MKT:
                this.executeSellMKT(order);
            break;
            case LMT:
                this.executeSellLMT(order);
            break;
        }
    }

    constructor(name){
        this.name = name;
        this.orderbooks = new Map();
        this.transactions = [];
        this.marketmaker = null;
    }

    addOrderBook(symbol){
        this.orderbooks.set(symbol, new OrderBook(symbol));
    }

    getOrderBook(symbol){
        return this.orderbooks.get(symbol);
    }

    preprocess(order){
        let orderbook = this.getOrderBook(order.symbol);
        order.price = parseFloat(order.price.toFixed(orderbook.precision));
    }

    execute(order){
        this.preprocess(order);
        
        switch(order.side){
            case BUY:
            case CVR:
                this.executeBuy(order);
            break;

            case SEL:
            case SHT:
                this.executeSell(order);
            break;
        }

        let orderbook = this.orderbooks.get(order.symbol);

        for(let i = 0; i < this.transactions.length; ++i){
            orderbook.priceHistory.push(this.transactions[i]);
        }

        if(order.size > 0 && order.type != MKT){
            orderbook.addOrder(order);
        }

        return order.size;
    }

    cancel(id, symbol){
        let orderbook = this.orderbooks.get(symbol);
        orderbook.cancel(id);
    }

    getTransactions(){
        return this.transactions;
    }
}