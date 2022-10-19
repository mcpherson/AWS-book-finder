const { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
 
exports.handler = async (event) => {

    const client = new CognitoIdentityProviderClient({
        region: "us-east-1"
    });

    const pbody = JSON.parse(event.body);
    
    var params = {
      ClientId: process.env.COGNITO_APP_CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
          USERNAME: pbody.username,
          PASSWORD: pbody.password
      }
    };

    const command = new InitiateAuthCommand(params);
    
    try {
      const res = await client.send(command);
      const getUser = new GetUserCommand({AccessToken : res.AuthenticationResult.AccessToken});
      const userData = await client.send(getUser);
      res.UserSub = userData.Username;
      console.log('Login success. Result: ', res);
      return(res);
    } catch (e) {
      console.log('Login fail. Error: ', e);
    }

};
