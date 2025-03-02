const Engine = require('./jschema-engine/$engine');
const $defs = require('./helpers/$defs');

// --- READ ----
exports.users = async function(){
    const [dbUsers, cognitoUsers] = await Promise.all([
        Engine.db.query({pk: 'users'}),
        Engine.users.listAllUsers()
    ]);
    for (var u of cognitoUsers){
        var dbUser = dbUsers.Items.find(dbu=>{ return dbu._username == u.username });
        if (!dbUser){ 
            console.log('Fixing user',u);
            dbUser = Engine.utils.stamp({
                pk: 'users', 
                sk: `user$${u.username.replaceAll('-','_')}`,
                 _username: u.username, 
                 _email: u.email
            });
            const groups = await Engine.users.getUserGroups(u.username);
            for (const g of groups){
                const dsName = g.split('-')[0];
                const role = g.split('-').length > 1 ? g.split('-')[1] : true;
                if (dsName == 'admin'){
                    dbUser._admin = true;
                }
                dbUser[dsName] = role;
            }
            Engine.db.create(dbUser).catch(e=>{ 
                Engine.db.error(`Error Creating User ${u.username}>${e}`,'admin');
            });
        }
        u = Object.assign(u,dbUser);
        u.groups = Object.keys(dbUser).filter(k=>{ return !k.startsWith('_') && !['pk','sk'].includes(k)}).map(k=>{ return {group: k} });
    }
    
    return {Items: cognitoUsers};
};


exports.datasets = async function(archived=false){
    const start = performance.now();
    const userProm = Engine.db.query({pk: 'users'});
    const _allPartitions = await Engine.listPartitions();
    const _partitions = archived === true ? _allPartitions.filter(p=>{ return p.pk.endsWith('#archive') }) : _allPartitions.filter(p=>{ return !p.pk.endsWith('#archive');});
    const proms = [];
    const datasets = [];
    for (const p of _partitions){
        proms.push(Engine.db.query({ pk: `defs/${p.name}`}));
    }

    const results = await Promise.all(proms);
    const userResults = await userProm;
    results.forEach(r=>{
        datasets.push(...r.Items);
    });
    for (const item of datasets){
        // $utils.formatObject(item);
        if (item.$class === 'property'){ 
            item.title = item.label;
        }
        if (item.__object === 'dataset'){
            item._owners = userResults.Items?.filter(u=>{ return u[`${item.name}$modeler`]}).map(u=>{ return {user: {username: u._username, email: u._email} }}) || [];
        }
    }
    console.debug('ds time', performance.now() - start);
    return {Items: datasets};
}

exports.history = async function(params){
    const pk = `admin$history`;
    const userHistory = await Engine.db.query({pk: pk});
    return userHistory;
}

exports.logs = async function(params){
    const logs = await Engine.db.query({pk: 'admin$logs'});
    return logs;
}

// --- WRITE ----
exports.new = {};
exports.delete = {};
exports.update = {};
exports.import = {};
exports.restore = {};


// --- DATASETS ----
exports.new.dataset = async function(body,path,localUser){
    console.debug('New dataset',body)
    // Validate Request
    Engine.utils.validate(body, {
        pk: { required: false, type: 'string'},
        sk: { required: false, type: 'string'},
        title: { required: true, type: 'string', pattern: /^[A-Za-z0-9_\- ]{3,40}$/ },
    })
    
    // Construct
    const dataset = $defs.dataset(body.title);
    if (/^(history|user|users|defs|archive|partitions|admin)$/.test(dataset.name)){
        return { status: 400, msg: { error: 'Reserved dataset name: ' + dataset.name } };
    }
    Engine.utils.stamp(dataset);

    // Check If Exist
    const dbExists = await Engine.db.getOne(`_partition`, dataset.name);
    if (dbExists){
        throw `BadRequest: Dataset Exists ${dataset.name}`
    }

    // Add To Paritions List
    const [part,ds,g1,g2] = await Promise.all([
        Engine.addPartition(dataset.name,dataset.title),
        Engine.db.create(dataset),
        Engine.users.createGroup(`${dataset.name}$modeler`),
        Engine.users.createGroup(`${dataset.name}-user`)
    ])

    Engine.history({pk: 'admin'},localUser.email,`Created dataset ${dataset.name}`);
    return ds;
}

exports.update.dataset = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        sk: { required: true, type: 'string' },
        pk: { required: true, type: 'string' },
        _owners: { required: true, type: 'array'},
    })
    
    const dsName = body.sk.split('$')[1];
    
    const groupName = `${dsName}$modeler`;
    const existingUsers = await Engine.users.listGroupUsers(groupName);
    
    // Add Users
    for (const owner of body._owners){
        const existingUser = existingUsers.find(u=>{ return u.username == owner.user.username });
        if (!owner.user?.username) { continue }
        if (!existingUser){
            const user = {
                pk: 'users',
                sk: `user$${owner.user.username.replaceAll('-','_')}`
            }
            user[groupName] = 'modeler';
            await Promise.all([
                Engine.users.assignRole(owner.user.username,groupName),
                Engine.db.edit(user)
            ])
            Engine.history({pk: 'admin'},localUser.email,`assigned ${owner.user.username} to ${groupName}`);
        }
    }

    // Remove Users
    for (const user of existingUsers){
        const existingUser = body._owners.find(u=>{ return u.user.username == user.username });
        if (!existingUser){
            const userObj = {
                pk: 'users',
                sk: `user$${user.username.replaceAll('-','_')}`
            }
            userObj[groupName] = null;
            await Promise.all([
                Engine.users.removeRole(user.username,groupName),
                Engine.db.edit(userObj)
            ])
            Engine.history({pk: 'admin'},localUser.email,`removed ${user.username} from ${groupName}`);
        }
    };
    return body;
}

exports.delete.dataset = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        sk: { required: true, type: 'string' },
        pk: { required: true, type: 'string' }
    },true)
    

    const dsName = body.sk.split('$').pop();
    console.debug('Deleting Dataset',dsName);
    // User Role Params
    const params = {pk: 'users'}
    params[dsName] = 'attribute_exists';
    params[dsName + '$modeler'] = '*attribute_exists';  
    // Kick Off Promises
    const [defs,allGroups,dsUsers] = await Promise.all([
        Engine.db.query({pk: `defs/${dsName}`}),
        Engine.users.listGroups(dsName),
        Engine.db.query(params)
    ]);
    // Construct
    if (!defs.Items){
        throw 'NotFound: Dataset not found';
    }

    // Delete User Roles
    console.debug('Deleting User Roles',dsUsers.Items.length)
    for (const user of dsUsers.Items){
        user[dsName] = null;
        user[`${dsName}$modeler`] = null;
        Engine.db.edit(user);
    }

    // Delete Groups
    const delGroupProms = [];
    console.debug('Deleting Groups',allGroups.length)
    allGroups.forEach(g=>{
        delGroupProms.push( Engine.users.deleteGroup(g.name) );
    });
    
    // Delete Data
    const jtableDefs = defs.Items.filter(d=>{ return d.$class == 'jtable' });
    for (const j of jtableDefs){
        console.debug('Deleting Data',`${dsName}/${j.name}`);
        Engine.db.query({pk:`${dsName}/${j.name}`, _cols: 'pk+sk'}).then((dataToDelete)=>{
            for (const item of dataToDelete.Items){
                Engine.db.delete({pk: item.pk,sk: item.sk});
            }
        });
    }
    // Archive Defs
    console.debug('Deleting Defs',defs.Items.length)
    for (const d of defs.Items){
        Engine.db.delete({pk: d.pk, sk: d.sk})
    }

    // Wait for Resolutions
    console.debug('Remove Partition',dsName);
    await Engine.removePartition(dsName);


    Engine.history({pk: 'admin'},localUser.email, `deleted dataset ${dsName}`);
    return {};
}

// --- USERS ----
exports.new.user = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        sk: { required: true, type: 'string' },
        pk: { required: true, type: 'string' },
        _email: { required: true, type: 'string', pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,20}$/ },
    })
    

    // Create User
    const email = body._email;
    const newUser = await Engine.users.newUser(email);
    for (const k in newUser){
        newUser[`_${k}`] = newUser[k].toString();
        delete newUser[k]
    }
    const userObj = Engine.utils.stamp({
        pk: 'users',
        sk: `user$${newUser._username.replaceAll('-','_')}`,
        ...newUser
    })
    await Engine.db.create(userObj);
    Engine.history({pk: 'admin'},localUser.email, `Created user ${body.email}`);
    return userObj;
};

exports.update.user = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        sk: { required: true, type: 'string' },
        pk: { required: true, type: 'string' },
        _admin: { required: true, type: 'boolean' },
    });
    
    const username = body.sk.split('$')[1].replaceAll('_','-');
    let res;
    if (body._admin === true){
        await Engine.users.assignRole(username, 'admin');
        const adminRes = await Engine.db.edit({
            pk: 'users',
            sk: body.sk,
            _admin: true
        })
    } else {
        res = await Engine.users.removeRole(username,'admin');
        await Engine.db.edit({
            pk: 'users',
            sk: body.sk,
            _admin: null
        })
    }
    Engine.history({pk: 'admin'},localUser.email, `${body.admin ? 'assigned' : 'removed'} admin role for ${username}`);
    return body;
};

exports.delete.user = async function(body,path,localUser){
    // Validate Request
    Engine.utils.validate(body, {
        sk: { required: true, type: 'string' },
        pk: { required: true, type: 'string' }
    })
    const username = body.sk.split('$')[1].replaceAll('_','-');
    Engine.users.deleteUser(username);
    Engine.db.delete({pk: 'users',sk: body.sk})
    Engine.history({pk: 'admin'},localUser.email, `deleted user ${body.sk}`);
    return {status: 200, msg: {} };
};

// --- REPAIR ----
exports.repair = async function(){
    console.log('Executing Repair');
    // Remove Unused Groups
    const partitions = await Engine.listPartitions();
    const groups = await Engine.users.listGroups();
    console.log('partitions',partitions);
    for (const group of groups){
        const dsName = group.name.split('-')[0].split('$')[0];
        if (dsName === 'admin'){ continue }
        if (!partitions.find(p=>{ return p.name == dsName })){
            await Engine.users.deleteGroup(group.name);
            console.log('Deleting Group',group.name);
        }
    }
    console.log('Completed Repair');
}
// ======== Helpers ========

