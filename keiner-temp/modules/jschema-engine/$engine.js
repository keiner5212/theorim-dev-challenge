// ==== Libs ====
const Ajv = require('ajv');
// ==== APIs ====
const $db = require('./helpers/$db');
const $utils = require('./helpers/$utils');
exports.db = $db;
exports.utils = require('./helpers/$utils');
exports.files = require('./helpers/$files');
exports.users = require('./helpers/$users');




// ==== Globals ====

const Defs = {};
const Validators = {};

// =============================================
// ==== Core Functions =========================
// =============================================

exports.listPartitions = async function (minutesDifference = null) {
    const res = await this.db.query({ pk: '_partition' });
    const filteredItems = res.Items.filter(item => $utils.isOlderThanMilliseconds(item.lastUpdated, minutesDifference));
    return filteredItems;
}

exports.entitlements = function(groups){
    const userGroups = groups.map(g=>{ return g.split('-')[0]});
    const keys = Object.keys(Defs).filter(d=>{ return userGroups.includes(d) }).map(k=>{ return { name: Defs[k].name, title: Defs[k].title } });
    const enttl = {
        modeler: keys.filter(k=>{ return /\$modeler$/.test(k.name) }),
        user: keys.filter(k=>{ return !/\$modeler$/.test(k.name) && k.name !== 'admin' }),
    }
    if (userGroups.includes('admin')){
        enttl.admin = [{name: 'admin', title: 'Admin', pk: 'admin'}]
    }
    return enttl;
}

exports.addPartition = async function(name,title){
    const partition = {
        pk: '_partition',
        sk: name,
        title: title,
        name: name,
        lastUpdated: Date.now()
    }
    return this.db.create(partition);
}

exports.removePartition = async function(name){
    const partition = {
        pk: '_partition',
        sk: name,
    }
    console.debug('Remove Partition', partition);
    return this.db.delete(partition);
}

exports.addDef = function(def){
    // Format User Schemas
    Defs[def.name] = JSON.parse(JSON.stringify(def));
    for (const jt of Defs[def.name].jtables){
        for (const schema of jt.schemas){
            // console.log('sch-',schema.$id, Object.keys(schema.properties).length);
            schema.readRestrict = Object.keys(schema.properties).filter(k=>{ return Array.isArray(schema.properties[k].viewers) && schema.properties[k].viewers.length >0})
            schema.writeRestrict = Object.keys(schema.properties).filter(k=>{ return Array.isArray(schema.properties[k].editors) && schema.properties[k].editors.length >0})
        }
    }
    // Build Validators
    const _def = JSON.parse(JSON.stringify(def))
    Validators[def.name] = {}
    for (const jt of _def.jtables){
        Validators[def.name][jt.name] = Validators[def.name][jt.name] || {};
        for (const schema of jt.schemas){
            schema.additionalProperties = false;
            schema.properties.pk = { type: 'string', pattern: '^[A-Za-z0-9_\$]{3,}\/[A-Za-z0-9_\$]{3,}$' }
            schema.properties.sk = { type: 'string', pattern: '^[A-Za-z0-9\$\-\_]{3,}$' }
            Object.entries(schema.properties).forEach(p=>{ p[1].type = [p[1].type, 'null']})
            const ajv = new Ajv({strict: false, allErrors: true});
            try{
                const newSchema = ajv.compile(schema);
                schema.required = [];
                const updateSchema = ajv.compile(schema);
                Validators[def.name][jt.name][schema.$id] = {
                    new: newSchema,
                    update: updateSchema
                };
            } catch (e){
                console.log('----Failed Schema Compilation ---')
                console.log(schema);
                return false;
            }
        }
    }
}

exports.listDefs = function(){
    return {
        defs: Object.keys(Defs),
        validators: Object.keys(Validators)
    }
}


exports.def = function(defPointer,userRole){
    return def(defPointer,userRole)
}

exports.schema = function(params){
    const ds = Defs[params.dataset]
    if (!ds){ throw 'NotFound: Def not found:' + defName }
    if (!params.jtable){ return ds }
    const jt = ds.jtables.find(jt=>{jt.name === params.jtable })
    if (!jt){ throw 'NotFound: jTable not found:' + defName + '/' + params.jtable}
    if (!params.schema){ return jt }
    const schema = jt.schemas.find(s=>{ return s.$id === params.schema});
    if (!schema){ throw 'NotFound: Schema not found:' + defName + '/' + params.jtable + '/' + params.schema }
    return schema;
}


// =============================================
// ====       CRUD      =====================
// =============================================

exports.get = async function(pk,sk,userRole){
    const start = performance.now();
    /// Validate Access
    var ds;
    var jt;
    try{
        [ds,jt] = readAccess(userRole,params.pk.split('/')[0],params.pk.split('/').pop().split('$')[0]);
    }catch(e){
        throw e;
    }
    // Run Query
    const item = await this.db.getOne(pk,sk);
    const schema = jt.schemas.find(s=>{ s.$id === item.__object });
    // Strip props
    sch.readRestrict = schema.readRestrict.filter(k=>{ return !sch.properties[k].viewers.includes(userRole)})
    for (const prop of schema.readRestrict){
        delete item[prop]
    }
    console.debug('Get time',pk,sk, performance.now() - start);
    return dataRes;
}


exports.query = async function(params,userRole){
    const start = performance.now();
    /// Validate Access
    var ds;
    var jt;
    try{
        [ds,jt] = readAccess(userRole,params.pk.split('/')[0],params.pk.split('/').pop().split('$')[0]);
    }catch(e){
        throw e;
    }
    
    // Run Query
    const dataRes = await this.db.query(params);
    // Strip props
    for (const sch of jt.schemas){
        sch.readRestrict = sch.readRestrict.filter(k=>{ return !sch.properties[k].viewers.includes(userRole)})
    }
    const restrictedSchemas = jt.schemas.filter(sch=>{ return sch.readRestrict.length > 0 });
    for (const sch of restrictedSchemas){
        const matchingData = dataRes.Items.filter(itm=>{ return __object(itm.sk) === sch.$id });
        for (const obj of matchingData){
            for (const resProp of sch.readRestrict){
                delete obj[resProp]
            }
        }
    }
    console.debug('Query time',params.pk, performance.now() - start);
    return dataRes;
}

exports.create = async function(obj,user,checkOnly=false){
    // Validate Access
    const schema = def(obj,user.role)
    if (!schema.$allow.create){
        throw `NotAuthorized:${user.role} cannot create ${schema.$id}`
    }
    // Validate Prop Access
    Object.keys(obj).forEach(k=>{ if (k.startsWith('__')){ delete obj[k] } });
     const notAuthedFields = Object.keys(obj).filter(k=>{
        return schema.properties[k] && schema.properties[k].readOnly === true
    })
    if (notAuthedFields.length > 0){
        throw `NotAuthorized:${user.role} cannot edit fields ${notAuthedFields.join(',')}`
    }
    // Add Index
    obj.sk = `${obj.sk}\$${$utils.hexId()}`;
    obj.index = computeIndex(schema.properties.index.$is, obj.index);
    // Validate Data Structure
    const validator = Validators[schema.dataset][schema.jtable][schema.$id];
    validator.new(obj)
    const errors = validator.errors ? validator.errors.map(e => e.instancePath.replace(/^\//, '') + ':' + e.message) : [];
    if (errors.length > 0){ throw `ValidationError:${errors.join('\n')}` }
    // Add Obj / Created / Updated / Parent
    this.utils.stamp(obj,true);
    // Test SK
    if (!$utils.testSk(obj.sk)){
        throw `BadRequest: Malformed SK ${obj.sk}`
    }
    // Check Parent
    if (obj.__parent){
        const parent = await this.db.getOne(obj.pk,obj.__parent);
        if (!parent){
            throw `BadRequest: Parent Not Found ${obj.__parent}`
        }  
    }
    // Return if Validate Only
    if (checkOnly === true){ return obj }
    // Write History
    console.log('create',obj);
    history(obj, user.email, 'Created ' + obj.__object);
    // Write to DB
    return await this.db.create(obj);
}

exports.update= async function(obj,user,checkOnly=false){
    if (!obj || !user){ throw 'Engine Update: Missing Required Param'}
    // Validate Access
    const schema = def(obj,user.role)
    // Validate Prop Access
    Object.keys(obj).forEach(k=>{ if (k.startsWith('__')){ delete obj[k] } });
     const notAuthedFields = Object.keys(obj).filter(k=>{
        return schema.properties[k] && schema.properties[k].readOnly === true
    })
    if (notAuthedFields.length > 0){
        throw `NotAuthorized:${user.role} cannot edit fields ${notAuthedFields.join(',')}`
    }
    // Recompute Index
    if (obj.index){
        obj.index = computeIndex(schema.properties.index.$is,obj.index,true);
    }
    // Validate Data Structure
    const validator = Validators[schema.dataset][schema.jtable][schema.$id];
    validator.update(obj)
    const errors = validator.errors ? validator.errors.map(e => e.instancePath.replace(/^\//, '') + ':' + e.message) : [];
    if (errors.length > 0){ throw `ValidationError:${errors.join('\n')}` }
    // Add Obj / Created / Updated / Parent
    this.utils.stamp(obj,false);
    // Return if Validate Only
    if (checkOnly === true){ return true }
    // Write History
    const updatedKeys = Object.keys(obj).filter(k=>{return !k.startsWith('__') && k !== 'pk' && k !== 'sk'})
    history(obj, user.email, 'Updated ' + updatedKeys.join(','));
    // Write to DB
    const updatedItem = await this.db.edit(obj);
    return updatedItem;
}




// =============================================
// ====       SPECIAL      =====================
// =============================================

exports.archive = async function(obj,user,checkOnly=false){
    console.debug('Archive',obj.pk,obj.sk);
    // Validate Access
    const schema = def(obj,user.role)
    if (!schema.$allow.delete){
        throw `NotAuthorized:${user.role} cannot delete ${schema.$id}`
    }
    // Return if Validate Only
    if (checkOnly === true){ return true }
    // Kick Off Requests
    const childrenProm = await this.db.query({pk: obj.pk, sk: obj.sk});
    for (const child of childrenProm.Items){
        const newItem = JSON.parse(JSON.stringify(child));
        newItem.pk = child.pk + '$archive';
        newItem._ttl = Date.now() + 1000*60*60*24*30; 
        await this.db.create(newItem);

        await this.db.delete(child)
        // Write History
        history(child, user.email, 'Deleted Item');
    }
    
    // Write to DB
    return {};
}

exports.restore = async function(obj,user,checkOnly=false){
    // Validate Access
    const schema = def(obj,user.role)
    if (!schema.$allow.create){
        throw `NotAuthorized:${user.role} cannot create ${schema.$id}`
    }
    // Return if Validate Only
    if (checkOnly === true){ return true }
    // Kick Off Requests
    const item = await this.db.getOne(obj.pk, obj.sk);
    const newItem = JSON.parse(JSON.stringify(item));
    newItem.pk = newItem.pk.replace(/\$archive$/,'');
    delete newItem._ttl;
    const restored = await this.db.create(newItem);
    this.db.delete(item);

    history(obj, user.email, 'Restored Item');
    
    // Write to DB
    return restored;
}

exports.copy = async function(obj,user){
    const newSk = obj.newSk;
    delete obj.newSk;
    // Validate Access
    const schema = def(obj,user.role)
    if (!schema.$allow.create){
        throw `NotAuthorized:${user.role} cannot create ${schema.$id}`
    }
    // Run Queries
    // const newObj = await this.db.getOne(obj.pk, obj.sk);
    // const existingItems = await this.db.query({pk: obj.pk, sk: obj.sk})
    const [newObj,existingItemsRes] = await Promise.all([
        this.db.getOne(obj.pk, obj.sk),
        this.db.query({pk: obj.pk, sk: obj.sk})
    ])
    const existingItems = existingItemsRes.Items;
    // Add Index
    newObj.sk = `${newSk}-${newObj.__object}\$${$utils.hexId()}`;
    console.log('New Obj', newObj.sk);
    // Build Child Array
    const newItems = [newObj];
    for (const item of newItems){
        const existingItem = existingItems.find(i=>{ return i.__id === item.__id });
        const itemChildren = existingItems.filter(i=>{ return i.__parent === existingItem.__id });
        for (const child of itemChildren){
            const newChild = JSON.parse(JSON.stringify(child));
            newChild.sk = `${item.sk}-${child.__object}\$${$utils.hexId()}`;
            newItems.push(newChild);
        }
    }

    for (const newItem of newItems){
        this.utils.stamp(newItem,true);
        console.log('Creating', newItem.sk);
        if (!$utils.testSk(newItem.sk)){
            throw `BadRequest: Malformed SK ${newItem.sk}`
        }
    }
    const createProms = newItems.map(i=>{ return this.db.create(i) });
    await Promise.all(createProms);
    return newItems;
}


// =============================================
// ====        Utils       =====================
// =============================================
exports.history = function(obj,email,msg){
    return history (obj,email,msg);
}

exports.error = async function(msg,source,user){
    const id = 'log$' + Date.now() + '_' + this.utils.hexId();
    const errObj = {
        pk: 'admin$logs',
        sk: id,
        error: msg,
        user: user || 'system',
        source: source,
        date: dateStr(true),
        _ttl: Date.now() + 1000*60*60*24*7,
        __object: 'log',
        __id: id
    }
    return this.db.create(errObj).catch(e=>{ console.log('Error Logging Error', e)});
}


// =============================================
// ==== HELPERS =========================
// =============================================
function readAccess(userRole,dsName,jtName){
    if (!userRole){ throw 'NotAuthorized: User Cannot Access ' + dsName }
    const def = Defs[dsName];
    if (!def){ throw 'NotFound: Dataset ' + dsName }
    const jtable = def.jtables.find(jt=>{ return jt.name === jtName})
    if (!jtable){ throw 'NotFound: jTable ' + jtName }
    if (jtable.viewers && jtable.viewers.length > 0 && !jtable.viewers.includes(userRole)){
        throw 'NotAuthorized: jTable ' + jtName;
    }
    return JSON.parse(JSON.stringify([def, jtable]));
}

async function history(obj,email,msg){
    var uid = obj.__uid;
    if (!uid && obj.sk){
        const dbObj = await $db.getOne(obj.pk,obj.sk, ['__uid']);
        if (dbObj){ uid = dbObj.__uid; }
    }
    const uidStr = uid ? `${uid}+` : '';
    const id = `${uidStr}${dateStr().replaceAll('-','_')}-history\$${Date.now()}`
    return $db.create({
        pk: obj.pk + '$history',
        sk: id,
        date: dateStr(true),
        user: email,
        msg: msg,
        __object: 'history',
        __id: id
    }).catch(e=>{ console.log('Error Logging History', e)});
}

function def(defPointer,userRole){
    // Check if Schema or Full Def
    const defName = typeof(defPointer) === 'object' ? defPointer.pk.split('/')[0] : defPointer;
    const schemaOnly = typeof(defPointer) === 'object';
    // Get Def
    if (!Defs[defName]){ throw 'NotFound: Def not found:' + defName }
    const def = JSON.parse(JSON.stringify(Defs[defName]));
    // Strip unviewable jTables
    def.jtables = def.jtables.filter(jt=>{ return !jt.viewers || jt.viewers.length === 0 || jt.viewers.includes(userRole) })
    // Apply Permissions
    for (const jt of def.jtables){
        const canEditJt = !jt.editors || jt.editors.length === 0 || jt.editors.includes(userRole);
        for (const schema of jt.schemas){
            schema.$allow = {
                create: canEditJt === false ? false : (!schema.creators || schema.creators.length === 0 || schema.creators.includes(userRole)),
                delete: canEditJt === false ? false : (!schema.deletors || schema.deletors.length === 0 || schema.deletors?.includes(userRole))
            }
            for (const [k,v] of Object.entries(schema.properties)){
                if (v.viewers && (v.viewers.length > 0 && !v.viewers.includes(userRole))){
                    delete schema.properties[k];
                } else if (!canEditJt || (v.editors && v.editors.length > 0 && !v.editors.includes(userRole))){
                    schema.properties[k].readOnly = true;
                } 
            }
        }
    }
    if (schemaOnly === false){ return def; }
    const jtName = defPointer.pk.split('/')[1].split('$')[0];
    const targetJt = def.jtables.find(jt=>{ return jt.name === jtName});
    if (!targetJt){ 
        if (!Defs[defName].jtables.find(jt=>{ return jt.name === jtName})){
            throw `NotFound: jtable ${jtName}`
        } else {
            throw `NotAuthorized: jtable ${jtName}`
        }
     }
    const schemaName = defPointer.sk.split('+').pop().split('-').pop().split('$')[0];
    const schema = targetJt.schemas.find(s=>{ return s.$id === schemaName });
    if (!schema){ throw `NotFound: schema ${schemaName}` }
    schema.dataset = defName;
    schema.jtable = jtName;
    return schema;
}



// =============================================
// ==== UTILS =========================
// =============================================

function computeIndex(indexType,indexValue,isUpdate=false){
    if (indexType === 'cdate' && !isUpdate){
      return dateStr()
    } else if (indexType === 'cdate' && isUpdate){
      return indexValue;
    } else if (indexType === 'udate'){
        return dateStr()
    }
    if (indexType === 'string' || indexType === 'select'){
      return indexValue.toString().trim().replaceAll(/[^A-Za-z0-9\_\- ]/g, '').toUpperCase();
    }
    if (indexType === 'role'){
      return indexValue;
    }
    if (indexType === 'date'){
      return indexValue;
    }
    return null;
}

function dateStr(time=false){
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(now.getUTCDate()).padStart(2, '0');
    if (!time){
      return `${year}-${month}-${day}`;
    }
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function __object(sk){
    return sk.split('+').pop().split('-').pop().split('$')[0];
}

// =============================================
// ==== FIXES ====

exports.fix = async function(){
    console.log('Apply Fixes');
    // Reindex JTables
    const partitions = await this.listPartitions();
    for (const p of partitions){
        const jtables = await this.db.query({
            pk: `defs/${p.name}`, 
            sk: `dataset${p.name}-jtable`,
            index: 'has_attribute',
            __object: 'jtable'
        });
        console.log('Fixing',jtables.Items.length,'JTables');
        for (const jt of jtables.Items){
            jt.index_def = jt.index_def || jt.index;
            delete jt.index;
            await this.db.edit(jt);
        }
    }
    // Update SKs
    const allItems = await this.db.scan();
    let fixCount = 0;
    for (const item of allItems){
        if (item.sk.includes('+')){
            fixCount++;
            $db.delete(item);
            item.sk = item.sk.split('+').pop();
            $db.create(item);
        }
    }
    console.log('Fixes Complete', fixCount);
}