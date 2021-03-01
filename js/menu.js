//Menu
const menu                  = document.querySelector("#menu");
const menuButton            = document.querySelector("#menu-button");
const menuLinks             = document.querySelectorAll(".menu-link");
const menuLinkOpenPositions = document.querySelector("#menu-open-positions-link");
const menuLinkClosedPositions = document.querySelector("#menu-closed-positions-link");
const menuLinkOpenOrders    = document.querySelector("#menu-open-orders-link");
const menuSymbolListLink    = document.querySelector("#menu-symbol-list-link");

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

menuLinkOpenPositions.onclick = function(){
    if(!showOpenPositions){
        showOpenPositions = true;
       // menu.classList.add("show");
       // menuButton.classList.add("close");
    }
    else{
        showOpenPositions = false;
        //menu.classList.remove("show");
        //menuButton.classList.remove("close");
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