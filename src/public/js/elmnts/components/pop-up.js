
class PopUp extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }


    // --- Private Properties --- //
    

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['close','click', this._onClose]
        ]
    }

    set title(v){
        this.$el('title').innerHTML = v;
    }

    set content(v){
        this.$el('content').innerHTML = v;
    }

    _onClose(){
        this.remove();
    }

    // --- Static Defs   --- //
    static Tag = 'pop-up';
    static Html = (
        `<section class="title">
            <div id="title"></div>
            <div id="controls">
                <span class="control" id="close">x</span>
            </div>
        </section>
        <section class="content"></section>`
    )
    static Css = (
        `:host{
            position: absolute;
            z-index: 11111;
            width: 60vw;
            height: fit-content;
            margin: 20vh auto;
        }
        .title{
            background: var(--bg2);
            color: var(--f4);
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 1.5rem;
        }
        .title #title{
            flex: 1 1 100%;
        }
        #controls{
            display: flex;
            align-items: center;
            flex: 1 0 auto;
        }
        #close{
            background: var(--bg3-active);
            color: white;
            border-radius: 50%;
            font-size: .65rem;
            width: 1rem;
            height: 1rem;
        }`
    );

}


ELMNT.define(cmdWindow);

