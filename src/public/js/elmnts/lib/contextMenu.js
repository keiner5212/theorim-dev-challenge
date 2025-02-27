class ContextMenu extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
        this.shadow.addEventListener('mousedown',(ev)=>{ 
            const $opt = ev.target.closest('[data-value]');
            if (!$opt){ return }
            this.#value.value = $opt.dataset.value;
            this.#value.label = $opt.dataset.label;
            if (this.#target){
                this.#target.dispatchEvent(new CustomEvent($opt.dataset.value));
            }
            this.dispatchEvent(new CustomEvent('select',{detail: $opt.dataset.value}));
        })
    }

    #value = {label: '', value: ''}
    #target;

    // --- Lifecycle Hooks --- //


    // --- Setters & Getters --- //
    get value(){ return this.#value; }
    set value(v){ this.#value = v; }

    set options(v){
        this.$el('options').innerHTML = '';
        v.forEach(opt=>{
            const $opt = document.createElement('div');
            $opt.dataset.value = opt.value || opt;
            $opt.dataset.label = opt.label || opt;
            $opt.innerHTML = `<span class="material-symbols-outlined ico">${opt.icon || ''}</span><span>${opt.label || opt}</span>`;
            this.$el('options').appendChild($opt);
        })
    }

    set visible(v){
        this.$qsa('div').forEach($opt=>{
            if (v.includes($opt.dataset.value)){
                $opt.classList.remove('h');
            } else {
                $opt.classList.add('h');
            }
        })
    }

    set html(v){
        this.$el('options').innerHTML = v;
    }

    set left(v){
        this.style.left = `${v}px`;
    }

    set $target(v){ this.#target = v; }
    get $target(){ return this.#target; }

    // --- Public Methods --- //
    bindTo(evType,$target,as='context'){
        this.#target = $target;
        $target.addEventListener(evType, (ev)=>{
            ev.preventDefault();
            ev.stopImmediatePropagation();
            let dimensions;
            if (as === 'context'){ 
                dimensions = {top: ev.clientY, left: ev.clientX};
            } else if (as === 'menu'){
                dimensions = {top: this.#target.getBoundingClientRect().bottom, left: this.#target.getBoundingClientRect().right};
            }
            this.open(dimensions);
        });
    }

    addOption(opt){
        const val = opt.value || opt;
        if (this.shadow.querySelector(`[data-value="${val}"]`)){ return }
        const $opt = document.createElement('div');
        $opt.dataset.value = val;
        $opt.dataset.label = opt.label || opt;
        $opt.innerHTML = `<span class="material-symbols-outlined ico">${opt.icon || ''}</span><span>${opt.label || opt}</span>`;
        this.$el('options').appendChild($opt);
    }

    open(input){
        const p = {
            top: input.top || (input.pageY ? input.pageY : input.rect.bottom + window.scrollY),
            left: input.left || (input.pageX ? input.pageX : input.rect.left + window.scrollX),
            width: input.width || (input.rect ? `${input.rect.width}px` : 'fit-content')
        }

        this.style = [
            `top: ${p.top}px`,
            `left: ${p.left}px`,
            `width: ${p.width}`
        ].join(';');
        
        document.body.appendChild(this);
        // Check for overflow on x axis
        if (this.offsetWidth + p.left > window.innerWidth){
            this.style.left = `${p.left - this.offsetWidth - 3}px`;
        }
        // Check for overflow on y axis
        const rect = this.getBoundingClientRect();
        if (rect.bottom > window.innerHeight){
            const newHeight = window.innerHeight - rect.top - 2;
            if (newHeight < 30){
                const overflow = newHeight - 30;
                this.style.top = `${rect.top - overflow}px`;
            }
            this.style.height = `${newHeight}px`;
        }
        window.addEventListener('mousedown',(ev)=>{ 
            window.addEventListener('mouseup',(ev)=>{ 
                this.remove();
            }, {once: true})
        }, {once: true})
    }

    filter(str){
        // console.log('filtering',str)
        this.shadow.querySelectorAll('[data-value]').forEach($opt=>{
            if (str === '' || $opt.dataset.value.toLowerCase().includes(str.toLowerCase()) || $opt.dataset.label.toLowerCase().includes(str.toLowerCase())){
                // console.log('showing',$opt)
                $opt.classList.remove('h');
            } else {
                // console.log('hiding',$opt)
                $opt.classList.add('h');
            }
        });
    }

    // --- Private Helpers --- //


    // --- Static Defs   --- //
    static Tag = 'context-menu';

    static Html = `<section id="options"></section>`;

    static Css = (
        `:host{
            display: block;
            position: absolute;
            font-size: .95em;
            overflow-x: hidden;
            overflow-y: auto;
            z-index: 1000;
            box-sizing: border-box;
        }
        section{
            width: 100%;
            background-color: rgb(31 31 31);
            color: rgb(204 204 204);
            border-radius: 2px;
            box-shadow: rgba(0, 0, 0, 0.36) 0px 0px 8px 2px;
            border: 1px solid rgb(49, 49, 49);
        }
        section:empty{
            display: none;
        }
        div{
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            display: flex;
            align-items: center;
            padding: 7px 10px 7px 5px;
            text-decoration: none;
            transition: background-color 0.2s ease;
        }
        div:hover{
            background-color: rgb(15 15 15);
        }
        div.h{
            display: none;
        }
        .ico{
            font-size: 1em;
            display: inline-block;
            margin-right: 2px;
            line-height: 1.2;
            font-size: .95em;
        }
        @keyframes scaleIn {
            from {
              transform: scale(0.5);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
        }`
    );
}

ELMNT.define(ContextMenu);