let bearThreshold = 0.5;

generator = new SineGenerator(0.007, 0.3);
sentimentFrequencyModulator = new SineGenerator(0.01, 0.007, COS, 0.007 / 2);

execute = function(order){
    order.price = parseFloat(order.price.toFixed(orderbook.precision));
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
    updateTraders();
    let order = undefined;


    if(BAILOUTS.length > 0 && BAILOUT_SWITCH){
        //const id = Array.from(BAILOUTS.keys()).pop();
        const id = BAILOUTS[0];
        BAILOUTS.splice(0, 1);
        order = logic(id);

        if(bailoutSwitchTimer >= BAILOUT_SWITCH_TIME){
            BAILOUT_SWITCH = false;
            bailoutSwitchTimer = 0;
        }
        else{
            bailoutSwitchTimer += UPDATE_SPEED;
        }
    }
    else{
        //const id = RANDOM_RANGE_INT(1, )
        const id = RANDOM_RANGE_INT(1, numTraders - 1);
        order = logic(id);

        BAILOUT_SWITCH = true;
        bailoutSwitchTimer = 0;
    }
    
    
    if(order){
        execute(order);
    }
	
}