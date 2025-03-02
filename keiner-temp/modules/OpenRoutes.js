const Engine = require('./jschema-engine/$engine');
const $defs = require('./helpers/$defs');


// Entitlements
// exports.getEntitlements = async function(userGroups){
//     Engine.entitlements(userGroups);
//     const userEntitlements = { modeler: [], user: [] };   
//     // const groups = userGroups.map(u=>{ return u.replace('defs#','') });
//     const allDatasets = await Engine.listPartitions() || [];
//     const activeDatasets = allDatasets.filter(d=>{ return !d.pk.endsWith('$archive') });
//     // console.log('activeDatasets',activeDatasets);
//     for (const g of userGroups){
//         if (g === 'admin-admin'){
//             userEntitlements.admin = [{name: 'admin', title: 'Admin', pk: 'admin'}];
//             continue;
//         }
//         const ds = activeDatasets.find(d=>{ return d.name === g.split('$')[0].split('-')[0] });
//         if (!ds){ continue }
//         if (/\$modeler$/.test(g)){ 
//             userEntitlements.modeler.push({name: `${ds.name}$modeler`, title: ds.title, pk: `${ds.name}$modeler`});
//         } else {
//             if (!userEntitlements.user.find(u=>{ return u.pk === ds.pk })){
//                 userEntitlements.user.push(ds);
//             }
//         }
//     }
    
//     return {status: 200, msg: userEntitlements};
// };


// ---- Dataset Definitions ----
exports.getLinks = async function(datasetName,sk,objType,primitives){
    console.debug('OpenRoutes getLinks',datasetName,sk,objType,primitives);
    const params = { pk: `defs/${datasetName}` }
    if (sk) { params.sk = sk }
    const res = await Engine.db.query(params);
    if (objType){
        res.Items = res.Items.filter(i=>{ return i.$class === objType || i.__object === objType });
    }
    if (primitives){
        res.Items = res.Items.filter(i=>{ return $defs.PrimitiveFields.includes(i.__object) });
    }
    return res.Items;
}

exports.getJtCols = async function(datasetName,jtable){
    const params = { 
        pk: `defs/${datasetName}`, 
        sk: `dataset$${datasetName}-jtable$${jtable}-`,
        // $class: '=!property',
        _cols: 'pk+sk+name+title+label' 
    }
    const res = await Engine.db.query(params);
    const cols = [...new Set(res.Items.map(d=>{ return d.name }))].filter(c=> { return c !== undefined });
    let returnCols = cols.map(c=>{ return {name: c, label: c} });
    return { status: 200, msg: returnCols };
}

// ---- Users ----

exports.searchUser = async function(srchStr){
    const data = await Engine.users.listAllUsers(srchStr);
    return {status: 200, msg: data};
}

exports.searchGroup = async function(dsName){
    const roles = await Engine.users.listGroups(dsName);
    const rolesList = roles.map(r=>{ return { name: r.name, label: r.name.split('-').pop() } });
    return rolesList.filter(r=>{ return !r.name.endsWith('$modeler') });
}
