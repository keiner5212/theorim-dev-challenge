
class eTable extends ELMNT
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
    get Events(){
        return [
            ['targetId','action','function' ]
        ];
    }

    connectedCallback(){
        // Add User Events --- //
    }

    // --- Setters & Getters --- //
    set y(v){}

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
    static Tag = '';
    static Html = (``);

    static Css = (``);

}


ELMNT.define(eTable);

