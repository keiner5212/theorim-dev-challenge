class RestoreDataWindow extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //

    // --- Private Properties --- //
    #data = [];
    #importFields = [];

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['upload','click',this._onUploadClick ],
            ['file','change',this._onFileUpload ],
            ['submit','click',this._onSubmit ],
            ['cancel','click',this._onCancel ]
        ];
    }

    connectedCallback(){
        // Add User Events --- //
        this.dataset.state = 'ready-for-file';
    }

    // --- Setters & Getters --- //

    // --- Public Methods --- //

    // --- User Events --- //
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
                this.#data = JSON.parse(content);
                this.dataset.state = 'ready-for-import';
                this.$el('results').innerText = `${this.#data.length} Records Ready for Import as ${this.pk.replace('defs#','')}`;
            } catch (e){
                console.warn('Invalid File Format', e);
                window.alert('Invalid File Format:' + e);
                return;
            }
        };
        reader.readAsText(file);
    }

    async _onSubmit(){
        try{
            const restoreData = {
                    pk: this.pk,
                    sk: 'dataset',
                    data: this.#data
            }
            console.debug('Restore Data:',restoreData);
            const results = await Global.Api.Owner.restore_data(restoreData);
            if (results === true){
                this.dispatchEvent(new CustomEvent('complete',{detail:this.data}));
                this.dataset.state = 'upload-complete';
            } else {
                console.warn('Error Importing Schema:',results);
                this.$el('results').innerText = results;
            }
        } catch (e){
            console.warn('Error Importing Schema:',e);
            this.$el('results').innerText = e;
        }
    }

    _onCancel(){
        this.#data = null;
        this.remove();
    }

    // --- Private Helpers --- //


    // --- Static Defs   --- //
    static Tag = 'restore-data-window';

    static Html = (
        `<div class="title"><span>RESTORE DATA</span><button id="cancel">✕</button></div>
        <div class="controls">
            <button id="upload" class="dyn ready-for-file">Upload File</button>
            <button id="submit" class="dyn ready-for-import">Import Data</button>
        </div>
        <div id="results" class="results">
            Import a schema
        </div>
        <input type="file" id="file" style="visibility:hidden;" accept="application/json;text/csv"/>`
    );

    static Css = (
        `:host{
            position: absolute;
            display: flex;
            flex-direction: column;
            width: 400px;
            height: 300px;
            margin-top: 50px;
            margin-left: calc(50% - 200px);
            background-color: #1c1f24;
            border: 1px solid rgb(100 100 100);
            color: rgb(200 200 200);
            z-index: 1000;
            box-shadow: rgba(0, 0, 0, 0.36) 0px 0px 8px 2px;
            overflow: hidden;
        }
        .dyn{
            display: none;
        }
        :host([data-state="ready-for-file"]) .dyn.ready-for-file{
            display: block;
        }
        :host([data-state="ready-for-import"]) .dyn.ready-for-import{
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
        .controls{
            display: flex;
            justify-content: flex-start;
            margin: 1em 0;
            padding: 1em;
            flex: 0 0 auto;
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
        .controls button:hover{
            background: black;
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
            text-align: center;
            padding: 1em;
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


ELMNT.define(RestoreDataWindow);

