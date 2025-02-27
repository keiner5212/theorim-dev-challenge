class iMultiline extends ELMNT_Input
{
    constructor(){
        super();

        this.#input = this.shadow.querySelector('textarea');
    }


    // Public Globals
    minLength = 0;
    name;
    

    // Private Globals
    #value = '';
    #enum = null;
    #input;
    #maxLength;
    #chars = null;
    #pattern = null;
    

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['iput','input', this._onChange],
            ['iput','paste', this._onChange]
        ];
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

    get state(){
        return parseInt(this.dataset.state);
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

    // Public Methods
    populate(value){
        this.#input.value = value;
        this.dataset.state = this.#checkState();
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
    

    // --- Static Properties --- //
    static Tag = 'i-multiline';
    

    static Html = `<textarea id="iput"></textarea>`;

    static Css = (
        `:host{
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 10em;
        }
        textarea{
            border: 1px solid var(--b3);
            width: 100%;
            padding: .5em;
            flex: 1 1 100%;
        }
        textarea:disabled{
            background: var(--b4);
        }`
    );
}


ELMNT.define(iMultiline);
