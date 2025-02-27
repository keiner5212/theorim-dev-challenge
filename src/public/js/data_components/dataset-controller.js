
class DatasetController extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    ds;
    pages = {};

    // --- Private Properties --- //
    #rendered = false;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['nav','change',this._onTabChange]
        ];
    }

    connectedCallback(){
        // Add User Events --- //
        this.id = this.ds;
    }

    // --- Setters & Getters --- //
    set title(v){
        this.$el('nav').title = v;
    }
    set icon(v){
        this.$el('nav').icon = v;
    }
    get activeTable(){
        return this.$qs(`dv-controller.active`);
    }

    // --- Public Methods --- //
    show(){
        if (!this.#rendered){ this.#render(); }
        // this.$el('defs-table').load();
        this.classList.add('active');
    }

    hide(){
        this.classList.remove('active');
    }

    // --- User Events --- //
    _onTabChange(ev){
        const newDS = ev.target.value;
        this.$qs(`dv-controller.active`).hide();
        this.$qs(`dv-controller[id="${newDS}"]`).show();
        localStorage.setItem(`${this.ds}-last-table`,newDS);
    }

    // --- Private Helpers --- //
    async #render(){
        const ds = await Global.get('def',{ dataset: this.ds });
        if (!ds.jtables || ds.jtables.length === 0){ 
            console.warn('No JTables Found',ds);
            this.shadow.innerHTML = DatasetController.noJtables;
            this.classList.add('loaded');
            return;
        }
        console.debug('Render Def',ds);
        this.$el('nav').buttons = ds.jtables.map((def)=>{ return { id: def.name, title: def.title, order: def.order } })
        const localStorageLastPage = localStorage.getItem(`${this.ds}-last-table`);
        const lastPage = ds.jtables.find(jt=>jt.name === localStorageLastPage) ? localStorageLastPage : ds.jtables[0].name;
        const $frag = document.createDocumentFragment();
        ds.jtables.forEach(jt=>{
            const $dataPage = document.createElement('dv-controller');
            $dataPage.dsKey = this.ds;
            $dataPage.jtKey = $dataPage.id = jt.name;
            $dataPage.def = jt;
            if (jt.name === lastPage){ 
                $dataPage.show(); 
                this.$qs('tab-bar').value = jt.name;
            }
            $frag.appendChild($dataPage);
            this.pages[jt.name] = $dataPage;
        });
        if (this._onRender){ this._onRender(); }    
        this.shadow.appendChild($frag);
        this.classList.add('loaded');
        this.#rendered = true;
    }

    // --- Private SubHelpers --- //
    #get_value(){}

    // --- Static Methods --- //
    static get noJtables(){
        return (
            `<h1>No Accessible JTables Found in Dataset</h1>
            <h2>New tables take up to 5 minutes to show up.<br/>
            If you were recently added to a restricted table, log out and log in to 
            refresh permissions</h2>`
        )
    }

    // --- Static Defs   --- //
    static Tag = 'dataset-controller';
    static Html = (
        `<tab-bar id="nav" icon="admin_panel_settings" title="Admin"></tab-bar>`
    );

    static Css = (
        `:host{
            flex: 1 1 100%;
            flex-direction: row;
            overflow:hidden;
            height: 100vh;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            transition: opacity 0.1s;
        }
        :host(:not(.loaded)){
            opacity: 0;
        }
        elmnts-table{
            flex: 1 1 100%;
        }
        elmnts-form{
            flex: 0 0 40%;
        }
        h1{
            margin-top: 10vh;
            font-weight: 500;
            text-align: center;
            font-size: 1.75em;
        }
        h2{
            font-weight: 400;
            text-align: center;
            font-size: 1.25em;
        }`
    );

}


ELMNT.define(DatasetController);

