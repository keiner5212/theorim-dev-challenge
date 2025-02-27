class DataImportWindow extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //

    // --- Private Properties --- //
    #data = [];
    #schType = null;
    #uploadType;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['uploadtype','change',this._onUploadType ],
            ['upload','click',this._onUploadClick ],
            ['validate','click',this._onValidate ],
            ['file','change',this._onFileUpload ],
            ['submit','click',this._onSubmit, {once:true} ],
            ['cancel','click',this._onCancel ]
        ];
    }

    connectedCallback(){
        // Add User Events --- //
    }

    // --- Setters & Getters --- //

    // --- Public Methods --- //

    // --- User Events --- //
    _onUploadType(ev){
        this.#uploadType = ev.target.value;
        this.$el('upload').disabled = false;
        this.$qs(`.inst:not(.h)`).classList.add('h');
        this.$qs(`.instructions-${this.#uploadType}`).classList.remove('h');
    }

    _onUploadClick(){
        this.$el('file').click();
    }

    _onFileUpload(){
        const file = this.$el('file').files[0];
        if (!file){ return; }
        const reader = new FileReader();
        reader.onload = (e)=>{
            const content = e.target.result;
            try{
                this.#data = file.name.endsWith('.json') ? JSON.parse(content) : this.#parseCSV(content);
                const itemsValid = this.#uploadType === 'new' ? this.#checkFieldsNew() : this.#checkFieldsEdit();
                if (!itemsValid){ return } 
                this.#formatData();
                this.#render();
                this.$el('validate').disabled =false;
                this.$el('upload').disabled = true;
                this.$el('uploadtype').disabled = true;
            } catch (e){
                console.warn('Invalid File Format', e);
                this.#errorMsg('Invalid File Format', e);
                return;
            }
        };
        reader.readAsText(file);
    }

    async _onValidate(){
        this.$el('loader').show(true);
        // Validate in chunks of 25
        let invalid = 0;
        let valid = 0;
        var validResults = {};
        let key = this.#uploadType === 'new' ? '__id' : 'sk';

        try{
            validResults = await Global.post('import',{},{ 
                pk: this.pk, 
                validate: true,
                importType: this.#uploadType,
                data: this.#data 
            });
            console.debug('Validation Results',validResults);
            validResults.failures = validResults.failures || {};
            for (const record of this.#data){
                const $row = this.$el(record[key]);
                const rowResult = validResults.failures[record[key]];
                if (rowResult){
                    $row.querySelector('[data-col="__valid"]').dataset.status = 'false';
                    $row.querySelector('[data-col="__error"]').innerText = rowResult.join('\n');
                    invalid++;
                } else {
                    $row.querySelector('[data-col="__valid"]').dataset.status = 'true';
                    valid++;
                }
            }
            this.$el('valid').innerText = valid;
            this.$el('invalid').innerText = invalid;
            this.$el('upload').disabled = true;
            this.$el('validate').disabled = true;
            if (invalid === 0){
                this.$el('submit').disabled = false;
            }
        } catch(e){
            this.#errorMsg('Validation Error',e);
        }
        this.$el('loader').show(false);
    }


    async _onSubmit(){
        this.$el('loader').show(true);
        this.$el('submit').disabled = true;
        // Validate in chunks of 25
        let uploaded = 0;
        let failed = 0;
        var validResults = {};
        const key = this.#uploadType === 'new' ? '__id' : 'sk';
        try{
            validResults = await Global.post('import',{},{ 
                pk: this.pk, 
                validate: false,
                importType: this.#uploadType,
                data: this.#data 
            });
        
            console.debug('Write Results',validResults);
            validResults.failures = validResults.failures || {};
            for (const record of this.#data){
                const $row = this.$el(record[key]);
                const rowResult = validResults.failures[record[key]];
                if (rowResult){
                    $row.querySelector('[data-col="__uploaded"]').dataset.status = 'false';
                    $row.querySelector('[data-col="__error"]').innerText = rowResult.join('\n');
                    failed++;
                } else {
                    $row.querySelector('[data-col="__uploaded"]').dataset.status = 'true';
                    uploaded++;
                }
            }
            this.$el('uploaded').innerText = `${uploaded} of ${this.#data.length} uploaded`;
            if (Object.keys(validResults.failures).length === 0){
                this.$el('success').style.display = '';
            }
        } catch(e){
            this.#errorMsg('Upload Error',e);
        }
        this.$el('loader').show(false);
    }

    _onCancel(){
        this.schemas = null;
        this.#data = null;
        this.#schType = null;
        this.remove();
    }

    // --- Private Helpers --- //
    #checkFieldsNew(){
        const missingId = this.#data.filter(r=>{ return r.__id === null || r.__id === undefined });
        const missingObj = this.#data.filter(r=>{ return typeof(r.__object) !== 'string' });
        const schemaNames = this.schemas.map(s=>{ return s.$id});
        const invalidObj = this.#data.filter(r=>{ 
            return !schemaNames.includes(r.__object) 
        });
        if (missingId.length + missingObj.length + invalidObj.length === 0){ return true };
        this.#invalidMsgNew([
            missingId,
            missingObj,
            invalidObj
        ])
        return false;
    }

    #checkFieldsEdit(){
        const schemaNames = this.schemas.map(s=>{ return s.$id});
        const invalidObj = this.#data.filter(r=>{
            const path = Global.Path(r.sk);
            if (!path?.__object){ return true }
            if (!schemaNames.includes(path.__object)){ return true }
            return false;
        })
        if (invalidObj.length > 0){
            this.#invalidMsgEdit(invalidObj);
            return false;
        } else {
            return true;
        }
    }



    #formatData(){
        this.#data.sort((a, b) => {
            if (a.__object < b.__object) return -1;
            if (a.__object > b.__object) return 1;
            return 0;
        });
        for (const sch of this.schemas){
            const schData = this.#data.filter(r=>{ return r.__object === sch.$id });
            for (const obj of schData){
                for (const key in sch.properties){
                    if (obj[key] === undefined || obj[key] === null){ continue; }
                    const prop = sch.properties[key];
                    if (prop.type === 'number' && !prop.multipleOf || prop.multipleOf === 1){
                        obj[key] = parseInt(obj[key]);
                    } else if (prop.type === 'number'){
                        obj[key] = parseFloat(obj[key]);
                    } else if (prop.type === 'boolean'){
                        obj[key] = obj[key].toLowerCase() === 'true';
                    } else {
                        obj[key] = obj[key];
                    }
                }
            }
        }
    }

    #parseCSV(csvString){
        // Extract headers by splitting the first row by comma
        const lines = csvString.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        return lines.slice(1).map(line => {
            const tokens = parseCSVLine(line);
            return headers.reduce((obj, header, index) => {
                obj[header] = tokens[index] ? tokens[index].trim() : null;
                return obj;
            }, {});
        });
    }

    #render(){
        // Headers
        const allHeaders = this.#uploadType === 'new' ? ['__id','__object'] : ['sk'];
        allHeaders.push(...['__valid','__uploaded','__error']);
        this.#data.forEach(r=>{ allHeaders.push(...(Object.keys(r))) });
        const dataHeaders = [...new Set(allHeaders)]
        this.$el('thead').innerHTML = dataHeaders.map(h=>`<th data-col="${h}">${h.replaceAll('_','')}</th>`).join('');
        
        // Rows
        const frag = document.createDocumentFragment();
        for (const row of this.#data){
            const $row = document.createElement('tr');
            $row.id = this.#uploadType === 'new' ? row.__id : row.sk;
            $row.innerHTML = dataHeaders.map(h=>`<td data-col="${h}">${row[h] === undefined ? '' : row[h]}</td>`).join('');
            frag.appendChild($row);
        }
        this.$el('tbody').appendChild(frag);
    }

    #invalidMsgNew([missingId,missingObj,notFoundObj]){
        const html = (
            `<div class="error">
                <div class="err-title">
                    <span>Failed: All Items must have __id and __object properties</span>
                    <i>__id is any unique identifier. __object must be the name of the schema</i>
                </div>
                <div class="err-msg">
                    <div class="errinfo ${missingId.length > 0 ? '':'h'}">${missingId.length} items missing __id property</div>
                    <div class="errinfo ${missingObj.length > 0 ? '':'h'}">
                        <div>${missingObj.length} items missing __object property</div>
                        <div>
                            ${missingObj.map(i=>{ return i.__id }).join('\n')}
                        </div>
                    </div>
                    <div class="errinfo ${notFoundObj.length > 0 ? '':'h'}">
                        <div>${notFoundObj.length} items have invalid __objects property</div>
                        <div>Valid __objects are ${this.schemas.map(s=>{return s.$id}).join(',')}</div>
                        <div>
                            ${notFoundObj.map(i=>{ return i.__id }).join('\n')}
                        </div>
                    </div>
                </div>
            </div>`
        )
        this.$el('content').innerHTML = html;
    }

    #invalidMsgEdit(invalidSk){
        console.log('invalid sk',invalidSk);
        const html = (
            `<div class="error">
                <div class="err-title">
                    <span>Failed: All Items must have a valid sk (sort key) property</span>
                    <i>The sk property is used as an id. The provided values must match an existing item this table.
                        <br/>The sk property will be present on any data exported directly from the application.
                    </i>
                </div>
                <div class="err-msg">
                    <div class="errinfo">
                        <div><b>${invalidSk.length} items have invalid sk properties:</b></div>
                        <div>
                            ${invalidSk.map(i=>{ return Object.values(i).join(',') }).join('<br/>')}
                        </div>
                    </div>
                </div>
            </div>`
        )
        this.$el('content').innerHTML = html;
    }

    #errorMsg(errorTitle,errorMsg){
        const html = (
            `<div class="error">
                <div class="err-title">
                    <span>Upload Failed: ${errorTitle}</span>
                </div>
                <div class="err-msg">
                    ${errorMsg}
                </div>
            </div>`
        )
        this.$el('content').innerHTML = html;
    }

    // --- Static API Calls --- //

    // --- Static Defs   --- //
    static Tag = 'data-import-window';

    static Html = (
        `<div class="title"><span>IMPORT WIZARD</span><button id="cancel">✕</button></div>
        <div class="controls">
            <fieldset id="uploadtype">
                <label>Edit Exiting Data</label><input type="radio" id="edit" name="uploadtype" value="edit"/>
                <label>Upload New Data</label><input type="radio" id="new" name="uploadtype" value="new"/>
            </fieldset>
            <button id="upload" disabled>Upload File</button>
            <button id="validate" disabled>Validate Data</button>
            <button id="submit" disabled>Upload to Database</button>
            <el-loader id="loader"></el-loader>
        </div>
        <div class="results">
            <span class="valid">
                <span class="material-symbols-outlined">check_circle</span>
                <span>Valid: </span>
                <span id="valid">-</span>
            </span>
            <span class="invalid">
                <span class="material-symbols-outlined">warning</span>
                <span>Invalid: </span>
                <span id="invalid">-</span>
            </span>
            <span class="uploaded">
                <span class="material-symbols-outlined">upload</span>
                <span>Uploaded: </span>
                <span id="uploaded">-</span>
            </span>
            <div id="success" style="display:none;">Success! All Data Uploaded</div>
        </div>
            <div class="inst instructions-new">
                <h1>Upload Edits to EXISTING Data</h1>
                <h2>Export data from the table you wish to edit as JSON or CSV<br/>
                    Make your edits and reupload in this wizard<br/>
                </h2>
                <p>
                    <b>Important!</b><br/>
                    All Items MUST has a sk (sort key) attribute that exists in the database<br>
                    Index fields CANNOT be updated through imports. 
                </p>
            </div>
            <div class="inst instructions-edit h">
                <h1>Upload NEW Data</h1>
                <h2>Create a CSV or JSON file with your data (JSON is more reliable)</h2>
                <p>
                    <div<Ensure each item has the following properties:</div>
                    <b>__object</b> The name of a schema of the row/object.<br>
                    <b>__id</b> A Unique identifier for the row. This can be any value.<br>
                    <b>__parent</b>Optional. This is the __id of the parent property<br>
                </p>
            </div>
            <div class="content h" id="content">
                <table border="1">
                    <thead id="thead"></thead>
                    <tbody id="tbody"></tbody>
                </table>
            </div>
        </div>
        <input type="file" id="file" style="visibility:hidden;" accept="application/json;text/csv"/>`
    );

    static Css = (
        `:host{
            position: absolute;
            display: flex;
            flex-direction: column;
            width: 80vw;
            height: 80vh;
            margin-top: 0vh;
            margin-left: 10vw;
            background-color: #1c1f24;
            border: 1px solid rgb(100 100 100);
            color: rgb(200 200 200);
            z-index: 1000;
            box-shadow: rgba(0, 0, 0, 0.36) 0px 0px 8px 2px;
            overflow: hidden;
        }
        .inst{
            padding: 4em;
            box-sizing: border-box;
        }
        h1,h2,p{
            text-align: center;
        }
        p{
            font-size: 1.1em;;
        }
        .dyn{
            display: none;
        }
        :host([data-state="ready-for-file"]) .dyn.ready-for-file{
            display: block;
        }
        :host([data-state="ready-for-mapping"]) .dyn.ready-for-mapping{
            display: block;
        }
        :host([data-state="ready-for-validation"]) .dyn.ready-for-validation{
            display: block;
        }
        :host([data-state="invalid-data"]) .dyn.invalid-data{
            display: block;
        }
        :host([data-state="ready-for-submit"]) .dyn.ready-for-submit{
            display: block;
        }
        .title{
            text-align: center;
            font-size: 1.2em;
            font-weight: 600;
            line-height: 2em;
            height: 2em;
            font-family: var(--ttl);
            background: rgb(0,0,0,.15);
            border-bottom: 1px solid rgba(255,255,255,.1);
            flex: 0 0 auto;
        }
        #cancel{
            position: absolute;
            right: 0;
            top: 0;
            width: 2em;
            height: 2em;
            cursor: pointer;
            background: black;
        }
        #cancel:hover{
            color: var(--red);
        }
        el-loader{
            height: 1em;
            width: 2em;
        }
        .controls{
            display: flex;
            justify-content: flex-start;
            margin: 1em 0;
            padding: 1em;
            flex: 0 0 auto;
        }
        fieldset#uploadtype{
            display: flex;
            align-items: center;
            border: 2px solid #6f7b90;
            margin-inline: 0;
            padding-inline: 0;
            padding-block: 0;
        }
        fieldset#uploadtype > *{
            padding: .25em .5em;
            margin: 0;
        }
        fieldset#uploadtype > input{
            margin-right: 1em;
        }
        .controls button,
        .controls select{
            background: rgb(0,0,0,.25);
            border: 2px solid #6f7b90;
            margin: 0 .5em;
            padding: .5em 1em;
            color: #9aa3b1;
            cursor: pointer;
            font-family: var(--ttl);
        }
        .controls button{
            border-radius: 3px;
        }
        .controls button:not(:disabled):hover{
            background: black;
        }
        .controls button:disabled{
            background: rgba(255,255,255,.25);
        }
        .controls select{
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }
        .controls option{
            background: black;
            color: white;
            font-weight: 500;
            font-size: .9em;
        }
        .results{
            display: flex;
            align-items: center;
            padding-left: 1em;
        }
        .valid,.invalid,.uploaded{
            display: flex;
            align-items: center;
            font-weight: 600;
        }
        .valid{
            color: var(--green);
            margin-right: 3em;
        }
        .invalid{
            color: var(--yellow);
        }
        #valid,#invalid,#uploaded{
            margin-left: 10px;
        }
        .uploaded{
            margin-left: 3em;
            color: var(--btn)
        }
        #success{
            color: var(--btn);
            padding: 3px .5em;
            margin: 0 2em;
            font-weight: bold;
            border: 1px solid var(--btn);
        }
        .results .material-symbols-outlined{
            font-size: 1.25em;
            margin-right: 10px;
        }
        .content{
            overflow: scroll;
            padding: 1em;
            width: 100%;
            flex: 1 1 100%;
            box-sizing: border-box;
        }
        table{
            table-layout: fixed;
            min-width: 100%;
            border-collapse: collapse;
            position: relative;
        }
        th{
            background: #9aa3b1;
            color: black;
            top: 0;
        }
        th:nth-child(-n+5){
            background: black;
            color: white;
        }
        td{
            min-width: 5em;
        }
        td[data-status="true"]{
            background: var(--green);
            color: white;
            text-align: center;
        }
        td[data-status="true"]:before{
            content: "✓";
            display: inline-block;
            color: white;
            font-weight: 700;
            text-align: center;
        }
        td[data-status="false"]{
            background: var(--red);
            text-align: center;
        }
        td[data-status="false"]:before{
            content: "✗";
            color: white;
            display: inline-block;
            text-align: center;
        }
        .error{
            width: 100%;
            font-size: 1.2em;
            padding: 2em;
            box-sizing: border-box;
        }
        .error .err-title{
            font-weight: bold;
            font-size: 1.1em;
            text-align: center;
            margin-bottom: 1em;
        }
        .err-title i{
            font-style: normal;
            font-size: .9em;
            font-weight: normal;
            margin-top: 1em;
        }
        .error .err-title > *{
            display: block;
        }
        .eror .err-title i{
            font-style: normal;
        }
        .error .err-msg > *{
            display: block;
        }
        .h{
            display:none;
        }`
    );

}


function parseCSVLine(line) {
    const tokens = [];
    let inQuotes = false;
    let char;
    let token = '';

    for (let i = 0; i < line.length; i++) {
        char = line[i];

        if (char === '"' && line[i + 1] === '"') {
            // Handle escaped quotes inside quoted string
            token += char;
            i++; // skip the next quote
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            // End of a token
            tokens.push(token);
            token = '';
        } else {
            token += char;
        }
    }

    tokens.push(token); // push the last token

    return tokens.map(token => token.trim().replace(/^"|"$/g, '')); // remove leading/trailing quotes
}


ELMNT.define(DataImportWindow);

