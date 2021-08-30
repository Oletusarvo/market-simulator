const STRAT_DEFAULT = 0;
const STRAT_DIP = 1;
const STRAT_BREAKOUT = 2;
const STRAT_DIP_UNI = 3;

const MENT_DEFAULT = 0;
const MENT_NERVOUS = 1;

const RES_DIRECT = 0; //Get out as fast as possible.
const RES_DELAY = 1; //Send out limit orders.

class Strategy{
    constructor(type, stop, target){ //Stop and target are percentages.
        this.type = type;
        this.stop = stop;
        this.target = target;
        this.response = RES_DIRECT;
    }
}

class Trader{
    constructor(id){
        this.lastCanceledPrice  = 0;
        this.bias               = Math.random() > 0.5 ? SEL : BUY;
        this.inverted           = false; //Will buy when bias is to sell and vice verse.
        this.id                 = id;
        this.confidence         = 1; //Value between 0 and 1
        this.threshold          = Math.random(); //How confident the trader must be before taking a position.
        this.breakoutThreshold  = 0.1;
        this.numCancels         = 0;
        this.cooldownMultiplier = 0; //Multiply cooldown timer by this.
        this.riskTolerance      = 0.025 //How much in percentage (value * 100) a position must be down before we close it.
        this.profitTarget       = 0.03 //How much in percentage a position must be up before we take profit.
        //this.previousSentiment  = this.bias;
        this.previousBias       = this.bias;
        this.strategy           = new Strategy(STRAT_DEFAULT, 0.025, 0.03);
        this.mentality          = Math.trunc(RANDOM_RANGE(MENT_DEFAULT, MENT_NERVOUS));
        this.recentBailout      = false;
        this.undecided          = false; //Trader will not participate if undecided.

        this.giveUpTime         = this.strategy.type == STRAT_DIP ? Math.trunc(RANDOM_RANGE(60000, 120000)) : RANDOM_RANGE(5000, 10000);
        this.giveUpTimer        = this.giveUpTime;
        this.coolDownTimer      = 0; //How long we wait after a loss until taking another trade.
        this.coolDownTime       = 60000;

        this.resetBalanceTimer = 0;
        this.resetBalanceTime = 120000;
    }

    updateBias(buyChance, sellChance, flatChance){
        const dice = Math.random();

        const max = Math.max(buyChance, sellChance, flatChance);
        this.previousBias = this.bias;

        if(max == buyChance){
            this.bias = dice <= buyChance ? !this.inverted ? BUY : SEL : !this.inverted ? SEL : BUY;
        }   
        else if(max == sellChance){
            this.bias = dice <= sellChance ? !this.inverted ? SEL : BUY : !this.inverted ? BUY : SEL;
        }
        else{
            this.bias = dice <= 0.5 ? BUY : SEL;
        }
		
    }

    updateStrategy(){
        const acc = BROKER.accounts.get(this.id);
        const pos = acc.positions.get(SYMBOL);

        if(pos){
            const bid = orderbook.bestBid();
            const ask = orderbook.bestAsk();

            const gain = pos.side == BUY ? ((bid.price - pos.avgPriceIn) / pos.avgPriceIn) : ((pos.avgPriceIn - ask.price) / pos.avgPriceIn);
            switch(pos.side){
                case BUY:{
                    if(SENTIMENT == BUY){
                        if(gain <= this.strategy.stop){
                            this.strategy.target = 0;
                        }
                    }
                }
                break;

                case SEL:{
                    if(SENTIMENT == SEL){
                        if(gain <= this.strategy.stop){
                            this.strategy.target = 0;
                        }
                    }
                }
                break;
            }
        }
    }

    generateBuyOrderDefault(pos, bid, ask){
        let price = 0;
        let type = LMT;

        if(pos){
            //There is an existing short position to cover.
            const gain = pos.calcGain(ask.price) / 100;
            if((gain <= -this.riskTolerance && SENTIMENT != SEL) || this.recentBailout){
                type = MKT;
                price = ask.price;
                this.recentBailout = false;
            }
            else if(gain >= this.profitTarget){
                price = ask.price;
                //price = pos.avgPriceIn - MARKETMAKER.increment * 5;
            }
            else{
                return undefined;
            }
        }
        else{
            //Long biased trader wants to buy.
            price = SENTIMENT == BUY ? ask.price : bid.price;
        }
        
        return new  Order(this.id, SYMBOL, k_ename, price, 0, BUY, 0);
    }

    generateSellOrderDefault(pos, bid, ask){
        let price = 0;
        let type = LMT;

        if(pos){
            //There is an existing long position to sell.
            const gain = pos.calcGain(ask.price) / 100;
            if((gain <= -this.riskTolerance && SENTIMENT != BUY) || this.recentBailout){
                type = MKT;
                price = bid.price;
                this.recentBailout = false;
            }
            else if(gain >= this.profitTarget){
                price = ask.price;
                //price = pos.avgPriceIn - MARKETMAKER.increment * 5;
            }
            else{
                return undefined;
            }
        }
        else{
            //Short biased trader wants to sell.
            price = SENTIMENT == SEL ? bid.price : ask.price;
        }
        
        return new  Order(this.id, SYMBOL, k_ename, price, 0, BUY, type);
    }

    generateOrder(){
        const id = this.id;
        const trader = this;

        const bid = orderbook.bestBid();
        const ask = orderbook.bestAsk();
        const acc = BROKER.accounts.get(id);

        let price = 1.0;
        let size = 0;
        let type = LMT;
        let side = FLT;
        
        if(acc){
            const pos = acc.positions.get(SYMBOL);
            const openOrders = acc.openOrderSize > 0;
            const strategy = trader.strategy.type;

            if(openOrders){
                return undefined;
            }

            if(pos){
                const gain = pos.side == BUY ? ((bid.price - pos.avgPriceIn) / pos.avgPriceIn) : ((pos.avgPriceIn - ask.price) / pos.avgPriceIn);
                
                
                if(pos.side == BUY){
                    switch(strategy){
                        
                        case STRAT_DIP_UNI:{
                            if(SENTIMENT == BUY){
                                price  = !this.inverted ? ask.price : bid.price;
                            }
                            else{
                                price = !this.inverted ? bid.price : ask.price;
                            }
                        }
                        break;

                        default:{
                            if((gain <= -trader.riskTolerance  && SENTIMENT != BUY) || trader.recentBailout){
                                type = MKT;
                                trader.recentBailout = false;
                                price = bid.price;
                            }
                            else if(gain >= trader.profitTarget){
                                price = bid.price;
                                //price = pos.avgPriceIn + MARKETMAKER.increment * 5;
                            }
                            else{
                                return undefined;
                            }
                        }
                    }
                    
                    side = SEL;
                }
                else{

                    switch(strategy){

                        case STRAT_DIP_UNI:{
                            if(SENTIMENT == SEL){
                                price = bid.price;
                            }
                            else{
                                price = ask.price;
                            }
                        }
                        break;

                        default:{
                            if((gain <= -trader.riskTolerance && SENTIMENT != SEL) || trader.recentBailout){
                                type = MKT;
                                price = ask.price;
                                trader.recentBailout = false;
                            }
                            else if(gain >= trader.profitTarget){
                                price = ask.price;
                                //price = pos.avgPriceIn - MARKETMAKER.increment * 5;
                            }
                            else{
                                return undefined;
                            }
                        }
                    }
                    
                    side = CVR;
                }

                size = pos.totalSize; //This might cause a problem where the open position display shows negative size.

                if(gain <= -trader.profitTarget){
                    trader.coolDownTimer = trader.coolDownTime;
                }      

            }
            else{
                //Trader will not participate after a recent loss.
                if(trader.coolDownTimer > 0){
                    return undefined;
                }

                if(acc.getBuyingPower() <= 0 && trader.resetBalanceTimer <= 0){
                    trader.resetBalanceTimer = trader.resetBalanceTime;
                    return undefined;
                }

                type = LMT;
                const dataSeries = orderbook.dataSeries;
                const previousCandle = dataSeries[dataSeries.length - 2];

                if(trader.bias == BUY){
                    switch(strategy){

                        case STRAT_DIP:{
                            /*
                                Dip buyers may buy at whole dollars, half dollars or quarter dollars, as well as the low of the previous candle.
                                Figure out which one is closest and buy there.
                            */

                            const currentBid 		= bid.price;
                            const halfDollar 		= Math.floor(currentBid) + 0.5;
                            const wholeDollar 		= Math.floor(currentBid);
                            const quarterDollar 	= Math.floor(currentBid) + 0.25;
                            const threeFourDollar 	= Math.floor(currentBid) + 0.75;

                            //If the value is negative, it will cause the trader to buy on the ask once the minimum of the bunch is returned later.
                            //Set all negative numbers to MAX_VALUE.
                            const MAX_VALUE = Number.MAX_VALUE;
                            let maxIfNeg = (val) => {return val < 0 ? MAX_VALUE : val;}
                            
                            const distanceToHalf = maxIfNeg(currentBid - halfDollar);
                            const distanceToQuart = maxIfNeg(currentBid - quarterDollar);
                            const distanceToWhole = maxIfNeg(currentBid - wholeDollar);
                            const distanceToThreeFour = maxIfNeg(currentBid - threeFourDollar);
                            const previousCandleValid = previousCandle && previousCandle.low;
                            const distanceToCandleLow = previousCandleValid ? maxIfNeg(currentBid - previousCandle.low) : MAX_VALUE;
                            const distanceToCandleHigh = previousCandleValid ? maxIfNeg(currentBid - previousCandle.high) : MAX_VALUE;
                            const lowIsValid = orderbook.low != NaN;
                            const distanceToLow = lowIsValid ? maxIfNeg(currentBid - orderbook.low) : MAX_VALUE;

                            const buyOffset = Math.min(distanceToLow, distanceToCandleHigh, distanceToHalf, distanceToCandleLow, distanceToQuart, distanceToThreeFour, distanceToWhole);
                            
                            if(SENTIMENT == SEL)
                                price = currentBid - buyOffset;
                            else
                                return undefined;
                        
                        }
                        break;

                        case STRAT_DIP_UNI:{
                            if(SENTIMENT == SEL){
                                price = ask.price;
                            }
                            else{
                                return undefined;
                            }
                        }
                        break;

                        default:{
                            const offset = RANDOM_RANGE(0,0.1);

                            if(SENTIMENT == BUY){
                                price = !this.inverted ? (ask.price + offset) : (bid.price - offset);
                            }  
                            else
                                price = !this.inverted ? (bid.price - offset) : (ask.price + offset);
                        }
                            

                    }
                    
                    
                    side = BUY;
                }else{

                    //Short biased trader
                    switch(strategy){
                        case STRAT_DIP:{
                            /*
                                Pop shorters may short at whole dollars, half dollars or quarter dollars, as well as the high of the previous candle.
                                Figure out which one is closest and short there.
                            */

                            const currentAsk 		= ask.price;
                            const halfDollar 		= Math.floor(currentAsk) + 0.5;
                            const wholeDollar 		= Math.floor(currentAsk) + 1;
                            const quarterDollar 	= Math.floor(currentAsk) + 0.25;
                            const threeFourDollar 	= Math.floor(currentAsk) + 0.75;

                            //If the value is negative, it will cause the trader to buy on the ask once the minimum of the bunch is returned later.
                            //Set all negative numbers to MAX_VALUE.
                            const MAX_VALUE = Number.MAX_VALUE;
                            let maxIfNeg = (val) => {return val < 0 ? MAX_VALUE : val;}
                            
                            const distanceToHalf = maxIfNeg(halfDollar - currentAsk);
                            const distanceToQuart = maxIfNeg(quarterDollar - currentAsk);
                            const distanceToWhole = maxIfNeg(wholeDollar - currentAsk);
                            const distanceToThreeFour = maxIfNeg(threeFourDollar - currentAsk);
                            const previousCandleValid = previousCandle && previousCandle.high;
                            const distanceToCandleHigh = previousCandleValid ? maxIfNeg(previousCandle.high - currentAsk) : MAX_VALUE;
                            const distanceToCandleLow = previousCandleValid ? maxIfNeg(previousCandle.low) - currentAsk  : MAX_VALUE;
                            const highIsValid = orderbook.high != NaN;
                            const distanceToHigh = highIsValid ? maxIfNeg(orderbook.high - currentAsk) : MAX_VALUE;

                            const shortOffset = Math.min(distanceToHigh, distanceToCandleLow, distanceToHalf, distanceToCandleHigh, distanceToQuart, distanceToThreeFour, distanceToWhole);
                            
                            if(SENTIMENT == BUY)
                                price = currentAsk + shortOffset;
                            else
                                return undefined;
                            
                        }
                        break;

                        case STRAT_DIP_UNI:{
                            if(SENTIMENT == BUY){
                                price = bid.price;
                            }
                            else{
                                return undefined;
                            }
                        }
                        break;


                        default:{
                            const offset = RANDOM_RANGE(0,0.1);

                            if(SENTIMENT == BUY)
                                price = !this.inverted ? ask.price + offset : bid.price - offset;
                            else{
                                const ssr = orderbook.shortSaleRestriction;
                                price = !ssr ? bid.price - offset : ask.price + offset;
                            }
                        }
                            
                    }
                    side = SHT;
                }

                //trader.previousSentiment = sentiment;
                const amount = (acc.getBuyingPower() * 0.6);
                //const sizes = [100, 250, 500, 1000];
                size = /*sizes[Math.trunc(RANDOM_RANGE(0, 3))];//*/ amount <= 100000 ? Math.floor(amount / price) : Math.floor(100000 / price); //Limit dollar amount.
                trader.lastOpenPrice = price; //Market orders are not put in the order book, but this should not be a problem.
                trader.giveUpTimer = trader.giveUpTime;
                trader.coolDownTimer = 0;
                trader.recentBailout = false;
            }

            
        }
        
        return new Order(id, SYMBOL, k_ename, price, size, side, type);
    }

    generateOrder2(){
        const acc = BROKER.accounts.get(this.id);

        let order = undefined;

        if(acc){
            const pos = acc.positions.get(SYMBOL);

            switch(this.strategy.type){
                default:
                    if(this.bias == BUY){
                        order = this.generateBuyOrderDefault();
                    }
                    else{
                        order = this.generateSellOrderDefault();
                    }
            }
        }

        return order;
    }

}