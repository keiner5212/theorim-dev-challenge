

exports.stamp = function(itm,isNew){
    itm.__object = itm.sk.split('+').pop().split('-').pop().split('$')[0];
    itm.__id = itm.sk;
    // Parent
    const index = itm.sk.includes('+') ? itm.sk.split('+')[0] : null;
    let parent = itm.sk.split('+').pop().split('-').slice(0,-1).join('-');
    if (index && parent){ 
        parent = `${index}+${parent}`
    }
    itm.__parent = parent && parent !== itm.sk ? parent : null;
    if (isNew === undefined){ return itm }
    if (isNew === false){
        itm.__updated = Date.now();
    } else if (isNew === true){
        itm.__created = Date.now();
        itm.__updated = Date.now();
        itm.__uid = itm.sk.split('+').pop().split('-').pop();
    }
    return itm;
}

exports.hexId = function(){
    const rand = (Math.random() * 36 ** 6) | 0; // 6-digit Base36 number
    return rand.toString(36).padStart(6, '0'); 
}

exports.parse = function(pk,sk){
    const obj = {
        dataset: pk.split('/')[0],
        jtable: pk.split('/').pop(),
        jtableName: pk.split('/').pop().split('$')[0]
    }
    if (sk){
        obj.schema = sk.split('+').pop().split('-').pop().split('$')[0]
    }
}

exports.testSk = function(sk){
    if (!sk || typeof(sk) !== 'string'){ return false };
    const allParts = sk.split('+');
    const parts = allParts.pop().split('-');
    const t = /^[A-Za-z][A-Za-z0-9\_]*\$[A-Za-z0-9\_]*[A-Za-z0-9]$/
    for (const p of parts){
      if (!t.test(p)){
        return false;
      }
    }
    if (allParts.length > 1){
      if (/^[A-Za-z0-9\-\_]*[A-Za-z0-9]$/.test(allParts)){
        return false;
      }
    }
    return true;
}

exports.testRole = function(dsName,group){
  const rgx = new RegExp(`^${dsName}(?:-|$)`);
  return rgx.test(group);
}

exports.parsePath = function(pk,skArg){
  const [dataset,jtable,skPath] = pk.split('/'); 
  const sk = skArg || skPath;

  const params = {};
  params.pk = `${dataset}/${jtable}`;
  params.full = `${dataset}/${jtable}`;
  params.dataset = dataset;
  params.dsName = dataset.split('$')[0];
  params.modifier = params.dataset.includes('$') ? params.dataset.split('$').pop() : null;
  params.jtable = jtable || null;
  params.jtableName = params.jtable ? params.jtable.split('$')[0] : null;

  if (sk){
    params.full += `/${sk}`;
    params.sk = sk;
    const skParts = sk.split('+');
    const skIndex = sk.includes('+') ? skParts[0] : null;
    params.skIndex = skIndex;
    params.skPath = skParts.pop();
    params.parent = params.sk.slice(0, params.sk.lastIndexOf("-"));
    params.schema = params.skPath.split('-').pop().split('$')[0];
  }

  return params;
}

exports.validate = function(object,schema,allowOther=false){
    const errors = [];
    const required = [];
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
            errors.push(`${key} must match pattern ${schemaProp.pattern}`);
        } 
    }
    // Check Result
    if (errors.length > 0) {
      throw `BadPost:${errors.join(';')}`
    }
    return true;
}

/**
 * Returns true if lastUpdated is older than milliseconds from now
 * @param {number} lastUpdated the last updated timestamp
 * @param {number} milliseconds the number of milliseconds to compare
 * @returns {boolean}
 */
exports.isOlderThanMilliseconds = function (lastUpdated, milliseconds) {
    if (!lastUpdated) return true;

    const lastUpdatedDate = new Date(lastUpdated);
    const currentDate = new Date();
    const differenceInMilliseconds = currentDate - lastUpdatedDate;

    return differenceInMilliseconds > milliseconds;
};