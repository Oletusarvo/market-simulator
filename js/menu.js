//Menu
const menu                  = document.querySelector("#menu");
const menuButton            = document.querySelector("#menu-button");
const settingAllowNakedShort= document.querySelector("#input-naked-short");
const settingInfiniteShortSupply = document.querySelector("#input-is-supply");

settingAllowNakedShort.addEventListener("change", nakedFun);
settingInfiniteShortSupply.addEventListener("change", infiniteFun);

function nakedFun(){
    const setting = settingAllowNakedShort.value;
    broker.allowNakedShort = setting == "True";
    update();
}

function infiniteFun(){
    const setting = settingInfiniteShortSupply.value;
    broker.infiniteShortSupply = setting == "True";
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