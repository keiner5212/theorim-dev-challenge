

class DatasetControllerAdmin extends DatasetController
{
    
    // Constructor
    constructor(){
        super();
    }

    //  --- Events --- //
    _onRender(){
        for (const pageName of Object.keys(this.pages)){
            const $table = this.pages[pageName].table;
            $table.showArchive = false;
            $table.contextMenuOptions = [];
            $table.removeControl('exp-json');
            $table.removeControl('exp-csv');
            $table.removeControl('import');
        }
    }
    // --- Static Defs   --- //
    static Tag = 'dataset-controller-admin';
}


ELMNT.define(DatasetControllerAdmin);

