// import

class ModuleBaseClass extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    
    
    //  --- Public Properties --- //
    pages = [];
    $page = {};

    // --- Private Properties --- //
    #rendered = false;
    #activePage = null;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [];
    }

    connectedCallback(){}

    // --- Setters & Getters --- //

    // --- Public Methods --- //
    activate(pageId){
        if (!this.#rendered){ this.#render();}
        if (this.#activePage && this.#activePage.id !== pageId){
            this.#activePage.hide();
        }
        // Activate Page
        this.#activePage = this.$el(pageId) || this.$el(this.pages[0].name);
        this.#activePage.show();
        this.classList.add('active');
    }

    deactivate(){
        this.classList.remove('active');
    }

    // --- User Events --- //

    // --- Internal Events --- //

    // --- Private Helpers --- //
    #render(){
        // Generate Owner Data Pages
        this.pages.forEach((page)=>{
            const $page = document.createElement(this.controllerTag || 'dataset-controller');
            $page.ds = page.name;
            $page.title = page.title;
            $page.icon = this.icon || '';
            this.shadow.appendChild($page);
        });
        this.#rendered = true;
    }

    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Css = (
        `:host{
            width: 100%;
            height:100%;
            overflow: hidden;
        }
        :host > *:not(.active){
            display:none;
        }`
    );

}

