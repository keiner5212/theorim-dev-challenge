// import

class OwnerModule extends ModuleBaseClass
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Public Properties --- //
    controllerTag = 'dataset-controller-modeler';
    icon = 'schema';
    
    // --- Static Defs   --- //
    static Tag = 'modeler-module';
}


ELMNT.define(OwnerModule);

