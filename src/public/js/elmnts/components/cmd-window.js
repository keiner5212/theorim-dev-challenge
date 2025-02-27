
class cmdWindow extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }


    // --- Private Properties --- //
    #open = false;
    #shorcuts = [
        // ['Alt', 'Show Shortcuts'],
        // ['ctl S', 'Save'],
        // ['ctl C', 'Copy Selected'],
        // ['ctl X', 'Cut'],
        // ['Enter','New Item']
        'Logout',
        'Refresh',
        'Enable Logs'
    ];

    // --- Events --- //

    // --- Lifecycle Hooks --- //

    connectedCallback(){
        // Generate Shortcuts
        let html = '';
        this.#shorcuts.forEach(sc=>{
            html += `<span>${sc}</span>`;
        });
        this.shadow.innerHTML = html;
        // Add Event Listener
        window.addEventListener('cmd-window',()=>{
            this.#open = this.classList.contains('open') ? false : true;
            this.classList.toggle('open', this.#open);
        })
        window.addEventListener('keyup', (ev)=>{
            if (ev.key === 'Alt'){ 
                this.#open = this.classList.contains('open') ? false : true;
                this.classList.toggle('open', this.#open);
                return; 
            } else if (this.#open === true){
                this.#open = false;
                this.classList.toggle('open', this.#open);
            }
        });
        this.shadow.addEventListener('click',(ev)=>{ 
            if (!ev.target.textContent){ return }
            const fn = this[ev.target.textContent.replaceAll(' ','')];
            if (fn){ fn(ev); }
        })
    }

    // --- User Event --- //
    async Logout(){
        console.debug('Logout');
        localStorage.clear();
        sessionStorage.clear();
        const r = await fetch('/api/logout');
        window.location.reload();
    }

    Refresh(){
        console.debug('Refresh');
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    }

    EnableLogs(ev){
        localStorage.setItem('logLevel',true);
        console.log('Verbose logging ON');
        window.location.reload();
    }

    // --- Static Defs   --- //
    static Tag = 'cmd-window';

    static Css = (
        `:host{
            display: flex;
            justify-content: center;
            background: var(--bg1);
            color: var(--f4);
            font-size: 12px;
            align-items: center;
            width: calc(100vw - 3.5rem);
            height: 2.5rem;
            position: fixed;
            z-index: 999;
            padding: 0 1em;
            margin-left: 3rem;
        }
        :host(:not(.open)){
            display: none;
        }
        span:first-child i{
            width: 2em;
        }
        span{
            display: inline-flex;
            align-items: center;
            padding: 0 1.5em;
            cursor: pointer;
            min-width: 8em;
        }
        span:hover{
            color: var(--bg-3-active);
        }
        i{
            display: inline-block;    
            font-style: normal;
            font-weight: normal;
            min-width: 1.5em;
            padding: 0 2px;
            height: 1.5em;
            text-align: center;
            border-radius: 0;
            border: 1px solid rgba(255,255,255,0.5);
            padding: 0;
        }
        b{
            display: inline-block;
            padding-left: .5em;
            padding-right: 1em;
            font-weight: normal
        }`
    );

}


ELMNT.define(cmdWindow);

