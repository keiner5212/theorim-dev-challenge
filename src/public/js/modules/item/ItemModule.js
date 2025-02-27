// import { API } from './helpers/Api.js';

class ItemModule extends ELMNT
{
    
    // Constructor
    constructor(){
        super();
    }
    
    //  --- Public Properties --- //

    // --- Private Properties --- //
    #rendered = false;

    // --- Lifecycle Hooks --- //
    get Events(){
        return [];
    }

    connectedCallback(){}

    // --- Setters & Getters --- //

    // --- Public Methods --- //
    async activate(itemPath){
        this.classList.add('active');
        const [dataset, jtable, skPlus,uid] = itemPath?.split('/');
        const sk = skPlus.replaceAll(' ','+');
        console.debug('Get Item',dataset, jtable,sk,uid);
        if (!dataset || !jtable || !sk){
            this.shadow.innerHTML = 'Invalid Path';
            return;
        }
        
 
        // Get Item
        try{
            const [def,dataRes] = await Promise.all([
                Global.get('def',{dataset: dataset}),
                Global.get('data',{ dataset: dataset, jtable: jtable, sk: sk})
            ]);
            if (!dataRes || dataRes.Items?.length == 0){
                console.log('Item Not Found');
                const uidRes = Global.get('data',{ dataset: dataset, jtable: jtable}, {__uid: uid})
                if (!uidRes || uidRes.Items?.length == 0){
                    this.shadow.innerHTML = 'Item Not Found: ' + dataset + '/' + jtable + '/' + sk;
                }
                return
            }
            // Set Def
            const $form = this.shadow.querySelector('elmnts-form')
            const data = dataRes.Items[0];
            const jt = def.jtables.find(s => s.name == jtable);
            const schema = jt.schemas.find(s => s.$id == data.__object);
            $form.pk = `${dataset}/${jtable}`;
            $form.schemas = [schema];
            // Set Data
            $form.data = data;
        } catch (err){
            console.warn(err);
            this.shadow.innerHTML = 'Item Not Found: ' + this.id;
        }
        this.classList.add('active');
    }

    deactivate(){
        this.classList.remove('active');
    }

    // --- User Events --- //

    // --- Internal Events --- //

    // --- Private Helpers --- //

    // --- Static Methods --- //


    // --- Static Defs   --- //
    static Tag = 'item-module';

    static Html = (
        `<elmnts-form id="form"></elmnts-form>`
    );

    static Css = (
        `:host{
            position:fixed;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 50px;
            box-sizing: border-box;
            overflow: hidden;
            background: rgb(245 245 245);
            z-index: 1000;
          }
          elmnts-form {
            height: 100%;
            width: 100%;
            max-width: 1100px;
            min-width: 600px;
          }`
    );

}


ELMNT.define(ItemModule);

