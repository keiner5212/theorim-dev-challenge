class iString extends ELMNT_Input
{
    constructor(){
        super();
        this.#input = this.shadow.querySelector('input');
    }

    

    //  --- Public Properties --- //
    minLength = 0;
    

    // --- Private Properties --- //
    #value = '';
    #enum = null;
    #input;
    #maxLength;
    #chars = null;
    #pattern = null;
    
    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['iput','keyup', this._onChange ],
            ['iput','paste', this._onChange ]
        ];
    }

    // Public Methods
    populate(value){
        this.#input.value = value;
        this.dataset.state = this.#checkState();
    }

    // Setters
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v; 
        this.#input.value = this.#value === null ? '' : this.#value;
    }

    get value(){
        return this.#input.value;
    }

    set pattern(v){
        this.#pattern = new RegExp(v);
    }

    set $chars(v){
        this.#chars = new RegExp(v);
        this.#input.addEventListener('keydown',(ev)=>{
            if (!this.#chars.test(ev.key) && !ev.ctrlKey){
                ev.preventDefault();
                ev.stopPropagation();
            }
        });
    }

    set maxLength(v){
        this.#maxLength = v;
        this.#input.addEventListener('keydown', (ev)=>{
            if (ev.target.value.length >= this.#maxLength && ev.key.length === 1 && !ev.ctrlKey){
                ev.preventDefault();
                ev.stopPropagation();
            }
        });
    }
    
    set placeholder(v){
        this.#input.setAttribute('placeholder',v);
    }

    set enum(v){
        this.#enum = v;
        const $datalist = document.createElement('datalist');
        $datalist.id = 'list';
        $datalist.innerHTML = v.map(o=>{ return `<option value="${o}">${o}</option>`}).join('');
        this.shadow.appendChild($datalist)
        this.#input.setAttribute('list', 'list')
    }


    // Events
    _onChange(){
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event("change", {bubbles: true}));
    }

    // Private Helpers
    #checkState(){
        if (this.#value === this.#input.value){
            return 0;
        }
        // Check Regex
        const regExPass = this.#pattern === null ? true : this.#pattern.test(this.#input.value);
        if (!regExPass){
            return -1;
        }
        // Check Min Length
        if (this.minLength > 0 && this.#input.value.length < this.minLength){
            return -1;
        }
        // Check Max Length
        if (this.#maxLength > 0 && this.#input.value.length > this.#maxLength){
            return -1;
        }
        // Check Enum
        if (this.#enum && !this.#enum.includes(this.#input.value)){
                return -1;
        }
        return 1;
    }

    

    // Static Methods
    
    static Tag = 'i-string';

    static Html = (`<input type="text" id="iput" input tabindex="0"/>`);

    static Css = (
        `:host{
            display: block;
        }
        input{
            border: 1px solid var(--b3);
            width: 100%;
            padding: .5em;
        }
        input:disabled{
            background: var(--b4);
        }`
    )
}


ELMNT.define(iString);
