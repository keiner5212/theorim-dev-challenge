

class iHistory extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    x;

    // --- Private Properties --- //
    #value = [];
    #path;
    #loaded = false;
    #ds;
    #jtable;
    #sk;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['show','click',this._onLoadHistory ]
        ];
    }

    connectedCallback(){
        // Add User Events --- //
    }

    // --- Setters & Getters --- //
    set value(v){
        this.$el('list').innerHTML = '';
        this.$el('show').disabled = false;
    }

    get value(){}


    set $path(v){
        this.#path = v;
        // this.#ds = v.split(':')[0].split('#')[0];
        // this.#jtable = v.split(':')[0].split('#')[1];
        // this.#sk = v.split(':')[1];
    }

    // --- Public Methods --- //


    // --- User Events --- //
    async _onLoadHistory(){
        try{
            const now = new Date();
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0')
            // const params = {dataset: this.#ds, jtable: this.#jtable, sk: this.#sk}
            const historyRes = await Global.get('data',{
                dataset: this.__path.dataset,
                jtable: this.__path.jtable + '$history',
                sk: `${this.__path.uid}+${year}_${month}`
            });
            const history = historyRes.Items || [];
            history.sort((a,b) =>{ return a.date > b.date ? -1 : 1 });
            history.forEach(h => {
                const $row = this.#getRow(h);
                this.shadow.getElementById('list').insertAdjacentHTML('beforeend', $row);
            });
            this.$el('show').disabled = true;
        } catch (e){
            console.warn('Load History Error:', e);
        }
    }

    // --- Private Helpers --- //
    #getRow(history){
        return (
        `<div class="list-item">
            <span class="comment-content">
                <span class="stat">
                    <b class="on">${history.date}</b> by <b class="by">${history.user}</b>
                </span>
                <span class="comment">${history.msg}</span>
            </span>
        </div>`);
    }

    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'i-history';

    static Html = (
    `<div class="head" id="head">
        <button id="show" class="load-btn">Show History</button>
    </div>
    <div class="list" id="list"></div>`
    );

    static Css = (
        `:host{
            display: block;
            font-size: inherit;
            font-family: inherit;
            color: inherit;
            overflow: hidden;
        }
        .head{
            flex: 0 0 auto;
            margin-top: .5em;
            width: 100%;
            padding: .5em;
            box-sizing: border-box;
        }
        .load-btn{
            display: inline-block;
            min-width: 5em;
            padding: .5em;
            cursor: pointer;
            text-align: center;
            font-size: .9em;
            color: rgba(0,0,0,.65);
            font-weight: 600;
            background: rgb(240,240,240);
            border: none;
        }
        
        .load-btn:hover{
            background: rgb(229 229 229);
        }
        .load-btn:active{
            background: rgb(220 220 220);
        }
        .load-btn:disabled{
            opacity: .5;
        }
        .comment-window{
            display: flex;
            align-items: flex-start;
            border: 1.5px solid rgb(221, 221, 221);
            background: white;
            width: 100%;
            padding: .5em;
            font-size: .9em;
        }
        .save-btn{
            flex: 0 0 auto;
            color: var(--btn);
            cursor: pointer;
            opacity: .5;
        }
        .save-btn:hover{
            opacity: 1;
        }
        .head textarea{
            display: block;
            width: 100%;
            height: 6em;
            background: none;
            padding: 0 .5em;
            font-size: inherit;
            font-family: inherit;
            color: inherit;
            border: none;
            resize: none;
        }
        textarea:focus{
            outline: none;
        }
        .list{
            overflow-x: hidden;
            overflow-y: auto;
            max-height: 60em;
            min-height: 10em;
            padding: 1.5em 1em 1em 1em;
            box-sizing: border-box;
        }
        .list:empty{
            display: none;
        }
        .list-item{    
            padding: .75em;
            background: white;
            font-size: .95em;
            overflow: hidden;
            display: flex;
            align-items: stretch;
            margin-bottom: 2em;
            border-radius: 6px;
            border: 1.5px solid rgb(235 235 235);
        }
        .ico{
            flex: 0 0 1.5em;
            fill: rgb(180 180 180);
            overflow: hidden;
            display: flex;
            align-items:center;
        }
        .comment-content{
            background: white;
            flex: 1 1 100%;
        }
        .stat{
            display: block;
            font-size: .9em;
            padding-bottom: 1.25em;
            color: rgb(100 100 100);
        }
        .on,.by{
            font-weight: normal;
        }`
    );
}


ELMNT.define(iHistory);


