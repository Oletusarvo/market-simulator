const BID = BUY;
const ASK = SEL;

class BrokerAccount{
    constructor(id, bp){
        this.id = id;
		this.pnl = 0.0;
        this.closedPositions = [];
        this.openEquity = 0;
        this.openOrderSize = 0;
        this.openOrderSentiment = -1;
        this.cashBuyingPower = bp;
        this.bpMultiplier = 1;
        this.marginBuyingPower = this.cashBuyingPower * this.bpMultiplier;
		
        this.openOrderSide = FLT;
        this.openOrderPrice = 0;
        this.openOrderDifference = 0;
		
        this.margin = 0;
        this.marginEnabled = false;
        this.setBpMultiplier();

        this.willingToBorrow 	= false;
        this.positionCloseLimit = new Map();
        this.locatedShares      = new Map(); //Contains shares for a symbol that can be shorted.
        this.offeredShares      = new Map(); //Contains shares for a symbol offered to be borrowed.
        this.borrowInfo         = new Map(); //Contains completed share borrow info.
        this.loanInfo           = new Map(); //Contains completed share loan info.
        this.openOrders         = new Map();
        this.positions          = new Map();

        this.updateCashBuyingPower = function(amount){
            if(this.id != MARKETMAKER_ID)
                this.cashBuyingPower += amount;
        }
    }

    closePosition(rec){
        //Limit closed positions to 10 per account.
        if(this.closedPositions.length == 10){
            this.closedPositions.splice(0, 1);
        }

        //Limit position saving only to non-bot accounts.
        if(this.id == 0)
            this.closedPositions.push(rec);
      
    }

    addPosition(symbol, price, size, side){
        let pos = this.positions.get(symbol);
        if(pos){
            pos.avgPriceIn = ((pos.avgPriceIn * pos.sizeIn) + (price * size)) / pos.sizeIn + size;
            pos.sizeIn = size;
            pos.side = side;
			pos.totalSize += size;
        }
        else{
            pos = new Position(symbol);
            pos.avgPriceIn = price;
            pos.sizeIn = pos.totalSize = size;
		
            pos.side = side;
            pos.id = this.id;
            pos.openPrice = price;
            this.positions.set(symbol, pos);
        }
    }

    getPosition(symbol){
        return this.positions.get(symbol);
    } 

    

    //Returns the available buying power multiplied by current multiplier.
    getBuyingPower(){
        if(this.marginEnabled)
            return this.marginBuyingPower;
        else
            return this.cashBuyingPower;
    }

    setBpMultiplier(){
       let cash = this.cashBuyingPower;
       /*
       if(cash >= 500 && cash < 3000){
           this.bpMultiplier = 2;
       }
       else if(cash > 0 && cash < 500){
           this.bpMultiplier = 1;
       }
       else if(cash <= 0){
           this.bpMultiplier = 0;
       }
       else{
           this.bpMultiplier = 4;
       }
       */

       this.marginBuyingPower = cash * this.bpMultiplier;
    }

}