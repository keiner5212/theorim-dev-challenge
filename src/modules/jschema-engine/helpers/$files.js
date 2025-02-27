const { S3Client, HeadObjectCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const mime = require('mime-types');
const fs = require('fs');

exports.upload = async function (file, objectKey,overwrite=false) {
    const s3Client = new S3Client({region: process.env.$APP_REGION});
    
    // Check if file exists
    if (overwrite === false){
        try{
            await s3Client.send(new HeadObjectCommand({
                Bucket: process.env.$APP_S3BUCKET,
                Key: objectKey
            }));
            return {status: 400, error: 'File Exists'}
        } catch (err) {
            const ok = true;
        }
    }

    
    try {
        const fileStream = fs.createReadStream(file.path);
        const contentType = mime.lookup(objectKey);
        const uploadParams = {
            Bucket: process.env.$APP_S3BUCKET,
            Key: objectKey,
            Body: fileStream,
            ContentType: contentType
        };

        const res = await s3Client.send(new PutObjectCommand(uploadParams));
        fs.unlinkSync(file.path);
        return {status: 200}
    } catch (err) {
        fs.unlinkSync(file.path);
        throw err
    }
}

exports.getUrl = async function (objectKey) {
    const s3Client = new S3Client({region: process.env.$APP_REGION});
    if (objectKey.charAt(0) === '/'){
        objectKey = objectKey.substring(1);
    }
    const command = new GetObjectCommand({
        Bucket: process.env.$APP_S3BUCKET,
        Key: objectKey,
        ResponseContentDisposition: 'inline'
    });

    // Generate a signed URL that expires in 60 minutes (3600 seconds)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
}

exports.delete = async function (objectKey) {
    const s3Client = new S3Client({region: process.env.$APP_REGION});
    
    const deleteParams = {
        Bucket: process.env.$APP_S3BUCKET,
        Key: objectKey
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    return true;
}



