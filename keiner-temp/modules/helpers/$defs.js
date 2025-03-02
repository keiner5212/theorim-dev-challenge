const Ajv = require('ajv');
// ----------------------------
// ---- CONSTRUCTORS --------
// ----------------------------
const FieldTypes = {
    string: 'string',
    number: 'number',
    integer: 'integer',
    boolean: 'boolean',
    multiline: 'string',
    list: 'array',
    select: 'string',
    iuser: 'object',
    role: 'string',
    date: 'string',
    cdate: 'string',
    udate: 'string',
    table: 'array',
    complex: 'array',
    file: 'object',
    files: 'array',
    rel: 'object',
    lookup: 'object',
}

exports.Fields = FieldTypes;

exports.PrimitiveFields = ['string','number','integer','boolean','date','cdate','select','user','usergroup'];


exports.dataset = function(name){
    // pk:= dataset sk:= dataset_name >> dataset processes
    const idName = cleanId(name);
    return {
        pk: `defs/${idName}`,
        sk: `dataset$${idName}`,
        $class: 'dataset',
        name: idName,
        title: name.trim(),
        description: '',
        _owners: []
    }
}

exports.jtable = function(dsName,ds){
    // pk:= dataset sk:= dataset_name >> dataset processes
    ds.title = ds.title.trim();
    const idName = cleanId(ds.title);
    
    const jt = {
        pk: `defs/${dsName}`,
        sk: `${ds.sk}$${idName}`,
        $class: 'jtable',
        name: idName,
        title: ds.title,
        description: '',
        allow: {},
        $tableViews: [],
        index_def: ds.index_def
    }

    return jt;
}

exports.schema = function(dsName,obj){
    const name = cleanId(obj.title);
    return {
        $id: name,
        pk: `defs/${dsName}`,
        sk: `${obj.sk}$${name}`,
        $class: 'schema',
        title: obj.title.trim(),
        description: '',
        top: obj.top || false,
        $titleField: obj.$titleField || 'index',
        $allow: {
            create: true,
            delete: true
        },
        $parents: [],
        required: [],
        properties: {
            pk: { type: 'string', readOnly: true, name: 'pk', label: 'Primary Key', editors: [], viewers: []},
            sk: { type: 'string', readOnly: true, name: 'sk', label: 'Sort Key',editors: [], viewers: []}
        }
    }
}

exports.prop = function(p){
    const name = p.name || cleanId(p.title);
    const $is = p.sk.split('-').pop().split('$')[0];
    if (!FieldTypes[$is]) { return null }
    const newProp = {
        pk: p.pk,
        sk: `${p.sk}$${name}`,
        cls: 'property',
        $class: 'property',
        name: name,
        label: p.label || p.title.trim(),
        type: FieldTypes[$is],
        readOnly: p.readOnly || false,
        $is: $is,
        viewers: [],
        editors: [],
    }
    return newProp;
}

// ----------------------------
// ----    VALIDATORS  --------
// ----------------------------



// ----------------------------
// ----     FUNCS      --------
// ----------------------------

exports.validate = function(object,schema,required=[],allowOther=false){
    const errors = [];
    
    // Check required
    Object.keys(schema).forEach(key => {
        if (schema[key].required === true && !required.includes(key)) {
           required.push(key);
        }
    })
    for (const key of required) {
        if (object[key] === undefined || object[key] === null) {
            errors.push(`${key} is required`);
        }
    }
    // Validate Properties
    for (const [key, value] of Object.entries(object)) {
        const schemaProp = schema[key];
        
        // Property not present in schema
        if (!schemaProp && allowOther === false) {
            errors.push(`${key} is not a valid property`);
            continue;
        } else if (!schemaProp && allowOther === true) {
            continue;
        }
        // Property is read only
        if (schemaProp.readOnly === true) {
            errors.push(`${key} is read only`);
            continue;
        }
        // Process Null Values
        if (object[key] === null) { continue }
        if (!schemaProp.type && object[key] !== undefined){ continue }
        // Match Type
        if (schemaProp.type === 'array') {
            if (!Array.isArray(object[key])) {
                errors.push(`${key} must be Array but is ${typeof object[key]}`);
            }
        } else if (typeof object[key] !== schemaProp.type) {
            if (schemaProp.type === 'integer' && Number.isInteger(object[key])){ continue }
            errors.push(`${key} must be ${value.type} but is ${typeof object[key]}=>${object[key]}`);
        } else if (schemaProp.pattern && !object[key].match(schemaProp.pattern)) {
            console.log('kv',key,value);
            errors.push(`${key} must match pattern ${schemaProp.pattern}`);
        } 
    }
    // Check Result
    if (errors.length > 0) {
        return {ok: false, errors: errors};
    } else {
        return {ok: true };
    }
}

exports.jValidate = function(schema, obj, newItem=false){
    const start = performance.now();
    const ajv = new Ajv({strict: false});

    // Schema struct
    const vSchema = {
        type: "object",
        properties: schema.properties,
        required: newItem ? (schema.required || []) : ['pk','sk'],
        additionalProperties: false
    };

    vSchema.properties.pk = { type: 'string' };
    vSchema.properties.sk = { type: 'string' };

    // Update Required
    if (newItem === true && schema.required.length > 0 && typeof(schema.required[0]) === 'object'){
        vSchema.required = schema.required.map(r => { return r.name });
    }

    // Validate WRITE Access
    const validationErrors = [];
    const keysToCheck = Object.keys(obj).filter(k=>{ return k !== 'pk' && k !== 'sk' });
    for (const key of keysToCheck){
        const prop = schema.properties[key];
        if (!prop){
            validationErrors.push('Property not in schema:' + key);
        } else if (newItem === true && prop.readOnly === true && schema.required.includes(key) === false){
           validationErrors.push('User not allowed to edit property:' + key); 
        } else if (newItem === false && prop.readOnly === true){
            validationErrors.push('Property is read only:' + key);
        }
    }
    if (validationErrors.length > 0){
        return {ok: false, errors: validationErrors};
    }


    // Allow nulls
    for (const p of Object.keys(vSchema.properties)) {
        schema.properties[p].type = [schema.properties[p].type, 'null'];
    }

    var validate;
    try {
       validate = ajv.compile(vSchema);
    } catch (e) {
        console.log('----Failed Schema---')
        console.log(vSchema);
        console.log('Schema Compilation Error:',e);
        throw e;
    }
    

    const isValid = validate(obj);

    const errs = validate.errors ? validate.errors.map(e => e.instancePath.replace(/^\//, '') + ':' + e.message) : [];
    console.log('Ajv Validation:' + performance.now()-start)
    return {ok: isValid, errors: errs};
}

exports.jValidateArray = function(schema, objArr, options){
    const start = performance.now();
    const ajv = new Ajv({strict: false, allErrors: true});

    // Schema struct
    const vSchema = {
        type: "object",
        properties: schema.properties,
        required: options.new ? (schema.required || []) : ['pk','sk'],
        additionalProperties: options.additional || true
    };

    vSchema.properties.pk = { type: 'string' };
    vSchema.properties.sk = { type: 'string' };


    const arrSchema = {
        type: 'array',
        items: vSchema
    }
    
    // Compile Schema
    var validate;
    try {
       validate = ajv.compile(arrSchema);
    } catch (e) {
        console.log('----Failed Schema---')
        console.log(vSchema);
        console.log('Schema Compilation Error:',e);
        throw e;
    }
    const report = objArr.map(o => { return {__id: o.__id, valid: true, errors: [] } });
    const results = validate(objArr);

    validate.errors?.forEach(e => {
        const p = e.instancePath.split('/');
        const indx = parseInt(p[1]);
        report[indx].errors.push(processError(e));
        report[indx].valid = false;
    });
    console.log('Ajv Array Validation:', performance.now()-start);
    return report;
}

// ----------------------------
// ---- INLINE HELPERS --------
// ----------------------------
function processError(error) {
      let message;
      switch (error.keyword) {
        case 'additionalProperties':
          message = `Unexpected property '${error.params.additionalProperty}'`;
          break;
        case 'required':
          message = `Missing required property '${error.params.missingProperty}'`;
          break;
        default:
          message = `${error.message}`;
          break;
      }
      const prop = error.instancePath.replace(/^\//, '') || error.params.additionalProperty || error.params.missingProperty;
      return `${prop}: ${message}`;
}


function cleanId(str) {
    return str.trim().replaceAll(' ','_').replace(/[^a-zA-Z0-9\_]/g, '').toLowerCase()
}