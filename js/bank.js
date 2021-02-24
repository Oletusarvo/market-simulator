class Bank{
    constructor(){
        this.accounts = new Map();
    }

    addAccount(id, balance){
        this.accounts.set(id, new BankAccount(id, balance));
    }
    
    registerTransaction(info){
        let buyer = this.accounts.get(info.buyer);
        let seller = this.accounts.get(info.seller);

        if(buyer){
            buyer.balance -= info.price * info.size;
        }

        if(seller){
            seller.balance += info.price * info.size;
        }
    }
}