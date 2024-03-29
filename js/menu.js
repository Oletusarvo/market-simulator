//Menu
const menu                  = document.querySelector("#menu");
const menuButton            = document.querySelector("#menu-button");
const settingAllowNakedShort= document.querySelector("#input-naked-short");
const settingInfiniteShortSupply = document.querySelector("#input-is-supply");

settingAllowNakedShort.addEventListener("change", nakedFun);
settingInfiniteShortSupply.addEventListener("change", infiniteFun);

function nakedFun(){
    const setting = settingAllowNakedShort.value;
    BROKER.allowNakedShort = setting == "True";

	if(BROKER.allowNakedShort){
		let message = new Message("Naked shorting enabled.", "Broker");
		BROKER.addMessage(message);
	}
	else{
		let message = new Message("Naked shorting disabled.", "Broker");
		BROKER.addMessage(message);
	}
    update();
}

function infiniteFun(){
    const setting = settingInfiniteShortSupply.value;
    BROKER.infiniteShortSupply = setting == "True";

	if(BROKER.infiniteShortSupply){
		let message = new Message("Infinite short supply enabled", "Broker");
		BROKER.addMessage(message);
	}
	else{
		let message = new Message("Infinite short supply disabled", "Broker");
		BROKER.addMessage(message);
	}
    update();
}

const areaOpenPositions     = document.querySelector("#menu-area-open-positions");
const areaClosedPositions   = document.querySelector("#menu-area-closed-positions");
const areaOpenOrders        = document.querySelector("#menu-area-open-orders");
const areaSymbolList        = document.querySelector("#menu-area-symbol-list");

let showMenu      = false;
let showOpenPositions = false;
let showClosedPositions = false;
let showOpenOrders = false;
let showSymbolList = false;

menuButton.onclick = function(){
    if(!showMenu){
        showMenu = true;
        menu.classList.add("show");
        menuButton.classList.add("close");
    }
    else{
        showMenu = false;
        menu.classList.remove("show");
        menuButton.classList.remove("close");
    }
}

const menuButtonOkNumBots = document.querySelector("#button-ok-num-bots");
menuButtonOkNumBots.onclick = function(){
	const inputNumBots = document.querySelector("#input-num-bots");
	const num = inputNumBots.value;
	
	let message = new Message("Bot number set to \'" + num + "\'", "Broker");
	BROKER.addMessage(message);
	update();
}

let rmb = document.querySelector("#input-enable-mm");
rmb.addEventListener("change", toggleMM);

function toggleMM(){
	mmEnabled = rmb.value == "True";
	
	if(mmEnabled){
		let message = new Message("Market maker enabled.", "Exchange");
		BROKER.addMessage(message);
	}
	else{
		let message = new Message("Market maker disabled.", "Exchange");
		BROKER.addMessage(message);
		orderbook.cancel(-1);
	}
	
	update();
}

const buttonOkAddSymbol = document.querySelector("#button-ok-add-symbol");
buttonOkAddSymbol.onclick = function(){
	const symbol = document.querySelector("#input-add-symbol").value;
	const price = parseFloat(document.querySelector("#input-add-symbol-price").value);
	
	if(symbol != ""){
		EXCHANGE.addOrderBook(symbol);
		let message = new Message("Added symbol \'" + symbol + "\'.", "Exchange");
		BROKER.addMessage(message);
	}
	else{
		let message = new Message("Cannot have an empty string as symbol name!", "Exchange");
		BROKER.addMessage(message);
	}
	
	update();
}

const inputPoSymbol = document.querySelector("#input-po-symbol");
const inputPoAmount = document.querySelector("#input-po-amount");
const inputPoPrice = document.querySelector("#input-po-price");
const buttonPoOk = document.querySelector("#button-ok-po-symbol");

buttonPoOk.onclick = function(){
    const amount = parseInt(inputPoAmount.value);
    const symbol = inputPoSymbol.value;
    const price = parseFloat(inputPoPrice.value);
    
    //const id = parseInt(document.querySelector("#input-id").value);

    const half = Math.floor(numTraders / 2);
    const shares = Math.floor(amount / half);
    for(let i = 0; i < half; ++i){
        const acc = BROKER.accounts.get(i);

        if(acc){
            acc.addPosition(symbol, price, shares, BUY);
        }
        
    }

    let message = new Message("Performed public offering for symbol \'" + symbol + "\'.", "Broker");
    EXCHANGE.addOrderBook(symbol);
    BROKER.addMessage(message);

    if(EXCHANGE.getOrderBook(symbol) == undefined){
        let message = new Message("Added symbol \'" + symbol + "\'.", "Exchange");
        EXCHANGE.addOrderBook(symbol);
        broker.addMessage(message);
    }
    
    update();
}

const inputMMSpread = document.querySelector("#input-mm-spread");
const inputMMDepth = document.querySelector("#input-mm-depth");
const buttonOkMMSpread = document.querySelector("#button-ok-mm-spread");
const buttonOkMMDepth = document.querySelector("#button-ok-mm-depth");

buttonOkMMSpread.onclick = function(){
    const spread = parseFloat(inputMMSpread.value);
    MARKETMAKER.spread = spread;

    const message = new Message("Spread set to " + spread, "Market maker");
    BROKER.addMessage(message);
    update();
}

buttonOkMMDepth.onclick = function(){
    const depth = parseFloat(inputMMDepth.value);
    MARKETMAKER.depth = depth;

    const message = new Message("Depth set to " + depth, "Market maker");
    BROKER.addMessage(message);
    update();
}
/*
Reintroduce this later.
const createOkButton = document.querySelector("#create-ok-button");
const createSymbol  = document.querySelector("#input-create-symbol");
const createPrice   = document.querySelector("#input-create-price");
const createSize    = document.querySelector("#input-create-size");

createOkButton.onclick = function(){
    let symbol = createSymbol.value;
    let price = parseFloat(createPrice.value).toFixed(2);
    let size = parseInt(createSize.value).toFixed(2);

    if(price == 0 || price > 10000){
        console.log("Incorrect price! Must be between 0 and 10001.");
        return;
    }
    else if(size == 0 || size > 10000){
        console.log("Incorrect size! Must be between 0 and 10001.");
        return;
    }
    
    if(!exchange.getOrderBook(symbol)){
        exchange.addOrderBook(symbol);
        menu.classList.remove("show");
        menuButton.classList.remove("close");
        showMenu = false;
        broker.messages.push("Symbol " + symbol + " created!");
        update();
    }
    else{
        console.log("Symbol " + symbol + " already exists!");
    }
}
*/