const { SSMClient,GetParametersByPathCommand } = require("@aws-sdk/client-ssm");
const { MetadataService } = require("@aws-sdk/ec2-metadata-service");
const Engine = require('./jschema-engine/$engine');
const path = require('path');
const fs = require('fs');
const JWS = require('jws');

exports.setParams = async function(rootDir){
    console.log('Setting Params');
    // Read App Name and Region from mason.txt
    const configPath = path.resolve(rootDir,'mason.txt');
    const configText = fs.readFileSync(configPath,'utf-8');
    const configLines = configText.split(',');
    process.env.$APP_REGION = configLines[0].trim();
    process.env.$APP_ID = configLines[1].trim();
    process.env.$IS_LOCAL = configLines[2] ? 'y' : ''; 
    process.env.$APP_ENV = configLines.length > 1 ? configLines[2]?.trim() : '';
    console.log(`REGION: ${process.env.$APP_REGION} APP_ID: ${process.env.$APP_ID} LOCAL: ${process.env.$IS_LOCAL}`)

    // Get Version and Build Info
    const buildInfoPath = path.resolve(rootDir,'version.txt');
    if (fs.existsSync(buildInfoPath)){
        process.env.$APP_BUILD = fs.readFileSync(buildInfoPath,'utf-8').split('/n').join(';');
    } else {
        process.env.$APP_BUILD = '0.0.0';
    }
    

    // Set Insance ID
    process.env.$APP_INSTANCE_ID = 0;
    process.env.$APP_METADATA = '{}';
    // if (process.env.$APP_ENV !== 'local'){
    //     try{
    //         console.log('Getting Instance Params');
    //         const params = await getInstanceParams();
    //         console.log('Got instance Params:',params);
    //         if (params){
    //             process.env.$APP_METADATA = JSON.stringify(params);
    //             // process.env.$APP_INSTANCE_ID = await GetInstanceId();
    //             // process.env.$APP_REGION = params.region;
    //         } else {
    //             console.log('!Metadata Pull Failed');
    //         }
    //     } catch (e){
    //         console.error('Failed to get Instance ID:',e);
    //     }
    // }

    // Get the parameters from SSM
    // const ssmClient = new SSMClient({ region: process.env.$APP_REGION }); // Set your preferred region
    // const pathPrefix = `/${process.env.$APP_ID}/`;
    // const parameters = [];
    // let nextToken;

    // do {
    //     const response = await ssmClient.send(new GetParametersByPathCommand({
    //         Path: pathPrefix,
    //         NextToken: nextToken
    //     }));

    //     if (response.Parameters) {
    //         parameters.push(...response.Parameters);
    //     }
    //     nextToken = response.NextToken;

    // } while (nextToken);
    // // Set Params to ENV
    // parameters.forEach(p=>{ 
    //     const pname = p.Name.replace(`/${process.env.$APP_ID}/`,'');
    //     const key = `$APP_${pname.toUpperCase()}`;
    //     if (key !== '$APP_ENV'){ 
    //         process.env[key] = p.Value;
    //     }
    // });
    // Check for Test Params
    if (process.env.$APP_ENV == 'local' && fs.existsSync(path.join(rootDir,'_testuser.json'))){
        const testUserEmail = JSON.parse(fs.readFileSync(path.join(rootDir,'_testuser.json'),'utf-8')).email;
        const testUser = await Engine.users.getUser(testUserEmail);
        process.env.$APP_TESTUSER = JSON.stringify(testUser)
        // console.log('Test User:',testUser);
    } else {
        console.log('No Test User Found');
    }
    return true;
}

exports.verifyUser = async function(req,res,next){
    // Role Extract Function
    const extractRoles = () => {
        res.locals.user.roles = {};
        for (const g of res.locals.user.groups){
            const ds = g.split('-')[0];
            const rName = g.includes('-') ? g.split('-').pop() : 'user';
            if (!res.locals.user.roles[ds] || rName !== 'user'){
                res.locals.user.roles[ds] = rName;
            }
        }
    }
    // Return Mock User if Local
    if (process.env.$APP_TESTUSER) {
        res.locals.user = JSON.parse(process.env.$APP_TESTUSER);
        extractRoles();
        return next();
    }

    // Return OK for Health Check without Token
    if (!req.headers['x-amzn-oidc-data']){
        res.status(200).send('OK');
        return
    }

    // Extract User Info from Access Token
    const accessJWT = decode(req.headers['x-amzn-oidc-accesstoken'],1);
    res.locals.user = {
        username: accessJWT.username,
        groups: accessJWT['cognito:groups'],
        roles: {}
    }
    res.locals.user.groups = res.locals.user.groups || [];
    extractRoles();
    
    
    // Parse Data Token
    const dataJWT = decode(req.headers['x-amzn-oidc-data'],1);
    res.locals.user.email = dataJWT.email;


    // Verify Token
    const { kid } = decode(req.headers['x-amzn-oidc-data'],0);
    const verificationURL = `https://public-keys.auth.elb.${process.env.$APP_REGION}.amazonaws.com/${kid}`
    const pbRes = await fetch(verificationURL);
    const pubKey = await pbRes.text();
    const isValid = JWS.verify(req.headers['x-amzn-oidc-data'],'ES256', pubKey);
    if (!isValid) { 
        req.status(403).send('Forbidden: Invalid Token');
        return;
    }
    return next();
}

async function getInstanceParams(){
    const metadataService = new MetadataService({});

    const token = await metadataService.fetchMetadataToken();
    console.log('token:',token);
    const possibleURLs = [
        "/latest/meta-data",
        "/latest/meta-data/instance-id",
        "/latest/meta-data/tags/instance",
    ]
    const allMD = [];
    for (const url of possibleURLs){
        try{
            const md = await metadataService.request(url, {});
            allMD.push(md);
            console.log('MD succeeded:',url);
        } catch (e){
            console.log('Failed to get MD:',url);
        }
    }
    return allMD;
}


function decode(token,index=0){
    const payload = token.split('.')[index]
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
}