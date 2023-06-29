const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3")
const { DynamoDBClient, DeleteItemCommand } = require("@aws-sdk/client-dynamodb")

exports.handler = async (event) => {

    // CONFIGURE CLIENTS
    const config = {
        region : process.env.AWS_REGION
    }

    const dynamoClient = new DynamoDBClient(config)
    const s3Client = new S3Client(config)
    
    // CONFIGURE COMMANDS
    const userSub = event.queryStringParameters.usersub
    const imageKey = event.queryStringParameters.key

    console.log(userSub)
    console.log(imageKey)

    // S3
    const s3Params = {
        Bucket : process.env.UPLOADS_BUCKET_NAME,
        Prefix : `${userSub}`,
        Key : `${userSub}/${imageKey}`
    }

    let responseBody = {
        s3Response: {},
        dynamoResponse: {}
    }
    
    let response = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: ''
    }

    const s3DeleteCommand = new DeleteObjectCommand(s3Params)
    try {
        const res = await s3Client.send(s3DeleteCommand)
        console.log(res)
        response.statusCode = 200
        responseBody.s3Response = res
    } catch (error) {
        console.log(error)
        response.statusCode = error.$metadata.httpStatusCode
        responseBody.s3Response = error
        response.body = JSON.stringify(responseBody)
        return(response)
    }

    // DYNAMODB
    const dynamoParams = {
        Key: {
            Id: { S: `${event.queryStringParameters.usersub}` },
            Image: { S: `${event.queryStringParameters.key}`}
        },
        TableName: process.env.DB_TABLE_NAME
    }

    const dynamoDeleteCommand = new DeleteItemCommand(dynamoParams)
    try {
        const res = await dynamoClient.send(dynamoDeleteCommand)
        console.log(res)
        response.statusCode = 200
        responseBody.dynamoResponse = res
        response.body = JSON.stringify(responseBody)
        return(response)
    } catch (error) {
        console.log(error)
        response.statusCode = error.$metadata.httpStatusCode
        responseBody.dynamoResponse = error
        response.body = JSON.stringify(responseBody)
        return(response)
    }
    
}