
class iComplex extends ELMNT_Input
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    objects = [];

    // --- Private Properties --- //
    #path;
    #value;
    #schema;
    #required = [];
    #maxItems = 100;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['add','click',this._onAddRow ]
        ];
    }

    // --- Setters & Getters --- //
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v; 
        this.objects = [];
        this.dataset.dirty = "";
        this.shadow.querySelector('.objects').innerHTML = '';
        if (v === null){ return }
        v.forEach(v=>{ this.#addRow(v) });
    }

    get value(){
        const val = [];
        this.objects.sort((a,b)=>{ return parseInt(a.dataset.order) - parseInt(b.dataset.order) });
        for (const $f of this.objects){
            const obj = {};
            for (const $field of $f.fields){
                obj[$field.name] = $field.value;
            }
            val.push(obj);
        }
        return val;
    }

    set items(v){
        if (v.required){
            this.#required = v.required;
        }
        this.#schema = v.properties;
        if (!this.$titleField){
            this.$titleField = Object.keys(this.#schema)[0];
        }
    }


    set __path(v){
        this.#path = v;
        this.objects.forEach(view=>{ 
            view.fields.forEach(f=>{ f.__path = v });
        });
    }

    set maxItems(v){
        this.#maxItems = v;
    }

    // --- Public Methods --- //

    // --- User Events --- //
    _onAddRow(){
        this.#addRow();
    }

    _onDeleteView(ev){
        const $view = ev.target.closest('.object');
        this.objects = this.objects.filter(v=>v !== $view);
        $view.remove();
        this.dataset.dirty = true;
        this.#checkState();
        this.$el('add').style.display = this.objects.length >= this.#maxItems ? 'none' : '';
    }

    _onMoveUp(ev){
        const $view = ev.target.closest('.object');
        const currentOrder = parseInt($view.dataset.order);

        if (currentOrder === 0){ return }
        
        const $old = this.$el('objects').querySelector(`.object[data-order="${currentOrder - 1}"]`);
        $view.style.order = $view.dataset.order = currentOrder - 1;

        if ($old){ $old.style.order = $old.dataset.order = currentOrder };
        this.dataset.dirty = true;
        this.#checkState();
    }

    _onMoveDown(ev){
        const $view = ev.target.closest('.object');
        const currentOrder = parseInt($view.dataset.order);

        if (currentOrder >= this.shadow.querySelectorAll('.object').length - 1){ return }
        
        const $old = this.$el('objects').querySelector(`.object[data-order="${currentOrder + 1}"]`);
        $view.style.order = $view.dataset.order = currentOrder + 1;

        if ($old){ $old.style.order = $old.dataset.order = currentOrder };
        this.dataset.dirty = true;
        this.#checkState();
    }


    // --- Private Helpers --- //
    #addRow(value){
        const $ff = document.createElement('div');
        $ff.classList.add('object');
        $ff.innerHTML = iComplex.RowHtml;
        $ff.fields = [];

        for (const prop in this.#schema){
            const fieldType = this.#schema[prop].$is ||  this.#schema[prop].type;
            const $field = document.createElement(`i-${fieldType}`);
            $field.setAttribute('name',prop);
            Object.entries(this.#schema[prop]).forEach(([k,v])=>{ $field[k] = v; });
            $field.__path = this.#path;
            $ff.fields.push($field);
            $ff.appendChild($field);
            if (value){
                $field.value = value[prop];
            }
        }
        
        if (!value){
            $ff.classList.add('open');
            $ff.classList.add('new');
        } else {
            $ff.querySelector('.object-name i').innerText = value[this.$titleField];
        }
        

        $ff.style.order = $ff.dataset.order = this.objects.length;
        
        $ff.querySelector('.object-title').addEventListener('click',()=>{ 
            $ff.classList.toggle('open');
            $ff.draggable = $ff.classList.contains('open') ?  false : true;
        });
        $ff.addEventListener('change', this.#checkState.bind(this));
 
        const $ttl = $ff.querySelector(`[name="${this.$titleField}"]`);
        $ttl.addEventListener('change',()=>{ 
            $ff.querySelector('.object-title-text').innerText = $ttl.value;
        });
        $ff.querySelector('.ctrl.up').addEventListener('click',this._onMoveUp.bind(this));
        $ff.querySelector('.ctrl.down').addEventListener('click',this._onMoveDown.bind(this));
        $ff.querySelector('.ctrl.delete').addEventListener('click',this._onDeleteView.bind(this));
        

        this.shadow.querySelector('.objects').appendChild($ff);
        this.objects.push($ff);

        this.$el('add').style.display = this.objects.length >= this.#maxItems ? 'none' : '';
        
    }

    #checkState(){
        const invalid = this.objects.find($f=>{ return $f.fields.find(field=> field.state === -1 )});
        const valid = this.objects.find($f=>{ return $f.fields.find(field=> field.state === 1 ) })
        if (invalid){
            this.dataset.state = -1;
        } else if (valid && this.#required.length > 0){
            let invalidFound = false;
            for (const obj of this.objects){
                for (const fieldName of this.#required){
                    const $field = obj.fields.find(f=>f.name === fieldName);
                    if (!$field.value || $field.state === -1){
                        this.dataset.state = -1;
                        $field.dataset.state = -1;
                        invalidFound = true;
                    }
                }
            }
            this.dataset.state = invalidFound ? -1 : 1;
        } else if (valid){
            this.dataset.state = 1;
        } else if (this.dataset.dirty = 'true'){
            this.dataset.state = 1;
        } else {
            this.dataset.state = 0;
        }
        this.dispatchEvent(new Event('change', {bubbles: true}));
    }

    // --- Static Methods --- //
    static RowHtml = (
            `<div class="object-name">
                <span class="left">
                    <span class="object-title">
                        <b>+</b>
                        <i class="object-title-text">New</i>
                    </span>
                </span>
                <div class="row-controls">
                    <button class="ctrl up material-symbols-outlined">arrow_upward</button>
                    <button class="ctrl down material-symbols-outlined">arrow_downward</button>
                    <button class="ctrl delete material-symbols-outlined">close</button>
                </div>
            </div>`
    )

    // --- Static Defs   --- //
    static Tag = 'i-complex';
    
    
    static Html = (
        `<div class="controls">
            <button id="add">ADD ITEM</button>
        </div>
        <div id="objects" class="objects"></div>`
    );

    static Css = (
        `:host{
            display: flex;
            flex-direction: column;
            overflow: hidden;
            max-width: 98% !important;
        }
        .controls{
            padding-top: .5em;
            padding-bottom: 1.75em;
        }
        .controls:empty{
            display: none;
        }
        .controls button{
            font-weight: 700;
            background: var(--button);
            color: var(--button-text);
            border-radius: 3px;
            cursor: pointer;
        }
        .controls button:hover{
            background: var(--button-hover);
        }
        
        .objects{
            padding: 0;
            display: flex;
            flex-direction: column;
        }
        .object{
            margin-bottom: 1em;
            user-select: none;
            border-bottom: 1px solid rgb(240 240 240);
        }
        .object.drag-over{
            background: rgb(240 240 240);
        }
        .object.open .open-arrow{
            transform: rotate(90deg);
        }
        .object:not(.open) > *:not(.object-name){
            display: none;
        }
        .object-name{
            font-weight: 700;
            margin-bottom: 1.5em;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-left: -.5em;
        }
        .left{
            display: flex;
            align-items: center;
            flex: 1 1 100%;
        }
        .object-title{
            padding-left: 10px
        }
        .object-title-text{
            font-style: normal;
        }
        .row-controls{
            display: flex;
            align-items: center;
            flex: 0 0 auto;
        }
        .ctrl{
            cursor: pointer;
            border-radius: 50%;
        }
        .ctrl:hover{
            color: var(--btn);
            background: rgb(250 250 250);
        }
        .ctrl.delete:hover{
            color: var(--warning);
        }
        .elmnts-input{
            margin-bottom: 1.75em;
        }
        input:disabled{
            background: var(--b4);
        }`
    )

}


ELMNT.define(iComplex);

