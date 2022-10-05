// TODO: CommonJS or ES6 module???? Explore.

const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const dynoClient = new DynamoDBClient();

exports.handler = async (event, context) => {
  //console.log(JSON.stringify(event));
  //console.log(JSON.stringify(context));
//   console.log(JSON.stringify(process.env));
  let ret = {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: process.env.DB_TABLE_NAME
  };

  const params = {
    TableName: process.env.DB_TABLE_NAME,
    Key: {
        Id: {S: 'bullshit'},
        Image: {S: 'dipshit.png'}
    }
  };

// const params = {
//     TableName: process.env.DB_TABLE_NAME,
//     Key: marshall({
//         Id: "asfaf"
//     }),
//     KeyConditionExpression:
//   };

// let params = {
//     ExpressionAttributeValues: {
//         ":v1": {
//             S: "asfaf"
//         },
//         ":v2": {
//             S: "gvshdh"
//         }
//     },
//     TableName: process.env.DB_TABLE_NAME,
//     KeyConditionExpression: "Id = :v1 and Image = :v2"
//  };

  const getItemCommand = new GetItemCommand(params);

  try {
    const data = await dynoClient.send(getItemCommand);
    ret.body = data;
    return ret;
  } catch (error) {
    console.log(`getItemCommand failed: ${error}`);
    // throw new Error(JSON.stringify(error));
  }
};