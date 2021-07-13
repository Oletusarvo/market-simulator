const ERR_ORDER_SIZE            = 0;
const ERR_ORDER_PRICE           = 1;
const ERR_POSITION              = 2;
const ERR_OPEN_EQUITY           = 3;
const ERR_OPPOSITE_POSITION     = 4;
const ERR_BUYINGPOWER           = 5;
const ERR_SHORT_LONG            = 6;
const ERR_BUY_SHORT             = 7;
const ERR_POSITION_SIZE         = 8;
const ERR_NO_POSITION           = 9;
const ERR_COVER_LONG            = 10;
const ERR_SELL_SHORT            = 11;
const ERR_COVER_GREATER         = 12;
const ERR_SELL_GREATER          = 13;
const ERR_GREATER_THAN_POSITION = 14;
const ERR_LOCATED_SHARES        = 15;
const ERR_LOCATED_SHARES_NUM    = 16;
const ERR_GREATER_THAN_CLOSE_LIMIT = 17;
const ERR_ACCOUNT 				= 18;
const ERR_SIZE 					= 19;

class Broker{
    constructor(name){
        this.name = name;
        this.accounts = new Map();
        this.shortStatus = new Map();
        //Used to reference possible error messages and display them.
        this.messages = [];
        this.nextOrderId = 0;
        this.allowNakedShort = true;
		this.infiniteShortSupply = false;
    }

    addAccount(id, equity){
        let acc = this.accounts.get(id);
        if(acc)
            return false;
        
        this.accounts.set(id, new BrokerAccount(id, equity));

        return true;
    }

    getAccount(id){
        return this.accounts.get(id);
    }

    checkOrder(order){
        let acc = this.accounts.get(order.id);
        let pos = acc.positions.get(order.symbol);

        if(acc){
            //Disalow shorting unless there are located shares available.
            if(!this.allowNakedShort && order.side == SHT){
                let locatedShares = acc.locatedShares.get(order.symbol);
                if(locatedShares == undefined){
                    return ERR_LOCATED_SHARES;
                }
                else if(locatedShares < order.size){
                    return ERR_LOCATED_SHARES_NUM;
                }
            }

            //Not enough buying power.
            let newOpenEquity = acc.openEquity + order.size * order.price;
            if((order.side == SHT || order.side == BUY) && (newOpenEquity > acc.getBuyingPower()))
                return ERR_BUYINGPOWER;
            
            //Disallow orders out on opposite sides at the same time.
            if((acc.openOrderSide == SHT && order.side == BUY) || (acc.openOrderSide == BUY && order.side == SHT)){
                return ERR_OPPOSITE_POSITION;
            }

            if(pos){    
                /*
                    If the account has offered shares for borrow for this symbol,
                    dissalow sending out orders for that amount.
                */
                let positionCloseLimit = acc.positionCloseLimit.get(order.symbol);
                if(positionCloseLimit == undefined){
                    if(order.size > Math.abs(pos.sizeIn)){
                        return ERR_GREATER_THAN_POSITION;
                    }
                }
                else{
                    if(order.size > positionCloseLimit){
                        return ERR_GREATER_THAN_CLOSE_LIMIT;
                    }
                }
                
                if(pos.side == SHT && order.side == SEL)
                    return ERR_SELL_SHORT;
    
                if(pos.side == BUY && order.side == CVR)
                    return ERR_COVER_LONG;
                
                if(pos.side == SHT && order.side == BUY){
                    return ERR_BUY_SHORT;
                }
    
                if(pos.side == BUY && order.side == SHT){
                    return ERR_SHORT_LONG;
                }
    
                let newOpenOrderSize = acc.openOrderSize + order.size;
                if(order.side == CVR && pos.sizeIn > -newOpenOrderSize){
                    return ERR_COVER_GREATER;
                }
                else if(order.side == SEL && pos.sizeIn < newOpenOrderSize){
                    return ERR_SELL_GREATER;
                }
            }
            else{
                if(order.side == CVR || order.side == SEL){
                    return ERR_NO_POSITION;
                }
            }
    
            if(order.price <= 0.00){
                console.log(order.price);
                return ERR_ORDER_PRICE;
            }
                
    
            if(order.size <= 0)
                return ERR_ORDER_SIZE;
    
        }
        return 0;

    }

    //Update relevant account data before the order is sent to an exchange.
    registerOrder(order){
        let acc = this.accounts.get(order.id);

        let errcode = this.checkOrder(order);
        if(!errcode){
            //Order is ok.

            /*
                A wierd bug happens where if a market order is filled and then closed as a limit order,
                One can put out double the amount of shares to be closed. When those are canceled once,
                Everything works as expected.

                **FIXED**
            */

            if(order.type == LMT){
                if(order.side == BUY || order.side == SHT){
                    acc.openEquity += order.size * order.price;
                    acc.openOrderSide = order.side;
                }

                //Store the price and size of open orders.
                let orderMap = acc.openOrders.get(order.symbol);
                if(!orderMap){
                    acc.openOrders.set(order.symbol, new Map());
                    orderMap = acc.openOrders.get(order.symbol);
                }

                let o = orderMap.get(order.price);
                if(!o){
                    orderMap.set(order.price, new Order(order.id, order.symbol, order.route, order.price, 0, order.side, order.type));
                    o = orderMap.get(order.price);
                }

                o.size += order.size;

                acc.openOrderSize += order.size;
                acc.openOrderPrice = order.price;
                order.orderId = this.nextOrderId++;
            }
        }
        else{
            let message = new Message(this.convertErrorCode(errcode), order.id);
			
			if(errcode == ERR_ORDER_PRICE){
				message.message += " (" + order.price + ").";
			}
            this.addMessage(message);
        }

        return errcode
    }

    addMessage(message){
        this.messages.push(message);

        //Limit the number of messages stored.
        if(this.messages.length == this.maxMessages + 10){
            this.messages.slice(0, this.messages.length - 10);
        }
    }

    registerCancel(id){
        let acc = this.accounts.get(id);
        acc.openEquity = 0;
        acc.openOrderSize = 0;
        acc.openOrderSide = FLT;
        acc.openOrderPrice = 0;

        acc.openOrders = new Map();
    }

    //Call this to update account data again when transactions at an exchange have occured.
    registerTransaction(info){
        let buyer = this.accounts.get(info.buyer);
        let seller = this.accounts.get(info.seller);

        if(buyer){
            let pos = buyer.positions.get(info.symbol);
            if(pos){    
                //If adding to an existing long position, update average price and decrease buying power.
               if(pos.side == BUY){
                    pos.avgPriceIn = (pos.avgPriceIn * pos.sizeIn + info.price * info.size) / (info.size + pos.sizeIn);  
                    buyer.cashBuyingPower -= info.price * info.size;
                    pos.totalSize += info.size;
               }

               /*
                    An account covering a short position should have their buying power increased and 
                    their average closing price updated.
               */
                if(pos.side == SHT){
                    let equity = -pos.sizeIn * pos.avgPriceIn;
                    let price = info.size * info.price;
                    let gain = equity - price;

                    buyer.cashBuyingPower += equity + gain;

                    pos.avgPriceOut = (pos.avgPriceOut * pos.sizeOut + info.size * info.price) / (info.size + pos.sizeOut);
                    pos.sizeOut += info.size; 
                    pos.realized += (pos.avgPriceIn - info.price) * info.size;
                }

               pos.sizeIn += info.size;
                pos.calcGain(info.price);

               if(pos.sizeIn == 0){
                   /*
						If the buyer covered a short position, it is now unwinded fully and can be deleted.
						But before doing that, add the position into the closed positions of this account.
				   */
                    let rec = new Receipt();
                    rec.avgPriceIn = pos.avgPriceIn;
                    rec.avgPriceOut = pos.avgPriceOut;
                    rec.size = pos.totalSize;
                    rec.side = SHT;
                    rec.symbol = pos.symbol;
                    rec.realized = pos.realized;

                    buyer.closedPositions.push(rec);
					buyer.pnl += rec.realized;
                    buyer.positions.delete(info.symbol);
               }
            }
            else{
                buyer.addPosition(info.symbol, info.price, info.size, BUY);
                buyer.cashBuyingPower -= info.price * info.size;
            }

            buyer.openEquity -= buyer.openEquity > 0 ? info.size * info.price : 0;
            buyer.openOrderSize -= buyer.openOrderSize > 0 ? buyer.openOrderSize : 0;
            buyer.openOrderSide = buyer.openOrderSize == 0 ? FLT : buyer.openOrderSide;

            let symbolOrders = buyer.openOrders.get(info.symbol);
            if(symbolOrders){
                let openOrder = symbolOrders.get(info.price);
                if(openOrder != undefined){
                    openOrder.size -= info.size;
                    if(openOrder.size == 0){
                        symbolOrders.delete(info.price);
                    }

                    if(symbolOrders.size == 0){
                        buyer.openOrders.delete(info.symbol);
                    }
                }
            }
            
            buyer.setBpMultiplier();

            
        }

        if(seller){
            let pos = seller.positions.get(info.symbol);
            if(pos){    
                 //If adding to an existing short position, update average price and decrese buying power.
                if(pos.side == SHT){
                     pos.avgPriceIn = (pos.avgPriceIn * -pos.sizeIn + info.price * info.size) / (info.size + -pos.sizeIn);
                     seller.cashBuyingPower -= info.price * info.size;
                     pos.totalSize -= info.size;
                }

                //An account selling a long position should have their buying power increased.
                if(pos.side == BUY){
                    let equity = pos.sizeIn * pos.avgPriceIn;
                    let price = info.size * info.price;
                    let gain = price - equity;
                    seller.cashBuyingPower += equity + gain;

                    pos.avgPriceOut = (pos.avgPriceOut * pos.sizeOut + info.size * info.price) / (info.size + pos.sizeOut);
                    pos.sizeOut += info.size;
                    pos.realized += (info.price - pos.avgPriceIn) * info.size;
                }

                pos.sizeIn -= info.size;
                pos.calcGain(info.price);

                if(pos.sizeIn == 0){
                    /*
						If the seller covered a long position, it is now unwinded fully and can be deleted.
						But save it into the closed positions first.
					*/
                    let rec = new Receipt();
                    rec.avgPriceIn = pos.avgPriceIn;
                    rec.avgPriceOut = pos.avgPriceOut;
                    rec.size = pos.totalSize;
                    rec.side = BUY;
                    rec.symbol = pos.symbol;
                    rec.realized = pos.realized;

                    seller.closedPositions.push(rec);
					seller.pnl += rec.realized;
                    seller.positions.delete(info.symbol);
                }
             }
             else{
                seller.addPosition(info.symbol, info.price, -info.size, SHT);
                seller.cashBuyingPower -= info.price * info.size;
             }

            seller.openEquity -= seller.openEquity > 0 ? info.price * info.size : 0;
            seller.openOrderSize -= seller.openOrderSize > 0 ? seller.openOrderSize : 0; 
            seller.openOrderSide = seller.openOrderSize == 0 ? FLT : seller.openOrderSide;

            let symbolOrders = seller.openOrders.get(info.symbol);
            if(symbolOrders){
                let openOrder = symbolOrders.get(info.price);
                if(openOrder != undefined){
                    openOrder.size -= info.size;
                    if(openOrder.size == 0){
                        symbolOrders.delete(info.price);
                    }
    
                    if(symbolOrders.size == 0){
                        seller.openOrders.delete(info.symbol);
                    }
                }
            }
          
            
            seller.setBpMultiplier(); 
        }
    }

    drawMessages(table){

        if(table.rows.length != 10){
            for(let i = 0; i < 10; ++i){
                table.insertRow().insertCell();
            }
        }

        /*
            Display the broker messages so that the most recent one is at the top.
        */
        let end = this.messages.length < 10 ? 0 : this.messages.length - 10;
        let tablePos = 0;
        for(let i = this.messages.length - 1; i >= end; --i){
            let message = this.messages[i];
			
            table.rows[tablePos++].cells[0].innerHTML = "(" + message.from + ") " + message.message;
        }

    }

    convertErrorCode(errcode){
        switch(errcode){
            case ERR_ORDER_SIZE:  
                return("Invalid order size!");

            case ERR_NO_POSITION:
                return("There is no position to sell/cover!");

            case ERR_BUYINGPOWER:
                return("Out of buying power!");

            case ERR_BUY_SHORT:
                return("Cannot long while in an open short position!");

            case ERR_COVER_LONG:
                return("There is no short position to cover!");
           
            case ERR_SHORT_LONG:
                return("Cannot short while in an open long position!");

            case ERR_ORDER_PRICE:
                return "Order price is invalid!";

            case ERR_OPPOSITE_POSITION:
                return("Orders on opposite sides are not allowed!");

            case ERR_SELL_GREATER:
                return("Trying to sell more than long position!");

            case ERR_COVER_GREATER:
                return("Trying to cover more than short position!");

            case ERR_GREATER_THAN_POSITION:
                return "Order size is greater than open position!";

            case ERR_SELL_SHORT:
                return "No long position to sell!";

            case ERR_LOCATED_SHARES:
                return "No available located shares for this account!";

            case ERR_LOCATED_SHARES_NUM:
                return "Trying to short more than available located shares!";

            case ERR_GREATER_THAN_CLOSE_LIMIT:
                return "Trying to close more than available non-short offered shares!";

            default:
                return("Unknown error. Code: " + errcode);
        }
    }
	
    offer(id, symbol, size){
        let acc = this.accounts.get(id);
		let result = 0;
        if(acc){
            let pos = acc.positions.get(symbol);
            if(pos){
                if(pos.sizeIn >= size){ 
                    acc.willingToBorrow = true;
                    acc.offeredShares.set(symbol, size);
                    acc.positionCloseLimit.set(symbol, pos.sizeIn - size);
                }
                else{
                    result = ERR_SIZE;
                }
            }
            else{
                result = ERR_NO_POSITION;
            }
        }
        else{
            result =  ERR_ACCOUNT;
        }

        return result;
    }
	
	cancelOffer(id, symbol){
		let acc = this.accounts.get(id);
		let errcode = 0;
		
		if(acc){
			let closeLimit = acc.closeLimit.get(symbol);
			
			if(closeLimit == undefined){
				acc.offeredShares.delete(symbol);
			}
			else{
				
			}
			
		}
		else{
			errcode = ERR_ACCOUNT;
		}
		
		return errcode;
	}
	
    locate(id, symbol, size){
        /*
            Find an account that has enough shares available and is willing to lend shares.
        */
		
        let result = 0;
		
		if(this.infiniteShortSupply){
			let borrower = this.accounts.get(id);
			if(borrower){
				borrower.locatedShares.set(symbol, size);
			}
		}
		else{
            const accountValues = this.accounts.values();
			for(let lender of accountValues){
				if(lender.id != id/*The account is not the one wanting to borrow*/ && lender.willingToBorrow){
					let offeredShares = lender.offeredShares.get(symbol);
					if(offeredShares && offeredShares >= size){
						/*
							Move the shares to the borrowing account and prevent the lender from selling more
							shares than what has been lended out, until the borrower has returned them.
							Also imburse the lender's defined interest payment to them.
						*/
						let borrower = this.accounts.get(id);
						if(borrower){
							borrower.locatedShares.set(symbol, size);

							let info        = new TransactionInfo();
							info.seller     = lender.id;
							info.buyer      = borrower.id;
							info.price      = 0;
							info.size       = size;
							info.symbol     = symbol;

							borrower.borrowInfo.set(symbol, info);
							lender.loanInfo.set(symbol, info);
							lender.willingToBorrow = false;
							break;
						}
						else{
							
						}
					}
					else{
						result = 2;
					}
				}
				else{
					result = 1;
				}
			}
		}
       

        //Return non-zero if shares could not be located.
        return result;
    }

    returnShares(id, symbol){
        let acc = this.accounts.get(id);
        if(acc){
			
			if(acc.openEquity != 0){
				return 3;
			}
			else{
				const numshares = acc.locatedShares.size;
			
				if(numshares != 0){
					acc.locatedShares.delete(symbol);
				}
				else{
					return 1;
				}
			}	
        }
		else{
			return 2;
		}
		
		return 0;
        
    }
}