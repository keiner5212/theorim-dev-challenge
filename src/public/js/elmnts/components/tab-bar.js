
class TabBar extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    x;

    // --- Private Properties --- //
    #x;

    // --- Lifecycle Hooks --- //
    static observedAttributes = ['title','icon'];

    get Events(){
        return [
            [this.shadow,'click',this._onTabClick,{selector: 'button[data-id]'}]
        ];
    }

    connectedCallback(){}

    // --- Setters & Getters --- //
    set title(v){
        this.$el('title').innerText = v;
    }
    set icon(v){
        this.$el('icon').setAttribute('icon',v);
    }

    set buttons(v){
        let html = '';
        let activeClass = ' active';
        for (const b of v){
            let order = isNaN(parseInt(b.order)) ? 999 : parseInt(b.order);
            html += `<button style="order:${order};" class="admin-button${activeClass}" data-id="${b.id}">${b.title}</button>`
            activeClass = '';
        }
        this.shadow.innerHTML += html;
    }

    set value(v){
        this.$qs('button.active')?.classList.remove('active');
        this.$qs(`button[data-id="${v}"]`)?.classList.add('active');
    }

    get value(){
        return this.$qs('button.active')?.dataset.id;
    }

    // --- Public Methods --- //

    // --- User Events --- //
    _onTabClick($btn){
        if ($btn.classList.contains('active')){ return; }
        this.$qs('button.active')?.classList.remove('active');
        $btn.classList.add('active');
        this.dispatchEvent(new Event('change'));
    }

    // --- Private Helpers --- //

    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'tab-bar';

    static Html = (
    `<button class="title">
        <app-icon id="icon"></app-icon>
        <span id="title"></span>
    </button>`);

    static Css = (
        `:host{
            flex: 0 0 2.5rem;
            overflow: hidden;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            position: relative;
            z-index: 99;
            background: var(--bg3);
            color: var(--f3);
            border-bottom: 1px solid rgb(57 57 57);
        }
        .admin-select-item{
            border-right: 3px solid rgb(200 200 200);
            height: 100%;
            color: white;
            font-size: 1.2em;
            font-weight: 600;
        }
        .title{
            height: 100%;
            width: 20em;
            text-align: left;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            padding: 0;
            white-space: nowrap;        
            overflow: hidden;           
            text-overflow: ellipsis;  
            color: var(--f4);
        }
        #title{
            font-size: 1.2em;
        }
        #icon{
            width: 2.5rem;
            height: 1.3rem;
            text-align: center;
            fill: var(--f4);
        }
        .admin-button{
            border: none;
            border-right: 1px solid rgba(0,0,0,.1);
            border-top: 3px solid transparent;
            color: rgb(170 170 170);
            text-transform: uppercase;
            font-weight: 700;
            font-size: .9em;
            padding: 10px 20px 10px 10px;
            min-width: 120px;
            height: 100%;
            margin: 0;
            transition: opacity .2s ease-in-out;
            font-family: var(--ttl);
            cursor: pointer;
            display: flex;
            align-items: center;
        }
        .admin-button:before{
            content: '⬤';
            font-size: .7em;
            margin-right: 5px;
            opacity: 0;
        }
        .admin-button.active{
            color: white;
            background: rgba(255,255,255,.1);
            border-top: 3px solid var(--bg3-active);
        }
        .admin-button.active:before{
            opacity: 1;
            color: var(--bg3-active);
        }
        .admin-button:hover{
            color: white;
        }`
    );

}


ELMNT.define(TabBar);

