class iFile extends ELMNT_Input
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    maxSize = 5000;
    

    // --- Private Properties --- //
    #value;
    #readOnly = false;
    #maxItems = 1;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['upload','click',this._onUploadClick],
            ['file','change',this._onFileReady],
            ['list','click',this._onDeleteClick, {selector: '.delete'}]
        ];
    }


    // --- Setters & Getters --- //
    set value(v){ 
        this.$el('file').value = null;
        this.#value = v; 
        this.dataset.state = 0;
        this.#setValue(v);
    }

    get value(){
        return this.#value;
    }

    set readOnly(v){
        this.#readOnly = v;
        this.$el('head').style.display = v === true ? 'none' : '';
    }

    set maxItems(v){
        this.#maxItems = v;
        if (this.#maxItems > 1){
            this.$el('file').setAttribute('multiple', '');
        }
    }

    // --- Public Methods --- //

    // --- User Events --- //
    _onUploadClick(ev){
        this.shadow.getElementById('file').click();
    }


    async _onFileReady(ev){
        const $fileInput = this.shadow.getElementById('file');
        if (!$fileInput.files){ return; }
        const formData = new FormData();
        for (const file of $fileInput.files){
            // Check Size
            if (this.maxSize && (file.size/10000) > this.maxSize){
                window.alert(`Max file size is ${this.maxSize}mb`);
                $fileInput.value = null;
                return;
            }
            formData.append('files[]', file);
        }
        const returnData = await Global.upload(this.__path,this.name,formData);
        if (returnData.fails && returnData.fails.length > 0){
            window.alert(returnData.fails);
        }
        this.#setValue(returnData.value);
        console.debug('File Uploaded:', returnData.value);
        this.dispatchEvent(new CustomEvent('data-change', 
            { detail: {
                field: this.name, 
                value: returnData.value
            }, bubbles: true}));
    }


    async _onDeleteClick($target){
        const $item = $target.closest('.list-item');
        console.debug('Delete File',$item.id);
        try{
            await Global.delfile($item.id);
            $item.remove();
            const totalItems = this.shadow.querySelectorAll('.list-item').length;
            if (totalItems < this.#maxItems && !this.#readOnly){
                this.$el('head').style.display = '';
            }
            this.dispatchEvent(new CustomEvent('data-change', { 
                detail: {
                field: this.name, 
                value: this.#value.filter(f=> f.fileKey !== $item.id)
            }, bubbles: true}));
        } catch (e){
            console.warn('Delete File Error:', e);
            window.alert('Error Deleting File:' + e.toString());
        }
    }

    // --- Private Helpers --- //
    #setValue(v){
        if (v === null || v === undefined){ v = []; }
        const $list = this.$el('list');
        $list.innerHTML = '';

        v.forEach(item=>{
           const rowHTML = iFile.GetRow(item);
           $list.insertAdjacentHTML('beforeend', rowHTML)
        });
        if (this.#maxItems <= v.length){
            this.$el('head').style.display = 'none';
        } else if (!this.readOnly){
            this.$el('head').style.display = '';
        }
    }

    // --- Static Methods --- //
    static GetRow(fileInfo){
        const D = new Date(fileInfo.createdOn)
        let fDate = D.toLocaleDateString() + ' ' +  D.toLocaleTimeString();
        return (
        `<div class="list-item" id="${fileInfo.fileKey}" data-name="${fileInfo.fileName}">
            <div class="deets">
                <a href="api/file/${fileInfo.fileKey}" target="_blank">${fileInfo.fileName}</a>
                <span class="stat">
                    <b class="on">${fDate}</b> by <b class="by">${fileInfo.createdBy}</b>
                </span>
            </div>
            <span class="delete">✖</span>
        </div>`); 
    }

    // --- Static Defs   --- //
    static Tag = 'i-file';

    static Html = (
        `<div class="head" id="head">
            <button id="upload">
                <span class="material-symbols-outlined">upload</span><span class="text">UPLOAD</span>
            </button>
        </div>
        <div class="list" id="list"></div>
        <input id="file" type="file" style="visibility: hidden;"/>`
    );

    static Css = (
        `:host{
            display: block;
            font-size: inherit;
            font-family: inherit;
            color: inherit;
            width: 100%;
        }
        .head{
            flex: 0 0 auto;
            display: flex;
            align-items: center;
        }
        .head button{
            display: flex;
            flex: 0 0 auto;
            font-size: .8em;
            padding: .5em 1em;
            margin-top: .5em;
            margin-bottom: .5em;
            align-items: center;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
            color: rgba(0,0,0,.65);
            font-weight: 600;
            background: rgb(240,240,240);
            border: none;
        }
        .head button span.text{
            font-size: 1.1em;
            margin-left: .25em;
        }
        .head button:hover{
            color: rgba(0,0,0,.85);
            background: rgb(230 230 230);
        }
        .head button:active{
            background: rgb(210 210 210);
        }
        .list{
            flex: 1 1 100%;
            overflow-x: hidden;
            overflow-y: auto;
            max-height: 13em;
        }
        .list-item{
            padding: 0;
            overflow: hidden;
            font-size: .9em;
            display: flex;
            align-items: stretch;
        }
        .list-item:last-child{
            border-bottom: none;
        }
        .bullet{
            flex: 0 0 2.5em;
            display: inline-block;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        .bullet span{
            line-height: .95;
        }
        .bullet:hover{
            color: rgba(0, 103,181, 1);
            background: rgb(240 240 240);
        }
        .deets{
            flex: 1 1 100%;
            padding: .35em .75em;
            cursor: pointer;
            min-width: 0;
            color: rgb(97, 97, 97);
        }
        a{
            display: block;
            font-size: 1.15em;
            text-decoration: none;
            color: var(--btn);
            font-weight: 500;
            cursor: pointer;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            min-width: 0;
        }
        .deets i{
            opacity: 0;
        }
        .deets:hover{
            background: rgb(253 253 253);
            color: rgb(0,103,181);
        }
        .deets:hover i{
            opacity: 1;
        }
        .stat{
            font-size: .9em;
            padding: .25em;
            color: rgb(150 150 150);
        }
        .on,.by{
            font-weight: normal;
        }
        .delete{
            flex: 0 0 2em;
            font-size: 1.5em;
            cursor: pointer;
            margin-left: .5em;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgb(220 220 220);
            cursor: pointer;
        }
        .delete:hover{
            background: #f1f2f4;
            color: rgb(255, 59, 63);
        }
        :host(.versioned) .delete{
            display: none;
        }`
    );

}

ELMNT.define(iFile);

