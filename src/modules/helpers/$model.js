class DataModel
{
    constructor(role,dsName){
        this.name = 'datasets';
        this.title = role === 'admin' ? 'Datasets' : 'Modeler';
        this.description = 'Datasets, JSON Tables, Objects and Fields';
        this.$tableViews = [
            {
                name: 'Active Datasets',
                filters: [],
                query: null,
                cols: [
                   { name: 'title', width: 1 },
                ]
            }
        ];

        // SCHEMAS
        this.schemas = [
            this.dataset, 
            this.jtable, 
            this.schema,
            // Fields
            this.istring,
            this.ibool,
            this.inumber,
            this.imultiline,
            this.ilist,
            this.iselect,
            this.iuser,
            this.irole,
            this.idate,
            this.icdate,
            this.udate,
            // Complex
            this.itable,
            this.icomplex,
            this.ifile,
            this.irel
        ]

        this.schemas.forEach(schema=>{
            if (schema.$id === 'dataset'){
                schema.creators = ['admin']
                schema.deletors = ['admin']
            } else {
                schema.creators = [`${dsName}$modeler`]
                schema.deletors = [`${dsName}$modeler`]
            }
        });

        // Set Permission Level
        if (role === 'admin'){
            this.schemas.forEach(schema=>{
                const allow = schema.$id === 'dataset';
                schema.$allow = {create: allow, delete: allow};
                Object.keys(schema.properties).forEach(prop=>{
                    schema.properties[prop].readOnly = schema.$id === 'dataset' && prop === '_owners' ? false : true;
                })
            });
        } else if (role === 'owner'){
            this.schemas.forEach(schema=>{
                const allow = schema.$id === 'dataset' ? false : true;
                schema.$allow = {create: allow, delete: allow};
            });
            Object.entries(this.dataset.properties).forEach(([key, value]) => {
                if (!['_roles','_viewers','_editors'].includes(key)){
                    value.readOnly = true;
                }
            });
            this.dataset.$formViews = this.dataset.$formViews.filter(view=>{ return !['Owners','Editors','Viewers'].includes(view.name)});
            delete this.dataset.properties._editors
            delete this.dataset.properties._viewers
            delete this.dataset.properties._owners
            this.dataset.properties.description.readOnly = false;
        }
    }

    get obj(){
        return {
            pk: this.pk,
            name: this.name,
            title: this.title,
            description: this.description,
            $tableViews: this.$tableViews,
            schemas: this.schemas
        };
    }

    get props(){
        const _props = {};
        for (const schema of this.schemas){
            if (['dataset','jtable','schema'].includes(schema.$id)) { continue; }
            _props[schema.$id] = schema;
        }
        return _props;
    }

    // SCHEMAS


    // Dataset
    dataset =  {
        $id: 'dataset',
        required: ['title'],
        $titleField: 'title',
        top: true,
        $parents: [],
        $icon: 'database',
        $allow: {create: true, delete: false},
        $formViews: [
            {name: 'Info', cols: ['name','title','description']},
            {name: 'Owners', cols: ['_owners']}
        ],
        properties: {
            title: {
                type: 'string',
                description: 'Display name',
                minLength: 1,
                maxLength: 50,
                $chars: '^[a-zA-Z0-9\-_ ]+$'
            },
            name: {
                type: 'string',
                description: 'Dataset ID',
                minLength: 1,
                maxLength: 50,
                readOnly: true
            },
            description: {
                type: 'string',
                $is: 'multiline',
                description: 'Description of the dataset',
                minLength: 1,
                maxLength: 255,
                readOnly: false
            },
            _owners: {
                type: 'array',
                description: 'Dataset Owners',
                label: 'Owners',
                $is: 'table',
                items: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'string',
                            $is: 'user'
                        }
                    }
                }
            }
        }
    }

    // jTable
    jtable = {
        $id: 'jtable',
        required: ['title','index_def'],
        $titleField: 'title',
        $parents: [{$id: 'dataset', title: 'Dataset'}],
        $allow: {create: true, delete: false},
        $icon: 'table',
        $formViews: [
            { name: 'Info', cols: ['name','title','order','description','index_def']},
            { name: 'Table Views', cols: ['$tableViews'] },
            { name: 'Permissions', cols: ['viewers','editors'] }
        ],
        properties: {
            title: {
                type: 'string',
                label: 'jTable Title',
                description: 'Display name',
                minLength: 1,
                maxLength: 50,
                $chars: '^[a-zA-Z0-9\-_ ]+$'
            },
            name: {
                type: 'string',
                description: 'Dataset ID',
                minLength: 1,
                maxLength: 50,
                readOnly: true
            },
            order: {
                type: 'number',
                label: 'Display Order',
                minimum: 0,
                maximum: 100
            },
            index_def: {
                type: 'object',
                label: 'Index Field',
                $is: 'index'
            },
            description: {
                type: 'string',
                $is: 'multiline',
                description: 'Description of the dataset',
                minLength: 1,
                maxLength: 255,
                readOnly: false
            },
            $tableViews: {
                type: 'array',
                label: 'Table Views',
                description: 'Table Views',
                $is: 'complex',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', label: 'View Name', minLength: 3, maxLength: 25 },
                        cols: { 
                            type: 'array',
                            description: 'Dataset Roles',
                            label: 'Columns',
                            $is: 'table',
                            items: {
                                type: 'object',
                                properties: {
                                    column: { 
                                        type: 'string', 
                                        label: 'Column',
                                        $is: 'jtcols'
                                    },
                                    width: { 
                                        type: 'number', 
                                        label: 'Width',
                                        min: 10,
                                        max: 100
                                    }
                                }
                            }
                        },
                        filters: { 
                            type: 'array',
                            description: 'Dataset Roles',
                            label: 'Filters',
                            $is: 'table',
                            items: {
                                type: 'object',
                                properties: {
                                    object: { 
                                        type: 'string',
                                        $is: 'jtschemas',
                                        label: 'Schema',
                                    },
                                    column: { 
                                        type: 'string', 
                                        label: 'Column',
                                        $is: 'jtcols'
                                    },
                                    operator: { 
                                        type: 'string', 
                                        title: 'Operator',
                                        $is: 'select',
                                        enum: ['equal','not equal','contains','not contain','greater','less']
                                    },
                                    value: { type: 'string', title: 'Value' }
                                }
                            }
                        },
                        sort: { 
                            type: 'array',
                            description: 'Dataset Roles',
                            label: 'Sort',
                            $is: 'table',
                            items: {
                                type: 'object',
                                properties: {
                                    column: { 
                                        type: 'string', 
                                        label: 'Column',
                                        $is: 'jtcols'
                                    },
                                    direction: { 
                                        type: 'string', 
                                        label: 'Direction',
                                        $is: 'select',
                                        enum: ['asc','dsc']
                                    }
                                }
                            }
                        }
                    }
                }
            },
            viewers: {
                type: 'array',
                $is: 'roles',
                label: 'Viewers'
            },
            editors: {
                type: 'array',
                $is: 'roles',
                label: 'Editors'
            }
        }
    }

    // jObj
    schema = {
        $id: 'schema',
        title: 'schema',
        $titleField: 'title',
        required: ['title', 'top'],
        $parents: [{$id:'jtable', title: 'jTable'}],
        $allow: {create: true, delete: false},
        $icon: 'data_object',
        $formViews: [
            { name: 'Info', cols: ['title','$id','$icon','$titleField','description','top','$parents', 'required','$enableComments']},
            { name: 'Form Views', cols: ['$formViews'] },
            { name: 'Permissions', cols: ['creators', 'deletors']}
        ],
        properties: {
            title: {
                type: 'string',
                description: 'Display name',
                minLength: 1,
                maxLength: 50,
                $chars: '^[a-zA-Z0-9_ ]+$',
                pattern: '^[A-Za-z0-9_ ]{3,40}$'
            },
            $id: {
                type: 'string',
                label: 'ID',
                description: 'Dataset ID',
                minLength: 1,
                maxLength: 50,
                readOnly: true
            },
            $icon: {
                type: 'string',
                label: 'Icon',
                $is: 'iconpicker'
            },
            $titleField: {
                type: 'string',
                label: 'Title Field',
                description: 'Field to display in top of form',
                $is: 'schtitle',
            },
            description: {
                type: 'string',
                $is: 'multiline',
                description: 'Description of the dataset',
                minLength: 1,
                maxLength: 255,
            },
            top:{
                type: 'boolean',
                label: 'Is This a Top Level Object?',
                readOnly: true,
                $is: 'radio',
                $options: [
                    {label: 'Top Level: WILL NOT have parents', value: true},
                    {label: 'NOT Top Level: WILL have a parent', value: false}
                ],
                $instructions: 'This CANNOT be changed after creation'
            },
            $parents: {
                type: 'array',
                $is: 'schparents',
                label: 'Parents',
                description: 'Valid parents'
            },
            required: {
                type: 'array',
                $is: 'schrequired',
                label: 'Required Fields',
            },
            $enableComments: {
                type: 'boolean',
                label: 'Enable Comments'
            },
            $formViews: {
                type: 'array',
                label: 'Form Views',
                description: 'Table Views',
                $is: 'complex',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', label: 'View Name', minLength: 3, maxLength: 25 },
                        cols: { 
                            type: 'array', 
                            label: 'Column',
                            $is: 'schrequired'
                        }
                    }
                }
            },
            creators: {
                type: 'array',
                label: 'Creators',
                description: 'Dataset Owners',
                $is: 'roles'
            },
            deletors: {
                type: 'array',
                label: 'Deletors',
                description: 'Dataset Owners',
                $is: 'roles'
            }
        }
    }
    
    // --------------------
    // --- FIELDS     -----
    // --------------------
    baseProps = {
        type: {
            type: 'string',
            description: 'Field Type',
            readOnly: true,
            visibility: 'hidden'
        },
        title: {
            type: 'string',
            description: 'Display name',
            minLength: 1,
            maxLength: 50,
            $chars: '^[a-zA-Z0-9\-_ ]+$'
        },
        $is: {
            type: 'string',
            label: 'Field Type',
            readOnly: true
        },
        name: {
            type: 'string',
            description: 'Field ID',
            minLength: 1,
            maxLength: 50,
            readOnly: true
        },
        description: {
            type: 'string',
            $is: 'multiline',
            adescription: 'Short description of the field',
            minLength: 1,
            maxLength: 100,
        },
        readOnly: {
            type: 'boolean',
            label: 'Read Only',
            description: 'If required, field will only be editable for new items'
        },
        viewers: {
            type: 'string',
            label: 'Field Viewers',
            description: 'Groups that can view this field',
            $is: 'roles',
            $scoped: true
        },
        editors: {
            type: 'string',
            label: 'Field Editors',
            description: 'Groups that can edit this field',
            $is: 'roles',
            $scoped: true
        }
    }
    baseView = {
        name: 'Info', cols: ['title','$is','name','description','required', 'readOnly', 'editors', 'viewers']
    }
    // string
    istring = {
        $id: 'string',
        title: 'String',
        $titleField: 'title',
        type: 'string',
        required: ['title'],
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $icon: 'title',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['maxLength','pattern','$chars'] }
        ],
        properties: {
            ...this.baseProps,
            maxLength: {
                type: 'number',
                description: 'Max Length between 1 and 255',
                minimum: 1,
                maximum: 255,
            },
            pattern: {
                type: 'string',
                description: 'Regex Pattern. Format without slashes'
            },
            $chars: {
                type: 'string',
                label: 'Valid Characters',
                description: 'Regex pattern for valid charectars. Format as a group (e.g [A-Za-z0-9])'
            }
        }
    }
    
    ibool = {
        $id: 'boolean',
        title: 'Boolean',
        $titleField: 'title',
        type: 'boolean',
        required: ['title'],
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'check_box',
        $formViews: [
            this.baseView,
        ],
        properties: {
            ...this.baseProps
        }
    }

    inumber = {
        $id: 'number',
        title: 'Number',
        type: 'number',
        required: ['title'],
        $titleField: 'title',
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'tag',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['minimum','maximum','multipleOf'] }
        ],
        properties: {
            ...this.baseProps,
            minimum: {
                type: 'number',
                description: 'Minimum value'
            },
            maximum: {
                type: 'number',
                description: 'Maximum value'
            },
            multipleOf: {
                type: 'number',
                label: 'Multiple Of',
                description: 'Decimal precision',
                $float: true
            }
        }
    }

    imultiline = {
        $id: 'multiline',
        title: 'Multiline',
        type: 'string',
        required: ['title'],
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $titleField: 'title',
        $allow: {create: true, delete: false},
        $icon: 'view_headline',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['maxLength','pattern','$chars'] }
        ],
        properties: {
            ...this.baseProps,
            maxLength: {
                type: 'number',
                description: 'Max Length between 0 and 500',
                minimum: 1,
                maximum: 500,
            },
            pattern: {
                type: 'string',
                description: 'Regex Pattern. Format without slashes'
            },
            $chars: {
                type: 'string',
                label: 'Valid Characters',
                description: 'Regex pattern for valid charectars. Format as a group (e.g [A-Za-z0-9])'
            }
        }
    }

    ilist = {
        $id: 'list',
        title: 'List',
        type: 'array',
        required: ['title'],
        $titleField: 'title',
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'list',
        $formViews: [
            this.baseView,
        ],
        properties: {
            ...this.baseProps,
            $chars: {
                type: 'string',
                label: 'Valid Characters',
                description: 'Regex pattern for valid charectars. Format as a group (e.g [A-Za-z0-9])'
            }
        }
    }

    iselect = {
        $id: 'select',
        title: 'Select',
        type: 'array',
        required: ['title'],
        $titleField: 'title',
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'arrow_drop_down',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['enum', '$multi'] }
        ],
        properties: {
            ...this.baseProps,
            enum: {
                type: 'array',
                label: 'Options',
                $is: 'list'
            },
            $multi: {
                type: 'boolean',
                label: 'Multiple Select'
            }
        }
    }

    iuser = {
        $id: 'iuser',
        title: 'User',
        type: 'object',
        required: ['title'],
        $titleField: 'title',
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'person',
        $formViews: [
            this.baseView,
        ],
        properties: {
            ...this.baseProps
        }
    }

    iusergroup = {
        $id: 'usergroup',
        title: 'user group',
        type: 'object',
        required: ['title'],
        $titleField: 'title',
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'group',
        $formViews: [
            this.baseView
        ],
        properties: {
            ...this.baseProps
        }
    }

    irole = {
        $id: 'role',
        title: 'User Group',
        type: 'object',
        required: ['title'],
        $titleField: 'title',
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'group',
        $formViews: [
            this.baseView
        ],
        properties: {
            ...this.baseProps
        }
    }

    idate = {
        $id: 'date',
        title: 'Date',
        type: 'string',
        required: ['title'],
        $titleField: 'title',
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'calendar_today',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['$period']}
        ],
        properties: {
            ...this.baseProps,
            $period: {
                type: 'string',
                label: 'Period',
                $is: 'select',
                $labelKey: 'label',
                $valueKey: 'value',
                enum: [
                    {label: "Date Time", value: "datetime-local" },
                    {label: "Day", value: "date"},
                    {label: "Week", value: "week"},
                    {label: "Month", value: "month"},
                    {label: "Quarter", value: "quarter"},
                    { label: "Year", value: "year" }
                ]
            }
        }
    }

    icdate = {
        $id: 'cdate',
        title: 'Created Date',
        type: 'string',
        required: ['title'],
        $titleField: 'title',
        hidden: true,
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'event',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['$period']}
        ],
        properties: {
            ...this.baseProps,
            $period: {
                type: 'string',
                label: 'Period',
                $is: 'select',
                $labelKey: 'label',
                $valueKey: 'value',
                enum: [
                    {label: "Date Time", value: "datetime-local" },
                    {label: "Day", value: "date"},
                    {label: "Week", value: "week"},
                    {label: "Month", value: "month"},
                    {label: "Quarter", value: "quarter"},
                    { label: "Year", value: "year" }
                ]
            }
        }
    }

    udate = {
        $id: 'udate',
        title: 'Updated Date',
        type: 'string',
        required: ['title'],
        $titleField: 'title',
        hidden: true,
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'event',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['$period']}
        ],
        properties: {
            ...this.baseProps,
            $period: {
                type: 'string',
                label: 'Period',
                $is: 'select',
                $labelKey: 'label',
                $valueKey: 'value',
                enum: [
                    {label: "Date Time", value: "datetime-local" },
                    {label: "Day", value: "date"},
                    {label: "Week", value: "week"},
                    {label: "Month", value: "month"},
                    {label: "Quarter", value: "quarter"},
                    { label: "Year", value: "year" }
                ]
            }
        }
    }

    itable = {
        $id: 'table',
        title: 'Table',
        type: 'object',
        required: ['title'],
        $parents: [{$id:'schema'}],
        $titleField: 'title',
        $allow: {create: true, delete: true},
        $icon: 'table_view',
        $formViews: [
            this.baseView,
        ],
        properties: {
            ...this.baseProps,
            $titleField: {
                type: 'string'
            },
            required: {
                type: 'array',
            }
        }
    }

    icomplex = {
        $id: 'complex',
        title: 'Complex',
        type: 'object',
        required: ['title'],
        $parents: [{$id:'schema'}],
        $titleField: 'title',
        $allow: {create: true, delete: true},
        $icon: 'tenancy',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['$titleField', 'maxItems'] }
        ],
        properties: {
            ...this.baseProps,
            $titleField: {
                type: 'string'
            },
            maxItems: {
                type: 'number',
                step: 1,
                minimum: 1
            }
        }
    }

    ifile = {
        $id: 'file',
        title: 'File',
        $titleField: 'title',
        type: 'string',
        required: ['title'],
        $titleField: 'title',
        $parents: [{$id:'schema'}],
        $icon: 'attach_file',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['maxSize','maxItems'] }
        ],
        properties: {
            ...this.baseProps,
            maxSize: {
                type: 'number',
                label: 'Max Size in MB',
                description: 'Size in MB',
                minimum: 1,
                maximum: 5000,
            },
            maxItems: {
                type: 'number',
                label: 'Max Number of Files',
                description: 'Max number of files',
                minimum: 1,
            }
        }
    }

    irel = {
        $id: 'rel',
        title: 'Relationship',
        $titleField: 'title',
        type: 'object',
        required: ['title', 'lookup'],
        $parents: [{$id: 'schema'}, {$id:'table'}, {$id:'complex'}],
        $allow: {create: true, delete: true},
        $icon: 'share',
        $formViews: [
            this.baseView,
            { name: 'Validation', cols: ['schema','lookup'] }
        ],
        properties: {
            ...this.baseProps,
            lookup: {
                type: 'object',
                $is: 'relbuilder',
            }
        }
    }

}



class UserModel
{
    constructor(role,pk){
        this.name = 'users';
        this.title = role === 'admin' ? 'App Users' : 'Dataset Users';
        this.description = 'Users and Groups with access to datasets';
        
        this.$tableViews = role === 'admin' ? UserModel.adminViews : UserModel.ownerViews;
        const sch = role === 'admin' ? UserModel.allUsers : UserModel.datasetUsers;
        this.schemas = [sch];
    }

    get obj(){
        return {
            pk: this.pk,
            name: this.name,
            title: this.title,
            description: this.description,
            $tableViews: this.$tableViews,
            schemas: this.schemas
        };
    }

    static adminViews= [
        {
            name: 'All Users',
            filters: [],
            query: null,
            cols: [
                {name: '_email', width: 6},
                {name: '_status',width: 3},
                {name: '_admin', width: 1}
            ]
        }
    ]

    static ownerViews = [
        {
            name: 'All Users',
            filters: [],
            query: null,
            cols: [
                {name: '_email',width: 6}, 
                {name: '_role', width: 2},
                {name: '_owner', width: 1}
            ]
        }
    ]

    // Users
    static allUsers = {
        $id: 'user',
        required: ['_email'],
        $titleField: '_email',
        top: true,
        $parents: [],
        $allow: {create: true, delete: true},
        $icon: 'person',
        $formViews: [
            {name: 'Info', cols: ['_admin','_status', '_created', '_groups']}
        ],
        properties: {
            // user: {
            //     type: 'string',
            //     description: 'User Email',
            //     minLength: 1,
            //     maxLength: 50,
            //     readOnly: true
            // },
            _email: {
                type: 'string',
                label: 'Email',
                description: 'User Email',
                readOnly: true
            },
            _admin: {
                type: 'boolean',
                label: 'Admin',
                description: 'Is Admin'
            },
            _status: {
                type: 'string',
                label: 'Status',
                description: 'User Status',
                readOnly: true
            },
            _created: {
                type: 'string',
                label: 'Created',
                description: 'User Created',
                readOnly: true
            },
            _groups: {
                type: 'array',
                label: 'Groups',
                description: 'Dataset Owners',
                $is: 'table',
                readOnly: true,
                items: {
                    type: 'object',
                    properties: {
                        group: {
                            type: 'string'
                        }
                    }
                }
            }
        }
    }


    static datasetUsers = {
        $id: 'user',
        required: ['user', '_role'],
        $titleField: '_email',
        top: true,
        $parents: [],
        $allow: {create: true, delete: true},
        $icon: 'person',
        $formViews: [
            {name: 'Info', cols: ['_owner','_role']}
        ],
        properties: {
            user: {
                type: 'object',
                $is: 'user',
                description: 'User Email',
                minLength: 1,
                maxLength: 50,
                readOnly: true
            },
            _email: {
                type: 'string',
                description: 'User Email',
                label: 'Email',
                minLength: 1,
                maxLength: 50,
                readOnly: true
            },
            _owner: {
                type: 'boolean',
                label: 'Owner',
                description: 'Is Owner',
                readOnly: true
            },
            _role: {
                type: 'string',
                label: 'Role',
                description: 'User Role',
                $is: 'role'
            }
        }
    }

}


class HistoryModel
{
    constructor(objType){
        this.name = 'history',
        this.title = objType + ' History',
        this.description = 'Changes to users and permissions',
        this.custom_sk = {
            $is: {value: 'date'},
            $period: {value: 'month'},
        }
        this.$tableViews = [
            {
                name: 'All Changes',
                filters: [],
                sort: [{col: 'date', dir: 'dsc'}],
                query: null,
                // cols: ['date','user','msg']
                cols: [
                    { name: 'date', width: 1 },
                    { name: 'user', width: 1 },
                    { name: 'msg', width: 5 }
                ]
            }
        ]
        this.schemas = [HistoryModel.schema];
    }

    get obj(){
        return {
            pk: this.pk,
            name: this.name,
            title: this.title,
            description: this.description,
            $tableViews: this.$tableViews,
            custom_sk: this.custom_sk,
            schemas: this.schemas
        };
    }

    static schema = {
        $id: 'history',
        required: [],
        top: true,
        $parents: [],
        $icon: 'history',
        $allow: {create: false, delete: false},
        $titleField: 'date',
        $form: [],
        properties: {
            date: {
                type: 'string',
                description: 'Date of change',
                readOnly: true
            },
            user: {
                type: 'string',
                label: 'editor',
                adescription: 'User who made change',
                readOnly: true
            },
            msg: {
                type: 'string',
                label: 'message',
                description: 'Change',
                readOnly: true
            }
        }
    }
}

class RolesModel
{
    constructor(){
        this.name = 'roles',
        this.title = 'Dataset Roles',
        this.description = 'Custom DS Roles',
        this.$tableViews = [
            {
                name: 'All Roles',
                filters: [],
                sort: [],
                query: null,
                // cols: ['date','user','msg']
                cols: [
                    { name: 'name', width: 1 }
                ]
            }
        ]
        this.schemas = [RolesModel.schema];
    }

    get obj(){
        return {
            pk: this.pk,
            name: this.name,
            title: this.title,
            description: this.description,
            $tableViews: this.$tableViews,
            schemas: this.schemas
        };
    }

    static schema = {
        $id: 'role',
        required: ['name'],
        $parents: [],
        $icon: 'local_police',
        $allow: {create: true, delete: true},
        top: true,
        $titleField: "name",
        $formViews: [
            {name: 'Info', cols: ['name']}
        ],
        properties: {
            name: {
                type: 'string',
                description: 'Role Name',
                $chars: '^[a-zA-Z0-9\ ]+$',
                readOnly: true
            }
        }
    }
}

class LogsModel
{
    constructor(){
        this.name = 'logs',
        this.title =  'Logs',
        this.description = 'Application Logs',
        this.$tableViews = [
            {
                name: 'All Logs',
                filters: [],
                sort: [{col: 'date', dir: 'dsc'}],
                query: null,
                // cols: ['date','user','msg']
                cols: [
                    { name: 'date', width: 1 },
                    { name: 'source', width: 1 },
                    { name: 'user', width: 2 },
                    { name: 'error', width: 5 }
                ]
            }
        ]
        this.schemas = [LogsModel.schema];
    }

    get obj(){
        return {
            pk: this.pk,
            name: this.name,
            title: this.title,
            description: this.description,
            $tableViews: this.$tableViews,
            custom_sk: this.custom_sk,
            schemas: this.schemas
        };
    }

    static schema = {
        $id: 'log',
        required: [],
        top: true,
        $parents: [],
        $icon: 'history',
        $allow: {create: false, delete: false},
        $form: [],
        $titleField: 'date',
        properties: {
            date: {
                type: 'string',
                description: 'Date of change',
                readOnly: true
            },
            user: {
                type: 'string',
                label: 'user',
                adescription: 'User who made change',
                readOnly: true
            },
            error: {
                type: 'string',
                $is: 'multiline',
                description: 'Change',
                readOnly: true
            },
            source: {
                type: 'string',
                label: 'source',
                description: 'Change',
                readOnly: true
            }
        }
    }
}

module.exports = { DataModel, UserModel, HistoryModel, RolesModel, LogsModel}