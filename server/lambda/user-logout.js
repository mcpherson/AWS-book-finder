const { SSOClient, LogoutCommand } = require("@aws-sdk/client-sso"); // CommonJS import
 
exports.handler = async (event) => {

    const client = new SSOClient({
        region: "us-east-1"
    });
    
    const bodyData = JSON.parse(event.body);

    var params = {
      accessToken: bodyData.accessToken
    };

    console.log(params);
    
    const command = new LogoutCommand(params);
    
    try {
      const res = await client.send(command)
      let ret = {
        isBase64Encoded: false,
        statusCode: res.$metadata.httpStatusCode,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(res)
      };
      console.log('Logout success. Result: ', ret);
      return(ret);
    } catch (e) {
      let error = {
        isBase64Encoded: false,
        statusCode: e.$metadata.httpStatusCode,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(e)
      };
      console.log('Logout fail. Error: ', error);
      return(error);
    }

};