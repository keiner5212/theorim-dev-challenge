
class DataviewController extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
        this.#table = this.$el('table');
        this.#form = this.$el('form');
        this.#archTable = this.$el('arch-table');
    }

    //  --- Public Properties --- //
    dsKey;
    jtKey;
    get pk(){ return `${this.dsKey}/${this.jtKey}`; }

    // --- Private Properties --- //
    #loaded = false;
    #table;
    #form;
    #archTable;
    #archLoaded = false;
    #def;
    #schemas;
    #has_custom_sk = false;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['form','save',this._onFormSave ],
            ['form','data-change',this._onDataChange ],
            ['table','reload',this.reload ],
            ['table','import',this._onImport ],
            ['table','show-archive',this._onShowArchive ],
            ['table','select',this._onRowSelect ],
            ['table','add',this._onAdd ],
            ['table','delete',this._onDelete ],
            ['table','sk-change',this._onSkChange ],
            ['table','duplicate',this._onDuplicate ],
            ['table','duplicate-with-children',this._onDuplicateWithChildern ],
            ['table','paste-copy',this._onPasteCopy ],
            ['table','paste-copy-with-children',this._onPasteCopyChildren ],
            ['table','paste-cut',this._onPasteCut ],
            ['table','paste-as',this._onPasteAs ],
            ['table','create-linked-item',this._onCreateLinkedItem ],
            ['arch-table','close-archive',this._onCloseArchive ],
            ['arch-table','select',this._onRowSelect ],
            ['arch-table','restore',this._onRestore ],
        ];
    }

    connectedCallback(){
        // Add User Events --- //
    }

    // --- Setters & Getters --- //
    set def(v){
        this.#def = v;
        this.#schemas = v.schemas;
        // Table Def
        this.#table.id = `${this.pk}-table`;
        this.#table.name = `${this.dsKey}-${this.jtKey}`
        this.#table.index = v.index || null;
        
        this.#has_custom_sk = v.custom_sk === undefined || v.custom_sk === null ? false : true;
        for (const view of v.$tableViews){
            for (const col of view.cols){
                for (const sch of this.#schemas){
                    if (sch.properties[col.name]){
                        col.type = sch.properties[col.name].type;
                        col.$is = sch.properties[col.name].type;
                        col.title = sch.properties[col.name].title || sch.properties[col.name].label;
                        break
                    }
                }
            }
        }
        this.#table.views = v.$tableViews;
        const tableObjects = v.schemas.map(s=>{ return { 
            $id: s.$id,
            name: s.$id, 
            icon: s.$icon, 
            top: s.top, 
            title: s.title || s.name,
            parents: s.$parents,
            create: s.$allow.create, 
            delete: s.$allow.delete,
            $titleField: s.$titleField
        }});
        this.#table.objects = tableObjects;
        // Archive Table Def
        this.#archTable.id = `${this.pk}$archive-table`;
        this.#archTable.views = [{ 
            name: 'Archive', 
            cols: v.$tableViews[0].cols, 
        }];
        this.#archTable.objects = JSON.parse(JSON.stringify(tableObjects));
        // Form Def
        this.#form.pk = this.pk;
        this.#form.schemas = this.#schemas;
        this.classList.add('rendered');
    }

    get table(){ return this.#table; }


    // --- Public Methods --- //
    show(){
        if (!this.#loaded){ this.#load(); }
        // this.$el('defs-table').load();
        this.classList.add('active');
    }

    hide(){
        this.classList.remove('active');
    }

    reload(){
        this.#table.reset();
        this.#load();
    }

    // --- User Events --- //
    _onRowSelect(ev){
        this.#form.data = ev.detail;
    }

    _onAdd(ev){
        const schName = ev.detail.newObj;
        const schema = this.#schemas.find(s=>{ return s.$id === schName });

        const $newForm = document.createElement('elmnts-form');
        $newForm.new = true;
        $newForm.pk = this.pk;
        $newForm.schemas = [schema];
        // Set Parent
        let sk = schema.$id;
        if (ev.detail.parent){
            console.debug('Parent:',ev.detail.parent);
            sk = `${ev.detail.parent}-${schema.$id}`;
        }
        console.debug('New Form:',{sk: sk, pk: this.pk, __object: schema.$id});
        $newForm.data = {sk: sk, pk: this.pk, __object: schema.$id};
        $newForm.title = `NEW ${schema.$id.toUpperCase()}`;
        $newForm.style = [
            `position: absolute;`, 
            'z-index:99;',
            'min-width: 55em;',
            'width: 50vw;',
            'max-width: 90%;',
            'height: 60vh;',
            'margin: 0 auto;',
            'top: 8vh;',
            'border: 1px solid var(--blue);',
            'left: 50%;',
            'transform: translateX(-50%);',
            'box-shadow: 0px 3px 5px 3px rgba(0,0,0,0.5);'
        ].join(' ');
        
        $newForm.focus();

        // Events
        $newForm.addEventListener('close', ()=>{ $newForm.remove(); })
        $newForm.addEventListener('save', ()=>{ this.#saveNewItem($newForm) });
        document.body.appendChild($newForm);
    }

    async _onDelete(ev){
        console.debug('Delete Record', ev.detail);
        if (!ev.detail.pk || !ev.detail.sk){ return console.error('Primary Key or Sort Key not found') };
        if (window.confirm('Delete Record?\nHold down control to avoid this message!')){
            try{
                await Global.post('data',{action:'delete'},{pk: this.pk, sk: ev.detail.sk});
                this.#table.remove([ev.detail.__id]);
            } catch (e){
                console.warn('Could not delete item:',e);
                window.alert('Delete Failed:\n' + e.error);
                return
            }
        }
    }

    _onRestore(ev){
        console.debug('Restore Record', ev.detail);
        if (!ev.detail.pk || !ev.detail.sk){ return console.error('Primary Key or Sort Key not found') };
        Global.post('data',{action:'restore'},{pk: ev.detail.pk, sk: ev.detail.sk});
        this.#archTable.remove([ev.detail.__id]);
    }

    _onShowArchive(ev){
        console.debug('Show Archive', ev.detail);
        if (!this.#archLoaded){
            this.#load_archive();
            this.#archLoaded = true;
        }
        this.#archTable.classList.remove('hidden');
        this.#table.classList.add('hidden');
    }

    _onCloseArchive(ev){
        console.debug('Close Archive', ev.detail);
        this.#archTable.classList.add('hidden');
        this.#table.classList.remove('hidden');
    }

    _onFormSave(ev){
        const $form = ev.target;
        console.debug('Save Item:',$form.changes);
        this.#updateItem($form);
        this.#form.classList.remove('saving');
    }

    _onDataChange(ev){
        console.debug('Item Updated:',ev.detail);
        this.#table.load([ev.detail]);
        this.#table.select(ev.detail.__id);
    }

    _onSkChange(ev){
        console.debug('SK Change',ev.detail);
        this.#table.reset();
        this.#load(ev.detail);
    }

    _onImport(ev){
        const $importWindow = document.createElement('data-import-window');
        $importWindow.schemas = this.#schemas;
        $importWindow.pk = this.pk;
        document.body.appendChild($importWindow);
    }

    // --- Table Menu Events --- //
    async _onDuplicate(ev){
        const inputItem = JSON.parse(JSON.stringify(ev.detail));
        inputItem.sk = ev.detail.__object;
        console.debug('Duplicate',inputItem);
        try{
            const newItem = await Global.post('data',{action:'new'},inputItem);
            const returnItem = Object.assign(inputItem,newItem);
            this.#table.insert(returnItem);
        } catch (e){
            console.warn('Could not duplicate item:',e);
            window.alert('Save Failed:\n' + e.toString());
            return
        }
    }

    async _onDuplicateWithChildern(ev){
        console.debug('Duplicate with Childern',ev.detail);
        // const inputItem = JSON.parse(JSON.stringify(ev.detail));
        // inputItem.sk = ev.detail.__object;
        const params = {
            pk: ev.detail.pk,
            sk: ev.detail.sk,
            newSk: ev.detail.__object,
        };
        console.debug('Duplicate',params);
        let newItems = [];
        try{
            newItems = await Global.post('data',{action:'copy'},params);
            console.debug('New Items:',newItems);
        } catch (e){
            console.warn('Could not duplicate item:',e);
            window.alert('Save Failed:\n' + e.toString());
            return
        }
        for (const item of newItems){
            this.#table.insert(item);
        }
    }

    async _onPasteCopy(ev){
        const newItem = JSON.parse(JSON.stringify(ev.detail.source));
        newItem.sk = ev.detail.target.sk + '-' + newItem.__object;
        console.debug('Paste Copy',newItem);
        try{
            const newRow = await Global.post('data',{action:'new'},newItem);
            this.#table.insert(newRow);
        } catch (e){
            console.warn('Could not paste item:',e);
            window.alert('Paste Failed:\n' + e.toString());
            return
        }
    }

    async _onPasteCut(ev){
        const newItem = JSON.parse(JSON.stringify(ev.detail.source));
        const params = {
            pk: newItem.pk,
            sk: newItem.sk,
            newSk: ev.detail.target.sk
        }
        console.debug('Paste Cut',params, 'Delete:',ev.detail.source);
        try{
            const newItems = await Global.post('data',{action:'copy'},params);
            for (const item of newItems){
                this.#table.insert(item);
            }
            Global.post('data',{action:'delete'},ev.detail.source);
            this.#table.remove([ev.detail.source.__id]);
        } catch (e){
            console.warn('Could not paste item:',e);
            window.alert('Paste Failed:\n' + e.toString());
            return
        }
    }

    async _onPasteCopyChildren(ev){
        const newItem = JSON.parse(JSON.stringify(ev.detail.source));
        const params = {
            pk: newItem.pk,
            sk: newItem.sk,
            newSk: ev.detail.target.sk
        }
        console.debug('Paste Copy with Children',params);
        try{
            const newItems = await Global.post('data',{action:'copy'},params);
            for (const item of newItems){
                this.#table.insert(item);
            }
        } catch (e){
            console.warn('Could not paste item:',e);
            window.alert('Paste Failed:\n' + e.toString());
            return
        }
    }

    _onPasteAs(ev){
        console.debug('Cross Table Paste',ev.detail);
        const $importWindow = document.createElement('paste-as-window');
        $importWindow.source = ev.detail.source;
        $importWindow.target = ev.detail.target;
        document.body.appendChild($importWindow);
        // $importWindow.addEventListener('complete', ()=>{});
    }

    _onCreateLinkedItem(ev){
        console.debug('Create Linked Item',ev.detail);
        const $window = document.createElement('create-link-window');
        $window.source = ev.detail;
        document.body.appendChild($window);
    }

    // --- Private Helpers --- //
    async #load(sk){
        console.debug('Load Dataview', { dataset: this.dsKey, jt: this.jtKey });
        let lastKey;
        let route =  { dataset: this.dsKey, jtable: this.jtKey }
        if (sk){
            route.sk = sk;
        }
        for (let i=0; i<41; i++){
            if (lastKey){
                params._last = lastKey;
            }
            const res = await Global.get('data',route);
            if (res.Items && res.Items.length > 0){
                this.#table.load(res.Items);
            }
            
            if (!res.lastKey){ 
                console.debug('Total Queries',i);
                break
            } else {
                lastKey = res.lastKey;
            }
        }
        this.#table.render();
        this.#table.select();
        this.#loaded = true;
    }

    async #load_archive(){
        const archiveKey = `${this.jtKey}$archive`;
        console.debug('Load Archive', { dataset: this.dsKey, jt: this.jtKey });
        let lastKey;
        let params = {};
        for (let i=0; i<10; i++){
            if (lastKey){
                params._last = lastKey;
            }
            const res = await Global.get('data',{ dataset: this.dsKey, jtable: archiveKey }, params);
            console.debug('Archive Response',res);
            if (res.Items && res.Items.length > 0){
                this.#archTable.load(res.Items,res.lastKey && i < 41 && i > 0);
            }
            
            if (!res.lastKey){ 
                console.debug('Total Queries',i);
                break
            } else {
                lastKey = res.lastKey;
            }
        }
        this.#archTable.render();
        this.#archTable.select();
    }

    async #saveNewItem($newForm){
        console.debug('New Item:',$newForm.changes);
        var newItem;
        try{
            newItem = await Global.post('data',{action:'new'},$newForm.changes);
        } catch (e){
            console.warn('Table Error:',e);
            window.alert('Save Failed:\n' + e.toString());
            $newForm.classList.remove('saving');
            return
        }
        $newForm.remove();
        let newData = Array.isArray(newItem) ? newItem : [newItem];
        console.debug('New Data Res:',newData);
        this.#table.load(newData);
        this.#table.select(newData[0].__id);
    }

    async #updateItem($form){
        var newItem;
        try{
            newItem = await Global.post('data',{action:'update'},$form.changes);
            console.debug('Update Response:',newItem);
            Object.keys($form.data).forEach(k=>{
                if (k.startsWith('__')){
                    newItem[k] = $form.data[k]
                }
            })
            const update = Array.isArray(newItem) ? newItem : [newItem];
            console.debug('Update:',update);
            this.#table.load(update);
            this.#table.select(update[0].__id);
        } catch (e){
            console.warn('Table Error:',e);
            window.alert('Save Failed:\n' + e.toString());
            return
        }
    }


    // --- Private SubHelpers --- //
    #get_value(){}

    // --- Static Methods --- //
    static helper(){}

    // --- Static Defs   --- //
    static Tag = 'dv-controller';

    
    static Html = `<el-table id="table"></el-table><el-table id="arch-table" class="archive hidden"></el-table><elmnts-form id="form"></elmnts-form>`;

    static Css = (
        `:host{
            flex: 1 1 100%;
            flex-direction: row;
            overflow:hidden;
            display: flex;
            flex-direction: row;
            transition: opacity 0.5s;
        }
        :host(:not(.active)){
            display: none;
        }
        :host(:not(.rendered)){
            opacity: 0;
        }
        elmnts-table{
            flex: 1 1 100%;
        }
        elmnts-form{
            flex: 0 0 40%;
        }
        .hidden{
            display: none;
        }`
    );

}


ELMNT.define(DataviewController);

