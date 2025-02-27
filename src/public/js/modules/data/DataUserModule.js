class DataUserModule extends ModuleBaseClass
{
    
    // Constructor
    constructor(){
        super();
    }

    options = {
        archive: true
    };
    icon = 'data';

    // --- Static Defs   --- //
    static Tag = 'data-module';
}


ELMNT.define(DataUserModule);