class iIcoPicker extends ELMNT_Input
{
    constructor(){
        super();
        this.#input = this.shadow.querySelector('input');
        this.#ico = this.shadow.querySelector('span');
    }

    // Public Globals
    minLength = 0;
    name;
    

    // Private Globals
    #value = '';
    #input;
    #ico;
    
    // Connected Callback
    connectedCallback(){
        this.classList.add('elmnts-input');
        //Events
        this.#input.addEventListener('keyup',this.#onChange.bind(this));
        this.shadow.querySelector('button').addEventListener('click',this.#open.bind(this));
    }


    // Setters
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v; 
        this.#input.value = this.#value === null ? '' : this.#value;
        this.#ico.innerHTML = this.#input.value || 'data_object';
    }

    get value(){
        return this.#input.value;
    }


    // Events
    #onChange(){
        this.dataset.state = this.#checkState();
        this.#ico.innerHTML = this.#input.value;
        this.dispatchEvent(new Event("change", {bubbles: true}));
    }

    // Private Helpers
    #checkState(){
        if (this.#value === this.#input.value){
            return 0;
        }
        return 1;
    }

    async #open(){
        const $menu = document.createElement('div');
        $menu.classList.add('icon-picker-menu');

        const icoList = await fetch('./img/icons.json');
        const icos = await icoList.json();
        $menu.innerHTML = icos.map(i=>{ return `<span class="material-symbols-outlined" data-value="${i}">${i}</span>` }).join('');

        window.addEventListener('mouseup', (event)=>{ 
            if (!event.target.closest('div.icon-picker-menu')){ 
                $menu.remove(); 
            }
        });
        $menu.addEventListener('mousedown', (ev)=>{
            if (!ev.target.closest('span[data-value]')) { return; }
            this.#input.value = ev.target.dataset.value;
            this.#ico.innerHTML = ev.target.dataset.value;
            this.dataset.state = this.#checkState();
            this.dispatchEvent(new Event('change',{bubbles: true}));
            $menu.remove();
        });
        document.body.appendChild($menu);
    }

    

    // Static Methods
    static Tag = 'i-iconpicker';

    static Html = (`<div><span class="material-symbols-outlined">data_object</span><button>Browse</button><input type="string"/></div>`);

    static Css = (
        `div{
            display: flex;
            align-items: center;
            justify-content: flex-start;
            height: 2em;
        }
        button{
            background: var(--button);
            color: var(--button-text);
            height: 100%;
            line-height: 2em;
        }
        span{
            width: 2em;
            height: 100%;
            color: var(--accent);
            overflow: hidden;
            background: rgba(103, 33, 122,.1);
            display: flex !important;
            align-items: center;
            justify-content: center;
            border-top-left-radius: 3px;
            border-top-right-radius: 3px;
        }
        input{
            border: 1px solid var(--b3);
            width: 7em;
            padding-left: .5em;
            height: 100%;
        }
        input:disabled{
            background: var(--b4);
        }`
    )

}
ELMNT.define(iIcoPicker);

function add_style_menu(){
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(
        `.icon-picker-menu{
            position: absolute;
            background: white;
            margin-top: 20vh;
            width: 500px;
            height: 400px;
            margin-left: calc(50% - 250px);
            overflow-y: scroll;
            overflow-x: hidden;
            box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
            border-radius: 6px;
            border:  1px solid rgb(240 240 240);
        }
        .icon-picker-menu span{
            content-visibility: auto;
            display: inline-block;
            width: 2em;
            height: 2em;
            text-align: center;
            line-height: 2em;
            font-size: 1.5em;
            cursor: pointer;
            margin: .5em;
            color: rgb(100 100 100);
        }
        .icon-picker-menu span:hover{
            background: rgb(220 220 220);
        }`
    );
    document.adoptedStyleSheets.push(sheet);
};
add_style_menu();