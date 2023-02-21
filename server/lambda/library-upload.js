const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

exports.handler = async (event) => {
    
    const client = new S3Client({region : "us-east-1"});

    const uploadData = JSON.parse(event.body);

    const params = {
        Bucket: 'book-finder-uploads', 
        Key: `${uploadData.UserSub}/${uploadData.fileName}`, 
        ContentEncoding: 'base64',
        ContentType: 'image/png'
        // ACL: 'public-read'
    };
    
    const putObj = new PutObjectCommand(params)

    try {
        let res = await getSignedUrl(client, putObj, { expiresIn: 600 });
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
