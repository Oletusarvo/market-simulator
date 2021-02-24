//Called when something changes.
updateBrokerInfo = function(){
	//Update account info.
	let inputId                 = document.getElementById("input-id");
	let outputId                = document.getElementById("output-id");
	let outputOpenEquity        = document.querySelector("#output-oe");
	let outputBuyingPower       = document.querySelector("#output-bp");
	let outputMargin            = document.querySelector("#output-margin");
	let id                      = parseInt(inputId.value);
	outputId.value              = id;

	let acc                     = broker.accounts.get(id);
	outputOpenEquity.value      = acc.openEquity.toFixed(2);
	outputBuyingPower.value     = acc.getBuyingPower().toFixed(2);
	outputMargin.value          = acc.cashBuyingPower < 0 ? -acc.cashBuyingPower.toFixed(2) : 0.00;

	//Display all open positions on the positions table.
	let posTable				= document.querySelector("#table-position-info");
	let positions               = acc.positions;
	let currentAsk          	= orderbook.bestAsk() ? orderbook.bestAsk().price : NaN;
	let currentBid          	= orderbook.bestBid() ? orderbook.bestBid().price : NaN;
	let pricePrecision			= 3;
	if(positions.size > 0){
		//Add rows and cells to the table to contain the data.
		if(posTable.rows.length - 1 < positions.size){
			for(let r = posTable.rows.length - 1; r < positions.size; ++r){
				let row = posTable.insertRow();
				for(let c = 0; c < 7; ++c){
					row.insertCell();
				}
			}
		}
		
		let tablePos = 1; //Skip the header.
		for(let p of positions.keys()){
			//Implied to exist.
			let pos = positions.get(p);
			
			if((pos.side == BUY) && currentBid != undefined){
				gain = ((currentBid - pos.avgPriceIn) / pos.avgPriceIn) * 100;
			}
			else if((pos.side == SHT) && currentAsk != undefined){
				gain = ((pos.avgPriceIn - currentAsk) / pos.avgPriceIn) * 100;
			}
			else{
				gain = NaN;
			}
			
			/*
				Update existing entries on the table.
				
				The order of cells is the following:
				Symbol Side Size AvgPrice Realized Unrealized Gain
			*/	
			
			let row = posTable.rows[tablePos];
			
			//Symbol
			row.cells[0].innerHTML = pos.symbol;
			//Side
			row.cells[1].innerHTML = pos.side == BUY ? "Long" : "Short";
			//Size
			row.cells[2].innerHTML = pos.sizeIn;
			//Average Price
			row.cells[3].innerHTML = pos.avgPriceIn.toFixed(pricePrecision);
			//Realized
			row.cells[4].innerHTML = pos.realized.toFixed(pricePrecision);
			//Unrealized
			row.cells[5].innerHTML = pos.side == BUY ? ((currentBid - pos.avgPriceIn) * Math.abs(pos.sizeIn)).toFixed(pricePrecision) : ((pos.avgPriceIn - currentAsk) * Math.abs(pos.sizeIn)).toFixed(pricePrecision);
			//Gain
			row.cells[6].innerHTML = gain >= 0 ? "+" : "";
			row.cells[6].innerHTML += gain.toFixed(2) + "%";
			
			row.cells[4].style.color = row.cells[4].innerHTML > 0 ? "green" : "red";
			row.cells[5].style.color = row.cells[6].style.color =  gain >= 0 ? "green" : "red";
		

			tablePos++;
		}
	}
	else{
		//Clear shown positions.
		for(let i = 1; i < posTable.rows.length; ++i){
			for(let c = 0; c < 7; ++c){
				posTable.rows[i].cells[c].innerHTML = "";
			}
		}
	}

	//Draw open orders
	//The openOrders container is a map containing maps.
	let ooTable = document.querySelector("#table-open-orders");
	let openOrders = acc.openOrders;

	//Count the total number of orders.
	let numOrders = 0;
	for(let oo of openOrders.values()){
		numOrders += oo.size;
	}

	if(openOrders.size > 0){
		for(let i = ooTable.rows.length - 1; i < numOrders; ++i){
			let row = ooTable.insertRow();
			for(let j = 0; j < 5; ++j){
				row.insertCell();
			}
		}

		let tablePos = 1; //Skip the header.
		for(let om of openOrders.keys()){
			let orders = openOrders.get(om);
			for(let o of orders){
				ooTable.rows[tablePos].cells[0].innerHTML = o[1].symbol;
				ooTable.rows[tablePos].cells[1].innerHTML = o[1].side == BUY ? "Buy" : o[1].side == SEL ? "Sell" : o[1].side == SHT ? "Short" : "Cover";
				ooTable.rows[tablePos].cells[2].innerHTML = o[1].size;
				ooTable.rows[tablePos].cells[3].innerHTML = o[1].price;
				ooTable.rows[tablePos].cells[4].innerHTML = o[1].type == LMT ? "LMT" : "UKN";
				tablePos++;
			}
		}
	}
	else{
		for(let i = 1; i < ooTable.rows.length; ++i){
			for(let j = 0; j < 5; ++j){
				ooTable.rows[i].cells[j].innerHTML = "";
			}
		}
	}

	//Draw any positions that have been closed.
	let cposTable = document.querySelector("#table-closed-positions");
	let closedPositions = acc.closedPositions;
	if(closedPositions.length > 0){
		//Insert rows into the table.
		if(cposTable.rows.length - 1 < closedPositions.length){
			for(let r = cposTable.rows.length - 1; r < closedPositions.length; ++r){
				let row = cposTable.insertRow();
				for(let c = 0; c < 7; ++c){
					row.insertCell();
				}
			}
		}

		//Skip the header.
		let tablePos = 1;
		for(let r = closedPositions.length - 1; r >= 0; --r){
			let rec = closedPositions[r];

			//Symbol
			cposTable.rows[tablePos].cells[0].innerHTML = rec.symbol;
			//Side
			cposTable.rows[tablePos].cells[1].innerHTML = rec.side == BUY ? "Long" : "Short";
			//Size
			cposTable.rows[tablePos].cells[2].innerHTML = rec.size / 2;
			//PriceIn
			cposTable.rows[tablePos].cells[3].innerHTML = rec.avgPriceIn.toFixed(pricePrecision);
			//PriceOut
			cposTable.rows[tablePos].cells[4].innerHTML = rec.avgPriceOut.toFixed(pricePrecision);
			//Realized
			cposTable.rows[tablePos].cells[5].innerHTML = rec.realized.toFixed(pricePrecision);
			//Gain
			cposTable.rows[tablePos].cells[6].innerHTML = 
			(rec.side == BUY ? (((rec.avgPriceOut - rec.avgPriceIn) / rec.avgPriceIn) * 100).toFixed(2) : (((rec.avgPriceIn - rec.avgPriceOut) / rec.avgPriceIn) * 100).toFixed(2)) + "%";

			tablePos++;
		}
	}

	//Draw symbol list
	let symbolTable = document.querySelector("#table-symbol-list");
	let orderbooks = exchange.orderbooks;
	if(orderbooks.size > 0){
		let numSymbols = orderbooks.size;
		for(let i = symbolTable.rows.length - 1; i < numSymbols; ++i){
			let row = symbolTable.insertRow();
			for(let j = 0; j < 3; ++j){
				row.insertCell();
			}
		}

		//Draw the symbols
		let tablePos = 1; //Skip the header.
		for(ob of orderbooks.values()){
			//Name
			symbolTable.rows[tablePos].cells[0].innerHTML = ob.symbol;
			
			//Last price
			let last = ob.priceHistory.length > 0 ? ob.priceHistory[ob.priceHistory.length - 1].price : NaN;
			symbolTable.rows[tablePos].cells[1].innerHTML = last;

			//Gain
			symbolTable.rows[tablePos].cells[2].innerHTML = ((last - ob.open) / ob.open * 100).toFixed(2);
			tablePos++;
		}
	}

	
}

updateBankInfo = function(){
    let inputId                 = document.getElementById("input-id");
    let outputId                = document.getElementById("output-id");
    let outputBalance           = document.getElementById("output-balance");

    let id                      = parseInt(inputId.value);
    let acc                     = bank.accounts.get(id);
    outputBalance.value         = acc.balance;
}

update = function(){  
    let outputAsk  = document.getElementById("output-ask");
    let outputBid  = document.getElementById("output-bid");
    let outputLast = document.getElementById("output-last");
    let outputGain = document.getElementById("output-gain"); 
    let outputHigh = document.getElementById("output-high");
    let outputLow  = document.getElementById("output-low");
    let outputOpen = document.getElementById("output-open");
    let outputSpread = document.getElementById("output-spread");
	let outputSymbol = document.querySelector("#output-symbol");

    let ask = orderbook.bestAsk();
    let bid = orderbook.bestBid();
    let last = orderbook.priceHistory.length > 0 ? orderbook.priceHistory[orderbook.priceHistory.length - 1].price : NaN;
    
    outputAsk.value = ask ? ask.price.toFixed(2) : NaN;
    outputBid.value = bid ? bid.price.toFixed(2) : NaN;
    outputLast.value = last.toFixed(2);
    outputHigh.value = orderbook.high.toFixed(2);
    outputLow.value = orderbook.low == Number.MAX_VALUE ? NaN : orderbook.low.toFixed(2);
    //outputSpread.value = (ask && bid) ? (ask.price - bid.price).toFixed(2) : NaN;
	outputSymbol.value = k_symbol;

    let prefix = last - orderbook.open >= 0 ? "+" : "-";

    outputGain.value = last != NaN ? prefix + Math.abs(((last - orderbook.open) / last * 100)).toFixed(2) + "%" : 0 + "%";
    outputOpen.value = orderbook.open.toFixed(2);
    outputGain.style.color = prefix == "+" ? "yellowgreen" : "red";

    marketmaker.createMarket(k_symbol);
    orderbook.drawTable(table);
    orderbook.drawPriceHistory(ptable);

    updateBrokerInfo();
    updateBankInfo();
}