class iCreateLinkWin extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //

    // --- Private Properties --- //
    #value = {};
    #source;
    #index;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['path','change', this._onPathChange],
            ['submit','click', this._onSubmit],
            ['cancel','click',this._onCancel ]
        ];
    }

    // --- Setters & Getters --- //
    set source(v){
        this.#source = v;
    }

    // --- Public Methods --- //


    // --- User Events --- //
    async _onPathChange(ev){
        this.#reset();
        // Validate All Fields Filled
        const val = ev.target.value;
        if (!val.dataset || !val.jtable || !val.schema){
            this.$el('submit').disabled = true;
            return;
        }
        // Build value
        this.#value = {
            pk: `${val.dataset.name}/${val.jtable.name}`,
            dataset: val.dataset.name,
            jtable: val.jtable.name,
            schema: val.schema.name
        };
        
        const schemaObjects = await Global.get('schema', this.#value);
        if (!schemaObjects.find(sch=>{ return sch.top === true})){
            this.$el('submit').disabled = false;
            return
        }
        const index = schemaObjects.find(f=>{ return f.$index === true});
        if (!index){
            this.$el('submit').disabled = false;
            return
        }
        const $div = this.$qs('.index-field');
        $div.innerHTML = `<label>${index.label}</label>`
        const $index = ELMNT.Input(index);
        $div.appendChild($index);
        $index.addEventListener('change', this._onIndexChange.bind(this));
        if (this.#source.index){
            $index.value = this.#source.index;
            $index.dataset.state = 1;
            $index.dispatchEvent(new Event('change'));
        }
        this.#index = $index;
    }

    _onIndexChange(ev){
        this.$el('submit').disabled = ev.target.state == 1 ? false : true;
    }


    async _onSubmit(){
        const cmd = {...this.#value};
        cmd.source = this.#source;
        cmd.sk = `${this.#value.schema}`
        if (this.#index){
            cmd.index = this.#index.value;
        }
        console.debug('Create Linked', cmd);
        try{
            const result = await Global.post('data',{action: 'create_linked'},cmd);
            console.debug(result);
        } catch (e){
            window.alert('Error Creating Linked Item: ' + e.toString());
            console.warn('Error Creating Linked Item:', e);
        }
        this.remove()
    }


    _onCancel(){
        this.remove();
    }

    // --- Private Helpers --- //
    #reset(){
        this.$el('submit').disabled = true;
        this.$qs('.index-field').innerHTML = '';
        this.#index = null;
    }




    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'create-link-window';
    

    static Html = (
    `<div class="title"><span>CREATE LINKED ITEM</span><button id="cancel">✕</button></div>
    <div class="controls">
        <button id="submit" class="move-btn" disabled>Create Linked Item</button>
    </div>
    <div class="body">
        <div class="row">
            <i-relbuilder class="no-prop" id="path"></i-relbuilder>
        </div>
        <div class="index-field">
        </div>
    </div>`
);

    static Css = (
        `:host{
            position: absolute;
            display: flex;
            flex-direction: column;
            width: 500px;
            height: fit-content;
            margin-top: 50px;
            margin-left: calc(50% - 250px);
            background-color: white;
            border: 1px solid rgb(100 100 100);
            color: rgb(120 120 120);
            z-index: 1000;
            box-shadow: rgba(0, 0, 0, 0.36) 0px 0px 8px 2px;
            overflow: hidden;
        }
        .title{
            text-align: center;
            font-size: 1.2em;
            font-weight: 600;
            line-height: 2em;
            height: 2em;
            font-family: var(--ttl);
            background: rgb(0,0,0,.15);
            border-bottom: 1px solid rgba(255,255,255,.1);
            flex: 0 0 auto;
        }
        .title span:not(.material-symbols-outlined){
            text-transform: uppercase;
            color: #666;
            font-weight: 600;
            width: 10em;
        }
        #cancel{
            position: absolute;
            right: 0;
            top: 0;
            width: 2em;
            height: 2em;
            cursor: pointer;
        }
        #cancel:hover{
            color: var(--red);
        }
        .controls{
            display: flex;
            justify-content: flex-start;
            margin: 1em 0;
            padding: 1em;
            flex: 0 0 auto;
        }
        .controls button{
            border: 2px solid rgb(200 200 200);;
            padding: .5em 1em;
            color: #0f62fe;
            cursor: pointer;
            font-family: var(--ttl);
            border-radius: 3px;
            font-weight: 600;
        }
        .controls button:not(.disabled):hover{
            border: 2px solid #0f62fe;
        }
        .body{
            padding: 1em;
        }
        :host(:not([data-customsk="true"])) .csk{
            display: none;
        }
        .row span{
            text-transform: uppercase;
            color: #666;
            font-weight: 600;
            width: 10em;
            display: inline-block;
        }
        input,select,i-date{
            border: 1px solid #ccc;
            margin: .5em 0;
            padding: .5em 1em;
            font-size: inherit;
            flex: 1 1 100%;
            max-width: 20em;
        }
        .index-field{
            margin-top: 1em;
        }
        i-date{
            width: 15em;
        }
        input[type="checkbox"]{
            width: 1em;
            flex: 0;
        }
        input:disabled,
        .controls button:disabled{
            background: rgba(200 200 200);
            color: rgb(120 120 120);
        }
        span.material-symbols-outlined{
            font-size: 1.2em;
            cursor: pointer;
        }
        .row{
            display: flex;
            flex-direction: row;
            align-items: center;
        }
        .custom_sk_box{
            flex: 1 1 100%;
        }`
    );

}


ELMNT.define(iCreateLinkWin);