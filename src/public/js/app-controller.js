// @import Global.Config.entitlements, Global.Config.loaded

class AppController extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    x;

    // --- Private Properties --- //
    #module = {};
    #activeModule;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['navbar','navbar',this._onNav]
        ];
    }

    connectedCallback(){
        // Activate Item Module
        const urlParams = new URLSearchParams(window.location.search);
        const itemPath = urlParams.get('item');
        // if (window.location.pathname.startsWith('/item')){
        if (itemPath){
            this.#renderItem(itemPath);
            this.$el('splash').remove();
            return
        }
        // Activate Module
        const [moduleToActive,subPage] = this.#getModuleToActivate();
        this.#renderAll().then(()=>{ 
            if (moduleToActive && Global.AppModules[moduleToActive]){
                this.$el('splash').remove();
                this.$el('navbar').activate(moduleToActive,subPage);
                this.#module[moduleToActive].activate(subPage);
                this.#activeModule = this.#module[moduleToActive];
            } else if (Object.keys(Global.AppModules).length === 0){
                this.$el('splash').access = false;
            }
        });
    }

    // --- User Events --- //
    _onNav(ev){
        // Define Module to Activate
        const moduleName = ev.detail.module;
        const pageId = ev.detail.pageId;

        this.#activeModule?.deactivate();

        // Activate Module
        this.#module[moduleName].activate(pageId);
        this.#activeModule = this.#module[moduleName];

        // Remove Splash
        this.$el('splash')?.remove();

        // Set Active Module
        localStorage.setItem('last-module',moduleName);
        localStorage.setItem('last-module-subpage',pageId);
    }

    // --- Private Helpers --- //
    #renderItem(itemPath){
        const $itemModule = document.createElement('item-module');
        $itemModule.activate(itemPath);
        this.$el('main').appendChild($itemModule);
        document.body.classList.remove('unloaded');
    }

    async #renderAll(){
        await Global.loaded;
        this.$el('navbar').modules = Global.AppModules;
        const $frag = document.createDocumentFragment();
        for (const mKey in Global.AppModules){
            const $module = document.createElement(Global.AppModules[mKey].tag);
            $module.id = mKey;
            $frag.appendChild($module);
            this.#module[mKey] = $module;
            $module.pages = Global.AppModules[mKey].pages;
        }
        this.$el('main').appendChild($frag);
    }

    #getModuleToActivate(){
        const urlParams = {};
        const rawParams = new URLSearchParams(window.location.search);
        for (const [key, value] of rawParams.entries()) { urlParams[key] = value; }

        let moduleToLoad = null;
        if (Object.keys(urlParams)[0] && Global.AppModules[Object.keys(urlParams)[0]]){
            moduleToLoad = Object.keys(result)[0];
            const pageId = Object.entries(result)[0][1];
            return [moduleToLoad,pageId];
        // Check Local Storage
        } else {
            return [localStorage.getItem('last-module'), localStorage.getItem('last-module-subpage')];
        }
    }

    // --- Private SubHelpers --- //


    // --- Static Methods --- //
    static pageToActivate(){

    }

    // --- Static Defs   --- //
    static Tag = 'app-controller';
    static Html = (
        `<nav-bar id="navbar"></nav-bar>
        <main id="main">
            <splash-screen id="splash"></splash-screen>
        </main>`
    );

    static Css = (
        `main{
            position: absolute;
            width: 100vw;
            padding-left: 3rem;
            height: 100vh;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            font-size: .9em;
        }
        main > *:not(.active){
            display: none !important;
        }
        main:empty{
            display: none;
        }
        admin-page-controller{
            width: 100%;
            height: 100%;
        }`
    );

}


ELMNT.define(AppController);

