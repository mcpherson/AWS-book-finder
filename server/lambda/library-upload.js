const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, ListObjectsCommand } = require("@aws-sdk/client-s3");

exports.handler = async (event) => {

    const client = new S3Client({region : "us-east-1"});

    const uploadData = JSON.parse(event.body);

    const params = {
        Bucket: 'book-finder-uploads', 
        Key: `${uploadData.UserSub}/${uploadData.fileName}`, 
        ContentEncoding: 'base64',
        ContentType: 'image/png'
        // ACL: 'public-read'
    }

    const listParams = {
        Bucket: 'book-finder-uploads', 
        Prefix : `${uploadData.UserSub}`
    }

    const listObjects = new ListObjectsCommand(listParams)

    try { // list all objects in S3 for a given prefix
        
        const bucketContents = await client.send(listObjects);

        // console.log(`bucket contents: ${JSON.stringify(bucketContents)}`)
        
        let currentFileSize = uploadData.fileSize // start with size of file passed in
        let currentStorage = 0

        bucketContents.Contents.forEach((i) => { // add up total filesize of existing images
            currentStorage += i.Size
        })

        if (currentFileSize + currentStorage > 50000000) {

            curMB = Math.ceil(currentFileSize/1000000.0)
            totMB = Math.ceil(currentStorage/1000000.0)

            let err = new Error(`Upload would exceed maximum storage limit (50MB). Your file: ${curMB}MB. Current storage: ${totMB}MB. Please delete some images before uploading more.`)

            let metadata = {httpStatusCode: 413}
            err.$metadata = metadata
            
            throw err

        }
        
    } catch (e) {
        console.log(e);
        let err = {
            isBase64Encoded: false,
            statusCode: e.$metadata.httpStatusCode,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: e.message
            // body: JSON.stringify(e, Object.getOwnPropertyNames(e))
        };
        console.log('Error: ', err);
        return(err);
    }
    
    const putObj = new PutObjectCommand(params)

    try {
        let res = await getSignedUrl(client, putObj, { expiresIn: 60 });
        console.log(res);
        let ret = {
            isBase64Encoded: false,
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: res
          };
        return ret;
    } catch (e) {
        console.log(e);
        return e;
    }
    
    
    // s3.getSignedUrl('putObject', params, function(err, url)
    // {
    //     if (err) { throw {msg:err, code:"AWS_ERROR"}; }
    //     else { 
    //         console.log("Hi" + url);
    //         return url; }
    // });
        
};
