const { S3Client, ListObjectsCommand, GetObjectCommand } = require("@aws-sdk/client-s3"); // CommonJS import
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

exports.handler = async (event) => {

    // CONFIGURE CLIENTS
    const config = {
        region : process.env.AWS_REGION
    }
    
    // S3
    const s3client = new S3Client(config);
    
    // GET OBJECT KEYS FOR ALL OBJECTS IN BUCKET 
    const params = {
        Bucket : process.env.UPLOADS_BUCKET_NAME,
        Prefix : `${event.queryStringParameters.usersub}`
    }
     
    let s3Keys = [];
    let s3URLs = [];
    let signedURLs = [];
    let dynamoData = {};
    let finalData = {};
    
    const listObjects = new ListObjectsCommand(params);
    
    try { // get arrays of image keys and urls from S3
        
        const bucketContents = await s3client.send(listObjects);

        console.log(`bucket contents: ${bucketContents}`);

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
            s3URLs.push(`https://${process.env.UPLOADS_BUCKET_NAME}.s3.amazonaws.com/${i.Key}`);
            s3Keys.push(i.Key);
            console.log(s3URLs);
            console.log(`s3 keys: ${s3Keys}`);
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

    for (const i in s3Keys) {

        let getParams = {
            Bucket: process.env.UPLOADS_BUCKET_NAME, 
            Key: s3Keys[i]
        };

        let getObj = new GetObjectCommand(getParams)

        try {
            let res = await getSignedUrl(s3client, getObj, { expiresIn: 15 });
            console.log(`Signed URL: ${res}`);
            signedURLs.push(res);
        } catch (e) {
            console.log(e);
            return e;
        }
    }

    // DYNAMO
    const dynamoClient = new DynamoDBClient(config);

    const dynamoGetParams = {
        TableName: process.env.DB_TABLE_NAME,
        Key: {
            Id: { S: `${event.queryStringParameters.usersub}` },
            Image: { }
        }
    }

    try { // return object with rekog results from dynamo + s3 data from s3Get

        for (var i=0; i<s3Keys.length; i++) {
            dynamoGetParams.Key.Image = { S: (s3Keys[i]).split("/")[1] };
            let getItemCommand = new GetItemCommand(dynamoGetParams);
            let rekogResults = await dynamoClient.send(getItemCommand);
            console.log(s3Keys[i]);
            // improve
            let s3Key = s3Keys[i];
            dynamoData[s3Key] = rekogResults;
        }

    } catch (e) {
        let err = {
            isBase64Encoded: false,
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(e)
        }
        console.log('Error: ', err);
        return(err);
    }

    finalData.s3URLs = s3URLs;
    finalData.signedURLs = signedURLs;
    finalData.dynamoData = dynamoData;

    let results = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(finalData)
    }

    console.log(process.env.DB_TABLE_NAME);
    return(results);
    
}