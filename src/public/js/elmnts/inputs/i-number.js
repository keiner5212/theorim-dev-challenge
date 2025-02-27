class iNumber extends ELMNT_Input
{
    constructor(){
        super();
        this.#input = this.shadow.querySelector('input');
    }
    

    // --- Private Properties --- //
    #value = '';
    #input;
    #float = false;
    #step = 1;
    
    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['iput','input', this._onChange],
            ['iput','paste', this._onChange]
        ];
    }

    // --- Setters & Getters --- //
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v; 
        this.#input.value = this.#value === null ? '' : this.#value;
    }

    get value(){
        if (this.#input.value === ''){ return null };
        if (this.#float){
            return this.#input.valueAsNumber;
        } else if(this.#step !== 1){
            const multiplier = 1 / this.#step;
            const v = this.#input.valueAsNumber;
            const floatV = (Math.round(v * multiplier) / multiplier).toFixed(Math.log10(multiplier));
            return parseFloat(floatV);
        } else {
            return parseInt(this.#input.value)
        }
    }

    set minimum(v){
        this.#input.min = v;
    }

    set maximum(v){
        this.#input.max = v;
    }

    set multipleOf(v){
        this.#step = v;
        this.#input.step = v;
        if (v % 1 !== 0){
            this.#float = true;
        }
    }

    set $float(v){
        this.#float = v;
        this.$el('iput').setAttribute('step','any');
    }

    // --- Public Methods --- //
    populate(v){
        this.#value = v; 
        this.#input.value = this.#value === null ? '' : this.#value;
        this.dataset.state = this.#checkState();
    }



    // --- User Events --- //
    _onChange(){
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event("change", {bubbles: true}));
    }

    // Private Helpers
    #checkState(){
        if (this.#value === this.#input.valueAsNumber){
            return 0;
        }
        const inputVal = this.#input.value ;
        if (inputVal !== ''){
            try {
                this.#float === false ? parseInt(inputVal) : parseFloat(inputVal);
            } catch(e){
                return -1;
            }
        }
        return this.#input.checkValidity() ? 1 : -1;
    }

    

    // Static Methods
    static Tag = 'i-number';
    

    static Html = `<input id="iput" type="number" step="1"/>`;

    static Css = (
        `input{
            border: 1px solid var(--b3);
            width: 100%;
            padding: .5em;
        }
        input:disabled{
            background: var(--b4);
        }`
    );

}

ELMNT.define(iNumber);