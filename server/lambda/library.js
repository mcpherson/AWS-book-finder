const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3"); // CommonJS import

exports.handler = async (event) => {
    
    // CONFIGURE CLIENT
    const config = {
        region : "us-east-1"
    };
    const client = new S3Client(config);

    // GET OBJECT KEYS FOR ALL OBJECTS IN BUCKET 
    const params = {
        Bucket : `book-finder-uploads`,
        Prefix : `${event.queryStringParameters.usersub}`
    }

    const listObjects = new ListObjectsCommand(params);
    
    try {
        const bucketContents = await client.send(listObjects);

        let objURLs = [];
        bucketContents.Contents.forEach((i) => {
            objURLs.push(`https://book-finder-uploads.s3.amazonaws.com/${i.Key}`);
        });
        bucketContents.imageNames = objURLs;

        let ret = {
            isBase64Encoded: false,
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(bucketContents)
        };
        console.log(ret);
        return(ret);
        
    } catch (e) {
        console.log('Error: ', e);
    }
    
};