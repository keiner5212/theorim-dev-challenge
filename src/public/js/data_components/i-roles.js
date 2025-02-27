class iDsRoles extends ELMNT_Input
{
    constructor(){
        super();
    }
    static Roles = {};

    #loaded = false;
    ds;

    static async LoadDsRoles(ds){
        if (!iDsRoles.Roles[ds]){
            iDsRoles.Roles[ds] = Global.get('roles',{dataset: ds});
        }
    }

    set __path(v){
        this.ds = v.pk.split('/')[0].split('$')[0];
        if (!this.#loaded){
            this.#load();
        }
    }

    async #load(){
        console.debug('Load Roles', this.ds);
        iDsRoles.LoadDsRoles(this.ds);
        await iDsRoles.Roles[this.ds];
        this.#loaded = true;
        this.render();
    }

}

class iRole extends iDsRoles
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //

    // --- Private Properties --- //
    #value;
    #loaded = false;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['roles','change', this._onChange],
        ];
    }


    // --- Setters & Getters --- //
    set value(v){
        v = v || '';
        this.#value = v;
        this.dataset.state = 0;
        iDsRoles.Roles[this.ds].then(r=>{
            const val = r.find(role=>{ return role.name=== v || role.label === v });
            this.$el('roles').value = val ? val.name : '';
        })
    }

    get value(){
        return this.$el('roles').value;
    }


    // --- Public Methods --- //
    async render(){
        const roles = await iDsRoles.Roles[this.ds];
        this.$el('roles').innerHTML = roles.map(r => `<option value="${r.name}">${r.label}</option>`).join('');
    }

    // --- User Events --- //
    _onChange(){
        this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles:true}));
    }

  
    #checkState(){
        if (this.#value !== this.$el('roles').value){
            this.dataset.state = 1;
        } else {
            this.dataset.state = 0;
        }
    }

    // --- Helpers --- //
    


    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'i-role';
    

    static Html = (
        `<select id="roles">
            <option disabled selected value="">Select Role</option>
        </select>`
    );

    static Css = (
        `:host{
            display: block;
            font-size: .95em;
        }
        input,select{
            border: 1px solid #ccc;
            padding: .25em .5em;
            font-size: inherit;
            flex: 1 1 100%;
            min-width: 15em;
            max-width: 25em;
        }`
    );

}


ELMNT.define(iRole);


class iRoles extends iDsRoles
{
    constructor(){
        super();
        this.#input = this.shadow.querySelector('select');
    }

    static DatasetRoles = {};

    // Private Globals
    #value = [];
    #inputValue = [];
    #input;

    
     // --- Lifecycle Hooks --- //
     get Events(){
        return [
            ['roles','change', this._onAddItem],
            ['items','click', this._onOptionClick],
        ];
    }


    // Public Methods

    // Setters
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v ? v : []; 
        this.#input.value = '';
        this.#inputValue = [];
        this.shadow.querySelector('.items').innerHTML = '';
        if (!v){ return }
        v.forEach(i=>{ this.#addNewItem(i); });
    }

    get value(){
        return this.#inputValue;
    }




    // Events

    _onAddItem(ev){
        const val = this.#input.value;
        if (!val){ return; }
        this.#addNewItem(val,true);
    }

    _onOptionClick(ev){
        const $span = ev.target.closest('span');
        if (!$span){ return; }
        const value = $span.dataset.value;
        const label = $span.innerHTML;
        $span.remove();
        
        this.#inputValue = this.#inputValue.filter(v=>{ return v !== value });
        this.#input.appendChild(new Option(label,value));
        this.#input.value = '';
        
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event("change", {bubbles: true}));
    }

    // Helpers
    async render(){
        const roles = await iDsRoles.Roles[this.ds];
        this.$el('roles').innerHTML = `<option disabled selected value="">Select Role</option>`
        this.$el('roles').innerHTML += roles.map(r => `<option value="${r.name}">${r.label}</option>`).join('');
        this.$el('roles').classList.remove('unloaded');
    }

    async #addNewItem(val,userInput=false){
        const $option = this.$qs(`#items span[data-value="${val}"]`);
        if ($option){ this.#input.value = ''; return; }
        const roles = await iDsRoles.Roles[this.ds];
        const role = roles.find(r=>{ return r.name === val || r.label === val});
        if (!role){
            console.warn('Role not found',val);
            return;
        }
        const label = role.label;
        this.$qs('div.items').insertAdjacentHTML('beforeend',`<span data-value="${val}">${label}</span>`);
        this.#inputValue.push(val);
        if (userInput === true){
            this.#input.value = '';
            this.dataset.state = this.#checkState();
            this.dispatchEvent(new Event("change", {bubbles: true}));
        }
    }

    #checkState(){
        if (JSON.stringify(this.#value) === JSON.stringify(this.#inputValue)){
            return 0;
        }
        return 1;
    }

    // --- Static Methods --- //

    

    // --- Static Defs --- //
    static Tag = 'i-roles';
    
    static Html = (
    `<div id="iput" class="input" class="unloaded">
        <select id="roles">
            <option disabled selected value="">Select Role</option>
        </select>
    </div>
    <div id="items" class="items"></div>`);

    static Css = (
        `:host{
            display: block;
            width: 100%;
        }
        .input{
            border: 1px solid var(--b3);
            padding: .25em ;
            display: flex;
            flex-direction: row;
            align-items: center;
        }
        select{
            flex: 1 1 100%;
        }
        select:disabled,
        :host(.unloaded) .input{
            background: var(--b4);
        }
        .add-item{
            display: flex;
            flex-direction: row;
            align-items: center;
            cursor: pointer;
            padding: 0 .5em;
            line-height: 1.5em;
        }
        .items{
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: .75em 0;
            flex-wrap: wrap;
            row-gap: .5em;
        }
        .items span{
            background: var(--b4);
            border-radius: 16px;
            padding: .25em .75em;
            color: var(--b1a);
            cursor: pointer;
            margin-right: .75em;
        }
        .items span:after{
            content: 'x';
            display: inline-block;
            margin-left: 1em;
            font-weight: 700;
        }
        span:hover{
            background: var(--b3);
        }`
    );
}
ELMNT.define(iRoles);