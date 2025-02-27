class eForm extends ELMNT
{
    constructor(){
        super();
    }


    // Public Globals
    get $id(){ return this.#activeSchema.$form.id; }
    get state(){ return this.dataset.state; }
 
    // Private Globals
    #schema = {};
    #data = {};
    #activeSchema = null;
    #parent = null;
    #sk;

    // Connected Callback
    connectedCallback(){
        this.dataset.state = 0;
    }


    // Public Setters/Getters
    set data(v){
        this.#data = v;
        this.dataset.state = 0;
        const schName = v.__object;
        this.schemaId = schName;
        this.sk = v.sk;

        // Error Check Schema
        if (!this.#schema[schName]){
            console.warn('!Error: Schema Not Found:',schName);
        }
        
        // Set Title
        this.#schema[schName].$title.value = v[this.#schema[schName].titleField] || v.index || v.__id;
        if (!v[this.#schema[schName].titleField]){
            console.warn('Title Field Not Found:',this.#schema[schName].titleField);
        }


        // Set Data
        this.#schema[schName].fields.forEach(field=>{ 
            field.$el.$path = this.pk + '/' + this.sk;
            field.$el.__path = this.__path;
            field.$el.value = v[field.name] !== undefined ? v[field.name] : null;
        })

        // Set Params
        this.#schema[schName].stats.updated.innerText = v.__updated ? new Date(v.__updated).toLocaleString('en-US', {
            year: '2-digit', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
        }).replace(',', '') : '';
        this.#schema[schName].stats.uuid.innerText = v.__uid || '';
        this.#schema[schName].stats.valid.innerText = 0;
        this.#schema[schName].stats.invalid.innerText = 0;

        // Activate Page
        if (this.#activeSchema.$id !== schName){
            this.shadow.querySelectorAll(`main`).forEach($f=>{ $f.classList.remove('active'); });
            this.#schema[schName].$form.classList.add('active');
            this.#activeSchema = this.#schema[schName];
        }
    }

    get data(){ return this.#data; }

    get changes(){;
        return this.#changes();
    }

    set title(v){
        this.shadow.querySelector('#formtitlefield').value = v;
    }

    set new(v){
        if (!v){ return; }
        this.dataset.new = true;
    }

    set schemas(v){
        for (const sch of v){
            this.#addSchema(sch);
        }
    }

    set history(v){
        if (!v){ return; }
    }

    get __path(){
        return {
            pk: this.pk,
            sk: this.#data.sk,
            uid: this.#data.__uid,
            dataset: this.#data.pk.split('/')[0],
            dsName: this.#data.pk.split('/')[0].split('$')[0],
            jtable: this.#data.pk.split('/')[1],
            schema: this.#data.__object
        }
    }

    // Public Methods
    #addSchema(schema){
        this.#schema[schema.$id] = { 
            $id: schema.$id,
            fields: [], 
            required: schema.required || [],
            view: {},
            $form: {}, 
            titleField: schema.$titleField,
            $title: null 
        };
        const $form = document.createElement('main');
        $form.id = schema.$id;
        $form.innerHTML = eForm.FormHtml;
        this.#schema[schema.$id].$title = $form.querySelector('#formtitlefield');
        this.#schema[schema.$id].$title.placeholder = schema.title?.toUpperCase() || schema.$id.toUpperCase();

        // Bind Stats
        this.#schema[schema.$id].stats = {
            valid: $form.querySelector('[data-id="validcount"]'),
            invalid: $form.querySelector('[data-id="invalidcount"]'),
            updated: $form.querySelector('[data-id="updated_date"]'),
            uuid: $form.querySelector('[data-id="uuid"]')
        };
        // Generate Fields
        const $ff = document.createDocumentFragment();
        // Add default required field if none exist
        if (schema.required.length === 0){
            let defRequired = null;
            if (schema.properties[schema.$titleField]) { 
                defRequired = schema.$titleField; 
            } else {
                for (const prop in schema.properties){
                    if (schema.properties[prop].$is === 'string'){
                        defRequired = prop;
                        break;
                    }
                }
            }
            defRequired = defRequired || Object.keys(schema.properties)[0];
            schema.required.push(defRequired);
        }

        for (const prop in schema.properties){
            if (this.dataset.new == 'true' && !schema.required.includes(prop)){ continue; }
            const fieldType = schema.properties[prop].$is ||  schema.properties[prop].type;
            const $field = document.createElement(`i-${fieldType}`);
            $field.name = prop;
            schema.properties[prop].label = schema.properties[prop].label || prop;
            Object.entries(schema.properties[prop]).forEach(([k,v])=>{ $field[k] = v; });
            $field.$path = this.pk;
            $field.GetFormField = (field)=>{ return this.#data[field]; }
            if (this.dataset.new == 'true'){
                $field.readOnly = false;
            }
            $ff.appendChild($field);
            this.#schema[schema.$id].fields.push({name: prop, $el: $field });
        }
        $form.querySelector('.form-body').appendChild($ff);

        // Add Tabs
        const $tabs = $form.querySelector('#formtabs');
        let first = '';
        schema.$formViews = schema.$formViews || [{name: 'All', cols: Object.keys(schema.properties)}];
        for (const view of schema.$formViews){
            $tabs.insertAdjacentHTML('beforeend', `<div class="tab" data-tab="${view.name}">${view.name}</div>`);
            this.#schema[schema.$id].view[view.name] = view.cols;
            if (first === ''){ first = view.name; }
        }
        

        // Attach
        this.#schema[schema.$id].$form = $form;
        this.shadow.appendChild($form);

        // Events
        const $schForm = this.#schema[schema.$id].$form
        $schForm.querySelector('#close').addEventListener('click', async ()=>{ this.dispatchEvent(new Event('close')); });
        $schForm.addEventListener('change', ()=>{ this.#onFieldChange(schema.$id) });
        $schForm.addEventListener('data-change', this.#onDataChange.bind(this));
        $schForm.querySelector('#save').addEventListener('click', this.#onFormSave.bind(this));
        $schForm.querySelector('#cancel').addEventListener('click', this.#onFormCancel.bind(this));
        $schForm.querySelector('.form-tabs').addEventListener('click', this.#onTabClick.bind(this));
        $schForm.addEventListener('keydown', this.#onKeyboardShortcut.bind(this));

        // Activate
        if (Object.keys(this.#schema).length === 1){ 
            this.#activeSchema = this.#schema[schema.$id]; 
            $form.classList.add('active');
        }

        this.#showTab(first,schema.$id);
    }

    setField(name,value,valid=true,readOnly=false){
        const field = this.#activeSchema.fields.find(f=>f.name === name);
        if (!field){ return; }
        field.$el.value = value;
        field.$el.dataset.state = valid ? 1 : -1;
        field.$el.readOnly = readOnly;
    }

    lock(enable){
        console.debug('lock',enable);
        const $blocks = this.shadow.querySelectorAll('.form-body');
        if (enable === true){
            $blocks.forEach($b=>{ 
                const $lockDiv = document.createElement('div');
                $lockDiv.classList.add('lock-block');
                $b.appendChild($lockDiv);
             });
        } else {
            $blocks.forEach($b=>{ 
                $b.querySelector('.lock-block').remove();
             });
        }
    }

    focus(){
        if (!this.#activeSchema.fields || this.#activeSchema.fields.length === 0){ return; }
        this.#activeSchema.fields[0].$el.focus();
        for (const field of this.#activeSchema.fields){
            if (field.$el.style.display !== 'none'){
                field.$el.focus();
                break;
            }
        }
    }


    // Event Handlers
    #onKeyboardShortcut(ev){
        if (ev.ctrlKey && ev.key === 's'){
            ev.preventDefault();
            if (this.dataset.state !== '1'){ return; }
            this.#onFormSave();
        }
    }

    #onTabClick(ev){
        const $tab = ev.target.closest('[data-tab]:not(.active)');
        if ($tab){ this.#showTab($tab.dataset.tab); }
    }

    #onFieldChange(schemaId){
        const schema = this.#schema[schemaId];
        if (!this.dataset.new){
            if (schema.fields.find(f=> f.$el.state === -1 )){
                this.dataset.state = -1;
            } else if (schema.fields.find(f=> f.$el.state === 1 )){
                this.dataset.state = 1;
            } else {
                this.dataset.state = 0;
            }
        } else {
            const notValid = schema.fields.find(f=> f.$el.state !== 1 && f.$el.tagName !== 'I-BOOLEAN' && f.$el.name !== 'period' && f.$el.name !== 'custom_sk');
            this.dataset.state = notValid ? -1 : 1;
        }
        schema.stats.valid.innerText = schema.fields.filter(f=> f.$el.state === 1).length;
        schema.stats.invalid.innerText = schema.fields.filter(f=> f.$el.state === -1).length;
    }

    #onDataChange(ev){
        const updates = {
            __id: this.#data.__id,
            [ev.detail.field]: ev.detail.value
        }
        this.dispatchEvent(new CustomEvent('data-change', { detail: updates, bubbles: true }));
    }

    async #onFormSave(){
        this.classList.add('saving');
        this.dispatchEvent(new CustomEvent('save'));
    }

    async #onFormCancel(){
        this.dataset.state = 0;
        this.#activeSchema.fields.forEach(field=>{ 
            field.$el.value = this.#data[field.name] !== undefined ? this.#data[field.name] : null;
        })
    }


    // Helpers
    #showTab(viewName,schemaId=null){
        const targetSchema = schemaId ? this.#schema[schemaId] : this.#activeSchema;

        const $oldTab = targetSchema.$form.querySelector('.tab.active');
        $oldTab?.classList.remove('active');

        targetSchema.$form.querySelector(`.tab[data-tab="${viewName}"]`).classList.add('active');
        if (this.dataset.new !== 'true'){
            targetSchema.fields.forEach(field=>{
                field.$el.style.order = targetSchema.view[viewName].findIndex(f=>{ return f === field.name });
                field.$el.style.display = targetSchema.view[viewName].includes(field.name) ? '' : 'none';
            });
        } else {
            targetSchema.fields.forEach(field=>{
                field.$el.style.order = targetSchema.required.findIndex(f=>{ return f === field.name });
                field.$el.style.display = '';
            });
        }
    }

    #changes(){
        const updates = {};
        this.#activeSchema.fields.forEach(f=>{
            if (f.$el.state === 1 || this.dataset.new === 'true'){
                updates[f.name] = f.$el.value;
            }
        });
        updates.pk = this.pk;
        updates.sk = this.sk;

        return updates;
    }

    // --- Static Methods --- //
    static FormHtml = (
        `<section class="form-head">
        <div class="form-title"><input id="formtitlefield" disabled/></div>
        <div class="form-controls">
            <button id="saving" class="lds-ring">
                <div></div><div></div><div></div><div></div>
            </button>
            <button  id="save" class="control" desc="Save Changes">SAVE</button>
            <button id="cancel" class="control" desc="Discard Changes">CANCEL</button>
            <button id="close" class="control" desc="Discard Changes">CLOSE</button>
        </div>
    </section>
    <section class="form-bar" id="form-tab-bar">
        <div class="form-tabs" id="formtabs"></div>
    </section>
    <section class="form-body"></section>
    <section class="form-info">
        <button>
            <em class="material-symbols-outlined">check</em>
            <em data-id="validcount">0</em>
        </button>
        <button>
            <em class="material-symbols-outlined">close</em>
            <em data-id="invalidcount">0</em>
        </button>
        <button>
            <em class="material-symbols-outlined">edit</em>
            <em data-id="updated_date"></em>
        </button>
        <button>
            <em class="material-symbols-outlined">fingerprint</em>
            <em data-id="uuid"></em>
        </button>
    </section>`
    )

    // --- Static Defs   --- //
    static Tag = 'elmnts-form';

    static Css = (
        `:host{
            display: flex;
            position: relative;
            flex-direction: column;
            background: white;
            overflow: hidden;
            border-left: 1px solid rgb(220 220 220);
        }
        main{
            display: flex;
            position: relative;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        main:not(.active){ display: none; }
        .form-head{
            flex: 0 0 2.5rem;
            background: white;
            color: rgb(82 82 82);
            border-bottom: 1px solid rgb(220 220 220);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 0 .5em;
            margin-bottom: 1em;
        }
        .form-title{
            flex: 1 1 100%;
            font-weight: 500;
            background: transparent;
            border: none;
            padding-left: 5px;
            font-size: 1.1em;
            font-weight: 600;
        }
        .form-title input{
            background: transparent;
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            height: 100%;
            width: 100%;
            border: none;
            color: inherit;
        }
        .form-controls{
            flex: 0 0 auto;
            display: flex;
            align-items: center;
        }
        .control{
            border: none;
            width: auto;
            font-size: .8em;
            font-weight: 600;
            border-radius: 3px;
            color: rgb(120 120 120);
            cursor: pointer;
            padding: .75em 1.5em;
            display: none;
            margin-right: 1em; 
            font-weight: 600;
            letter-spacing: 1px;
            transition: color .1s ease;
        }
        .control#save:hover{
            color: #0f62fe;
        }
        .control#close:hover,
        .control#cancel:hover{ 
            color: #ce9178; 
        }
        .control:last-child{ margin-right: 0; }
        .control:active{
            color: rgba(0,0,0,.9);
        }
        :host([data-state="1"]) #save{ display: inline-block; }
        :host(:not([data-state="0"])) #cancel{ display: inline-block; }
        :host([data-new="true"]) #close{ display: inline-block; }
        :host([data-new="true"]) #cancel{ display: none !important; }
       
        .form-bar{
            flex: 0 0 1.5em;
            min-width: 0;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            pading-right: 5px;
            margin-bottom: .5em;
        }
        .form-tabs{
            flex: 0 0 auto;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            pading-right: 5px;
        }
        :host([data-new="true"]) .form-tabs{ display: none; }
        .tab{
            padding: 2px .25em;
            margin: 0 .5em;
            flex: 0 0 auto;
            cursor: pointer;
            border-right: 1px solid rgb(243, 243, 243);
            box-sizing: border-box;
            border-bottom: 3px solid transparent;
        }
        .tab.active{
            font-weight: 600;
            color: rgb(30 30 30);
            border-bottom: 3px solid var(--active);
        }
        .form-body{
            flex: 1 1 100%;
            overflow: hidden scroll;
            box-sizing: border-box;
            display:flex;
            flex-direction: column;
            justify-content: flex-start;
            padding: 0 1em 2em 1em;
        }
        .lock-block{
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 10000;
            background: rgba(100,100,100,.1);
            margin-left: -1em;
        }
        .form-block{
            display: none;
            position: absolute;
            height: 100%;
            width: 100%;
            background: rgba(0,0,0,.1);
        }
        .elmnts-input{
            flex: 0 0 auto;
            margin: 1.5em .5em;
            font-size: .95em;
            max-width: 95%;
        }
        i-string,i-user,i-usergroup,i-select{
            width: 30em;
        }
        i-number,i-integer,i-date{
            width: 15em;
        }
        i-multiline,i-table,i-complex,i-file{
            width: 95%;
        }
        .form-info{
            background: rgb(0, 91, 161);
            color: rgba(255,255,255,.85);
            border-top: 1px solid rgb(230 230 230);
            padding: 2px 1px;
            font-size: .65rem;
            display: flex;
            align-items: center;
        }
        .form-info button{
            border: none;
            font-size: inherit;
            font-weight: 600;
            font-family: var(--ttl);
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 100%;
            opacity: .75;
            cursor: pointer;
            border-right: 2px solid rgba(255,255,255,.5);
            padding: 0 2em 0 0em;
            position: relative;
        }
        .form-info button > *{
            padding: 0 6px;
        }
        .form-info button span{
            font-size: inherit;
        }
        .form-info button em{
            font-style: normal;
        }
        .lds-ring {
            display: none;
            position: relative;
            width: 5em;
            height: 100%;
            padding: 0;
          }
        :host(.saving) .lds-ring{
            display: inline-block;
        }
        :host(.saving) #save{
            display: none;
        }
          .lds-ring div {
            box-sizing: border-box;
            display: block;
            position: absolute;
            width: 1.9em;
            height: 1.9em;
            top: 0;
            border: 3px solid #000;
            border-radius: 50%;
            animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            border-color: var(--green) transparent transparent transparent;
          }
          .lds-ring div:nth-child(1) {
            animation-delay: -0.45s;
          }
          .lds-ring div:nth-child(2) {
            animation-delay: -0.3s;
          }
          .lds-ring div:nth-child(3) {
            animation-delay: -0.15s;
          }
          @keyframes lds-ring {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }`
    )
}


ELMNT.define(eForm);