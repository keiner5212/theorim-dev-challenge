const Engine = require('./jschema-engine/$engine');

// ----------------------------
// ---------- READ  -----------
// ----------------------------


exports.file = async function(params,userGroups){
    const fileKey = `${params.dataset}/${params.jtable}/${params.schema}/${params.field}/${params.uid}/${encodeURIComponent(params.fileName)}`;
    const url = await Engine.files.getUrl(fileKey);
    return url;
}

// ----------------------------
// ---------- WRITE  ----------
// ----------------------------

//  -- CRUD Operations --
exports.new = async function(body,path,localUser){
    console.debug('NEW',body.pk,body.sk);
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
        index: { required: false }
    },true);
    
    
    const result = await Engine.create(body,localUser);
    return result;
}

exports.update = async function(body,path,localUser,schema){
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' }
    },true);
    
    const timeCheck = performance.now();
    
    const result = await Engine.update(body,localUser);
    console.debug('Edit time',performance.now()-timeCheck);
    return result;
}

exports.delete = async function(body,path,localUser,schema){
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' }
    },true);
    

    const result = await Engine.archive(body,localUser);

    return {status: 200, msg: {}};
}

exports.restore = async function(body,path,localUser,schema){
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' }
    },true);
    

    // Restore 
    const item = await Engine.restore(body,localUser);

    return item;
}

exports.comment = async function(body,schema,localUser){
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
        comment: { required: true, type: 'string' }
    },true);
    

    // Check Length
    if (body.comment.length > 5000){ return { status: 400, msg: 'Comment too long' }; }

    // Build Comment
    const comment = {
        date: Date.now(),
        user: localUser.email,
        comment: body.comment,
    }

    await Engine.db.append(body.pk,body.sk,'_comments',comment);

    return  comment;
}


//  -- Special Operations --
exports.copy = async function(body,path,localUser){
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
        targetSK: { required: false, type: 'string' },
        delete: { required: false, type: 'boolean' }
    },true);
    return await Engine.copy(body,localUser);
}


exports.create_linked = async function(body,localUser){
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
        source: { required: true, type: 'object' }
    },true);
    


    // Get Existing Item
    const [originalItem,targetSchema] = await Promise.all([
        Engine.db.getOne(body.source.pk,body.source.sk),
        Engine.def({
            pk: body.pk, 
            sk: body.sk,
        })
    ])

    // Build New Item
    const newItem = JSON.parse(JSON.stringify(originalItem));
    newItem.pk = body.pk;
    newItem.sk = body.sk;


    // Find Lookup Prop
    var linkField = null;
    const orgPath = Engine.utils.parse(originalItem.pk, originalItem.sk)
    Object.entries(targetSchema.properties).forEach(([k,v])=>{
        if (v.lookup.dataset === orgPath.dataset &&
            v.lookup.jtable === orgPath.jtable &&
            v.lookup.schema === orgPath.schema){
                linkField = targetSchema.properties[k]
        }
    })
    
    if (linkField){
        newItem[linkField.name] = {sk: originalItem.sk, label: originalItem[propDef.lookup.property] || originalItem.sk}
    }

    // Create New Item
    const createdItem = await Engine.create(newItem,localUser.email);
    
    return createdItem;
}

//  -- Files --

exports.upload = async function(params,files,localUser){
    // Get Existing DB Item
    const filePrefix = `${params.dataset}/${params.jtable}/${params.schema}/${params.field}/${params.uid}`;
    
    const itemParams = {
        pk: `${params.dataset}/${params.jtable}`,
        __uid: params.uid,
        _cols: 'pk+sk+' + params.field
    }
    const existingObjRes = await Engine.db.query(itemParams)
    const dbObj = existingObjRes.Items ? existingObjRes.Items[0] : null;
    if (!dbObj){ throw 'BadRequest: Item not found' }
    dbObj[params.field] = dbObj[params.field] || [];
    await Engine.update(dbObj,localUser,true)

    
    // Upload Files
    const proms = [];
    const fail = [];
    for (const file of files){
        const s3Key = `${filePrefix}/${encodeURIComponent(file.originalname)}`;
        const p = Engine.files.upload(file,s3Key,true).then(result=>{ 
            if (result.status === 200){
                dbObj[params.field].push(
                    {
                        fileName: file.originalname,
                        fileKey: s3Key,
                        createdBy: localUser.email,
                        createdOn: Date.now()
                    }
                );
            } else {
                fail.push(`${file.fileName} Failed: ${result.error}`)
            }
        });
        proms.push(p);
    }
    await Promise.all(proms);
    const res = await Engine.update(dbObj,localUser);

    return { value: dbObj[params.field], fails: fail};
}

exports.delfile = async function(params,localUser){
    const fileKey = `${params.dataset}/${params.jtable}/${params.schema}/${params.field}/${params.uid}/${encodeURIComponent(params.fileName)}`;

    const itemParams = {
        pk: `${params.dataset}/${params.jtable}`,
        __uid: params.uid
    }

    const existingObjRes = await Engine.db.query(itemParams);
    const dbObj = existingObjRes.Items ? existingObjRes.Items[0] : null;
    if (!dbObj){ throw 'BadRequest: Item not found' }
    const newObj = {
        pk: dbObj.pk,
        sk: dbObj.sk
    }
    newObj[params.field] = dbObj[params.field] || [];
    newObj[params.field] = dbObj[params.field].filter(f=>{ return f.fileKey !== fileKey });

    await Engine.update(newObj,localUser)

    // Delete File
    const delRes = await Engine.files.delete(fileKey,localUser);
    return  dbObj;
}

//  -- Import --
exports.import = async function(body,localUser){
    const now = Date.now();
    console.debug('Import');
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        validate: {required: true, type: 'boolean'},
        data: { required: true, type: 'array' }
    },true);
    
    

    // Build Validation Results
    const failures = {};
    const markFail = (itm,error)=>{
        failures[itm.__id] = failures[itm.__id] || [];
        failures[itm.__id].push(error);
    }
    // Validate Create
    const softCreate = (record)=>{
        try{
            record.sk = record.__object;
            Engine.create(record,localUser,true);
        } catch (e){
            markFail(record,'Failed Validation:' + e);
        }
    }
    const removeFails = ()=>{ body.data = body.data.filter(r=>{return !failures[r.__id] }); }


    // Kick off schema request
    // const [ds,jt] = body.pk.split('/');
    // const dsObjects = await $data.q({pk: `defs/${ds}`, sk: `dataset$${ds}-jtable$${jt}-schema$`});
    // if (dsObjects.Items.length === 0){
    //     return { status: 400, msg: `Dataset not found:${ds}/${jt}`}
    // }
    // const def = $utils.nestDataset(dsObjects.Items).jtables[0];
    const def = await Engine.def(body.pk.split('/')[0],localUser);
    const schemaIds = def.schemas.map(s=>{ return s.$id })

    // Format Data
    for (const record of body.data){
        record.pk = body.pk;
        
        if (typeof(record.__id) !== 'string' && typeof(record.__id) !== 'number'){
            markFail(record,'Missing __id:' + record.__id);
        }
        record.__object = typeof(record.__object) === 'string' ? record.__object.toLowerCase() : null;
        if (!record.__object || !schemaIds.includes(record.__object)){
            markFail(record, 'Missing, invalid or not authorized __object');
        }
        delete record.sk;
        record.__id = `${record.__id}`;
        if (typeof(record.__parent) === 'string' || typeof(record.__parent) === 'number'){
            record.__parent = `${record.__parent}`
        }
    }

    // Build Top Level SKs with Indexes
    for (const schDef of def.schemas){
        if (schDef.top !== true){ continue }
        const indexedData = body.data.filter(r=>{ return r.__object === schDef.$id });
        for (const record of indexedData){
            record.sk = record.__object;
            softCreate(record);
        }
    }
    removeFails();

    // Build Top Level SKs without index
    for (const record of body.data){
        if (!record.__parent && !record.sk){
            record.sk = record.__object;
            softCreate(record);
        }
    }

    // Resolve Inline Parents
    const resolved = body.data.filter(r=>{ return r.sk })
    let unresolved = body.data.filter(r=>{ return r.__parent && !r.sk });
    for (const item of resolved){
        const directChildren = unresolved.filter(r=>{ return `${r.__parent}` === `${item.__id}` });
        for (const dc of directChildren){
            dc.sk = `${item.sk}-${dc.__object}`;
            softCreate(dc);
            resolved.push(dc);
        }
    }
    unresolved = unresolved.filter(r=>{ return typeof(r.sk) !== 'string' });

    // Resolve DB Parents
    const unresolvedParents = [...new Set(unresolved.map(u=>{ return u.__parent }))]
    const proms = [];
    for (const parentId of unresolvedParents){
        const matchingData = unresolved.filter(r=>{ return r.__parent === parentId });
        if (!Engine.utils.testSk(parentId)){
            matchingData.forEach(r=>{ markFail(r,`Invalid Parent Id:${r.__parent}`)});
            continue;
        }
        const p = Engine.db.getOne(body.pk, parentId).then(parent=>{
            if (parent){
                matchingData.forEach(r=>{
                    r.sk = `${parent.sk}-${record.__object}`
                    softCreate(r)
                })
            } else {
                matchingData.forEach(r=>{
                    markFail(re,`Parent not found in DB:${r.__parent}`);
                })
                
            }
        });
        proms.push(p)
    }
    removeFails();

    // Mark Unresolved
    await Promise.all(proms);
    const remainingUnresolved = body.data.filter(r=>{ return !r.sk});
    for (const r of remainingUnresolved){
        markFail(r, 'Unresolved parent');
    }

    // Return Results
    if (Object.keys(failures).length > 0){
        return { status: 200, msg: { failures: failures, data:body.data } }
    } else if (body.validate === true){
        return { status: 200, msg: { data:body.data }  }
    }

    // Write Data
    removeFails();
    const writeProms = [];
    const dataToWrite = JSON.parse(JSON.stringify(body.data));
    dataToWrite.forEach(itm=>{
        const oldId = itm.__id;
        Object.keys(itm).forEach(k => k.startsWith('__') && delete itm[k]);
        const p = Engine.db.create(itm).then(result=>{
            return true;
        }).catch(err=>{
            markFail({__id: oldId }, 'Failed to write to DB:'+ itm.sk + '>>' + err)
        })
        writeProms.push(p);
    });

    // Return Results
    await Promise.all(writeProms);
    if (Object.keys(failures).length > 0){
        return { failures: failures, data: dataToWrite }
    } else {
        return  {data: dataToWrite }
    }

}

exports.bulk_edit = async function(body,localUser){
    const now = Date.now();
    console.debug('Bulk Edit');
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        validate: {required: true, type: 'boolean'},
        data: { required: true, type: 'array' }
    },true);
    
    
    // Build Validation Results
    const failures = {};
    const markFail = (itm,error)=>{
        failures[itm.sk] = failures[itm.sk] || [];
        failures[itm.sk].push(error);
    }
    const removeFails = ()=>{ body.data = body.data.filter(r=>{return !failures[r.sk] }); }


    // Kick off schema request
    Engine.def(body.pk.split('/')[0],localUser);
    
    // Format Data
    const checkProms = [];
    for (const record of body.data){
        delete record.index;
        const p = Engine.update(record,localUser,true).then(r=>{ return true}).catch(e=>{
            markFail(record, 'Failed Validation:' + e);
        })
    }
    await Promise.all(checkProms);

    // Check That Items Exist
    var notFound = JSON.parse(JSON.stringify(body.data));
    let lastKey = null;
    for (let i=0; i<1000; i++){
        const dbData = await Engine.db.query({pk: `${ds}/${jt}`, _lastkey: lastKey, _cols: 'sk+index'});
        lastKey = dbData.lastKey || null;
        const allSks = dbData.Items.map(i=>{ return i.sk });
        notFound = notFound.filter(nf=>{ !allSks.includes(nf.sk) })
        if (!lastKey || notFound.length === 0){
            break;
        }
    }
    // Mark Not Found
    notFound.forEach(nf=>{ markFail(nf, `Item not found in DB:${nf.sk}`) })
    removeFails();

    // Return Results
    if (Object.keys(failures).length > 0){
        return { status: 200, msg: { failures: failures, data:body.data } }
    } else if (body.validate === true){
        return { status: 200, msg: { data:body.data }  }
    }


    // Write Data
    const dataToWrite = JSON.parse(JSON.stringify(body.data));
    const proms = [];
    dataToWrite.forEach(itm=>{
        Object.keys(itm).forEach(k => k.startsWith('__') && delete itm[k]);
        proms.push(
            Engine.db.edit(itm,localUser.email).then(result=>{
                return true;
            }).catch(err=>{
                markFail(itm, 'Failed to write to DB:'+ itm.sk + '>>' + err)
            })
        );
    });

    // Return Results
    await Promise.all(proms);
    if (Object.keys(failures).length > 0){
        return { failures: failures, data: dataToWrite } 
    } else {
        return  {data: dataToWrite }
    }

}
