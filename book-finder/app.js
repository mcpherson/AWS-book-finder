function logOut() {
    const logoutData = {
        accessToken : localStorage.getItem('book-finder-login-data').AccessToken
    }
    const logoutReq = new XMLHttpRequest();
    logoutReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/logout");
    logoutReq.send(JSON.stringify(logoutData));

    logoutReq.onload = function() {
        if (logoutReq.status != 200) { // analyze HTTP status of the response
            console.log(`Error ${logoutReq.status}: ${logoutReq.statusText}`);
            // alertArea.style.display = "block";
            // alertArea.style.backgroundColor = "lightcoral";
            // alertMessage.innerText = "Invalid logout information. Please check your email address and re-type your password and try again. Make sure that your account has been verified. Reset password if necessary.";
            throw new Error("logout failed. See console for details.");
        } else {
            // console.log(logoutReq.response); // response is the server response
            localStorage.removeItem('book-finder-logout-data');
            window.location.href = "/index.html";
        }
    };
}