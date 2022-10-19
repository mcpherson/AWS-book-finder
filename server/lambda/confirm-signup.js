const { CognitoIdentityProviderClient, ConfirmSignUpCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
 
exports.handler = async (event) => {

    const client = new CognitoIdentityProviderClient({
        region: "us-east-1"
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
      return(res);
    } catch (e) {
      console.log('Confirmation fail. Error: ', e)
      return(e);
    }

};