const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient,PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");




// Write Ops
exports.create = async function(item){
    const client = new DynamoDBClient({ region: process.env.$APP_REGION });
    const ddbDocClient = DynamoDBDocumentClient.from(client);

    const putCommand = new PutCommand({
        TableName: process.env.$APP_DDBTABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
    });
    const result = await ddbDocClient.send(putCommand);
    return item;
}

exports.edit = async function(itemIn){
    const client = new DynamoDBClient({ region: process.env.$APP_REGION }); // replace 'YOUR_REGION' with your AWS region
    const ddbDocClient = DynamoDBDocumentClient.from(client);
    const item = {...itemIn};
    
    if (!item.pk || !item.sk){
        throw new Error('Item must have pk and sk');
    }
    const returnItem = JSON.parse(JSON.stringify(item));
    const pk = item.pk;
    const sk = item.sk;
    delete item.pk;
    delete item.sk;


    let updateExpression = '';
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    // Set Values
    const updateExp = [];
    for (const [key, value] of Object.entries(item)) {
        if (value === null){ continue; }
        const keyAlias = getId();
        const attributeName = `#${keyAlias}`;
        const attributeValue = `:${keyAlias}`;
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
        updateExp.push( `${attributeName} = ${attributeValue}`);
    }
    if (updateExp.length > 0){
        updateExpression = 'SET ' + updateExp.join(', ');
    }

    // Remove Values
    const remExp = [];
    for (const [key, value] of Object.entries(item)) {
        if (value !== null){ continue; }
        const keyAlias = getId();
        const attributeName = `#${keyAlias}`;
        expressionAttributeNames[attributeName] = key;
        remExp.push( `${attributeName}`);
    }
    if (remExp.length > 0){
        updateExpression += ' REMOVE ' + remExp.join(', ');
    }

    const updateParams= {
        TableName: process.env.$APP_DDBTABLE,
        Key: { pk, sk }, // Include sort key if provided
        UpdateExpression: updateExpression.trim(),
        ExpressionAttributeNames: expressionAttributeNames,
    };
    if (Object.keys(expressionAttributeValues).length > 0){
        updateParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    const updateCommand = new UpdateCommand(updateParams);

    const result = await ddbDocClient.send(updateCommand);
    return returnItem;
}

exports.append = async function(pk,sk,field,value){
    const client = new DynamoDBClient({ region: process.env.$APP_REGION }); // replace 'YOUR_REGION' with your AWS region
    const ddbDocClient = DynamoDBDocumentClient.from(client);
    
    if (!pk || !sk || !field || !value){
        throw new Error('Item must have pk and sk and field name and value');
    }
    const updateCommand = new UpdateCommand({
        TableName: process.env.$APP_DDBTABLE,
        Key: { pk, sk }, // Include sort key if provided
        UpdateExpression: 'set #field = list_append(if_not_exists(#field, :empty_list), :newval)',
        ExpressionAttributeValues: {
            ':empty_list': [],
            ':newval': [value],
        },
        ExpressionAttributeNames: {
            '#field': field,
        },
        ReturnValues: "ALL_NEW"
    });

    const result = await ddbDocClient.send(updateCommand);
    return result;
}

exports.delete = async function(item) {
    const client = new DynamoDBClient({ region: process.env.$APP_REGION });
    const ddbDocClient = DynamoDBDocumentClient.from(client);

    if (!item.pk || !item.sk) {
        throw new Error('Item must have pk and sk');
    }

    const deleteCommand = new DeleteCommand({
        TableName: process.env.$APP_DDBTABLE,
        Key: {
            pk: item.pk,
            sk: item.sk
        }
    });
    try {
        const result = await ddbDocClient.send(deleteCommand);
        return result;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return { message: 'Item does not exist, but operation is successful' };
        }
        throw error;
    }
};


exports.error = async function(error,user,source="server"){
    console.log('--recording error--', error);
    const client = new DynamoDBClient({ region: process.env.$APP_REGION });
    const ddbDocClient = DynamoDBDocumentClient.from(client);
    
    if (typeof error !== 'string'){
        console.warn("!INVALID ERROR!", error);
        error = JSON.stringify(error);
    }

    const errObj = {
        pk: 'admin$logs',
        sk: 'log$' + Date.now(),
        error: error,
        user: user,
        source: source,
        date: Date.now(),
        _ttl: Date.now() + 1000*60*60*24*7 // 7 days
    }

    const putCommand = new PutCommand({
        TableName: process.env.$APP_DDBTABLE,
        Item: errObj
    });
    const result = await ddbDocClient.send(putCommand);
    return true;
}

// Read
exports.getOne = async function (pk, sk, cols) {
    if (!pk || !sk) {
        throw new Error('getOneError:Item must have pk and sk');
    }
    const Client = new DynamoDBClient({ region: process.env.$APP_REGION });
    const docClient = DynamoDBDocumentClient.from(Client);
    const cmd = {
        TableName: process.env.$APP_DDBTABLE,
        Key: { pk, sk } // Include sort key if provided
    }
    if (cols){
        cmd.ExpressionAttributeNames = {};
        const exp = [];
        for (const c of cols){
            const keyAlias = getId(true);
            const attributeName = `#${keyAlias}`;
            cmd.ExpressionAttributeNames[attributeName] = c;
            exp.push(attributeName)
        }
        cmd.ProjectionExpression = exp.join(', ');
    }
    const getCommand = new GetCommand(cmd);

    const result = await docClient.send(getCommand);
    return result.Item;
}

exports.query = async function(query={},limit){
    // Build Params
    const params = {
        TableName: process.env.$APP_DDBTABLE,
        KeyConditionExpression: "#pk = :pkValue",
        ExpressionAttributeNames: {
            "#pk": 'pk'
        },
        ExpressionAttributeValues: {
            ":pkValue": query.pk
        },
    };
    delete query.pk;
    // Extract Sort Key
    if (query.sk){
        params.ExpressionAttributeValues[":skValue"] = query.sk;
        params.ExpressionAttributeNames["#sk"] = "sk";
        params.KeyConditionExpression += " and begins_with(#sk, :skValue)";
        delete query.sk;
    } else if (query.index){
        params.IndexName = 'gsi-index';
        params.ExpressionAttributeValues[":indexValue"] = query.index;
        params.ExpressionAttributeNames["#index"] = "index";
        params.KeyConditionExpression += " and begins_with(#index, :indexValue)";
        delete query.index;
    }

    // Extract Last Key
    if (query._lastkey){
        params.ExclusiveStartKey = query._lastkey;
    }
    delete query._lastkey;

    // Set Aliases
    const _cols = query._cols ? query._cols.split('+').filter(c=>{return c !== 'pk' && c !== 'sk'}) : null;
    delete query._cols;
    const keys = _cols ? [...new Set(Object.keys(query).concat(_cols))] : Object.keys(query);

    const alias = {pk: 'pk', sk: 'sk'};
    keys.forEach(k=>{
        alias[k] =  getId();
        params.ExpressionAttributeNames['#' +alias[k]] = k;
    })
    // Projection
    if (_cols){
        params.ExpressionAttributeNames["#sk"] = "sk";
        _cols.push('pk','sk');
        params.ProjectionExpression = _cols.map(c=>{ return '#' + alias[c] }).join(', ');
    }

    // Build Params
    const operators = ['attribute_exists', 'begins_with','contains', "<>",  "<=", ">=","=","<", ">", 'in']
    let index = 0;
    let filterExpression = [];
    for (const key in query){
        const attrName = alias[key];
        const parts = query[key].split('!');
        let operator = parts.length > 1 || parts[0].endsWith('attribute_exists') ? parts[0] : '=';
        let conjugator = 'and';
        let value = parts.pop();
        if (value === 'true'){ value = true; }
        if (value === 'false'){ value = false; }
        if (index === 0){
            conjugator = '';
            index++;
        } else if (operator.charAt(0) === '*'){
            operator = operator.substring(1);
            conjugator = 'or';
        }
        if (!operators.includes(operator)){
            throw 'EngineQueryError:InvalidOperator:' + operator;
        }
        // Build Filter
        let filter = '';
        if (["=", "<>", "<", "<=", ">", ">="].includes(operator)){
            filter = `${conjugator} #${attrName} ${operator} :${attrName}`.trim();
        } else if (['begins_with','contains'].includes(operator)){
            filter = `${conjugator} ${operator}(#${attrName},:${attrName})`.trim();
        } else if (operator === 'in'){
            const valArray = value.split(',');
            const valueExp = valArray.map((v,i)=>`:${attrName}${i}`).join(', ');
            valArray.forEach((v,i)=>{
                params.ExpressionAttributeValues[`:${attrName}${i}`] = v;
            })
            filter = `${conjugator} #${attrName} in (${valueExp})`.trim();
        } else if (operator === 'attribute_exists'){
            filter = `${conjugator} attribute_exists(#${attrName})`.trim();
        } else {
            filter = `${conjugator} #${attrName} = :${attrName}`.trim();
        }
        if (value && operator !== 'in' && operator !== 'attribute_exists'){
            params.ExpressionAttributeValues[`:${attrName}`] = value;
        }
        filterExpression.push(filter);
    }
    if (filterExpression.length > 0){
        params.FilterExpression = filterExpression.join(' ').trim();
    }
    if (limit){
        params.Limit = limit;
    }
    // Execute Query
    const Client = new DynamoDBClient({ region: process.env.$APP_REGION });
    const docClient = DynamoDBDocumentClient.from(Client);
    const command = new QueryCommand(params);
    const response = await docClient.send(command);
    return {Items: response.Items, lastKey: response.LastEvaluatedKey};
}

exports.scan = async function () {
    const client = new DynamoDBClient({ region: process.env.$APP_REGION });
    const docClient = DynamoDBDocumentClient.from(client);
    const allItems = [];
    let lastEvaluatedKey = null;
    for(let i=0; i<100; i++){
        const scanParams = {
          TableName: process.env.$APP_DDBTABLE
        };
        if (lastEvaluatedKey){
            scanParams.ExclusiveStartKey = lastEvaluatedKey;
        }
        // Execute the scan command
        const scanResult = await docClient.send(new ScanCommand(scanParams));
        // Add the retrieved items to the array
        if (scanResult.Items) {
          allItems.push(...scanResult.Items);
        }
  
        // Update the lastEvaluatedKey for the next page of results
        lastEvaluatedKey = scanResult.LastEvaluatedKey;
        if (!lastEvaluatedKey){ break; } // Continue until all pages are scanned
      } // Continue until all pages are scanned
      return allItems;
}

//  -------------------------------
//  ----  INLINE HELPERS ----------
//  -------------------------------
function getId(lettersOnly=false){
    // Generate ID
    let result = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbersAndLetters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    result += letters.charAt(Math.floor(Math.random() * letters.length));
    const charSet = lettersOnly === true ? letters : numbersAndLetters;
    for (let i = 0; i < 4; i++) {
        result += charSet.charAt(Math.floor(Math.random() * numbersAndLetters.length));
    }

    return result.toLowerCase();
}