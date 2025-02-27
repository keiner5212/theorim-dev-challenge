class ELMNT extends HTMLElement
{
    constructor(){
        super();
        this.shadow = this.attachShadow({mode: 'closed'});
        this.shadow.adoptedStyleSheets.push(ELMNT.GlobalStyleSheet);
        this.shadow.adoptedStyleSheets.push(this.constructor.StyleSheet);
        this.shadow.innerHTML = this.constructor.Html || '';

        if (this.Events){
            this.Events.forEach(ev=>{
                const [target,action,fn,options] = ev;
                const once = options && options.once ? {once: true} : {};
                const $el = typeof target === 'string' ? this.shadow.getElementById(target) : target;
                if (!$el){
                    console.warn('Element not found',target);
                }
                if (options && options.selector){
                    $el.addEventListener(action,(event)=>{
                        const $target = event.target.closest(options.selector);
                        if ($target){ fn.call(this,$target); }
                    },once);
                } else {
                    $el.addEventListener(action,fn.bind(this), once);
                }
            })
        }

        if (this.Shortcuts){
            this.Shortcuts.forEach(sc=>{
                const [target,letter,fn] = sc;
                const $el = typeof target === 'string' ? this.shadow.getElementById(target) : target;
                if (!$el){
                    console.warn('Element not found',target);
                }
                $el.addEventListener('keydown', (e) => {
                    if (e.key === 'Alt'){
                        $el.addEventListener('keydown', (e) => {
                            if (e.key === letter){
                                e.preventDefault();
                                fn.call(this);
                            }
                        }, {once: true});
                    }
                });
            });
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = newValue;
    }

    // External Methods
    map(obj){
        // Add Events
        if (obj.Events){
            obj.Events.forEach(ev=>{
                const [action,fn,options] = ev;
                const once = options && options.once ? {once: true} : {};
                if (options && options.selector){
                    this.addEventListener(action,(event)=>{
                        const $target = event.target.closest(options.selector);
                        if ($target){ fn($target); }
                    },once);
                } else {
                    try{
                        this.addEventListener(action,fn.bind(this), once);
                    } catch (e) { 
                        console.warn('Error adding event',action,e);
                    }
                }
            })
        }
        delete obj.Events;
        // Add Other Props
        for (const key in obj){
            this[key] = obj[key];
        }
    }

    // Internal Methods
    $el(id){ return this.shadow.getElementById(id); }
    $qs(selector){ return this.shadow.querySelector(selector); }
    $qsa(selector){ return this.shadow.querySelectorAll(selector); }

    // STATIC HELPERS
    static parseSK(path){
        const pathArr = path.split(':');
        return {
            id: pathArr[pathArr.length-1],
            class: pathArr[pathArr.length-1].split('#')[0],
            parent: pathArr.length <= 1 ? null : pathArr.slice(0, -1).join(':')
        }
    }

    static setProp(obj,name,value){
        Object.defineProperty(obj,name,{value: value, writable: false, enumerable: false});
    }

    static Shortcut($el,letter){
        $el.addEventListener('keydown', (e) => {
            if (e.key === 'Alt'){
                e.preventDefault();
                $el.click();
            }
        });
    }

    static Input(def,label=false){
        const fieldType = def.$is ||  def.type;
        const $field = document.createElement(`i-${fieldType}`);
        $field.name = def.name;
        if (label){
            def.label = def.label || def.title || def.name
        } else {
            delete def.label;
        }
        Object.entries(def).forEach(([k,v])=>{ $field[k] = v; });
        return $field;
    }

    // STATIC DEF METHODS
    static GlobalStyleSheet = new CSSStyleSheet();

    static GlobalCSS = (
        `::-webkit-scrollbar {
            width: 10px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #888;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        :focus { outline: none; } 
        .material-symbols-outlined {
            font-family: 'Material Symbols Outlined';
            font-weight: normal;
            font-style: normal;
            font-size: 1.65em;  /* Preferred icon size */
            display: inline-block;
            line-height: 1;
            text-transform: none;
            letter-spacing: normal;
            word-wrap: normal;
            white-space: nowrap;
            direction: ltr;
        }
        label{
            display: block;
            margin-bottom: 5px;
            font-size: 0.9em;
            color: rgb(97, 97, 97);
            font-weight: 500;
            text-transform: uppercase;
        }
        p.instructions{
            font-size: 0.95em;
            color: rgb(60 60 60);
            font-weight: 300;
            padding: 5px 0;
            margin: 0;
        }
        :host([data-state="1"]) label{ color: var(--green);}
        :host([data-state="-1"]) label{ color: var(--red);}
        :host(:not(:defined)){ opacity: 0; }
        input,textarea,select,button{
            background: none;
            font-size: inherit;
            font-family: inherit;
            color: inherit;
            border: none;
            outline: none;
            box-sizing: border-box;
        }
        input:disabled,textarea:disabled,select:disabled{ background: var(--b4); }
        input:focus,button:focus,textarea:focus,select:focus{ outline: none; }\n`
    )

    static define(cls){
        cls.StyleSheet = new CSSStyleSheet();
        cls.StyleSheet.replace(cls.Css).then(()=>{
            try{
                customElements.define(cls.Tag,cls);
            } catch (e){
                console.error('Error defining',cls.Tag,e);
            }
        })
    }
    static init(){ ELMNT.GlobalStyleSheet.replaceSync(ELMNT.GlobalCSS); }
}
ELMNT.init();

class ELMNT_Input extends ELMNT
{
    constructor(){ super(); }

    // ds;
    // pk;
    // sk;
    // type;
    // $path;


    #label;
    #description;

    // Lifecycle Hooks
    connectedCallback(){
        this.classList.add('elmnts-input');
    }

    // External Methods
    focus(){
        const el = this.shadow.querySelector('[tabindex]','input','textarea','select');
        if (el){ 
            setTimeout(()=>{ el.focus(); }, 100);
        }
    }

    get state(){ return this.dataset.state ? parseInt(this.dataset.state) : 0; }

    set readOnly(v){
        this.shadow.querySelectorAll('input,select,textarea,button').forEach($i=> { $i.disabled = v });
        v === true ? this.classList.add('disabled') : this.classList.remove('disabled');
    }

    set label(v){
        this.#label = this.#label || document.createElement('label');
        this.#label.title = this.#description || '';
        this.#label.innerText = v;
        this.shadow.insertBefore(this.#label, this.shadow.firstChild);
    }

    set $instructions(v){
        const $label = this.#label || this.shadow.firstChild;
        if ($label){
            $label.insertAdjacentHTML('afterend',`<p class="instructions">${v}</p>`);
        } else {
            this.shadow.appendChild(document.createElement('p')).innerText = v;
        }
    }

    set name(v){ this.setAttribute('name',v); }

    get name(){ return this.getAttribute('name'); }

    set description(v){
        this.#description = v;
        if (this.#label){
            this.#label.setAttribute('title', v);
        }
    }

    set styles(v){
        const ss = new CSSStyleSheet();
        ss.replaceSync(v);
        this.shadow.adoptedStyleSheets.push(ss)
    }

}


ELMNT.toFile = function(data, filename){
    const fileType = filename.endsWith('.json') ? 'application/json' : filename.endsWith('.csv') ? 'text/csv' : 'text/plain';
    const blob = new Blob([data], {type: fileType});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

