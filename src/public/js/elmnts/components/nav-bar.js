// @import Global.Config.entitlements

class NavBar extends ELMNT
{
    constructor(){ super(); }

    
    //  --- Public Properties --- //

    // --- Private Properties --- //


    // --- Lifecycle Hooks --- //
    get Events(){
        return [
            ['keyboard','click', this._onShowKeyboard],
            ['page-type','click', this._onSidebarClick],
            ['menu-content','click', this._onRowClick, {selector: '.row'}],
            
        ]
    }

    connectedCallback(){
        
    }


    /// --- Public Setters --- //
    set modules(v){
        // Create Buttons
        let btnHtml = '';
        let html = '';
        for (const moduleName in v){
            const moduleDef = v[moduleName];
            btnHtml += NavBar.button(moduleName, moduleDef );
            if (!moduleDef.subpages){ continue; }
            for (const page of moduleDef.pages){
                html += NavBar.row(page,moduleName);
            }
            this.$el('menu-content').innerHTML = html;
        }
        this.$el('page-type').innerHTML = btnHtml;
        this.classList.remove('unset');
        this.classList.add('loaded');
    }


    // --- Public Methods --- //
    activate(module,pageId){
        console.debug('Activate module:',module,'page:',pageId)
        this.$qs('.nav-button.active')?.classList.remove('active');
        this.$qs(`.nav-button#${module}`).classList.add('active');
        this.$qs('.row.active')?.classList.remove('active');
        this.$el(`${module}-${pageId}`)?.classList.add('active');
        this.$qsa('.row').forEach($row => {
            $row.style.display = $row.dataset.module === module ? '' : 'none';
        })
    }
    

    // --- User Events --- //
    _onSidebarClick(ev){
        const $btn = ev.target.closest('.nav-button');
        // If not a button, close sidebar
        if (!$btn){ 
            this.classList.remove('open');
            this.$qs('.nav-button.open')?.classList.remove('open');
            return;
        }
        // If no subpages, activate page
        if ($btn.dataset.subpages === 'false'){
            if ($btn.classList.contains('active')){ return }
            this.$qs('.nav-button.active')?.classList.remove('active');
            $btn.classList.add('active');
            this.classList.remove('open');
            this.dispatchEvent(new CustomEvent('navbar',{detail: { module: $btn.id } }));
            return
        }
        // Open with subpages
        if ($btn.classList.contains('open')){
            $btn.classList.remove('open');
            this.classList.remove('open');
            return;
        }
        // Closed with subpages
        if (!$btn.classList.contains('open')){
            this.$qs('.nav-button.open')?.classList.remove('open');
            $btn.classList.add('open');
            this.$qsa('.row').forEach($row => {
                $row.style.display = $row.dataset.module === $btn.id ? '' : 'none';
            })
            this.$el('module-title').innerText = $btn.dataset.title;
            this.$el('module-ico').innerHTML = `<app-icon icon="${Global.AppModules[$btn.id].icon}"></app-icon>`;
            this.classList.add('open');
            return;
        }
    }

    _onRowClick($row){
        const pageId = $row.dataset.pageid;
        const pageTitle = $row.dataset.title;
        const module = $row.dataset.module;
        this.$qs('.row.active')?.classList.remove('active');
        $row.classList.add('active');
        this.dispatchEvent(new CustomEvent('navbar',{detail: { module, pageId, pageTitle } }));
        this.classList.remove('open');

        // Activate Button
        this.$qs('.nav-button.active')?.classList.remove('active');
        this.$qs(`.nav-button#${module}`).classList.add('active');
    }

    _onShowKeyboard(){
        window.dispatchEvent(new CustomEvent('cmd-window'));
    }

    async _onLogout(){
        console.debug('Logout');
        localStorage.clear();
        sessionStorage.clear();
        const r = await fetch('/logout');
        window.location.reload();
    }

    _onEnableLogs(ev){
        localStorage.setItem('logLevel',true);
        console.log('Verbose logging ON');
        window.location.reload();
    }


    // --- Private Helpers --- //

    //  --- Static Helpers --- //
    static button(id,m){
        return (
            `<span class="nav-button" id="${id}" data-title="${m.title}" data-subpages="${m.subpages}">
                <app-icon icon="${m.icon}" tooltip="${m.title}"></app-icon>
            </span>`
        );
    }

    static row(page,moduleName){
        const ico = {
            owner: 'edit',
            user: 'database'
        }[moduleName] || '';
        return (
            `<div class="row" id="${moduleName}-${page.name}" data-pageid="${page.name}" data-pk="${page.pk}" data-module="${moduleName}" data-title="${page.title}">
                <span class="material-symbols-outlined">${ico}</span>    
                <span class="name">${page.title}</span>
            </div>`
        );
    }

    // --- Static Defs --- //
    static Tag = 'nav-bar';

    static Html = (
        `<section id="sidebar" class="sidebar">
            <div class="logo-box">
                <img src="./img/logo_white_blue.svg"/>
            </div>
            <div class="info" id="page-type"></div>
            <div class="nav-controls">
                <app-icon icon="menu" id="keyboard"></app-icon>
            </div>
        </section>
        <section class="menu">
            <div class="menu-title">
                <span id="module-title">Modeler</span>
                <span id="module-ico" class="menu-icon material-symbols-outlined">data_object</span>
            </div>
            <div class="menu-content" id="menu-content"></div>
        </section>`
    );

    static Css = (
        `:host{
            position: fixed;
            display: flex;
            flex-direction: row;
            height: 100vh;
            color: var(--f4);
            z-index: 100;
            width: 3em;
            overflow: hidden;
            background: var(--bg1);
            fill: var(--f4);
            border-right: 1px solid var(--bg4);
        }
        :host(:not(.loaded)){
            opacity: 0;
        }
        :host(.open){
            width: 20em;
        }
        .sidebar{
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            flex: 0 0 3rem;
            height: 100%;
        }
        .nav-controls{
            flex: 0 0 1.4rem;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            fill: white;
        }
        .nav-controls app-icon{
            height: 100%;
        }
        .menu{
            flex-grow: 1;
            flex-basis: 0;
            flex-shrink: 1;
            height: 100%;
            transition: flex-grow .3s linear;
        }
        :host(:not(.open)) .menu > *{
            display: none;
        }
        :host(.open) .menu{
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            flex: 1 1 100%;
            border-right: 1px solid rgb(140 140 140);
        }
        .menu-title{
            font-size: .9em;
            text-transform: uppercase;
            height: 2.5em;
            display: flex;
            align-items: center;
            flex-direction: row;
            fill: white;
            justify-content: space-between;
            padding-left: 1em;
            border-bottom: 1px solid rgba(200, 200, 200, 0.2);
        }
        .menu-icon{
            width: 2em;
            padding: 10px;
            box-sizing: border-box;
        }
        .menu-content{
            padding-top: 1em;
        }
        .row{
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: .5em;
            justify-content: flex-start;
            cursor: pointer;
        }
        .row .material-symbols-outlined{
            font-size: 1.25em;
            padding-right: .5em;
        }
        .row:hover{
            color: white;
        }
        .row .name{
            display: flex;
            align-items: center;
        }
        .row.active .name{
            color: var(--bg1-active);
        }
        .logo-box{
            width: 100%;
            height: 2.5rem;
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            flex: 0 0 auto;
            font-family: var(--ttl);
            font-size: 1.2em;
        }
        .logo-box img{
            height: 1.5rem;
            padding: 5px;
            width: auto;
            opacity: .85;
        }
        .info{
            flex: 1 1 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            overflow: hidden;
        }
        :host(.unset) .nav-button{
            opacity: 0;
        }
        app-icon{
            cursor: pointer;
            fill: inherit;
        }
        .nav-button{
            transition: opacity .3s linear;
            opacity: 1;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            font-size: 1em;
            overflow: hidden;
            padding: 1em 0;
            width: 100%;
            transition: background .1s ease-in-out, box-shadow .1s ease-in-out;
        }
        .nav-button app-icon{
            height: 4em;
            max-width: 100%;
            padding: .75em;
        }
        .nav-button:not(.active):hover{
            fill: var(--bg1-active);
        }
        .nav-button.active{
            fill: var(--bg1-active);
        }
        .nav-button.open{
            background: rgba(200,200,200,.2);
        }
        .info:hover .nav-button-text{
            opacity: 1;
        }`
    )


}


ELMNT.define(NavBar);