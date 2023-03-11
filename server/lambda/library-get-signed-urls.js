const { S3Client, ListObjectsCommand, GetObjectCommand } = require("@aws-sdk/client-s3"); // CommonJS import
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

exports.handler = async (event) => {
    
    // CONFIGURE CLIENTS
    const config = {
        region : "us-east-1"
    }

    // S3
    const s3client = new S3Client(config);
    
    // GET OBJECT KEYS FOR ALL OBJECTS IN BUCKET 
    const params = {
        Bucket : `book-finder-uploads`,
        Prefix : `${event.queryStringParameters.usersub}`
    }

    let s3Keys = [];
    let signedURLs = [];
    let dynamoData = {};
    let finalData = {};

    const listObjects = new ListObjectsCommand(params);
    
    try { // get arrays of image keys and urls from S3
        
        const bucketContents = await s3client.send(listObjects);

        console.log(bucketContents);

        if (!bucketContents.Contents) {
            console.log('no images found')
            let results = {
                isBase64Encoded: false,
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(bucketContents)
            }
            return(results)
        }
        
        bucketContents.Contents.forEach((i) => {
            s3Keys.push(i.Key);
            console.log(s3Keys);
        })
        
    } catch (e) {
        console.log(e);
        let err = {
            isBase64Encoded: false,
            statusCode: e.$metadata.httpStatusCode,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(e)
        };
        console.log('Error: ', err);
        return(err);
    }

    
    
    

    s3Keys.forEach(async (index, i) => {

        let getParams = {
            Bucket: 'book-finder-uploads', 
            Key: i
        };

        let getObj = new GetObjectCommand(getParams)

        try {
            let res = await getSignedUrl(client, getObj, { expiresIn: 600 });
            console.log(res);
            signedURLs.push(res);
        } catch (e) {
            console.log(e);
            return e;
        }

    })

}

