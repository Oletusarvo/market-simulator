const BID = BUY;
const ASK = SEL;

class BrokerAccount{
    constructor(id, bp){
        this.id = id;
        this.closedPositions = [];
        this.openEquity = 0;
        this.openOrderSize = 0;
        this.openOrderSentiment = -1;
        this.cashBuyingPower = bp;
        this.bpMultiplier = 0;
		
        this.openOrderSide = FLT;
        this.openOrderPrice = 0;
        this.openOrderDifference = 0;
		
        this.margin = 0;
        this.setBpMultiplier();

        this.willingToBorrow = false;
        this.positionCloseLimit = new Map();
        this.locatedShares      = new Map(); //Contains shares for a symbol that can be shorted.
        this.openOrders         = new Map();
        this.positions          = new Map();
        this.borrowedShares     = new Map();
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
            this.positions.set(symbol, pos);
        }
    }

    getPosition(symbol){
        return this.positions.get(symbol);
    } 

    //Returns the available buying power multiplied by current multiplier.
    getBuyingPower(){
        return this.cashBuyingPower * this.bpMultiplier;
    }

    setBpMultiplier(){
       let cash = this.cashBuyingPower;
       if(cash <= 0){
           this.bpMultiplier = 0;
       }
       else if(cash > 0 && cash < 500){
           this.bpMultiplier = 1;
       }
       else if(cash >= 500 && cash < 3000){
           this.bpMultiplier = 2;
       }
       else{
           this.bpMultiplier = 4;
       }
    }

}