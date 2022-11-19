const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
 
exports.handler = async (event) => {

    const client = new CognitoIdentityProviderClient({
        region: "us-east-1"
    });

    const data = JSON.parse(event.body);
    
    var params = {
        ClientId: process.env.COGNITO_APP_CLIENT_ID,
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: {
            REFRESH_TOKEN: data.refreshToken
        }
    };

    const command = new InitiateAuthCommand(params);
    
    try {
        const res = await client.send(command);
        console.log('Refresh success. Result: ', res);
        let ret = {
            isBase64Encoded: false,
            statusCode: res.$metadata.httpStatusCode,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(res)
        };
        return(ret);
    } catch (e) {
        console.log('Refresh fail. Error: ', e);
        let error = {
            isBase64Encoded: false,
            statusCode: e.$metadata.httpStatusCode,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(e)
        };
        return(error);
    }

};
