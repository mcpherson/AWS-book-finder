const { CognitoIdentityProviderClient, ConfirmSignUpCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
 
exports.handler = async (event) => {

    const client = new CognitoIdentityProviderClient({
        region: process.env.AWS_REGION
    });
    const pbody = JSON.parse(event.body);

    var params = {
      ClientId: process.env.COGNITO_APP_CLIENT_ID,
      ConfirmationCode: pbody.confirmationCode,
      Username: pbody.username
    }

    const command = new ConfirmSignUpCommand(params);
    
    try {
      const res = await client.send(command)
      console.log('Confirmation success. Result: ', res)
      let ret = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(res)
      };
      return(ret);
    } catch (e) {
      console.log('Confirmation fail. Error: ', e)
      return(e);
    }

};