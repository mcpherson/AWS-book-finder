const { S3Client, ListObjectsCommand } = require("@aws-sdk/client-s3"); // CommonJS import

exports.handler = async (event) => {
    
    // CONFIGURE CLIENT
    const config = {
        region : "us-east-1"
    };
    const client = new S3Client(config);
    
    // GET OBJECT KEYS FOR ALL OBJECTS IN BUCKET 
    const listObjects = new ListObjectsCommand({Bucket : `book-finder-uploads`, Prefix : `${event.UserSub}`});
    const bucketContents = await client.send(listObjects);
    console.log(bucketContents);
    console.log(event);
    let objKeys = [];
    bucketContents.Contents.forEach((i) => {
        objKeys.push(i.Key);
    });
    bucketContents.imageNames = objKeys;
    return(bucketContents.imageNames);
};