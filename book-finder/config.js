const apiEndpointID = "pa5ksgmnk3"
const apiStage = "dev"
const awsRegion = "us-east-1"
const apiEndpoints = {
    API_USER                    : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/user`,
    API_USER_SIGNUP             : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/user/signup`,
    API_USER_CONFIRM_SIGNUP     : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/user/confirm-signup`,
    API_USER_NEW_PASSWORD       : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/user/new-password`,
    API_USER_LOGIN              : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/user/login`,
    API_USER_LOGOUT             : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/user/logout`,
    API_USER_REFRESH            : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/user/refresh`,
    API_LIBRARY                 : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/library`,
    API_LIBRARY_UPLOAD          : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/library/upload`,
    API_LIBRARY_SEARCH          : `https://${apiEndpointID}.execute-api.${awsRegion}.amazonaws.com/${apiStage}/library/search`,
}