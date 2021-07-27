const EVENT_HOD_BREAK = 0;
const EVENT_NEW_HIGH = 1;
const EVENT_NEW_LOW = 2;
const EVENT_LOD_BREAK = 3;
const EVENT_HALF_BREAK = 4;
const EVENT_QUARTER_BREAK = 5;
const EVENT_WHOLE_BREAK = 6;
const EVENT_PRICE_CHANGE = 7;

class MarketEvent{
    constructor(type){
        this.type = type;
        this.param = undefined;
    }
}