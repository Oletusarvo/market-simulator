let bearThreshold = 0.5;

generator = new SineGenerator(0.007, 0.3);
sentimentFrequencyModulator = new SineGenerator(0.01, 0.007, COS, 0.007 / 2);

execute = function(order){
    order.price = parseFloat(order.price.toFixed(2));
    const errcode = broker.registerOrder(order);
    if(!errcode){
        exchange.execute(order);
        let transactions = exchange.transactions;
        
        while(transactions.length > 0){
            let info = transactions.pop();
            broker.registerTransaction(info);
            bank.registerTransaction(info);
        }
    }    
    else{
        broker.drawMessages(berrtable);
    }
}

function autoTrade(logic){
    var ask = orderbook.bestAsk();
    var bid = orderbook.bestBid();
    var last = orderbook.last;
    var spread = (ask && bid) ? ask.price - bid.price : NaN;
    var outputSpread = document.getElementById("output-spread");
    //outputSpread.value = spread.toFixed(2);

    //document.getElementById("output_sentiment_frequency").value = sentiment == BUY ? "BUY" : "SEL";
    var sendOrder = true;

    //Figure out what order to send.
    let order = logic();
    
    var acc = broker.accounts.get(order.id);
    if(((acc.openOrderSide == SHT && (order.side == SHT || order.side == CVR)) || 
        (acc.openOrderSide == BUY && (order.side == BUY || order.side == SEL)) || 
        acc.openOrderSide == FLT) && 
        sendOrder){
        execute(order);
    }
    else{
        //Cancel orders randomly.
        
        if(Math.abs(acc.openOrderPrice - last) >= 0.3){
            exchange.cancel(order.id, k_symbol);
            broker.registerCancel(order.id);
        }

    }
    
    generator.update();
    sentimentFrequencyModulator.update();
    //document.getElementById("output-sine").value = generator.val.toFixed(2);
}