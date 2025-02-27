
class iIndex extends ELMNT_Input
{
    
    // Constructor
    constructor(){
        super();
        Object.entries(iIndex.properties).forEach((e)=>{
            this.#input[e[0]] = ELMNT.Input(e[1],true);
            this.shadow.appendChild(this.#input[e[0]]);
        })
    }

    //  --- Public Properties --- //

    // --- Private Properties --- //
    #path;
    #value;
    #input = {};

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
        ];
    }

    connectedCallback(){
        this.classList.add('elmnts-input');
        this.#input.$is.addEventListener('change',this._onTypeChange.bind(this));
        this.shadow.addEventListener('change',this.#checkState.bind(this));
    }

    // --- Setters & Getters --- //
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v || {}; 
        this.#input.label.value = this.#value.label || null;
        this.#input.$is.value = iIndex.selectOptions[this.#value.$is] || null;
        this.#input.$period.value = this.#value.$period || null;
        this.#input.enum.value = this.#value.enum || null;
        if (this.#value.$is !== null && this.#value.$is !== undefined){
            this.#input.$is.readOnly = true;
        }
    }

    get value(){
        const val = {
            name: 'index',
            label: this.#input.label.value,
            $is: this.#input.$is.value.value
        }
        if (val.$is === 'date' || val.$is === 'cdate'){
            val.$period = this.#input.$period.value;
        }
        if (val.$is === 'select'){
            val.enum = this.#input.enum.value;
        }
        if (this.#input.$is.readOnly){
            delete val.$is;
        }
        return val;
    }

    // --- Public Methods --- //

    // --- User Events --- //
    _onTypeChange(){
        const type = this.#input.$is.value.value;
        this.dataset.type = type;
        if (type === 'date' || type === 'cdate' || type === 'udate'){
            this.#input.$period.value = {label: 'Month', value: 'month'};
        } else {
            this.#input.$period.value = null;
        }
        if (type !== 'select'){
            this.#input.enum.value = null;
        }
        this.#checkState();
    }

    // --- Private Helpers --- //

    #checkState(){
        const type = this.#input.$is.value.value;
        if (this.#input.label.state !== 1){
            this.dataset.state = -1;
        } else if (this.#input.$is.readOnly === false && this.#input.$is.state !== 1){
            this.dataset.state = -1;
        } else if (type === 'cdate' || type === 'date'){
            if (this.#input.$period.state === -1){
                this.dataset.state = -1;
            } else {
                this.dataset.state = 1;
            }
        } else {
            this.dataset.state = 1;
        }
        this.dispatchEvent(new Event('change', {bubbles: true}));
    }

    // --- Static Methods --- //
    static selectOptions = {
        string: {label: "String", value: "string"},
        select: {label: "Select", value: "select"},
        usergroup: {label: "User Group", value: "role"},
        date: {label: "Date", value: "date"},
        cdate: {label: "Created Date", value: "cdate"},
        udate: {label: "Updated Date", value: "udate"}
    }

    static properties = {
        label: {
            name: 'label',
            label: 'Index Field Title',
            type: 'string',
            description: 'Display name',
            minLength: 1,
            maxLength: 50,
            $chars: '^[a-zA-Z0-9\-_ ]+$'
        },
        $is: {
            name: '$is',
            type: 'string',
            label: 'Index Field Type',
            $is: 'select',
            $labelKey: 'label',
            $valueKey: 'value',
            enum: [
                {label: "String", value: "string"},
                {label: "Select", value: "select"},
                {label: "User Group", value: "role"},
                {label: "Date", value: "date"},
                {label: "Created Date", value: "cdate"},
                {label: "Updated Date", value: "udate"}
            ]
        },
        $period: {
            type: 'string',
            label: 'Period',
            name: '$period',
            $is: 'select',
            $labelKey: 'label',
            $valueKey: 'value',
            $display: 'none',
            enum: [
                {label: "Day", value: "date"},
                {label: "Week", value: "week"},
                {label: "Month", value: "month"},
                {label: "Quarter", value: "quarter"},
                {label: "Year", value: "year"}
            ]
        },
        enum: {
            name: 'enum',
            type: 'array',
            label: 'Options',
            $is: 'list',
            $chars: '^[a-zA-Z0-9\-]+$',
            $display: 'none',
        }
    }

    // --- Static Defs   --- //
    static Tag = 'i-index';
    

    static Css = (
        `:host{
            display: flex;
            flex-direction: column;
            overflow: hidden;
            max-width: 550px !important;
            border: 1px solid rgb(200 200 200);
            padding: .5em;
            box-sizing: border-box;
        }
        label{
            margin-bottom: 2em;
        }
        :host(:not([data-type="select"])) .elmnts-input[name="enum"]{
            display: none;
        }
        .elmnts-input[name="$period"]{
            display: none;
        }
        :host([data-type="date"]) .elmnts-input[name="$period"],
        :host([data-type="cdate"]) .elmnts-input[name="$period"]{
            display: block;
        }
        .elmnts-input{
            margin-bottom: 1.75em;
            margin-left: 1em;
        }
        input:disabled{
            background: var(--b4);
        }`
    )

}


ELMNT.define(iIndex);

