class imButton extends ELMNT
{
    constructor(){
        super();
        this.#menu = document.createElement('context-menu');
        this.#menu.addEventListener('select', this._onMenuSelect.bind(this));
    }


    #value;
    #options = false;
    #menu;
    #readOnly = false;

    // Connected Callback
    connectedCallback(){
        if (this.getAttribute('ico') !== null){
            this.shadow.querySelector('#ico').innerHTML = this.getAttribute('ico');
        }
        if (this.getAttribute('text') !== null){
            this.shadow.querySelector('#text').innerHTML = this.getAttribute('text');
        }
        if (this.getAttribute('options') !== null){
            this.options = this.getAttribute('options').split(';');
        }

        //Events
        this.shadow.addEventListener('click', this.#onClick.bind(this));
        this.shadow.addEventListener('change', ()=>{
            this.dispatchEvent(new CustomEvent('click',{detail: this.value}));
        });
    }

    get value(){
        return this.#value;
    }

    set value(v){
        this.#value = v;
    }
    set disabled(v){ this.readOnly = v }
    set readOnly(v){
        this.#readOnly = v;
        if (v === true){
            this.shadow.querySelector('select')?.setAttribute('disabled','true');
            this.shadow.querySelector('button')?.setAttribute('disabled','true');
        } else {
            this.shadow.querySelector('select')?.removeAttribute('disabled');
            this.shadow.querySelector('button')?.removeAttribute('disabled');
        }
    }

    set options(v){
        this.#menu.options = v;
        this.#options = v.length > 1;
        if (v.length < 2){
            this.#value = v[0];
        }
    }

    set visible(v){
        this.#menu.visible = v;
    }

    addOptions(v){
        this.#options = true;
        v.forEach(opt=>{
            this.#menu.addOption(opt);
        });
    }

    addOption(v){
        this.#options = true;
        this.#menu.addOption(v);
    }

    _onMenuSelect(ev){
        this.#value = ev.detail;
        this.dispatchEvent(new Event('click'));
    }

    #onClick(ev){
        if (this.#options){
            ev.stopImmediatePropagation();
            const boundingRect = this.getBoundingClientRect();
            const coords = {
                top: boundingRect.bottom,
                left: boundingRect.left
            }
            this.#menu.open(coords);
        }
    }

    // --- Static Defs   --- //
    static Tag = 'm-button';

    static Html = (`<button><span id="ico" class="material-symbols-outlined"></span><span id="text"></span></button>`);

    static Css = (
    `:host{
        display: block;
        position: relative;
    }
    button{
        z-index: -1;
        padding: .5em;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: inherit
        color: inherit;
        text-transform: uppercase;
        font-size: .9em;
        text-transform: uppercase;
        font-weight: 700;
        border-radius: 3px;
        cursor: pointer;
        width: 100%;
    }
    button:disabled{
        opacity: .5;
        cursor: pointer;
    }
    :host(:hover) button:not(:disabled){
        background: rgb(230 230 230);
    }
    button:not(:disabled):active{
        background: rgb(220 220 220);
    }
    option{
        background: rgb(20 20 20);
        color: white;
    }
    select{
        position: absolute;
        width: 100%;
        height:100%;
        opacity: 0;
        z-index: 1;
        top: 0;
        cursor: pointer;
    }`);
    
}

ELMNT.define(imButton);