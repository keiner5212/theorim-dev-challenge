

class iRel extends ELMNT_Input
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //

    // --- Private Properties --- //
    #value;
    #lookup;
    #hrefBase;
    #qry;
    #auto;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['edit','click', this._onEdit],
            ['copy','click', this._onCopy],
            ['itemsrch','input', this._onSearch],
            ['results','change', this._onChange]
        ];
    }


    // --- Setters & Getters --- //
    set readOnly(v){
        const $edit = this.$el('edit');
        if ($edit){
            $edit.style.display = v ? 'none' : 'block';
        }
    }

    set lookup(v){
        this.#lookup = v;
        this.$el('table').innerText = `${v.dataset.label} / ${v.jtable.label}`;
        if (v.autolookup){
            this.$el('edit').remove();
        }
    }

    set value(v){
        this.dataset.state = 0;
        this.#value = v;

        this.$el('name').innerText = '-';
        this.$el('results').innerHTML = '<option value="" disabled selected>No Results</option>';
        this.$el('results').value = '';
        this.$el('bottom').classList.remove('show');
        this.$el('linktag').href = '';
        this.$el('itemsrch').value = '';

        this.$el('name').innerText = v.label;
        this.$qs('a').href = Global.ItemPath({
            dataset: this.#lookup.dataset.name,
            jtable: this.#lookup.jtable.name,
            sk: v.sk,
            uid: v.uid
        });
    }

    get value(){
        const [uid,sk] = this.$el('results').value.split('/');
        return { 
            sk: sk,
            uid: uid,
            label: this.$el('results').options[this.$el('results').selectedIndex].innerText
        }
    }

    // --- Public Methods --- //


    // --- User Events --- //
    _onEdit(){
        this.$el('bottom').classList.toggle('show');
    }

    async _onSearch(){
        const srchVal = this.$el('itemsrch').value;
        if (srchVal.length !== 3){ return }
        const options = await this.#query(srchVal);
        if (!options || options.length === 0){
            this.$el('results').innerHTML = '<option disable selected>No Results</option>';
        } else {
            this.$el('results').innerHTML = options.map(o => `<option value="${o.__uid}/${o.sk}">${o[this.#lookup.property.name]}</option>`).join('');
        }
        this._onChange();
    }

    _onChange(){
        if (this.$el('results').value !== this.#value?.sk){
            this.dataset.state = 1;
        } else {
            this.dataset.state = 0;
        }
        this.dispatchEvent(new Event("change", {bubbles: true}));
    }

    _onCopy(){
        navigator.clipboard.writeText(this.$el('linktag').href);
    }

    // --- Private Helpers --- //

    async #query(srchVal){
        const query = {
            _cols: `${this.#lookup.property.name}+pk+sk+__uid`
        }
        query[this.#lookup.property.name] = 'begins_with!' + encodeURIComponent(srchVal)
        try{
            const res = await Global.get(
                'data',
                {dataset: this.#lookup.dataset.name,jtable: this.#lookup.jtable.name},
                query
            )
            const options = res.Items;
            return options;
        } catch(e){
            console.warn('Error fetching i-rel results:', e);
        }
    }

    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'i-rel';
    

    static Html = (
    `<div class="top">
        <a class="link" target="_blank" id="linktag">
            <span class="sec a" id="table">Table</span>
            <span id="name" class="sec c">-</span>
        </a>
        <span class="btn material-symbols-outlined" id="copy">content_copy</span>
        <span class="btn material-symbols-outlined" id="edit">edit</span>
    </div>
    <div class="bottom" id="bottom">
        <div class="srchbox">
            <span class="btn material-symbols-outlined">search</span>
            <input id="itemsrch" maxlength="3" placeholder="Search"/>
            <select id="results">
                <option value="" disabled selected>No Results</option>
            </select>
        </div>
    </div>`
);

    static Css = (
        `:host{
            display: block;
        }
        .top{
            display: flex;
            align-items: center;
        }
        .link{
            display: inline-flex;
            align-items: center;
            font-family: var(--ttl);
            margin: 0.4em;
            width: fit-content;
            oveflow: hidden;
            box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            flex: 0 0 auto;
        }
        .sec{
            display: inline-block;
            flex: 0 0 auto;
            color: #ffffff;
            display: table-cell;
            font-size: 0.9em;
            font-weight: 400;
            line-height: 1;
            padding-top: .3em;
            padding-bottom: .3em;
            text-align: center;
            vertical-align: baseline;
            white-space: nowrap;
        }
        a{ 
            text-decoration: none;
        }
        .a {
            border-top-left-radius: 0.25em;
            border-bottom-left-radius: 0.25em;
            background-color: #337ab7;
            padding-left: .6em;
            padding-right: 1em;
        }
        .b{
            border-right: 2px solid rgba(200 200 200);
            background-color: #337ab7;
            padding-left: 3px;
            padding-right: .6em;
        }
        .c {
            border-top-right-radius: 0.25em;
            border-bottom-right-radius: 0.25em;
            padding-left: .6em;
            padding-right: 1em;
            background-color: #656565;
        }
        .btn{
            margin-right: .5em;
            cursor: pointer;
            color: rgb(220 220 220);
        }
        btn:hover{
            color: rgb(180 180 180);
        }
        .bottom:not(.show){
            display: none;
        }
        .srchbox{
            display: flex;
            align-items: center;
            border: 1px solid rgb(220 220 220);
            width: 95%;
            margin: .5em;
            height: 2.5em;
        }
        #itemsrch{
            border: none;
            flex: 0 0 40%;
            height: inherit;
        }
        #results{
            flex: 0 1 60%;
            background: rgb(220 220 220);
            height: inherit;
        }`
    );

}


ELMNT.define(iRel);

