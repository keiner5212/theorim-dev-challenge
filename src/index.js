const express = require('express');
const multer = require('multer');

const Hydrator = require('./modules/engine-hydrator');
const Infra = require('./modules/AppConfig');
const OpenRoutes = require('./modules/OpenRoutes');
const Engine = require('./modules/jschema-engine/$engine');
const DataRoutes = {
    user: require('./modules/DataUser'),
    modeler: require('./modules/Modeler'),
    admin: require('./modules/Admin')
}

// Utils
const userRole = function(dsName,groups){
    const rgx = new RegExp(`^${dsName}[\$\-]`);
    const roleId = groups.find(g=>{ return rgx.test(g) || dsName === g });
    return roleId;
}

const setUserRole = function(dsName,res){
    const groups = res.locals.user.groups;
    const rgx = new RegExp(`^${dsName}[\$\-]`);
    const roleId = groups.find(g=>{ return rgx.test(g) || dsName === g });
    res.locals.user.role = roleId;
}

const handleResponse = async function(fn,...args){
    try{
        const result = await fn(...args);
        return {status: 200, result: result}
    } catch (err){
        const e = typeof(err) === 'object' ? err : {message: err};
        if (!e.message){
            console.log('MISSING ERROR MESSAGE',typeof(e), e)
            return {status: 500, result: err}
        }
        if (e.message.startsWith('NotAuthorized')){
            return {status: 403, result: e.message}
        } else if (e.message.startsWith('BadRequest')){
            return {status: 400, result: e.message}
        } else if (e.message.startsWith('NotFound')){
            return {status: 404, result: e.message}
        } else {
            let msg = `ServerError:${e.message}`.trim();
            if (typeof(e.stack) === 'string' && e.stack.split('\n').length > 1){
                msg += `@${e.stack.split('\n')[1].trim()}`
            }
            console.log('!ERR>>',msg);
            Engine.error(msg,'server')
            return {status: 500, result: msg}
        }
    }
}

// Port must be 8080
const app = express();
const PORT = 8080;

// Use JSON
app.use(express.json());

// Multer
const upload = multer({ dest: 'uploads/' });



// Protect Routes
// User info and cognito groups available in the res.local.user object
app.use(Infra.verifyUser);

// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public', {
    extensions: ['html']
}));

//  -------------------------------
//  -----------  ROUTES -----------
//  -------------------------------

// --------------------
// ----   GET --------
// --------------------

// === Defs ===
app.get('/api/defs/:dataset', async (req, res) => {
    const role = userRole(req.params.dataset, res.locals.user.groups)
    try {
        const def = await Engine.def(req.params.dataset, role);
        return res.status(200).send(def);
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        return res.status(500).send('Internal Server Error at ' + req.url);
    }
});

app.get('/api/defs/:dataset/:jtable/:schema', async (req, res) => {
    try {
        const def = await Engine.schema(req.params);
        return res.status(def.status).send(def.msg);
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        return res.status(500).send('Internal Server Error at ' + req.url);
    }
});

// === Get Data ===

// -- Admin
app.get('/api/data/admin/:jtable', async (req, res) => {
    if (!res.locals.user.groups.includes('admin')){
        return res.status(404).send(`NotAuthorized:User not authorized to access admin routes`);
    }
    if(!DataRoutes.admin[req.params.jtable]){
        return res.status(400).send(`Invalid: Route not found ${req.params.jtable}`);
    }
    try{
        const data = await DataRoutes.admin[req.params.jtable]();
        return res.status(200).send(data);
    } catch (e){
        console.log('err',e);
        return res.status(500).send(e.message);
    }
});

// -- Modeler
app.get('/api/data/:dataset([^$]+)\\$modeler/:jtable', async (req, res) => {
    if (!res.locals.user.groups.includes(`${req.params.dataset}$modeler`)){
        return res.status(404).send(`User not authorized to access modeler routes`);
    }
    if(!DataRoutes.modeler[req.params.jtable]){
        return res.status(400).send(`Invalid Route:${req.params.jtable}`);
    }
    try{
        const data = await DataRoutes.modeler[req.params.jtable]({
            dsName: req.params.dataset,
            dataset: req.params.dataset + '$modeler',
            jtable: req.params.jtable,
        });
        return res.status(200).send(data);
    } catch (e){
        console.log('err',e);
        return res.status(500).send(e.message);
    }
});

// -- User
app.get('/api/data/:dataset/:jtable/:sk?', async (req, res) => {
    try{
        const role = userRole(req.params.dataset,res.locals.user.groups);
        // const params = { query: req.query, path: req.params }
        const params = req.query;
        params.pk = `${req.params.dataset}/${req.params.jtable}`;
        if (req.params.sk){ params.sk = req.params.sk }
        const data = await Engine.query(params,role);
        return res.status(200).send(data);
    } catch (e){
        console.log('err',e);
        return res.status(500).send(e.message);
    }
});

// --------------------
// ----   POST --------
// --------------------


app.post('/api/data', async (req, res) => {
    // Check for PK and Action
    if (!req.body.pk){
        return res.status(400).send('Primary Key or Sort Key not specified');
    }
    if (!req.query.action){
        return res.status(400).send('Action not specified');
    }
    // Parse PK
    var path;
    try{
        path = Engine.utils.parsePath(req.body.pk, req.body.sk);
    } catch(e){
        console.log('parse err', e);
        return res.status(400).send('Invalid PK or SK:' + req.body.pk + '/' + req.body.sk)
    }

    var fn = null;
    // Admin
    if (path.dsName === 'admin'){
        if (!res.locals.user.groups.includes('admin')){
            return res.status(400).send('NotAuthorized: User not permitted to post to admin routes')
        }
        fn = DataRoutes.admin[req.query.action] ? DataRoutes.admin[req.query.action][path.schema] : null;
    } else if (/\$modeler$/.test(path.dataset)){
        if (!res.locals.user.groups.includes(path.dataset)){
            return res.status(400).send('NotAuthorized: User not permitted to post to modeler routes')
        }
        fn = DataRoutes.modeler[req.query.action] ? (DataRoutes.modeler[req.query.action][path.schema] || DataRoutes.modeler[req.query.action].prop) : null
    } else {
        fn = DataRoutes.user[req.query.action]
    }

    if (!fn){
        return res.status(400).send('Invalid: Invalid action ' + req.query.action)
    }
    res.locals.user.role = userRole(path.dataset,res.locals.user.groups);
    const result = await handleResponse(fn,req.body,path,res.locals.user)
    // console.log('RESULT',result);
    return res.status(result.status).send(result.result);
});

app.post('/api/import', async (req, res) => {
    // Check for PK
    if (!req.body.pk){
        return res.status(400).send('Primary Key or Sort Key not specified');
    }
    if (!['new','edit'].includes(req.body.importType)){
        return res.status(400).send('importType must be new or edit');
    }
    const ds = req.body.pk.split('/')[0]
    const user = {
        email: res.locals.user.email,
        role: res.locals.user.roles[ds]
    }
    const uploadFn = req.body.importType === 'edit' ? DataRoutes.user.bulk_edit : DataRoutes.user.import;
    delete req.body.importType;
    try{
        const result = await uploadFn(req.body, user);
        return res.status(result.status).send(result.msg);
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        return res.status(500).send('Internal Server Error at ' + req.url);
    }
});


// --------------------
// --- FILES -----
// --------------------

app.post('/api/file/:dataset/:jtable/:schema/:field/:uid', upload.array('files[]'), async (req, res) => {
    setUserRole(req.params.dataset,res);
    const {result,status} = await handleResponse(DataRoutes.user.upload,req.params,req.files, res.locals.user)
    res.status(status).send(result)
});

app.post('/api/delfile/:dataset/:jtable/:schema/:field/:uid/:fileName', async (req, res) => {
    setUserRole(req.params.dataset,res);
    const {status,result} = await handleResponse(DataRoutes.user.delfile,req.params,res.locals.user)
    res.status(status).send(result)
});

app.get('/api/file/:dataset/:jtable/:schema/:field/:uid/:fileName', async (req, res) => {
    try{
        const result = await DataRoutes.user.file(req.params,res.locals.user.groups);
        res.redirect(result)
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        res.status(404).send('File not found');
    }
});



// --------------------
// --- SPECIAL    -----
// --------------------

// ---- Linking ----
app.get('/api/dslinks', async (req, res) => {
    try{
        const result = await Engine.listPartitions();
        res.status(200).send(result)
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        return res.status(500).send('Internal Server Error at ' + req.url);
    }
});


app.get('/api/links/:dataset/:jtable?/:schema?', async (req, res) => {
    const dsName = req.params.dataset.split('$')[0];
    var sk = '';
    if (req.params.jtable){
        sk = `dataset$${dsName}-jtable$${req.params.jtable}`;
        if (req.params.schema){
            sk += '-schema$' + req.params.schema;
        }
    }
    try{
        
        const result = await OpenRoutes.getLinks(dsName,sk,req.query.obj,req.query.prim);
        res.status(200).send(result)
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        return res.status(500).send('Internal Server Error at ' + req.url);
    }
});

app.get('/api/jtcols/:dataset/:jtable', async (req, res) => {
    const dsName = req.params.dataset.split('$')[0];
    try{
        const result = await OpenRoutes.getJtCols(dsName,req.params.jtable);
        res.status(result.status).send(result.msg)
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        return res.status(500).send('Internal Server Error at ' + req.url);
    }
});



// ---- Users ----

app.get('/api/users', async (req, res) => {
    if (!req.query.q) {
        res.status(400).send('Query not specified');
        return
    }
    try{
        const result = await OpenRoutes.searchUser(req.query.q);
        res.status(result.status).send(result.msg)
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        res.status(500).send('Internal Server Error at ' + req.url);
    }
});

app.get('/api/roles/:dataset', async (req, res) => {
    try{
        const result = await OpenRoutes.searchGroup(req.params.dataset);
        res.status(200).send(result)
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        res.status(500).send('Internal Server Error at ' + req.url);
    }
});

// ----- Repair ----
app.get('/api/repair', async (req, res) => {
    if (!res.locals.user.groups.includes('admin')){
        return res.status(404).send(`NotAuthorized:User not authorized to execute repair`);
    }
    try{
        const result = await DataRoutes.admin.repair();
        res.status(200).send(result)
    } catch (e) {
        console.log('!RepairError:',e);
        res.status(500).send('Repair Error ' + e.toString());
    }
});


// --------------------
// --- OPEN ROUTES   --
// --------------------

app.get('/api/config', async (req, res) => {
    const cnf = {
        app: process.env.$APP_ID,
        region: process.env.$APP_REGION,
        user: res.locals.user,
        version: process.env.$APP_BUILD,
        env: process.env.$APP_ENV,
        metadata: process.env.$APP_METADATA,
        // instance_id: process.env.$APP_INSTANCE_ID
    };
    cnf.entitlements = Engine.entitlements(res.locals.user.groups);
    res.json(cnf);
});

app.get('/api/logout', (req, res) => {
    res.cookie('AWSELBAuthSessionCookie-0', '', { expires: new Date(0), path: '/' });
    res.cookie('AWSELBAuthSessionCookie-1', '', { expires: new Date(0), path: '/' });
    res.cookie('AWSELBAuthSessionCookie-2', '', { expires: new Date(0), path: '/' });
    res.cookie('AWSELBAuthSessionCookie-3', '', { expires: new Date(0), path: '/' });
    res.json({ok: true});
});


app.post('/api/error', async (req, res) => {
    if (!req.body.error && typeof(req.body.error) !== 'string'){
        return res.status(400).send('Error message invalid');
    }
    try{
        const result = await Engine.error(req.body.error, 'client',res.locals.user.email);
        res.status(200).send(result)
    } catch (e) {
        console.log('!Error:',req.url,'>>>',e);
        res.status(500).send('Internal Server Error at ' + req.url);
    }
});



//  -------------------------------
//  ---------- ERRORS  -----------
//  -------------------------------
// Error handling middleware
app.use((err, req, res, next) => {
    const errorSource = `Error in ${req.method} ${req.url}`;
    const errorMessage = `Message: ${err.message || 'Internal Server Error'}`;
    const errorStack = `Stack: ${err.stack || 'No stack available'}`;
    const errorLog = `${errorSource}\n${errorMessage}\n${errorStack}`;
    const user = res?.locals?.user ? res.locals.user.email : 'Unknown User';
    console.error(errorLog);
    Engine.error(errorLog,user);
    
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        status: err.status || 500,
      },
    });
    next();
});

process.on('uncaughtException', (err) => {
    const errorMessage = `!!!Uncaught Exception: ${err.message}>>Stack: ${err.stack}`;
    console.log(errorMessage);
    Engine.error(errorMessage, 'unknown').catch((e)=>{ console.log('Uncaught Exception Logging Error:',e)});
});
  
process.on('unhandledRejection', (reason, promise) => {
    let errorMessage = `!!!Unhandled Rejection >> Reason: ${reason}`;
    let errorLocation = 'unknown';
    console.log(errorMessage);
    // Get the stack trace and parse the file and line number
    if (reason && reason.stack) {
        const stackLines = reason.stack.split('\n');
        if (stackLines.length > 1) {
            const errorLine = stackLines[1].trim();
            errorMessage += `\nOccurred at: ${errorLine}`;

            // Extract file and line number
            const match = errorLine.match(/\(([^)]+)\)/);
            if (match) {
                errorLocation = match[1];
            }
        }
    }
    console.log(errorMessage + '@' + errorLocation);
    Engine.error(errorMessage + '@' + errorLocation, 'unknown').catch((e)=>{ console.log('Unhandeled Rejection Logging Error:',e)});
});




//  -------------------------------
//  -----------  START  -----------
//  -------------------------------
Infra.setParams(__dirname).then(()=>{
    // Engine.fix();
    console.debug = process.env.$APP_ENV.toLowerCase() === 'local' ? console.debug : ()=>{};
    Hydrator.init().then(()=>{
        console.log(`Starting Server for ${process.env.$APP_ID} in ${process.env.$APP_REGION}`,true);
        app.listen(PORT, async () => {
            console.log(`${process.env.$APP_ID} running on http://localhost:${PORT} in ${process.env.$APP_REGION}`);
            console.log(`Instance ID: ${process.env.$APP_INSTANCE_ID}`);
            console.log('Setting custom attribute in user pool');
            console.log(`Boot Complete ${process.env.$APP_ID}@${process.env.$APP_REGION}:${process.env.$APP_ENV}`,true);
        });
        app.keepAliveTimeout = 30000; 
        // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds higher than the ALB idle timeout
        app.headersTimeout = 31000; 
    })
});