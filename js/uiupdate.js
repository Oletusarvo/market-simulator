//Called when something changes.
updateBrokerInfo = function(){
	//Update account info.
	let inputId                 = document.getElementById("input-id");
	let outputId                = document.getElementById("output-id");
	let outputOpenEquity        = document.querySelector("#output-oe");
	let outputBuyingPower       = document.querySelector("#output-bp");
	let outputPnl				= document.querySelector("#output-pnl");
	let outputMargin            = document.querySelector("#output-margin");
	let outputShortStatus		= document.querySelector("#output-short-status");
	let outputSharesAvailable	= document.querySelector("#output-shares-available");
	let outputSharesLocated		= document.querySelector("#output-shares-located");
	let outputOfferedShares		= document.querySelector("#output-offered-shares");

	const id                      = parseInt(inputId.value);
	outputId.value              = id;

	const acc					= BROKER.accounts.get(id);
	const locatedShares			= acc.locatedShares.get(SYMBOL);
	const sharesAvailable		= BROKER.sharesAvailable.get(SYMBOL);
	outputSharesAvailable.value	= sharesAvailable;
	outputShortStatus.value		= (locatedShares != undefined) ? "S" : "NS";
	outputSharesLocated.value	= locatedShares != undefined ? locatedShares : 0;
	outputShortStatus.style.color = outputShortStatus.value == "NS" ? "red" : "green";

	outputOpenEquity.value      = acc.openEquity.toFixed(2);
	outputBuyingPower.value     = acc.getBuyingPower().toFixed(2);
	outputMargin.value          = acc.cashBuyingPower < 0 ? -acc.cashBuyingPower.toFixed(2) : 0.00;
	outputPnl.value				= acc.pnl.toFixed(2);
	outputPnl.style.color		= acc.pnl >= 0 ? "green" : "red";
	
	const shares 				= acc.offeredShares.get(SYMBOL);
	outputOfferedShares.value	= shares != undefined ? shares : "No offer";

	//Display all open positions on the positions table.
	let posTable				= document.querySelector("#table-position-info");
	let positions               = acc.positions;
	let currentAsk          	= orderbook.bestAsk() ? orderbook.bestAsk().price : NaN;
	let currentBid          	= orderbook.bestBid() ? orderbook.bestBid().price : NaN;
	let pricePrecision			= 3;

	const positionsSize			= positions.size;

	if(positionsSize > 0){
		//Add rows and cells to the table to contain the data.
		if(posTable.rows.length - 1 < positionsSize){
			for(let r = posTable.rows.length - 1; r < positionsSize; ++r){
				let row = posTable.insertRow();
				for(let c = 0; c < 7; ++c){
					row.insertCell();
				}
			}
		}
		else if(posTable.rows.length - 1 > positionsSize){
			//Blank out the extra cells
			const numExtra = posTable.rows.length - positionsSize;
			const start = posTable.rows.length - numExtra;
			const total = posTable.rows.length;

			for(let i = start; i < total; ++i){
				for(let c = 0; c < 7; ++c){
					posTable.rows[i].cells[c].innerHTML = "";
				}
			}
		}
		
		let tablePos = 1; //Skip the header.
		const positionKeys = positions.keys();

		for(let p of positionKeys){
			//Implied to exist.
			const pos = positions.get(p);
			
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
			row.cells[2].innerHTML = pos.totalSize;
			//Average Price
			row.cells[3].innerHTML = pos.avgPriceIn.toFixed(pricePrecision);
			//Realized
			row.cells[4].innerHTML = pos.realized.toFixed(pricePrecision);
			//Unrealized
			row.cells[5].innerHTML = pos.side == BUY ? ((currentBid - pos.avgPriceIn) * Math.abs(pos.totalSize)).toFixed(pricePrecision) : ((pos.avgPriceIn - currentAsk) * Math.abs(pos.totalSize)).toFixed(pricePrecision);
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
		const rowLength = posTable.rows.length;

		for(let i = 1; i < rowLength; ++i){
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
	const openOrderValues = openOrders.values();

	for(let oo of openOrderValues){
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
		const openOrderKeys = openOrders.keys();

		for(let om of openOrderKeys){
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
		const rowLength = ooTable.rows.length;

		for(let i = 1; i < rowLength; ++i){
			for(let j = 0; j < 5; ++j){
				ooTable.rows[i].cells[j].innerHTML = "";
			}
		}
	}

	//Draw any positions that have been closed.
	let cposTable = document.querySelector("#table-closed-positions");
	let closedPositions = acc.closedPositions;
	const numClosedPositions = closedPositions.length;

	if(numClosedPositions > 0){
		//Insert rows into the table.
		if(cposTable.rows.length - 1 < numClosedPositions){
			for(let r = cposTable.rows.length - 1; r < numClosedPositions; ++r){
				let row = cposTable.insertRow();
				for(let c = 0; c < 7; ++c){
					row.insertCell();
				}
			}
		}
		else if(cposTable.rows.length - 1 > numClosedPositions){
			//Blank out the extra cells
			const numExtra = cposTable.rows.length - numClosedPositions;
			const start = cposTable.rows.length - numExtra;
			const total = cposTable.rows.length;

			for(let i = start; i < total; ++i){
				for(let c = 0; c < 7; ++c){
					cposTable.rows[i].cells[c].innerHTML = "";
				}
			}
		}

		//Skip the header.
		let tablePos = 1;

		//Draw with most recent one at the top.
		for(let r = closedPositions.length - 1; r >= 0; --r){
			let rec = closedPositions[r];

			//Symbol
			cposTable.rows[tablePos].cells[0].innerHTML = rec.symbol;
			//Side
			cposTable.rows[tablePos].cells[1].innerHTML = rec.side == BUY ? "Long" : "Short";
			//Size
			cposTable.rows[tablePos].cells[2].innerHTML = rec.size;
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
	else{
		//Reset the closed positions
		
		const numRows = cposTable.rows.length;
		let rows = cposTable.rows;
		for(let i = 1; i < numRows; ++i){
			for(let c = 0; c < 7; ++c){
				rows[i].cells[c].innerHTML = "";
			}
		}
	}
	
	/*
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
	}*/

	
}

updateBankInfo = function(){
    let inputId                 = document.getElementById("input-id");
    let outputId                = document.getElementById("output-id");
    let outputBalance           = document.getElementById("output-balance");

    let id                      = parseInt(inputId.value);
    let acc                     = BANK.accounts.get(id);
    outputBalance.value         = acc.balance.toFixed(2);
}

update = function(){  

	if(mmEnabled){
		const last = orderbook.last.price;
		MARKETMAKER.size = last != undefined ? Math.floor((MARKETMAKER.cashBuyingPower * 0.01) / last) : 100;
		MARKETMAKER.increment = orderbook.precision == 3 ? 0.001 : orderbook.precision == 4 ? 0.0001 : orderbook.precision == 5 ? 0.00001 : 0.01;
		MARKETMAKER.updateSize();
		MARKETMAKER.createMarket(SYMBOL);
	}
	
    let outputAsk  = document.getElementById("output-ask");
    let outputBid  = document.getElementById("output-bid");
    let outputLast = document.getElementById("output-last");
    let outputGain = document.getElementById("output-gain"); 
    let outputHigh = document.getElementById("output-high");
    let outputLow  = document.getElementById("output-low");
    let outputOpen = document.getElementById("output-open");
    //let outputSpread = document.getElementById("output-spread");
	let outputSymbol = document.querySelector("#output-symbol");

    let ask = orderbook.bestAsk();
    let bid = orderbook.bestBid();
    let last = orderbook.priceHistory.length > 0 ? orderbook.priceHistory[orderbook.priceHistory.length - 1].price : NaN;
    
    outputAsk.value = ask ? ask.price.toFixed(orderbook.precision) : NaN;
    outputBid.value = bid ? bid.price.toFixed(orderbook.precision) : NaN;
    outputLast.value = last.toFixed(orderbook.precision);
    outputHigh.value = orderbook.high.toFixed(orderbook.precision);
    outputLow.value = orderbook.low == Number.MAX_VALUE ? NaN : orderbook.low.toFixed(orderbook.precision);
    //outputSpread.value = (ask && bid) ? (ask.price - bid.price).toFixed(2) : NaN;
	if(orderbook.shortSaleRestriction && orderbook.halted){
		outputSymbol.value = SYMBOL + "(SSR)(H)";
	}
	else if(orderbook.shortSaleRestriction){
		outputSymbol.value = SYMBOL + "(SSR)";
	}
	else if(orderbook.halted){
		outputSymbol.value = SYMBOL + "(H)";
	}
	else{
		outputSymbol.value = SYMBOL;
	}

    let prefix = last - orderbook.open >= 0 ? "+" : "-";

    outputGain.value = last != NaN ? prefix + Math.abs((((last - orderbook.open) / orderbook.open) * 100)).toFixed(2) + "%" : 0 + "%";
    outputOpen.value = orderbook.open.toFixed(orderbook.precision);
    outputGain.style.color = prefix == "+" ? "yellowgreen" : "red";

	
	
	orderbook.update();
    orderbook.drawTable(table);
    orderbook.drawPriceHistory(ptable);
	BROKER.drawMessages(berrtable);
    updateBrokerInfo();
    updateBankInfo();
}