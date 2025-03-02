const Engine = require('./jschema-engine/$engine');
const $defs = require('./helpers/$defs');


// --------------------
// --- READ      -----
// --------------------
exports.datasets = async function(path){
    const dataset = await Engine.db.query({pk:`defs/${path.dsName}`});
    if (!dataset){
        throw 'NotFound: Dataset not found ' + path.dsName;
    }

    for (const obj of dataset.Items){
        if (obj.$class === 'property'){
            obj.title = obj.label;
        }
        if (obj.top === true){
            delete obj.$parents;
        }
    }
    return dataset;
}

exports.history = async function(path){
    const dataset = await Engine.db.query({pk:`${path.dataset}$history`});
    if (!dataset){
        throw 'Dataset not found:' + path.dataset;
    }

    return dataset;
}

exports.roles = async function(path){
    const cogRoles = await Engine.users.listGroups(path.dsName);
    const roles = [];
    for (const role of cogRoles){
        if (role.name.endsWith('$modeler')){ continue }
        role.roleId = role.name;
        role.name = role.name.split('-').pop();
        role.pk = `roles/${path.dsName}`;
        role.sk = `role$${role.name}`;
        Engine.utils.stamp(role);
        roles.push(role);
    }
    return { Items: roles };
}

exports.users = async function(path){
    console.debug('Get Users',path);
    const datasetSK = path.dsName;
    const params = { pk: 'users' };
    params[datasetSK] = 'attribute_exists';
    params[`${datasetSK}$modeler`] = '*attribute_exists';
    const allUsers = await Engine.db.query(params);
    for (const user of allUsers.Items){
        user._role = user[datasetSK] ? user[datasetSK].split('-').pop() : '';
        user._owner = user[`${datasetSK}$modeler`] ? true : false;
        delete user[path.dsName];
    }
    
    return allUsers;
}

// --------------------
// ---  CUD      -----
// --------------------
exports.new = {};
exports.delete = {};
exports.update = {};
exports.import = {};
exports.restore = {};



// --- Role --- //
exports.new.role = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
        name: { required: true, type: 'string', pattern: /^[A-Za-z0-9\ ]{3,30}$/ },
    })
 
    // Construct
    const roleName = body.name.toLowerCase().replaceAll(' ','_');
    const roleId = `${path.dsName}-${roleName}`;
    if (roleName === 'user' || roleName === 'modeler' || roleName === 'admin'){
        throw 'BadRequest: Cannot create default roles';
    }
    const newRole= Engine.utils.stamp({
        pk: `roles/${path.dsName}`,
        sk: `role$${roleName}`,
        name: body.name,
        roleId: roleId
    });
    try{
        console.log('Create Role',roleId);
        Engine.users.createGroup(roleId)
        return newRole;
    } catch (e){
        throw 'BadRequest: Role exists ' + body.name;
    }
}


exports.delete.role = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
    })
    
    // Construct
    const dsName = path.dsName;
    const roleName = body.sk.split('$')[1];
    const roleId = `${path.dsName}-${roleName}`;
    console.debug('Delete', roleId);
    if (roleId == `${dsName}$modeler` || roleId == `${dsName}` || roleName === 'user'){
        throw 'BadRequest: Cannot delete default roles';
    }
    // Delete Role
    await Engine.users.deleteGroup(roleId);

    // Delete User Roles
    const params = {pk: 'users'}
    params[dsName] = '=!' + roleId;
    const users = await Engine.db.query(params);
    for (const user of users.Items){
        user[dsName] = 'user';
        await Engine.db.edit(user);
    }

    
    Engine.history({pk: path.dataset}, body.sk,localUser.email,  `deleted role ${roleId}`);
    return {};
}

// --- Users --- //
exports.new.user = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
        user: { required: true, type: 'object' },
        _role: { required: true, type: 'string'},
    })
    // Construct
    const dsName = path.dsName;
    const username = body.user.username;
    const roleName = body._role.split('-').pop();
    const roleId = body._role;
    console.debug('newuser',username,roleId);
    await Engine.users.assignRole(username,roleId);
    const user = {
        pk: 'users',
        sk: `user$${username.replaceAll('-','_')}`
    }
    user[dsName] = roleName;
    Engine.db.edit(user)
    
    // Format Return Value
    user._role = roleName;
    user._email = body.user.email;
    Engine.utils.stamp(user);
    return user;
}

exports.update.user = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
        _role: { required: true, type: 'string'},
    })

    //
    const user = await Engine.db.getOne('users',body.sk);
    // Construct
    const dsName = path.dsName;
    const username = user._username;
    console.debug('updateuser',dsName,username);
    
    user[dsName] = body._role;
    await Promise.all([
        Engine.users.removeRole(username,user[dsName]),
        Engine.users.assignRole(username,body._role),
        Engine.db.edit(user)
    ])
    // Kick Off Requests
    Engine.history({pk: path.dataset}, localUser.email,  `changed ${user._email} role to ${body._role}`);
    return body;
}


exports.delete.user = async function(body,path,localUser){
    console.debug('delete user',body);
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' }
    })

   // Kick Off Requests
   const user = await Engine.db.getOne('users',body.sk);
   if (!user){
    throw `NotFound: User Not Found ${body.sk}`
   }
   const oldRole = user[path.dsName];
   user[path.dsName] = null;
   await Promise.all([
        Engine.db.edit(user),
        Engine.users.removeUserGroup(user._username,`${path.dsName}-${oldRole}`)
   ]).catch(e=>{ throw e })
   
   // Remove from group
   Engine.history({pk: path.dataset}, localUser.email,  `removed DS user ${user._username}`);
   return body;
}



// --- Dataset --- //
exports.import.dataset = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        sk: { required: false, type: 'string' },
        pk: { required: true, type: 'string' },
        schema: { required: true, type: 'array' }
    })

    // Construct
    console.debug('Import',body.pk);
    console.debug('Import sk',body.sk);
    console.debug('Import path',path);

    // Update SKs
    const newDefs = body.schema;
    for (const def of newDefs){
        def.pk = body.pk;
        def.sk = def.sk.replace(/^dataset\$[A-Za-z0-9\_]*-/,`dataset$${path.dsName}-`);
        for (const key in def){
            if (key.startsWith('__')){
                delete def[key];
            }
        }
        console.debug('Import def',def.sk);
    }

    // Upload Data
    for (const def of newDefs){
        Engine.utils.stamp(def,true)
        Engine.db.create(def);
    }
    
    // Extract Roles
    const roleProps = ['viewers','editors','creators','deletors'];
    const allRoles = [];
    for (const def of newDefs){
        for (const permKey of roleProps){
            if (def[permKey]){
                allRoles.push(...def[permKey]);
            }
        }
    }
    const uniqueRoles = [...new Set(allRoles)];
    console.debug('Import roles',uniqueRoles);
    for (const role of uniqueRoles){
        console.debug('creae',`${path.dsName}-${role}`);
        Engine.users.createGroup(`${path.dsName}-${role}`);
        Engine.db.create({
            pk: 'roles',
            sk: `${path.dsName}+role$${role}`,
            name: role
        })
    }
    return {status: 200, msg: true};
};


// --- jTable --- //
exports.new.jtable = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string', pattern: /^dataset\$[A-Za-z0-9\_]{3,30}\-jtable$/ },
        title: { required: true, type: 'string', pattern: /^[A-Za-z0-9_\- ]{3,35}$/ },
        index_def: { required: true, type: 'object' },
    })

    // Get Dataset
    console.debug('get',`defs/${path.dsName}`,path.parent);
    const dataset = await Engine.db.getOne(`defs/${path.dsName}`,path.parent);
    if (!dataset){
        throw 'Dataset not found:' + path.dsName + ':' + path.parent;
    }
    

    // Construct
    const jtable = $defs.jtable(path.dsName, {...body});
    jtable.index_def.name = 'index';
    Engine.utils.stamp(jtable,true);
    try {
        const res = await Engine.db.create(jtable);
        // abds$modeler$history
        Engine.history({pk: path.dataset}, localUser.email, `created jtable ${jtable.name}`);
        return res;
    } catch (error) {
        console.log('Server Error@newds:', error.message);
        throw 'Could not create dataset';
    }
};

exports.update.jtable = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string',pattern: /^dataset\$[A-Za-z0-9_\-]{3,30}\-jtable\$[A-Za-z0-9_\-]{3,30}$/ },
        title: { required: false, type: 'string', pattern: /^[A-Za-z0-9_\- ]{3,20}$/ },
        description: { required: false, type: 'string' },
        $tableViews: { required: false, type: 'array' },
        index: { required: false, type: 'object' },
        viewers: { required: false, type: 'array' },
        editors: { required: false, type: 'array' },
        order: { required: false, type: 'integer' }
    })

    // Construct
    const jtable = await Engine.db.getOne(`defs/${path.dsName}`,body.sk);
    if (!jtable){
        throw `NotFound: jTable Not Found ${path.dsName}/${body.sk}`;
    }

    const oldPk = body.pk;
    delete body.pk;
    const newJTable = {...jtable, ...body};
    await Engine.db.edit(newJTable);
    
    // Edit Index Fields
    const rTable = JSON.parse(JSON.stringify(newJTable));
    rTable.pk = oldPk;
    const allUpdates = [rTable];
    // if (body.index){
    //     delete body.index.$is;
    //     const props = await Engine.db.query({
    //         pk: `defs/${path.dsName}`,
    //         sk: newJTable.sk,
    //         cls: '=!property',
    //         name: '=!index'
    //     });
    //     for (const prop of props.Items){
    //         for (const key in body.index){
    //             prop[key] = body.index[key];
    //         }
    //         Engine.db.edit(prop);
    //         prop.title = prop.label;
    //         prop.pk = oldPk;
    //         allUpdates.push(prop);
    //     }
    // }

    // Update Table
    Engine.history({pk: path.dataset}, localUser.email,  `edited jtable ${newJTable.name}`);

    return allUpdates;
}

exports.delete.jtable = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string', pattern: /^dataset\$[A-Za-z0-9_\-]{3,30}\-jtable\$[A-Za-z0-9_\-]{3,30}$/ }
    
    },true)

    // Check for Data
    const data = await Engine.db.query({ pk: `${path.dsName}/${path.jtable}`});
    if (data.Items.length > 10){
        throw 'BadRequest: Table has data';
    } else if (data.Items.length > 0){
        for (const record of data.Items){
            Engine.db.delete(record)
        }
    }

    // Delete Defs
    const defs = await Engine.db.query(
        { 
            pk: `defs/${path.dsName}`, 
            sk: body.sk
        }
    )
    for (const def of defs.Items){
        Engine.db.delete(def);
    }

    // Update Table
    Engine.history({pk: path.dataset}, localUser.email, `deleted jtable ${body.sk}`);
    return {};
}

// --- Schema --- //
exports.new.schema = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: false, type: 'string',  pattern: /^dataset\$[A-Za-z0-9_\-]{3,}-jtable\$[A-Za-z0-9_\-]{3,}-schema$/ },
        title: { required: true, type: 'string', pattern: /^[A-Za-z0-9_ ]{3,40}$/ },
        top: { required: false, type: 'boolean' }
    })

    // Construct
    const schema = $defs.schema(path.dsName,body);
    Engine.utils.stamp(schema);

    if (/^(history|users|user|dataset|owner|def|defs)$/.test(schema.$id)){
        return { status: 400, msg: { error: 'Reserved name: ' + schema.$id } };
    }
    // Construct Prop
    const returnVal = [schema];
   
    const jTable = await Engine.db.getOne(`defs/${path.dsName}`,path.parent);
    const prop = $defs.prop({
        pk: `defs/${path.dsName}`,
        sk: schema.sk + '-' + jTable.index_def.$is,
        name: 'index',
        label: jTable.index_def.label || 'index'
    });
    prop.$index = true;
    if (jTable.index_def.enum){ prop.enum = jTable.index_def.enum; }
    if (jTable.index_def.$period){ prop.$period = jTable.index_def.$period; }
    Engine.utils.stamp(prop,true);
    Engine.db.create(prop);
    // Format for Return
    prop.pk = body.pk;
    prop.title = prop.label;
    returnVal.push(prop);

    schema.required = [{name: 'index', label: jTable.index_def.label}];
    
    
    // Exec Writes
    Engine.db.create(schema);
    Engine.history({pk: path.dataset}, localUser.email, `created schema ${schema.$id}`);
    
    return returnVal; 
}

exports.update.schema = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        sk: { required: true, type: 'string',pattern: /^dataset\$[A-Za-z0-9_\-]{3,}-jtable\$[A-Za-z0-9_\-]{3,}-schema\$[A-Za-z0-9_\-]{3,}$/ },
        pk: { required: true, type: 'string' },
        title: { required: false, type: 'string', pattern: /^[A-Za-z0-9_\- ]{3,20}$/ },
        description: { required: false, type: 'string' },
        required: { required: false, type: 'array' },
        $titleField: { required: false, type: 'object' },
        $icon: { required: false, type: 'string' },
        $parents: { required: false, type: 'array' },
        $formViews: { required: false, type: 'array' },
        $enableComments: { required: false, type: 'boolean' },
        creators: { required: false, type: 'array'},
        deletors: { required: false, type: 'array'},
    })

    // Construct
    const schema = await Engine.db.getOne(`defs/${path.dsName}`,body.sk);
    if (!schema){
        console.error('Schema not found', body.sk);
        throw 'BadRequest: JSON table not found' + body.sk;
    }
    if (schema.top && body.$parents){
        throw 'BadRequest: Top level objects cannot have parents'
    }

    if (body.required && !body.required.find(r=>{ return r.name === 'index' })){
        throw 'BadRequest: Cannot Remove Index Field';
    }
    
    

    const newSchema = {...schema, ...body};
    newSchema.pk = `defs/${path.dsName}`;
    // Update Table
    Engine.history({pk: path.dataset}, localUser.email,  `edited schema ${schema.$id}`);
    Engine.db.edit(newSchema);
    return body;
}

exports.delete.schema = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        sk: { required: true, type: 'string',pattern: /^dataset\$[A-Za-z0-9_\-]{3,}-jtable\$[A-Za-z0-9_\-]{3,}-schema\$[A-Za-z0-9_\-]{3,}$/ },
        pk: { required: false, type: 'string' },
    })
    

    // Check for Data
    const data = await Engine.db.query({ pk: `${path.dsName}/${path.jtable}` });
    const dataFromSchema = data.Items.filter(d=>{ return d.sk.includes(`${path.schema}$`) });
    if (dataFromSchema.length > 9){
        return { status: 400, msg: { error: 'Schema has data' } };
    } else if (dataFromSchema.length > 0){
        for (const record of data.Items){
            Engine.db.delete(record)
        }
    }

    // Delete Defs
    const defs = await Engine.db.query(
        { 
            pk: `defs/${path.dsName}`, 
            sk: body.sk
        }
    )
    for (const def of defs.Items){
        Engine.db.delete(def);
    }

    // Update Table
    Engine.history({pk: path.dataset}, localUser.email, `deleted schema ${body.sk}`);
    return {};
}


// --- Props --- //
exports.new.prop = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' },
        title: { required: true, type: 'string', pattern: /^[A-Za-z 0-9]{2,25}$/},
        lookup: { required: false, type: 'object' },
    })
    
    // Build Prop
    const prop = $defs.prop({...body});
    Engine.utils.stamp(prop,true);
    
    if (prop === null){
        throw 'BadRequest: Invalid prop ' + body.label;
    } else if (/^(pk|sk|pkk|ttl|index)$/.test(prop.name)){
        throw 'BadRequest: Reserved name' + prop.name;
    } else {
        const existingProp = await Engine.db.getOne(`defs/${path.dsName}`,prop.sk);
        if (existingProp){
            throw 'BadRequest: Property already exists';
        }
    }

    if (body.lookup){
        prop.lookup = body.lookup;
    }
    prop.pk = `defs/${path.dsName}`;
    // Write to DB
    const res = await Engine.db.create(prop);
    if (res === -1){
        throw 'BadRequest: Property already exists';
    }

    Engine.history({pk: path.dataset}, localUser.email, `created field ${prop.name}`);

    prop.title = prop.label;

    return prop;
}

exports.update.prop = async function(body,path,localUser){
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string'},
        sk: { required: false, type: 'string'}
    },true)
    
    // Construct
    const inputPk = body.pk;
    const pk = `defs/${path.dsName}`;
    const existingProp = await Engine.db.getOne(pk,body.sk);
    if (!existingProp){
        console.error('Prop not found', body.sk);
        throw 'BadRequest Prop  not found' + body.sk;
    }

    const newProp = {...existingProp}

    // Configure Prop
    if (body.$is && body.$is === 'select'){
        body.type = body.$multi === true ? 'array' : 'string';
    }

    // Set Title
    if (body.title){
        newProp.label = body.title;
        delete body.title;
    }
    
    for (key in body){
        if (['pk','sk','name'].includes(key)){ continue; }
        newProp[key] = body[key];
    }


    const res = await Engine.db.edit(newProp);
    Engine.history({pk: path.dataset}, localUser.email, `edited field ${newProp.name}`);

    newProp.pk = inputPk;
    newProp.title = newProp.label;

    return newProp;
}

exports.delete.prop = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: true, type: 'string' },
        sk: { required: true, type: 'string' }
    })

    // Construct
    const pk = `defs/${path.dsName}`;
    const prop = await Engine.db.getOne(pk,body.sk);
    if (!prop){
        console.error('Prop not found', body.sk);
        return {status: 400, msg: { error: 'Prop  not found' + body.sk } };
    }
    if (prop.name === 'index'){
        console.error('Index cannot be deleted', body.sk);
        return {status: 400, msg: { error: 'Index cannot be deleted' + body.sk } };
    }

    // Check for Data
    const params = { pk: `${path.dsName}/${path.jtable}` };
    params[prop.name] = 'attribute_exists';
    const data = await Engine.db.query(params);
    const dataFromSchema = data.Items.filter(d=>{ 
        return d.sk.includes(`${path.schema}$`) && d[prop.name]
    });
    if (dataFromSchema.length > 9){
        throw 'BadRequest:Prop has data';
    } else if (dataFromSchema.length > 0){
        for (const record of data.Items){
            delete record[prop.name];
            Engine.db.create(record)
        }
    }

    // Delete Prop
    const res = await Engine.db.delete(prop);
    Engine.history({pk: path.dataset}, localUser.email, `deleted field ${prop.name}`);
    return {}
}