class AdminModule extends ModuleBaseClass
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    controllerTag = 'dataset-controller-admin';
    icon = 'admin';
    
    // --- Static Defs   --- //
    static Tag = 'admin-module';
}


ELMNT.define(AdminModule);

