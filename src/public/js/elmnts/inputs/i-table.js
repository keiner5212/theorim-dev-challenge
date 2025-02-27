class iTable extends ELMNT_Input
{
    constructor(){
        super();
    }


    // Public Globals
    get state(){ return parseInt(this.dataset.state); }

    // Private Globals
    #value;
    #row = {};
    #props = {};
    #path;
    
    // Connected Callback
    connectedCallback(){
        this.dataset.state = 0;
        this.classList.add('elmnts-input');
        
        //Events
        this.shadow.getElementById('add').addEventListener('click',this.#addRow.bind(this));
        this.shadow.querySelector('.tbody').addEventListener('change',this.#onChange.bind(this));
        this.shadow.querySelector('.tbody').addEventListener('click',this.#onRowClick.bind(this));
    }

    // Public Methods

    // Setters
    set value(v){ 
        this.dataset.state = 0;
        this.#value = v === undefined ? null : v; 
        if (this.#value === null){
            this.shadow.querySelector('.tbody').innerHTML = `<div class="row" id="def"><span>No Items</span></div>`;
            return
        }
        this.shadow.querySelector('.tbody').innerHTML = '';
        if (this.#value === null){ return }
        for (const row of this.#value){
            this.#addRow(row);
        }
    }

    get value(){
        return this.#getValue();
    }

    set items(v){
        this.#props = v.properties;
        this.shadow.querySelector('.thead').innerHTML = Object.keys(v.properties).map(k=>`<span data-col="${k}">${k.replaceAll('_',' ')}</span>`).join('');
        this.#row = document.createElement('div');
        this.#row.classList.add('row');
        this.#row.innerHTML = Object.keys(v.properties).map(k=>`<span data-col="${k}"><i-${v.properties[k].$is || v.properties[k].type}></i-${v.properties[k].$is || v.properties[k].type}></span>`).join('');
        this.#row.innerHTML += `<i class="material-symbols-outlined">disabled_by_default</i>`
    }


    set __path(v){
        this.#path = v;
        this.shadow.querySelectorAll('i-select').forEach($i=>{ $i.__path = v });
    }

    set $path(v){ }
    get $path(){ return this.#path }



    // Events
    #onChange(){
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event("change", {bubbles: true}));
    }

    #onRowClick(ev){
        if(!ev.target.closest('i.material-symbols-outlined')){ return }
        const $row = ev.target.closest('.row');
        $row.remove();
        this.dataset.state = this.#checkState();
        this.dispatchEvent(new Event('change', {bubbles: true}));
    }

    // Private Helpers
    #addRow(data){
        const $row = this.#row.cloneNode(true);
        $row.querySelectorAll('span').forEach($s=>{
            const colName = $s.dataset.col;
            $s.firstElementChild.placeholder = colName.replaceAll('_',' ');

            $s.firstElementChild.__path = this.#path
            $s.firstElementChild.name = colName;
            delete this.#props[colName].label;
            Object.entries(this.#props[colName]).forEach(([k,v])=>{
                $s.firstElementChild[k] = v;
            });
            if (data && data[$s.dataset.col]){
                $s.firstElementChild.value = data[$s.dataset.col]
            }
            if (this.classList.contains('disabled')){
                $s.firstElementChild.readOnly = true;
            }
        });
        this.shadow.getElementById('def')?.remove();
        this.shadow.querySelector('.tbody').appendChild($row);
    }


    #checkState(){
        const invalid = this.shadow.querySelector('.elmnts-input[data-state="-1"]');
        if (invalid){ return -1; }
        const valid = this.shadow.querySelector('.elmnts-input[data-state="1"]');
        if (valid){ return 1; }
        return JSON.stringify(this.#getValue()) === JSON.stringify(this.#value) ? 0 : 1;
    }

    #getValue(){
        const v = [];
        this.shadow.querySelectorAll('.tbody div:not(#def)').forEach($row=>{
            const o = {};
            var nonNull = false;
            $row.querySelectorAll('span').forEach($i=>{
                o[$i.dataset.col] = $i.firstElementChild.value;
                if ($i.firstElementChild?.value){
                    nonNull = true;
                }
            })
            if (nonNull){ v.push(o) }
        })
        return v;
    }

    
    // Static Methods
    
    static Tag = 'i-table';

    static Html = (
        `<div class="controls">
            <button id="add">ADD</button>
        </div>
        <div class="table">
            <div class="thead"></div>
            <div class="tbody">
                <div class="row" id="def"><span>No Items</span></div>
            </div>
        </div>`
    );

    static Css = (
        `:host{
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .controls{
            margin-top: -1em;
            display: flex;
            justify-content: flex-end;
            width: 99%;
        }
        .controls button{
            font-weight: 700;
            color: var(--b2);
            cursor: pointer;
        }
        .controls button:hover{
            color: var(--b1);
        }
        :host(.disabled) .controls button,
        :host(.disabled) .table i{
            visibility: hidden;
        }
        .table{
            border: 1px solid rgba(0, 0, 0, 0.12);
            width: 99%;
            border-radius: 3px;
            font-size: .85em;
        }
        .thead{
            font-weight: 600;
            text-transform: uppercase;
            padding-right: 3.5em;
            box-sizing: border-box;
        }
        .thead,.row{
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .tbody{
            max-height: 20em;
            overflow-x: scroll;
        }
        .table span{
            display: inline-block;
            height: 100%;
            flex: 1 1 100%;
            overflow: hidden;
            cursor: pointer;
            padding: .5em;
            min-height:0;
            min-width: 0;
            box-sizing: border-box;
        }
        .table span >*{
            height: 100%;
            max-width: 98%;
            min-height:0;
            min-width: 0;
        }
        .table i{
            flex: 0 0 1.5em;
            font-size: 2em;
            text-align: center;
            color: var(--b2);
            cursor: pointer;
        }
        .table i:hover{
            color: var(--red);
        }
        input:disabled{
            background: var(--b4);
        }`
    )
}

ELMNT.define(iTable);