class iComments extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    x;

    // --- Private Properties --- //
    #value = [];
    #loaded = false;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['save','click',this._onSaveComment ]
        ];
    }

    // --- Setters & Getters --- //
    set value(comments){
        this.shadow.getElementById('list').innerHTML = '';
        if (Array.isArray(comments) && comments.length > 0){
            comments.sort((a,b) =>{ return a.date > b.date ? -1 : 1 });
            comments.forEach(comment => {
                const $row = this.#getRow(comment);
                this.shadow.getElementById('list').insertAdjacentHTML('beforeend', $row);
            });
        }
    }

    get value(){}

    set readOnly(v){
        this.$el('head').style.display = v === true ? 'none' : '';
    }

    // --- Public Methods --- //


    // --- User Events --- //

    async _onSaveComment(){
        const commentText = this.$el('comment').value;
        if (!commentText){return}
        
        try{
            const comment = {
                pk: this.__path.pk ,
                sk: this.__path.sk,
                comment: commentText
            }
            console.debug('Save Comment',comment);
            const newComment = await Global.post('data',{action:'comment'},comment)
            const $row = this.#getRow(newComment);
            this.$el('list').insertAdjacentHTML('afterbegin', $row);
            this.$el('comment').value = '';
        } catch (e){
            const errText = e.toString();
            console.warn('Comment Error:', errText);
            window.alert('Comment Error:' + errText);
        }
    }

    // --- Private Helpers --- //

    #getRow(comment){
        const D = new Date(comment.date)
        let fDate = D.toLocaleDateString() + ' ' +  D.toLocaleTimeString();
        return (
        `<div class="list-item">
            <span class="comment-content">
                <span class="stat">
                    <b class="on">${fDate}</b> by <b class="by">${comment.user}</b>
                </span>
                <span class="comment">${comment.comment}</span>
            </span>
        </div>`);
    }

    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'i-comments';

    static Html = (
        `<div class="head" id="head">
        <div class="comment-window">
            <textarea id="comment" placeholder="New Comment"></textarea>
            <button id="save" class="material-symbols-outlined save-btn">save</button>
        </div>
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
            margin-top: 2.5em;
            margin-bottom: 1em;
            width: 100%;
            box-sizing: border-box;
        }
        .load-btn{
            display: inline-block;
            min-width: 5em;
            padding: .5em;
            margin-bottom: 2em;
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
            width: 95%;
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


ELMNT.define(iComments);


