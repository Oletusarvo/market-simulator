let bearThreshold = 0.5;

generator = new SineGenerator(0.007, 0.3);
sentimentFrequencyModulator = new SineGenerator(0.01, 0.007, COS, 0.007 / 2);

execute = function(order){
    order.price = parseFloat(order.price.toFixed(2));
    const errcode = BROKER.registerOrder(order);
    if(!errcode){
        EXCHANGE.execute(order);
        let transactions = EXCHANGE.transactions;
        
        while(transactions.length > 0){
            let info = transactions.pop();
            BROKER.registerTransaction(info);
            BANK.registerTransaction(info);
        }
    }    
    else{
        BROKER.drawMessages(berrtable);
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
    
	if(order != undefined){
		var acc = BROKER.accounts.get(order.id);
		if(((acc.openOrderSide == SHT && (order.side == SHT || order.side == CVR)) || 
			(acc.openOrderSide == BUY && (order.side == BUY || order.side == SEL)) || 
			acc.openOrderSide == FLT) && 
			sendOrder){
			execute(order);
		}
		else{
			//Cancel orders randomly.
			
			if(Math.abs(acc.openOrderPrice - last) >= 0.3){
				EXCHANGE.cancel(order.id, SYMBOL);
				BROKER.registerCancel(order.id);
			}

		}
	}
}