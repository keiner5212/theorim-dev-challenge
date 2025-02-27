
class elTable extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
        // Context Menu
        this.#menu = document.createElement('context-menu');
        this.#menu.options = this.#menuOptions;
        this.#menu.addEventListener('select', this._onContextMenuSelect.bind(this));
    }

    //  --- Public Properties --- //
    idField = 'id';

    // --- Private Properties --- //
    #data = [];
    #objects = {};
    #topLevelObjects = [];
    #searchFilters = [];
    #columns = [];
    #views = [];
    #activeView;
    #visibleRows = [];
    #row = {};
    #unresolved = [];
    #rowTemplate;
    #menu;
    #cskInput;
    #menuOptions = ['Cut','Copy','Copy with Children','Duplicate','Duplicate with Children','Paste','Paste As','Create Linked Item'];

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['tab-bar','click',this._onChangeView, {selector: 'button.tab:not(.active)'}],
            ['tab-bar','click',this._onShowArchive, {selector: '#show-archive'}],
            ['tab-bar','click',this._onCloseArchive, {selector: '#close-archive'}],
            ['srch-input','input',this._onSearch],
            ['filter','click',this._onSaveFilter],
            ['filter-clear','click',this._onClearFilter],
            ['import','click',this._onImport],
            ['exp-json','click',this._onJsonExport],
            ['exp-csv','click',this._onCsvExport],
            ['reset','click',this._onReset],
            ['add','click',this._onAdd],
            ['delete','click',this._onDelete],
            ['restore','click',this._onRestore],
            ['theadrow','click',this._onSort, {selector: '.cell'}],
            ['tbody','contextmenu',this._onContextMenu],
            ['tbody','click',this._onRowExpand, {selector: 'i'}],
            ['tbody','click',this._onRowSelect, {selector: '.item'}],
            ['tbody','keydown',this._onNew]
        ];
    }

    // get Shortcuts(){
    //     return [
    //         ['tbody','+',this._onNew]
    //     ]
    // }


    // --- Setters & Getters --- //
    set views(v){
        this.#views = v;
        // Build View CSS
        for (const view of v){
            const viewTitle = view.name;
            view.name = view.name.replaceAll(' ','-');
            
            view.rows = [];
            view.filters = view.filters || [];
            // CSS to Hide Rows and Columns
            const rowColCss = view.cols.map((c,i)=>`#table.${view.name} .item:not(.${view.name}){display:none;} #table.${view.name} .cell.${c.name}{display:inline-block;}`);
            // CSS to Set Width
            const totalWidth = view.cols.reduce((acc,col)=>acc+col.width,0);
            view.cols.forEach(col=>{
                col.width = col.width || totalWidth/this.#columns.length;
                col.width = parseInt((col.width/totalWidth)*100);
                if (this.#columns.find(c=>c.name === col.name) === undefined){
                    this.#columns.push(col);
                }
            });
            const widthCss = view.cols.map((col,i)=>`#table.${view.name} .cell:nth-child(${i+2}){flex:1 1 ${col.width}%;}`);
            this.$el('style').textContent += rowColCss.join(' ') + widthCss.join(' ');
            this.$el('show-archive').insertAdjacentHTML('beforebegin',`<button class="tab" data-view="${view.name}">${viewTitle}</button>`);
            // Set Function Filters
            view.filters.forEach(f=>{
                f.operator = f.operator.replaceAll(' ', '_');
                if (typeof(f.value) === 'string' && f.value.startsWith('@')){
                    f.value.replace('@user', Global.user.name);
                    f.value.replace('@day', '');
                    f.value.replace('@month', '');
                    f.value.replace('@year', '');
                }
            });
        }
        // Build Template
        this.#rowTemplate = elTable.rowTemplate(this.#columns);
        // Set Header
        this.$el('theadrow').innerHTML = '<i></i>' + this.#columns.map(col=>`<span class="cell ${col.name}">${col.title || col.name}</span>`).join('');
        // Set Search Cols
        this.$el('cols').innerHTML = this.#columns.map(col=>`<option value="${col.name}">${col.title || col.name}</option>`).join('');
        // Set Default View
        this.#activeView = this.#views[0];
        this.$el('table').className = v[0].name;
        this.$qs('#tab-bar .tab').classList.add('active');
    }

    set objects(v){
        v.forEach(obj=>{
            this.#objects[obj.$id] = obj;
            if (obj.create === true){
                this.$el('add').addOption({label: obj.title || obj.name, value: obj.$id });
                if (obj.top === true){
                    this.#topLevelObjects.push(obj.$id);
                }
            }
            const kids = [];
            for (const otherObject of v){
                if (otherObject.create === false){ continue }
                if (otherObject.parents?.find(p=>{ return p.$id === obj.$id })){
                    kids.push(otherObject.$id);
                }
            }
            this.#objects[obj.$id].children = kids;
        });
        this.$el('add').disabled = this.#topLevelObjects.length === 0;
    }

    #stringIndex = false;
    set index(v){
        if (!v){ return }
        this.dataset.csk = true;
        // console.log('here is sk',v);
        // console.log(v.$is.value);
        if (v.$is === 'date' || v.$is === 'cdate'){
            this.#cskInput = document.createElement('i-date');
            this.#cskInput.$period = v.$period.value;
            this.#cskInput.styles = `div,input{border:none;padding:0}`;
            this.#cskInput.setToday();
            this.$el('custom_sk').appendChild(this.#cskInput);
        } else if (v.$is === 'select'){
            this.#cskInput = document.createElement('input');
            this.#cskInput.setAttribute('list','sortkeys');
            const $dl = document.createElement('datalist');
            $dl.id = 'sortkeys';
            let defVal;
            v.enum.forEach(sk=>{
                const $opt = new Option(sk);
                $dl.appendChild($opt);
                if (!defVal){ defVal = sk }
            });
            this.#cskInput.value = defVal;
            this.$el('custom_sk').appendChild(this.#cskInput);
            this.$el('custom_sk').appendChild($dl);
        } else if (v.$is === 'usergroup'){
            this.#cskInput = document.createElement('i-usergroup');
            this.#cskInput.$path = this.pk;
            this.#cskInput.styles = `.srch{border:none;padding:0}`;
            if (!this.#cskInput.$path){
                console.warn("PK undefined when setting custom_sk", this.id, this.pk);
            }
            this.#cskInput.setDefault();
            this.$el('custom_sk').appendChild(this.#cskInput);
        } else if (v.$is === 'string'){
            this.#cskInput = document.createElement('i-string');
            this.#cskInput.styles = `div,input{border:none;padding:0}`;
            this.$el('custom_sk').appendChild(this.#cskInput);
            this.#stringIndex = true;
        }
        this.#cskInput.placeholder = v.label;
        this.classList.add('csk');
        this.$el('custom_sk').addEventListener('change', this._onSkChange.bind(this));
    }

    get index(){
        if (!this.#cskInput){ return null }
        return this.#cskInput.value;
    }

    set contextMenuOptions(v){
        this.#menuOptions = v;
    }

    set controls(v){
        const $controls = this.$qsa('#search-bar control');
        for (const $c of $controls){
            $c.style.display = v.includes($c.id) ? "" : "none";
        }
    }

    set showArchive(v){
        if (v === false){
            this.classList.add('option-noarchive');
        }
    }



    // --- Public Methods --- //
    load(data,loadAll=false){
        console.debug('Load Table');
        // console.log('data',data);
        // Generate Top Level Rows
        const toSkip = [];
        for (const row of data){
            if (!this.#row[row.__id]){
                try{
                    const displayIn = this.#getRowViews(row);
                    this.#row[row.__id] = this.#getRow(row, displayIn);
                } catch(e){
                    console.warn('Error Generating Row',row);
                    toSkip.push(row.__id);
                }
            } else {
                this.#update(row);
                toSkip.push(row.__id);
            }
        }
        data = data.filter(r=>{ return !toSkip.includes(r.__id) });
        
        // Generate Child Rows
        const $frag = document.createDocumentFragment();
        for (const row of data){
            if (row.__parent){
                if (!this.#row[row.__parent]){
                    this.#unresolved.push(row);
                    continue;
                }
                this.#row[row.__parent].querySelector('.children').appendChild(this.#row[row.__id] );
            } else {
                $frag.appendChild(this.#row[row.__id] );
            }
        }
        this.$el('tbody').appendChild($frag);
        this.#data.push(...data);
    }

    render(){
        // Check for rows with unresolved parents
        for (let i=0;i<this.#unresolved.length;i++){
            const row = this.#unresolved[i];
            const $appendTo = this.#row[row.__parent] ? this.#row[row.__parent].querySelector('.children') : this.$el('tbody');
            $appendTo.appendChild(this.#row[row.__id] );
            this.#unresolved.splice(i,1);
            i--;
        }
        if (this.#unresolved.length > 0){
            console.warn('Unresolved Rows',this.#unresolved);
        }
        this.#renderView(); 
    }

    reset(){
        this.#data = [];
        this.#visibleRows = [];
        this.#row = {};
        this.$el('tbody').innerHTML = '';
    }

    remove(ids){
        for (const id of ids){
            this.#data = this.#data.filter(r=>{ return r.__id !== id });
            this.#visibleRows = this.#visibleRows.filter(r=>{ return r.__id !== id });
            this.#row[id].remove();
            delete this.#row[id];
        }
    }

    insert(data){
        console.debug('Insert Row', data);
        
        // Generate Top Level Rows
        const row = JSON.parse(JSON.stringify(data));
        const displayIn = this.#getRowViews(row);
        this.#row[row.__id] = this.#getRow(row, displayIn);
        this.#row[row.__id].style.order = 0;
        
        // Generate Child Rows
        let $parent = this.$el('tbody');
        if (row.__parent){
            if (!this.#row[row.__parent]){
                console.warn('Unresolved Parent',row);
            }
            $parent = this.#row[row.__parent].querySelector('.children')
        }
        $parent.appendChild(this.#row[row.__id]);
        this.#data.push(row);
        this.#select(this.#row[row.__id].lastElementChild);
    }

    select(id){
        const $row = id && this.#row[id] ? this.#row[id].lastElementChild : null;
        this.#select($row);
    }
    
    addControl(control){
        const $filter = this.$el('filter-clear');
        const sid = control.id + Date.now();
        const html = `<app-icon id="${sid}" icon="${control.icon}" class="btn control" tooltip="${control.tooltip || ''}"></app-icon>`
        $filter.insertAdjacentHTML('afterend',html);
        // Add Event
        const $control = this.$el(sid);
        $control.addEventListener('click',control.callback);
    }

    removeControl(id){
        this.$qs(`#search-bar #${id}`).style.display = 'none';
    }

    // --- User Events --- //
    _onRowExpand($el){
        const $row = $el.closest('.row');
        $row.classList.toggle('expanded');
        if ($row.classList.contains('expanded')){
            $row.querySelectorAll('.item.hide').forEach(e=>{
                e.classList.remove('hide');
            });
            $row.querySelector(':scope > .item i b').innerText = 'remove';
        } else {
            $row.querySelector(':scope > .item i b').innerText = 'add';
        }
    }

    _onRowSelect($row){
        const rowData = this.#select($row);
        console.debug('row select',rowData);
    }

    _onChangeView($tab){
        const newView = $tab.dataset.view;
        // Activate Tab
        const $active = this.$qs('#tab-bar .tab.active');
        $active?.classList.remove('active');
        $tab.classList.add('active');
        this.#renderView(newView);
        if ($active.id === 'show-archive'){
            this.dispatchEvent(new CustomEvent('hide-archive'));
        }
    }

    #debounce = null;
    _onSearch(ev){
        const srchVal = ev.target.value;
        if (this.#debounce){ clearTimeout(this.#debounce); }
        this.#debounce = setTimeout(()=>{
            this.#runSearch(srchVal);
        }, 250);
    }

    _onSaveFilter(){
        // Save Filter
        const filter = {
            id: Date.now(),
            col: this.$el('cols').value,
            operator: this.$el('operator').value,
            value: this.$el('srch-input').value
        }
        this.#searchFilters.push(filter);
        // Add Filter Button
        const $filter = document.createElement('button');
        $filter.classList.add('filter-button');
        $filter.innerHTML = `<span class="material-symbols-outlined">filter_alt</span><em>${filter.value || '@blank'}</em><em class="close">x</em>`;
        $filter.addEventListener('click',()=>{ 
            $filter.remove(); 
            this.#searchFilters = this.#searchFilters.filter(f=>{ return f.id !== filter.id });
            console.debug('filters',this.#searchFilters);
            this.#runFilters();
        });
        this.shadow.getElementById('filters').appendChild($filter);
        this.shadow.getElementById('srch-input').value = '';
        this.#runFilters();
    }

    _onClearFilter(){
        this.$qsa('#filters .filter-button').forEach(f=>f.remove());
        this.#searchFilters = [];
        this.#runFilters();
    }

    _onImport(){
        this.dispatchEvent(new CustomEvent('import'));
    }

    _onJsonExport(){
        const blob = new Blob([JSON.stringify(this.#data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    _onCsvExport(){ 
        const cols = this.#columns.map(o=>{ return o.name });
        const csvData = [];
        csvData.push(cols.join(','));
        for (const r of data){
            const row = cols.map(c=>{ return r[c] || '' });
            csvData.push(row.join(','));
        }
        const csvString = csvData.join('\n');
        const blob = new Blob([csvString], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.pk}.csv`;
        a.click();
        URL.revokeObjectURL(url);  
    }

    _onShowArchive($btn){
        this.dispatchEvent(new CustomEvent('show-archive'));
    }

    _onCloseArchive($btn){
        this.dispatchEvent(new CustomEvent('close-archive'));
    }

    _onReset(){
        this.#data = [];
        this.$el('tbody').innerHTML = '';
        this.#row = {};
        this.#views.forEach(v=>{ v.rows = []; });
        this.dispatchEvent(new CustomEvent('reload'));
    }

    _onNew(event){
        if (event.key !== 'Enter'){ return }
        const selected = this.$el('tbody').querySelector('.item.selected');
        if (!selected){ return }
        const item = selected.parentElement.__data;
        const evData = {newObj: item.__object};
        if (!this.#topLevelObjects.includes(evData.newObj)){
            evData.parent = item.__parent;
        }
        this.dispatchEvent(new CustomEvent('add', {detail: evData}));
    }

    _onAdd(ev){
        const evData = {newObj: ev.target.value};
        const data = this.$el('tbody').querySelector('.item.selected')?.parentElement.__data;
        if (data && !this.#topLevelObjects.includes(ev.target.value)){
            evData.parent = data.__id;
        }
        this.dispatchEvent(new CustomEvent('add', { detail: evData}));
    }

    _onDelete(ev){
        const $target = this.$el('tbody').querySelector('.item.selected').closest('.row');
        if (!$target){ return; }
        this.dispatchEvent(new CustomEvent('delete', {detail: $target.__data}));
        $target.remove();
    }

    _onRestore(ev){
        const $target = this.$el('tbody').querySelector('.item.selected').closest('.row');
        if (!$target){ return; }
        this.dispatchEvent(new CustomEvent('restore', {detail: $target.__data}));
    }

    _onSort($cell){
        const col = $cell.classList[1];
        $cell.dataset.sort = $cell.dataset.sort === 'asc' ? 'dsc' : 'asc';
        this.#sort(col,$cell.dataset.sort);
    }

    _onContextMenu(ev){
        ev.preventDefault();
        if (this.classList.contains('archive')){ return }
        const $row = ev.target.closest('.row');
        const $item = ev.target.closest('.item');
        if (!$row || !$item){ return }
        // Select Target Row
        this.#select($item);
        // Filter Right Click Options
        let visibleOptions = [...this.#menuOptions];
        const objDef = this.#objects[$row.__data.__object];
        if (objDef.delete !== true){
            visibleOptions = visibleOptions.filter(o=>o !== 'Cut');
        }
        if (objDef.top === true){
            visibleOptions = visibleOptions.filter(o=>o !== 'Copy' && o !== 'Copy with Children' && o !== 'Cut');
        } else {
            visibleOptions = visibleOptions.filter(o=>o !== 'Duplicate' && o !== 'Duplicate with Children');
        }
        const clipBoard = localStorage.getItem(`clipBoard`);
        if (clipBoard){
            const { action, source } = JSON.parse(clipBoard);
            const itemDef = this.#objects[source.__object];
            if (!itemDef || !itemDef.parents.find(p=>p.$id === objDef.$id) || itemDef.create !== true){
                visibleOptions = visibleOptions.filter(o=>o !== 'Paste');
            }
            if (source.pk === $row.__data.pk){
                visibleOptions = visibleOptions.filter(o=>o !== 'Paste As');
            }
        } else {
            visibleOptions = visibleOptions.filter(o=>o !== 'Paste');
        }
        // Open Menu
        this.#menu.visible = visibleOptions;
        this.#menu.$target = $row;
        this.#menu.open(ev);
    }

    _onContextMenuSelect(ev){
        const operation = ev.detail.replaceAll(' ','-').toLowerCase();
        // On Paste
        if (operation === 'paste'){
            const clipBoard = JSON.parse(localStorage.getItem(`clipBoard`));
            clipBoard.target = this.#menu.$target.__data;
            localStorage.removeItem(`clipBoard`);
            console.log('paste',clipBoard);
            this.dispatchEvent(new CustomEvent(`paste-${clipBoard.action}`, {
                detail: clipBoard
            }));
            return;
        }
        // XTable Paste
        if (operation === 'paste-as'){
            const clipBoard = JSON.parse(localStorage.getItem(`clipBoard`));
            clipBoard.target = this.#menu.$target.__data;
            console.debug('paste as',operation,clipBoard);
            this.dispatchEvent(new CustomEvent(`paste-as`, {
                detail: clipBoard
            }));
            return;
        }
        // On Duplicate
        if (operation === 'duplicate' || operation === 'duplicate-with-children' || operation === 'create-linked-item'){
            this.dispatchEvent(new CustomEvent(operation, {detail: this.#menu.$target.__data }));
            return;
        }
        // On Cut, Copy, Copy with Children
        const clipBoard = {
            action: operation,
            source: this.#menu.$target.__data
        }
        localStorage.setItem(`clipBoard`,JSON.stringify(clipBoard));
    }

    #debounce2 = null;
    _onSkChange(ev){
        const sk = this.#cskInput.value;
        console.debug('sk change',sk);
        if (this.#stringIndex){
            if (this.#debounce2){ clearTimeout(this.#debounce2); }
            this.#debounce2 = setTimeout(()=>{
                this.dispatchEvent(new CustomEvent('sk-change', {detail: sk}));
            }, 750);
        } else {
            this.dispatchEvent(new CustomEvent('sk-change', {detail: sk}));
        }
    }

    // --- Private Helpers --- //
    #getRow(rowData,views){
        let foundVal = false;
        for (const k in this.#rowTemplate.cell){
            const val = rowData[k]  || '';
            this.#rowTemplate.cell[k].innerText = typeof(val) === 'object' ? Object.values(val)[0] : val;
            if (val){ foundVal = true }
        }
        if (!foundVal){
            const titleField = this.#objects[rowData.__object].$titleField
            this.#rowTemplate.cell[Object.keys(this.#rowTemplate.cell)[0]].innerText =  rowData[titleField] || '';
        }
        try{
            this.#rowTemplate.icon.innerText = this.#objects[rowData.__object].icon || '';
        } catch(e){
            console.warn('Schema not found',rowData.__object, rowData, this.#objects);
            throw e;
        }
        this.#rowTemplate.$item.className = `item ${views}`;
        this.#rowTemplate.node.id = rowData.__id;
        const $el = this.#rowTemplate.node.cloneNode(true);
        $el.__data = rowData;
        return $el;
    }

    #getRowViews(rowData){
        let viewClasses = [];
        for (const view of this.#views){
            if (!view.filters || view.filters.length === 0){ 
                viewClasses.push(view.name)
                view.rows.push(rowData);
            } else {
                for (const filter of view.filters){
                    if (!elTable.eval(rowData,filter)){
                        break;
                    }
                    viewClasses.push(view.name)
                    view.rows.push(rowData);
                }
            }
        }
        return viewClasses.join(' ');
    }

    #update(data){
        const $row = this.#row[data.__id];
        const $rowItem = $row.lastElementChild;
        // Update Display Value
        Object.keys(data).forEach(k=>{
            const $cell = $rowItem.querySelector(`.cell.${CSS.escape(k)}`);
            if ($cell){
                $cell.innerText = data[k] === undefined || null ? '' : data[k];
            }
        })
        // Update Data
        $row.__data = Object.assign($row.__data, data);
        console.log('update',data);
        // Update Views
        const displayIn = this.#getRowViews($row.__data) ;
        $rowItem.className = `item ${displayIn}`;
    }

    #runSearch(srchVal){
        // const dataToSearch = this.#activeView.filters && this.#activeView.filters.length > 0 ? this.#activeView.rows : this.#data;
        const params = {
            col: this.$el('cols').value,
            operator: this.$el('operator').value,
            value: srchVal
        }
        window.requestAnimationFrame(()=>{
            for (let i = this.#visibleRows.length - 1; i >= 0; i--){
                const row = this.#visibleRows[i];
                const show = elTable.eval(row,params,debug);
                this.#row[row.__id].lastElementChild.classList.toggle('hide',!show);
            }
            if (srchVal === ''){
                this.$el('tbody').classList.remove('expanded');
            } else {
                this.$el('tbody').classList.add('expanded');
            }
        });
    }

    #runFilters(){
        this.#visibleRows = this.#activeView.rows;
        window.requestAnimationFrame(()=>{
            if (this.#searchFilters.length === 0){
                for (const row of this.#activeView.rows){
                    this.#row[row.__id].lastElementChild.classList.remove('hide');
                }
                this.$el('tbody').classList.remove('expanded');
            } else {
                for (const filter of this.#searchFilters){
                    for (let i = this.#visibleRows.length - 1; i >= 0; i--){
                        const row = this.#visibleRows[i];
                        const show = elTable.eval(row,filter);
                        this.#row[row.__id].lastElementChild.classList.toggle('hide',!show);
                    }
                }
            }
        });
    }

    #renderView(viewName){
        // Set Pointers
        this.#activeView = this.#views.find(v=>v.name === viewName) || this.#views[0];
        this.#visibleRows = this.#activeView.rows;
        this.$el('visrows').textContent = this.#visibleRows.length;
        
        // Render
        window.requestAnimationFrame(()=>{
            this.$el('table').className = this.#activeView.name;
            if (this.#activeView.sort?.length > 0){
                for (let i=0; i<this.#activeView.sort.length; i++){
                    const renderSort = i === this.#activeView.sort.length - 1;
                    this.#sort(this.#activeView.sort[i].col,this.#activeView.sort[i].dir,renderSort);
                }
            }
        });
    }

    #select($row){
        if (this.#visibleRows.length === 0){ 
            this.$el('add').visible = this.#topLevelObjects;
            return 
        }
        if (!$row){ 
            const targetId = this.#visibleRows[0].__id;
            const $rowToSelect = this.#row[targetId];
            $row = $rowToSelect.lastElementChild;
         }
        // Select Row
        this.$el('tbody').querySelector('.item.selected')?.classList.remove('selected');
        $row.classList.add('selected');
        
        // Expand Parents
        let $parent = $row.closest('.row').parentElement?.closest('.row');
        while($parent){
            $parent.classList.add('expanded');
            $parent = $parent.parentElement.closest('.row');
        }
        $row.scrollIntoView({behavior: 'instant', block: 'nearest'});

        // Find Row Data
        const rowData = $row.closest('.row').__data;
        // Set Objects
        const objDef = this.#objects[rowData.__object];
        const children = this.#topLevelObjects.concat(objDef.children || []) ;
        this.$el('add').visible = children;
        this.$el('add').disabled = children.length === 0;
        // Set Deletable
        this.$el('delete').disabled = objDef.delete !== true;
        // Dispatch Event
        this.dispatchEvent(new CustomEvent('select', {detail: rowData}));
        return rowData;
    }


    // --- Private SubHelpers --- //
    #sort(col,direction,render=true){
        const isAsc = direction === 'asc';
        this.#data.sort((a,b)=>{
            return elTable.compare(a[col],b[col],isAsc);
        });
        if (render){ 
            for (let i=0; i<this.#data.length; i++){
                this.#row[this.#data[i].__id].style.order = i;
            }
        }
    }

    // --- Static Methods --- //
    static rowTemplate(cols){
        const rowObj = {
            node: document.createElement('div'),
            cell: {}
        };
        rowObj.node.className = 'row';
        rowObj.node.innerHTML = `<div class="children"></div>
        <div class="item">
            <i>
            <b class="material-symbols-outlined">add</b>
            <b class="material-symbols-outlined rowic"></b>
            </i>
        </div>`;
        rowObj.$item = rowObj.node.querySelector('.item');
        rowObj.icon = rowObj.$item.querySelector('i .rowic');
        rowObj.exp = rowObj.$item.querySelector('i b');
        cols.forEach((col,i)=>{
            rowObj.cell[col.name] = rowObj.$item.appendChild(document.createElement('span'));
            rowObj.cell[col.name].className = `cell ${col.name}`;
        })
        return rowObj;
    }

    static eval(obj,filter,debug){
        const { col, operator, value } = filter;
        const objValue = obj[col];
        
        const compare = (a, b) => {
            if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
            if (!isNaN(a) && !isNaN(b)) return parseFloat(a) - parseFloat(b);
            return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
        };
        
        switch (operator) {
            case 'begins':
                return String(objValue).toLowerCase().startsWith(String(value).toLowerCase());
            case 'contains':
                return String(objValue).toLowerCase().includes(String(value).toLowerCase());
            case 'equal':
                return compare(objValue, value) === 0;
            case 'not_equal':
                if (typeof(objValue) !== typeof(value)){ return true }
                return compare(objValue, value) !== 0;
            case 'not_contain':
                return !String(objValue).toLowerCase().includes(String(value).toLowerCase());
            case 'greater':
                return compare(objValue, value) > 0;
            case 'less':
                return compare(objValue, value) < 0;
            case 'blank':
                return objValue === '' || objValue === null || objValue === undefined;
            default:
                return false;
        }
    }

    static compare(a,b,ascending){
        // Handle undefined and null values
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;

        // Handle strings
        if (typeof a === 'string' && typeof b === 'string') {
            return ascending ? a.localeCompare(b) : b.localeCompare(a);
        }

        // Handle dates
        if (a instanceof Date && b instanceof Date) {
        return ascending ? a - b : b - a;
        }

        // Handle numbers and booleans
        if ((typeof a === 'number' || typeof a === 'boolean') && 
            (typeof b === 'number' || typeof b === 'boolean')) {
            if (a < b) return ascending ? -1 : 1;
            if (a > b) return ascending ? 1 : -1;
            return 0;
        }

        // Fallback for mixed types (e.g., string vs number)
        return ascending ? a.toString().localeCompare(b.toString()) : b.toString().localeCompare(a.toString());
    }

    // --- Static Defs   --- //
    static Tag = 'el-table';
    static Html = (
        `<link rel="stylesheet" href="./js/elmnts/css/e-table.css">
        <style id="style"></style>
        <section class="tab-bar" id="tab-bar">
            <app-icon icon="archive" class="tab" id="show-archive" tooltip="Show Archive"></app-icon>
            <app-icon icon="close" class="tab" id="close-archive" tooltip="Close Archive"></app-icon>
        </section>
        <section class="search-bar" id="search-bar">
            <app-icon icon="search"></app-icon>
            <div id="custom_sk"></div>
            <select id="cols"></select>
            <select id="operator">
                <option value="contains">contains</option>
                <option value="equal">equal</option>
                <option value="begins">begins</option>
                <option value="greater">greater</option>
                <option value="less">less</option>
                <option value="blank">blank</option>
            </select>
            <input type="text" class="srch-inpt" id="srch-input" placeholder="Search">
            <app-icon id="filter" icon="filter" class="search-icon" tooltip="Save Filter"></app-icon>
            <app-icon id="filter-clear" icon="filter_clear" class="search-icon" tooltip="Clear Filters"></app-icon>
            <app-icon id="import" icon="cloud_upload" class="btn" tooltip="Import Data"></app-icon>
            <app-icon id="exp-json" icon="json" class="btn control" tooltip="Export JSON"></app-icon>
            <app-icon id="exp-csv" icon="csv" class="btn control" tooltip="Export CSV"></app-icon>
            <app-icon id="reset" icon="reset" class="btn control" tooltip="Reload"></app-icon>
            <m-button id="add" text="add" class="control">ADD</m-button>
            <m-button id="delete" text="delete" class="control"></m-button>
            <m-button id="restore" text="restore" class="control"></m-button>
        </section>
        <section class="table-container" id="table-container">
            <section class="table-box">
                <section class="table" id="table">
                    <section class="thead" id="theadrow"></section>
                    <section id="tbody" class="tbody" tabindex="0"></section>
                </section>
            </section>
            <section class="filters" id="filters">
                <button>
                    <em class="material-symbols-outlined">database</em>
                    <em id="rowcount">0</em>
                </button>
                <button>
                    <em class="material-symbols-outlined">visibility</em>
                    <em id="visrows">0</em>
                </button>
            </section>
        </section>`
    );
}


ELMNT.define(elTable);