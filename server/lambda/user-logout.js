const { SSOClient, LogoutCommand } = require("@aws-sdk/client-sso"); // CommonJS import
 
exports.handler = async (event) => {

    const client = new SSOClient({
        region: "us-east-1"
    });
    
    const pbody = JSON.parse(event.body);
    console.log(event);
    console.log(pbody);

    var params = {
      accessToken: pbody.accessToken
    }
    console.log(params);
    
    const command = new LogoutCommand(params);
    
    try {
      const res = await client.send(command)
      console.log('Logout success. Result: ', res)
      return(res);
    } catch (e) {
      console.log('Logout fail. Error: ', e)
    }

};
