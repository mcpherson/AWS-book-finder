const { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
 
exports.handler = async (event) => {

    const client = new CognitoIdentityProviderClient({
        region: process.env.AWS_REGION
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
      let ret = {
        isBase64Encoded: false,
        statusCode: res.$metadata.httpStatusCode,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(res)
      };
      return(ret);
    } catch (e) {
      console.log('Login fail. Error: ', e);
      let error = {
        isBase64Encoded: false,
        statusCode: e.$metadata.httpStatusCode,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(e)
      };
      return(error);
    }

};
