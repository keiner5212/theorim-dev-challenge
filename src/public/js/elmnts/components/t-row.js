
class tRow extends HTMLElement
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
    connectedCallback(){
        // Add User Events --- //
    }

    // --- Setters & Getters --- //
    set selected(v){
        this.querySelector('.item').classList.toggle('selected',v);
    }

    get $item(){
        return this.querySelector('.item');
    }

    // --- Public Methods --- //
    getY(){}

    // --- User Events --- //
    _onEvent(){}

    // --- Private Helpers --- //
    #checkState(){}

    // --- Private SubHelpers --- //
    #get_value(){}

    // --- Static Methods --- //
    static helper(){}

    // --- Static Defs   --- //

}


customElements.define('t-row', tRow);

