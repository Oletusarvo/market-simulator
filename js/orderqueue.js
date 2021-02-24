class OrderQueue{
    //Contains orders at a single price.
    constructor(price){
        this.price = price;
        this.items = [];
        this.shareSize = 0;
    }

    push(order){
        this.shareSize += order.size;
        //If this new order has the same id as an existing one, just increase the size of that.
        let findOrder = (id) => {for(let o of this.items) if(o.id == id) return o; return null;};
        let existingOrder = findOrder(order.id);
        if(existingOrder){
            existingOrder.size += order.size;
        }
        else{
            this.items.push(order);
        }
        
    }

    pop(){
        return this.items.shift();
    }

    front(){
        return this.items[0];
    }

    reduce(size){
        let front = this.items[0];
        let nextSize = front.size - size;

        if(nextSize == 0){
            this.shareSize -= size;
            this.pop();
        }
        else{
            this.shareSize -= size;
            front.size -= size;
        }
    }

    cancel(id){
        for(let i = 0; i < this.items.length; ++i)
            if(this.items[i].id == id){
                this.shareSize -= this.items[i].size;
                this.items.splice(i, 1);
                i=-1;
            }
                
    }

    find(id){
        let orders = [];
        for(order of this.items){
            if(order.id == id)
                orders.push(order);
        }

        return orders;
    }
}