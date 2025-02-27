// import

class AiModule extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }

    
    
    //  --- Public Properties --- //
    entitlements = [];

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
        this.classList.add('active');
    }

    deactivate(){
        this.classList.remove('active');
    }

    // --- User Events --- //

    // --- Internal Events --- //

    // --- Private Helpers --- //
    // #render(){
    //     // Generate Owner Data Pages
    //     this.entitlements.forEach((page)=>{
    //         const dataPage = document.createElement('owner-data-page');
    //         dataPage.id = page.name;
    //         dataPage.pk = page.pk;
    //         dataPage.dataset.title = page.title;
    //         this.shadow.appendChild(dataPage);
    //     });
    //     this.#rendered = true;
    // }

    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'ai-module';

    static Html = (`<div><b>Stop clicking the fucking button Ospina</b></div>`);

    static Css = (
        `:host{
            width: 100%;
            height:100%;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
        }`
    );

}


ELMNT.define(AiModule);

