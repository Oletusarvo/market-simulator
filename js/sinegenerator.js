const SIN = 0;
const COS = 1;

class SineGenerator{
    constructor(frequency, amplitude, mode = SIN, anchor = 0.5){
        this.amplitude      = amplitude;
        this.frequency      = frequency;
        this.clock          = Math.random() * anchor * Math.PI * 2 / frequency;
        this.val            = Math.random() * amplitude;
        this.mode           = mode;
        this.anchor         = anchor;
    }

    update(){
        if(this.mode == SIN)
            this.val = this.anchor + Math.sin(this.frequency * this.clock) * this.amplitude;
        else    
            this.val = this.anchor + Math.cos(this.frequency * this.clock) * this.amplitude;

        if(this.clock >= Math.PI * 2 / this.frequency)
            this.clock -= Math.PI * 2 / this.frequency;
        this.clock++;
    }
}