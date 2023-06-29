const { CognitoIdentityProviderClient, SignUpCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
 
exports.handler = async (event) => {

    const client = new CognitoIdentityProviderClient({
        region: process.env.AWS_REGION
    });
    
    console.log(JSON.stringify(event));
    console.log(event);
    console.log(typeof event.body);
    var pbody = JSON.parse(event.body);
    console.log(pbody);
    
    var params = {
    //   ClientId: "47bf10g0lma5hi95uk83jut7g5", OLD
      ClientId: process.env.COGNITO_APP_CLIENT_ID,
      Password: pbody.password,
      Username: pbody.email,
      UserAttributes: [
        {
          Name: 'email',
          Value: pbody.email,
        },
      ],
    }

    const command = new SignUpCommand(params);
    
    try {
      const res = await client.send(command)
      console.log('Signup success. Result: ', res)
      let ret = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(res)
      };
      return(ret);
    } catch (e) {
      console.log('Signup fail. Error: ', e)
      return(e);
    }

};
