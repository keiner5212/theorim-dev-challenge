class iCreateLinkWin extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //

    // --- Private Properties --- //
    #value = {};
    #schema;
    #qry;
    #pk;
    #jtName;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['jtable','click', this._onFirstClick, {once:true}],
            ['jtable','change', this._onJtableChange],
            ['schema','change', this._onSchemaChange],
            ['submit','click', this._onSubmit],
            ['cancel','click',this._onCancel ]
        ];
    }

    // --- Setters & Getters --- //
    set pk(v){
        this.#pk = v;
        this.#jtName = v.split(':')[0].split('#')[1];
        this.$el('dataset').value = v.split(':')[0].split('#')[0];
    }

    // --- Public Methods --- //


    // --- User Events --- //


    async _onSchemaChange(){
        // Check for Custom SK
        const fullSchema = await Global.Api.User.Def({dataset: this.$el('dataset').value});
        // console.log('full schema', fullSchema);
        const jtSch = fullSchema.jtables.find(jt => jt.name === this.$el('jtable').value);
        // console.log('jtSch', jtSch);
        if (jtSch.custom_sk && jtSch.custom_sk.length > 0){
            this.$el('custom_sk_box').innerHTML = '';
            const schema = jtSch.schemas.find(s => s.$id === this.$el('schema').value);
            const prop = schema.properties[schema.custom_sk.name];
            this.$el('custom_sk_name').innerText = schema.custom_sk.label;
            const $field = ELMNT.Input(prop);
            $field.id = 'custom_sk_value';
            $field.addEventListener('change',()=>{ 
                this.#checkState(); 
            });
            this.$el('custom_sk_box').appendChild($field);
            this.dataset.customsk = 'true';
        } else {
            this.dataset.custom_sk = 'false';
        }
        this.#checkState();
    }

    async _onSubmit(){
        const cmd = {
            pk: this.#pk,
            sk: this.sk,
            dataset: this.$el('dataset').value,
            jtable: this.$el('jtable').value,
            schema: this.$el('schema').value
        }
        if (this.dataset.customsk === 'true'){
            cmd.custom_sk = {
                name: this.$el('custom_sk_value').name,
                value: this.$el('custom_sk_value').value
            };
        }
        console.debug('Create Linked', cmd);
        try{
            const result = await Global.Api.User.create_linked(cmd);
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
    async #query(level){
        let url = `api/owner/srchdef?dataset=${this.$el('dataset').value}`;
        for (const k of level){
            const v = this.$el(k).value;
            if (!v){ return [] }
            url += `&${k}=${v}`;
        }
        const r = await fetch(url);
        const res = await r.json();
        return res;
    }

    #checkState(){
        const v = {
            dataset: this.$el('dataset').value,
            jtable: this.$el('jtable').value,
            schema: this.$el('schema').value,
        }
        let validSK = true;
        if (this.dataset.customsk === 'true'){
            validSK = this.$el('custom_sk_value').state === 1;
        }
        this.$el('submit').disabled = validSK && v.jtable && v.schema ? false : true;
    }


    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'create-link-window';
    

    static Html = (
    `<div class="title"><span>PASTE AS</span><button id="cancel">✕</button></div>
    <div class="controls">
        <button id="submit" class="move-btn" disabled>Create Linked Item</button>
    </div>
    <div class="body">
        <div class="row">
            <span>Schema</span>
            <select id="schema">
                <option disabled selected value="">Select Schema</option>
            </select>
        </div>
        <div class="row csk">
            <span id="custom_sk_name">Custom SK</span>
            <div id="custom_sk_box"></div>
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
            background-color: #1c1f24;
            border: 1px solid rgb(100 100 100);
            color: rgb(200 200 200);
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
            background: black;
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
            background: rgb(0,0,0,.25);
            border: 2px solid #6f7b90;
            padding: .5em 1em;
            color: #9aa3b1;
            cursor: pointer;
            font-family: var(--ttl);
            border-radius: 3px;
        }
        .controls button:hover{
            background: black;
            color: white;
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
        i-date{
            width: 15em;
        }
        input[type="checkbox"]{
            width: 1em;
            flex: 0;
        }
        input:disabled,
        .controls button:disabled{
            background: rgba(255,255,255,.2);
            color: #8f8f8f;
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
        }
        option{
            background: black;
            color: white;
        }`
    );

}


ELMNT.define(iCreateLinkWin);

