class Net{
    constructor(topology){
        let numLayers = topology.length;
        for(let layerNum = 0; layerNum < numLayers; ++layerNum){
            this.layers.push([]);
            let lastLayer = this.layers.length - 1;
            for(let neuronNum = 0; neuronNum <= topology[layerNum].length; ++neuronNum){
                this.layers[lastLayer].push(new Neuron(neuronNum));
            }

            let lastNeuron = this.layers[layerNum].length - 1;
            this.layers[layerNum][neuronNum].outputValue = Math.random() < 0.5 ? SEL : BUY;
        }
    }
}