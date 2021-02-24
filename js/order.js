class Order{
    constructor(id, symbol, route, price, size, side, type){
        this.symbol = symbol;
        this.price = +price;
        this.route = route;
        this.size = +size;
        this.side = +side;
        this.type = +type;
        this.id = id;
        this.orderId = -1;
    }

}