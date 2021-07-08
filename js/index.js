var bb          = document.getElementById("buy-button");
var sb          = document.getElementById("sell-button");
var cb          = document.getElementById("cancel-button");
var shb         = document.getElementById("short-button");
var cvb         = document.getElementById("cover-button");
var borrowBtn   = document.querySelector("#borrow-button");

let table       = document.getElementById("table-level2");
let berrtable   = document.getElementById("table-broker-messages");
let ptable      = document.getElementById("table-price-history");
RANDOM_RANGE 	= (min, max) => Math.random() * (max - min) + min;
let SYMBOL    	= "DEF";
let NEXT_ID		= 1; //Used by trading logic functions to determine the next trader to make a move.
let LAST_SIDE = FLT;

const k_ename   = "HHSE"; 
let EXCHANGE    = new Exchange(k_ename);

let BROKER      = new Broker("Brokkoli");
let BANK        = new Bank();
var mmEnabled   = document.querySelector("#input-enable-mm").value != "False";

BROKER.allowNakedShort = false;
BROKER.infiniteShortSupply = false;

//exchange.marketmaker = marketmaker;

EXCHANGE.addOrderBook(SYMBOL);
var orderbook = EXCHANGE.getOrderBook(SYMBOL);

const numTraders = 50;
let traders = [];

for(let i = 0; i < numTraders; ++i){
    let equity = 3151.51;
    BROKER.addAccount(i, equity);
    BANK.addAccount(i, equity);
    traders.push(new Trader(i));
}

for(let r = 0; r < 10; ++r){
    let row = table.insertRow();
    for(let c = 0; c < 4; ++c){
        let cell = row.insertCell();

        //Allow setting price to the price listed on a level2 order.
        if(c == 0 || c == 2){
            cell.onclick = function(){
                let inputPrice = document.getElementById("input-price");
                inputPrice.value = cell.innerHTML;
                
            }
        }

        //Allow setting size to the size listed on a level2 order
        if(c == 1 || c == 3){
            cell.onclick = function(){
                let inputSize = document.getElementById("input-size");
                inputSize.value = cell.innerHTML * 100; //This has to be multiplied by 100, because the number shown is the size divided by 100.
                
            }
        }

        cell.setAttribute("name", "obcell");
    }
}

let marketmaker = new MarketMaker(EXCHANGE);
marketmaker.spread = 0.01;
marketmaker.depth = 2;

update();

let running = false;

//Prioritize traders that are bailing out of a position.
//let bailouts = [];
setInterval(function(){
    if(running){
        //generator.frequency = Math.abs(sentimentFrequencyModulator.val);
        autoTrade(tradingLogicComplex); 
        update(); 
    }
       
}, 150);

//Create a symbol
//Symbol select
const inputSymbol = document.querySelector("#input-symbol");
inputSymbol.onkeydown = function(key){
    if(key.keyCode === 13){
        //13 Is Enter.
        let symbol = inputSymbol.value;
        let ob = EXCHANGE.getOrderBook(symbol);

        if(ob){
            SYMBOL = symbol;
            orderbook = ob;
			
			let message = new Message("Symbol set to \'" + symbol + "\'", "Broker");
			
			BROKER.addMessage(message);

            const offerShares = document.querySelector("#input-offer-symbol");
            offerShares.value = symbol;
			
			const locateShares = document.querySelector("#input-locate-symbol");
			locateShares.value = symbol;
        } 
        else{
			let message = new Message("Symbol \'" + symbol + "' does not exist!", "Broker");
			BROKER.addMessage(message);
        }
    }
	
	update();
}

//Buy button
bb.onclick = function(){
    const price = parseFloat(parseFloat(document.getElementById("input-price").value).toFixed(2));
    const size = parseInt(document.getElementById("input-size").value);
    const id = parseInt(document.getElementById("input-id").value);
    const type = document.getElementById("input-type").value == "MKT" ? MKT : LMT;

    let order = new Order(id, SYMBOL, k_ename, price, size, BUY, type);
    execute(order);
    update();
}

//Cover button
cvb.onclick = function(){
    const price = parseFloat(parseFloat(document.getElementById("input-price").value).toFixed(2));
    const size = parseInt(document.getElementById("input-size").value);
    const id = parseInt(document.getElementById("input-id").value);
    const type = document.getElementById("input-type").value == "MKT" ? MKT : LMT;

    let order = new Order(id, SYMBOL, k_ename, price, size, CVR, type);
    execute(order);
    update();
}

//Sell button
sb.onclick = function(){
    const price = parseFloat(parseFloat(document.getElementById("input-price").value).toFixed(2));
    const size = parseInt(document.getElementById("input-size").value);
    const id = parseInt(document.getElementById("input-id").value);
    const type = document.getElementById("input-type").value == "MKT" ? MKT : LMT;

    let order = new Order(id, SYMBOL, k_ename, price, size, SEL, type);
    execute(order);
    update();
}

//Short button
shb.onclick = function(){
    const price = parseFloat(parseFloat(document.getElementById("input-price").value).toFixed(2));
    const size = parseInt(document.getElementById("input-size").value);
    const id = parseInt(document.getElementById("input-id").value);
    const type = document.getElementById("input-type").value == "MKT" ? MKT : LMT;

    let order = new Order(id, SYMBOL, k_ename, price, size, SHT, type);
    execute(order);
    update();
}

//Position button
let buttonPos = document.getElementById("position-button");
buttonPos.onclick = function(){
    const size = document.getElementById("input-size");
    const id = parseInt(document.getElementById("input-id").value);

    let acc = BROKER.accounts.get(id);
    if(acc){
        let pos = acc.positions.get(SYMBOL);
        if(pos){
            size.value = Math.abs(pos.sizeIn);
        }
            
    }
        
}

//Half pos Button
let buttonHalfPos = document.querySelector("#half-pos-button");
buttonHalfPos.onclick = function(){
    const id = parseInt(document.querySelector("#input-id").value);
    const acc = BROKER.accounts.get(id);
    const pos = acc.positions.get(k_symbol);

    if(pos){
        const size = document.querySelector("#input-size");
        size.value = Math.floor(pos.sizeIn / 2);
    }
    else{
       let message = new Message("No open position for " + SYMBOL, id);
	   BROKER.addMessage(message);
	   update();
    }
	
	
}

//Cancel button
cb.onclick = function(){
    const id = parseInt(document.getElementById("input-id").value);
    EXCHANGE.cancel(id, SYMBOL);

    BROKER.registerCancel(id);

    update();
}

//Stop AI button
let sab = document.getElementById("run-button");
sab.onclick = function(){
    running = !running;
    if(running){
        sab.innerHTML = "Stop AI";
    }
    else{
        sab.innerHTML = "Run AI";
    }
}

//Offer shares
const shortOfferSymbol      = document.querySelector("#input-offer-symbol");
const shortOfferSize        = document.querySelector("#input-offer-size");
const shortOfferPrice       = document.querySelector("#input-offer-size");
const shortOfferOkButton    = document.querySelector("#offer-ok-button");

shortOfferOkButton.onclick = function(){
    let id = parseInt(document.querySelector("#input-id").value);
    let symbol = shortOfferSymbol.value;
    let size = shortOfferSize.value;
    let result = broker.offer(id, symbol, size);
	
	switch(result){
		case BROKER.ERR_ACCOUNT:{
			let message = new Message("Account with id \'" + id + "\' does not exist!", "Broker");
			BROKER.addMessage(message);
		}
		break;
		
		case ERR_NO_POSITION:{
			let message = new Message("No position for symbol \'" + symbol + "\'!", id)
			BROKER.addMessage(message);
		}
		
		break;
		
		case BROKER.ERR_SIZE:{
			let message = new Message("Not enough shares to borrow!", id);
			BROKER.addMessage(message);
		}
		
		break;
		
		default:{
			let message = new Message("Offered shares for borrow.", id);
			BROKER.addMessage(message);
		}
		
	}
	
	update();
}

//Cancel offered shares
const shortOfferCancelButton = document.querySelector("#offer-cancel-button");

shortOfferCancelButton.onclick = function(){
	//Allow canceling an offer if no shares are currently borrowed out.
	const symbol = SYMBOL;
	const id = parseInt(document.querySelector("#input-id").value);
	const result = BROKER.cancelOffer(symbol, id);
	
	switch(result){
		
	}
}

//Short locate
const shortLocateSymbol     = document.querySelector("#input-locate-symbol");
const shortLocateSize       = document.querySelector("#input-locate-size");
const shortLocateOkButton   = document.querySelector("#locate-ok-button");

shortLocateOkButton.onclick = function(){
    let symbol = shortLocateSymbol.value;
    let size = parseInt(shortLocateSize.value);
    let id = parseInt(document.querySelector("#input-id").value);
    let result = BROKER.locate(id, symbol, size);

    if(!result){
		let message = new Message("Located " + size + " shares!", "Broker");
       BROKER.addMessage(message);
    }
    else{
		let message = new Message("Could not locate shares to borrow!", "Broker");
        BROKER.addMessage(message);
    }

    update();
}

//Return shares
let returnSharesButton = document.querySelector("#return-shares-button");
returnSharesButton.onclick = function(){
    let id = parseInt(document.querySelector("#input-id").value);
    let symbol = document.querySelector("#input-locate-symbol").value;
    let result = BROKER.returnShares(id, symbol);
	let msg = new Message();
	
	switch(result){
		case 1:
		msg.message = "No shares to return!";
		msg.from = id;
		BROKER.addMessage(msg);
		break;
		
		case 2:
		msg.message = "Account does not exist!";
		msg.from = "Broker";
		BROKER.addMessage(msg);
		break;
		
		case 3:
		msg.message = "Cannot return shares while there is open equity!";
		msg.from = id;
		BROKER.addMessage(msg);
		break;
		
		default:
		msg.message = "Returned borrowed shares.";
		msg.from = id;
		BROKER.addMessage(msg);
	}
	
    update();
}

let inputId = document.getElementById("input-id");
inputId.oninput = function(){
    updateBrokerInfo();
    updateBankInfo();
}

//Allow setting price to the current ask price by clicking on it.
let outputAsk = document.getElementById("output-ask");
outputAsk.onclick = function(){
    let inputPrice = document.getElementById("input-price");
    inputPrice.value = outputAsk.value;
}

//Allow setting price to the current bid price by clicking on it.
let outputBid = document.getElementById("output-bid");
outputBid.onclick = function(){
    let inputPrice = document.getElementById("input-price");
    inputPrice.value = outputBid.value;
}

//Allow setting price to the last price by clicking on it.
let outputLast = document.getElementById("output-last");
outputLast.onclick = function(){
    let inputPrice = document.getElementById("input-price");
    inputPrice.value = outputLast.value;
}

//Allow setting price to the high price by clicking on it.
let outputHigh = document.getElementById("output-high");
outputHigh.onclick = function(){
    let inputPrice = document.getElementById("input-price");
    inputPrice.value = outputHigh.value;
}

//Allow setting price to the low price by clicking on it.
let outputLow = document.getElementById("output-low");
outputLow.onclick = function(){
    let inputPrice = document.getElementById("input-price");
    inputPrice.value = outputLow.value;
}