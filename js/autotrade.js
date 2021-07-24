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
    //Figure out what order to send.
    updateGiveUp();
    checkCancelOrders();
    const order = logic(Math.trunc(RANDOM_RANGE(1, numTraders - 1)));
    
    if(order){
        execute(order);
    }
	
}