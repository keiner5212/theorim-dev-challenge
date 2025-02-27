


class iRelBuilder extends ELMNT_Input
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    static Datasets;
    static Loaded = false;

    // --- Private Properties --- //
    #value = {};
    #defs;
    #path;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['dataset','change', this._onDatasetChange],
            ['jtable','change', this._onJtableChange],
            ['schema','change', this._onSchemaChange],
            ['autolookup','change', this._onAutoLookup],
            ['property','change', this._onPropChange]
        ];
    }

    connectedCallback(){
        if (iRelBuilder.Loaded === false){ 
            iRelBuilder.Datasets = Global.get('dslinks');
        }
        iRelBuilder.Datasets.then(ds => {
            for (const d of ds){
                this.$el('dataset').innerHTML += `<option value="${d.name}">${d.title}</option>`;
            }
        });
    }

    // --- Setters & Getters --- //
    set value(v){
        this.#value = v || {};
        this.dataset.state = 0;
        this.$el('dataset').value = this.#value.dataset.name || '';
        ['jtable','schema','property'].forEach(k => {
            this.$el(k).innerHTML = this.#value[k] ? `<option value="${this.#value[k].sk || ''}">${this.#value[k].label || ''}</option>` : `<option disabled selected value="">Select ${k}</option>`;
        });
    }

    get value(){
        return this.#getValue();
    }

    set readOnly(v){
    }

    // --- Public Methods --- //


    // --- User Events --- //

    async _onDatasetChange(){
        const dataset = this.$el('dataset').value;
        this.#defs = await Global.get('links',{dataset});
        const jTables = this.#defs.filter(j=>{ return j.__object === 'jtable' && j.__parent === `dataset\$${dataset}` });

        this.$el('jtable').innerHTML = '<option disabled selected value="">Select Table</option>';
        this.$el('jtable').innerHTML += jTables.map(jt => `<option value="${jt.__id}">${jt.title}</option>`).join('');
        this.$el('jtable').removeAttribute('disabled');

        // Reset Schemas and Props
        this.$el('schema').innerHTML = '<option disabled selected value="">Select Schema</option>';
        this.$el('property').innerHTML = '<option disabled selected value="">Select Schema</option>';

        this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles:true}));
    }

    async _onJtableChange(){
        const schemas = this.#defs.filter(s=>{ return s.__object === 'schema' && s.__parent === this.$el('jtable').value });
        this.$el('schema').innerHTML = '<option disabled selected value="">Select Schema</option>';
        this.$el('schema').innerHTML += schemas.map(schema => `<option value="${schema.__id}">${schema.title}</option>`).join('');

        // Reset Schemas and Props
        this.$el('property').innerHTML = '<option disabled selected value="">Select Schema</option>';

        this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles:true}));
    }

    async _onSchemaChange(){
        const props = this.#defs.filter(s=>{ return s.__parent === this.$el('schema').value });
        this.$el('property').innerHTML = '<option disabled selected value="">Select Property</option>';
        this.$el('property').innerHTML += props.map(jt => `<option value="${jt.__id}">${jt.label}</option>`).join('');

        this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles:true}));
    }

    _onPropChange(){
        this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles:true}));
    }

    async _onAutoLookup(){
        this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles:true}));
    }

    

    // --- Private Helpers --- //
    static async Load(){
        this.Loaded = true;
        iRelBuilder.Datasets = Global.get('dslinks');
    }


    #getValue(){
        const value = {};
        for (const k of ['dataset','jtable','schema','property']){
            if (!this.$el(k).value){ continue; }
            const val = this.$el(k).value;
            value[k] = {
                sk: val,
                label: this.$el(k).options[this.$el(k).selectedIndex].innerText,
                name: this.#defs.find(d=>{return d.sk === val })?.name || val
            }
        }
        return value;
    }

    #checkState(){
        const v = {
            dataset: this.$el('dataset').value,
            jtable: this.$el('jtable').value,
            schema: this.$el('schema').value,
            property: this.$el('property').value,
            autolookup: this.$el('autolookup').checked
        }
        if (!v.jtable || !v.schema || !v.property){
            this.dataset.state = -1;
            return -1;
        }
        this.dataset.state = 1;
    }


    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'i-relbuilder';
    

    static Html = (
    `<div class="top">
        <span>Dataset:</span>
        <select id="dataset">
            <option disabled selected value="">Select Dataset</option>
        </select>
    </div>
    <div class="middle">
        <span>jTable</span>
        <select id="jtable">
            <option disabled selected value="">Select Table</option>
        </select>
    </div>
    <div class="middle">
        <span>Schema</span>
        <select id="schema">
            <option disabled selected value="">Select Schema</option>
        </select>
    </div>
    <div class="bottom" id="propbox">
        <span>Lookup Property</span>
        <select id="property">
            <option disabled selected value="">Select Property</option>
        </select>
    </div>
    <div class="bottom" style="display:none;">
        <span>Autolookup</span>
        <input type="checkbox" id="autolookup"/>
    </div>`
);

    static Css = (
        `:host{
            display: block;
            font-size: .95em;
        }
        :host(.no-prop) #propbox{
            display: none;
        }
        input,select{
            border: 1px solid #ccc;
            margin: .5em 0;
            font-size: inherit;
            flex: 1 1 100%;
            max-width: 20em;
        }
        input[type="checkbox"]{
            width: 1em;
            flex: 0;
        }
        span:not(.material-symbols-outlined){
            text-transform: uppercase;
            color: #666;
            font-weight: 600;
            width: 10em;
            display: inline-block;
        }
        span.material-symbols-outlined{
            font-size: 1.2em;
            cursor: pointer;
        }
        .top,.middle,.bottom{
            display: flex;
            flex-direction: row;
            align-items: center;
        }`
    );

}


ELMNT.define(iRelBuilder);

