// Object or Primitive
// Multiselect or Single
// Query or Enum

class iSelect extends ELMNT_Input
{
    // Constructor
    constructor(){
        super();
        
        this.#menu = document.createElement('context-menu');
        this.#menu.addEventListener('select',this._onMenuClick.bind(this));
    }

    // Public Props
    $query;
    $loadAll;
    $labelKey;
    $valueKey;
    $multi = false;

    // Private Properties
    #value;
    #menu;
    #qryChars = '';
    #type;
    #loaded = false;

    // Lifecycle Hooks
    get Events(){ 
        return [
            ['search','mousedown',this._onFirstClick],
            ['search','focus',this._onOpen ],
            ['expand','click',this._onOpenAll ],
            // ['search','blur',this._onClose ],
            ['search','keyup',this._onSearch ],
            ['search','change',this._onChange ],
            ['multiselect','click',this._onOptionClick, {selector: 'option' }]
        ];
    }

    // Public Setters
    set value(v){
        this.dataset.state = 0;
        this.#value = v;
        this.#menu.value = this.#mapValue(v);   
        if (this.$query){
            this.#menu.options = [];
            this.#loaded = false;
            this.#qryChars = '';
        }
        
        this.$el('multiselect').innerHTML = '';

        if (!v || Array.isArray(v) && v.length === 0){
            this.$el('search').value = '';
        } else if (this.type === 'array'){
            v.forEach(val=>{
                const obj = this.#mapValue(val);
                this.$el('multiselect').appendChild(new Option(obj.label,obj.value));
            })
        } else {
            const obj = this.#mapValue(v);
            this.$el('search').value = obj.label;
        }
    }

    get value(){
        return this.#getValue();
    }

    set enum(v){ this.options = v; }
    set options(v){
        if (!v || v.length === 0){ 
            this.#menu.options = [];
            return
        }
        v.forEach(o=>{ 
            const opt = this.#mapValue(o);
            this.#menu.addOption({label: opt.label, value: opt.value}); 
        });
    }

    set type(v){ 
        this.#type = v; 
    }
    get type(){ return this.$multi === true ? 'array' : this.#type; }

    // Public Methods
    async setDefault(){
        const res = await this.#query();
        this.#loaded = true;
        // console.log(this.#menu.options,res);
        this.value = res[0] || null;
    }

    checkState(){ this.#checkState() }

    // User Events
    async _onFirstClick(){
        if (!this.$loadAll || !this.$query || this.#loaded === true){ return }
        this.#query();
        this.#loaded = true;
    }

    _onOpen(){
        this.#open();
    }

    _onOpenAll(){
        this.#menu.filter('');
        this.#open();
    }

    _onClose(){
        const currentVal = this.$el('search').value;
        if (currentVal !== ''){
            const menuVal = this.#menu.value;
            if (!menuVal.value.value){ 
                this.$el('search').value = '';
            } else {
                this.$el('search').value = this.#menu.value.label;
            }
        }
    }

    _onMenuClick(ev){
        const val = this.#menu.value.value;
        const label = this.#menu.value.label;
        if (this.type === 'array'){
            const $existing = this.shadow.querySelector(`#multiselect option[value="${val}"]`);
            if ($existing){ return }
            this.shadow.getElementById('multiselect').appendChild(new Option(label,val));
        } else {
            this.$el('search').value = label;
        }
        this.#checkState();
        this.$el('search').dispatchEvent(new Event('blur',{bubbles: true}));
    }

    _onOptionClick($opt){
        $opt.remove();
        this.#checkState();
    }

    _onChange(){
        this.#checkState();
    }

    async _onSearch(){
        const searchVal = this.$el('search').value.toLowerCase();
        // Run Query
        const queryChars = searchVal.length > 1 ? (searchVal.charAt(0) + searchVal.charAt(1)) : this.#qryChars;

        if (this.$query && !this.$loadAll && queryChars !== this.#qryChars){
            await this.#query(queryChars);
            this.#qryChars = queryChars;
        }
        // Filter Menu
        this.#menu.filter(searchVal);
    }

    // Helpers

    #open(){
        const inputRect = this.getBoundingClientRect();
        this.#menu.open({
            top: inputRect.bottom,
            left: inputRect.left,
            width: inputRect.width + 'px'
        });
    }

    #mapValue(val){
        if (!val){ return {label: null, value: null} }
        if (!this.$labelKey){ 
            return {label: val.label || val, value: val.value || val } 
        }
        return {
            label: val[this.$labelKey] || val,
            value: val[this.$valueKey] || val
        }
    }

    #reverseMap(val){
        return {
            [this.$labelKey]: val.label,
            [this.$valueKey]: val.value
        }
    }

    async #query(v){
        // Construct URL
        var url = this.$query;
        const delim = new URL(url,'http://example.com').searchParams.keys().next().done === false ? '&' : '?';
        if (v && url.includes(':q')){
            url = url.replace(':q',encodeURIComponent(v));
        }
        const queryURL = `${url}${delim}path=${encodeURIComponent(this.$path)}`;
        var results = [];
        try{
            const res = await fetch(queryURL);
            results = await res.json();
        } catch (e) {
            console.warn('Query Error',url,e);
        }
        // console.log('results',results);
        this.#menu.options = results.map(o=>{ return this.#mapValue(o)});
        if (this.__log){ console.log('Query Results:',results) }
        return results;
    }


    #checkState(){
        if (JSON.stringify(this.#getValue()) === JSON.stringify(this.#value)){
            this.dataset.state = 0;
        } else {
            this.dataset.state = 1;
        }
        this.dispatchEvent(new Event('change',{bubbles: true}));
    }

    // Value Helpers
    #getValue(){
        const $multi = this.type === 'array' ? true : false;
        // Multi Object Value
        if ($multi && this.$valueKey){ 
            // console.log('Multi Object Value');
            return Array.from(this.shadow.querySelectorAll('#multiselect option')).map(o=>{ return this.#reverseMap(o) })
        }
        // Multi Primitive Value
        if ($multi && !this.$valueKey){
            // console.log('Multi Primitive Value');
            return Array.from(this.shadow.querySelectorAll('#multiselect option')).map(o=>{ return o.value });
        }
        // Single Object Value
        if (!$multi && this.$valueKey){
            // console.log('Single Object Value');
            const objVal = {label: this.#menu.value.label, value: this.#menu.value.value};
            return  this.#reverseMap(objVal);
        }
        // Single Primitive Value
        if (!$multi && !this.$valueKey){
            // console.log('Single Primitive Value');
            return this.#menu.value.value;
        }
        console.warn('Select value error:', $multi, this.$valueKey);
    }


    // Static
    static Tag = 'i-select';

    static Html = (
        `<div class="srch">
            <input type="text" placeholder="Search" id="search"/>
            <span class="material-symbols-outlined" id="expand">expand_more</span>
        </div>
        <div id="multiselect"></div>`
    );

    static Css = (
        `:host{
            overflow: hidden;
            color: inherit;
            font-size: inherit;
            display: block;
        }
        .srch{
            display: flex;
            flex-direction: row;
            align-items: center;
            border: 1px solid var(--b3);
        }
        input{
            flex: 1 1 100%;
            padding: .5em;
            color: inherit;
            font-size: inherit;
            font-family: inherit;
            text-transform: inherit;
            font-weight: inherit;
            min-width: 0;
        }
        .srch span{
            flex: 0 0 1.5em;
            font-size: 1.25em;
            opacity: .7;
            cursor: pointer;
        }
        .srch span:hover{
            opacity: 1;
        }
        #multiselect{
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: .75em 0;
            flex-wrap: wrap;
            row-gap: .35em;
        }
        #multiselect:empty{
            display: none;
        }
        #multiselect option{
            background: var(--b4);
            border-radius: 16px;
            padding: .25em .75em;
            color: var(--b1a);
            cursor: pointer;
            margin-right: .75em;
        }
        #multiselect option:after{
            content: 'x';
            display: inline-block;
            margin-left: 1em;
            font-weight: 700;
        }
        #multiselect option:hover{
            background: var(--b3);
        }
        :host(.disabled) input{
            background: var(--b4);
        }
        :host(.disabled) span{
            opacity: 0;
        }`
    );
}




ELMNT.define(iSelect);

