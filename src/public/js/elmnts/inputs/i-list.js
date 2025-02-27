class iList extends ELMNT_Input
{
    constructor(){
        super();
        this.#input = this.shadow.querySelector('input');
    }



    // Private Globals
    #value = [];
    #inputValue = [];
    #input;
    #chars;
    
     // --- Lifecycle Hooks --- //
     get Events(){
        return [
            ['additem','click', this._onAddItem],
            ['items','click', this._onOptionClick],
            ['iput','keydown', this._onEnter]
        ];
    }

    // Public Methods

    // Setters
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v ? v : []; 
        this.#input.value = '';
        this.#inputValue = [];
        this.shadow.querySelector('.items').innerHTML = '';
        if (!v){ return }
        v.forEach(i=>{ this.#addNewItem(i); });
    }

    get value(){
        return this.#inputValue;
    }

    set $chars(v){
        this.#chars = new RegExp(v);
        this.#input.addEventListener('keydown',this._onInput.bind(this));
        this.#input.addEventListener('paste',this._onPaste.bind(this));
    }

    // Events
    _onInput(ev){
        if (!this.#chars.test(ev.key) && !ev.ctrlKey){
            ev.preventDefault();
            ev.stopPropagation();
        }
    }

    _onPaste(ev){            
        ev.preventDefault();
        ev.stopPropagation();
    }

    _onEnter(ev){
        if (ev.key === 'Enter'){
            const val = this.#input.value;
            if (!val){ return; }
            this.#addNewItem(val,true);
        }
    }

    _onAddItem(ev){
        const val = this.#input.value;
        if (!val){ return; }
        this.#addNewItem(val,true);
    }

    _onOptionClick(ev){
        const $span = ev.target.closest('span');
        if (!$span){ return; }
        const value = $span.dataset.value;
        const label = $span.innerHTML;
        $span.remove();
        
        this.#inputValue = this.#inputValue.filter(v=>{ return v !== value });
        this.#input.appendChild(new Option(label,value));
        this.#input.value = '';
        
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event("change", {bubbles: true}));
    }

    // Helpers
    #addNewItem(val,userInput=false){
        this.$qs('div.items').insertAdjacentHTML('beforeend',`<span data-value="${val}">${val}</span>`);
        this.#inputValue.push(val);
        if (userInput === true){
            this.#input.value = '';
            this.dataset.state = this.#checkState();
            this.dispatchEvent(new Event("change", {bubbles: true}));
        }
    }

    #checkState(){
        if (JSON.stringify(this.#value) === JSON.stringify(this.#inputValue)){
            return 0;
        }
        return 1;
    }

    

    // --- Static Defs --- //
    static Tag = 'i-list';
    
    static Html = (
    `<div id="iput" class="input">
        <input placeholder="Add Item"/>
        <span id="additem" class="add-item">
            <b class="material-symbols-outlined">add</b>
            <b>Add</b>
        </span>
    </div>
    <div id="items" class="items"></div>`);

    static Css = (
        `:host{
            display: block;
        }
        .input{
            border: 1px solid var(--b3);
            padding: .25em ;
            display: flex;
            flex-direction: row;
            align-items: center;
        }
        input{
            flex: 1 1 100%;
        }
        input:disabled{
            background: var(--b4);
        }
        .add-item{
            display: flex;
            flex-direction: row;
            align-items: center;
            cursor: pointer;
            padding: 0 .5em;
            line-height: 1.5em;
        }
        .items{
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: .75em 0;
            flex-wrap: wrap;
            row-gap: .5em;
        }
        .items span{
            background: var(--b4);
            border-radius: 16px;
            padding: .25em .75em;
            color: var(--b1a);
            cursor: pointer;
            margin-right: .75em;
        }
        .items span:after{
            content: 'x';
            display: inline-block;
            margin-left: 1em;
            font-weight: 700;
        }
        span:hover{
            background: var(--b3);
        }`
    );
}

ELMNT.define(iList);