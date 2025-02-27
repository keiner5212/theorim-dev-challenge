
class DataeTable extends elTable
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
    // get Events(){
    //     return [
    //         ['targetId','action','function' ]
    //     ];
    // }

    connectedCallback(){
        this.id = 'ages';  
        const data = [];
        this.views = [
            {
                name: 'default',
                title: 'Default',
                cols: [
                    {name: 'id', title: 'ID', width: 2},
                    {name: 'name', title: 'Name', width: 10},
                    {name: 'age', title: 'Age', width: 5},
                    {name: 'parent', title: 'Parent', width: 5},
                ]
            },
            {
                name: 'olds',
                title: 'Olds',
                cols: [
                    {name: 'name', title: 'Name', width: 10},
                    {name: 'age', title: 'Age', width: 5},
                ],
                filters: [
                    {col: 'age', operator: 'greater', value: 50}
                ],
                sort: [
                    {col: 'age', dir: 'desc'}
                ]
            }
        ];
        this.objects = [
            { name: 'parent', icon: 'device_hub' , top: true, create: true,delete:true},
            { name: 'child', icon: 'folder' , parents: ['parent'], create: true,delete:true},
        ];
        // this.objects = {
        //     person: {name: 'person', icon: 'device_hub' , top: true},
        //     child: {name: 'child', icon: 'folder' , parents: ['person']},
        // };
        for (let i = 0; i < 1000; i++) {
            const r = {
                id: i,
                name: 'Name ' + i,
                age: Math.floor(Math.random() * 100),
                __icon: 'device_hub',
                __id: i,
                __object: 'parent'
            };
            if (i % 20 !== 0){
                r.__parent = Math.floor(i/20)*20;
                r.__icon = 'folder';
                r.__object = 'child';
                r.age = r.__parent
            }
            data.push(r);
        }       
        this.load(data,'id');
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
    static Tag = 'data-el-table';
    static Css = elTable.Css;
}


ELMNT.define(DataeTable);

