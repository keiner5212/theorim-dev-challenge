

class DatasetControllerModeler extends DatasetController
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
            $table.addControl({
                id: 'exp-schema',
                icon: 'cloud_download',
                tooltip: 'Export Schema',
                callback: this._onExport.bind(this)
            });
            $table.addControl({
                id: 'import-schema',
                icon: 'cloud_upload',
                tooltip: 'Export Schema',
                callback: this._onImport.bind(this)
            });
        }
    }


    _onImport(ev){
        const $activeDv = this.activeTable;
        const $newSchemaWindow = document.createElement('schema-import-window');
        $newSchemaWindow.pk = this.ds;
        document.body.appendChild($newSchemaWindow); 
        $newSchemaWindow.addEventListener('complete',()=>{
            $newSchemaWindow.remove();
            $activeDv.reload();
        })
    }

    async _onExport(){
        const res = await Global.get('data',{ dataset: this.ds, jtable: 'datasets' });
        const dsName = this.ds.split('$')[0];
        ELMNT.toFile(JSON.stringify(res.Items),`${dsName}-schema.json`);
    }

    // --- Static Defs   --- //
    static Tag = 'dataset-controller-modeler';
}


ELMNT.define(DatasetControllerModeler);

