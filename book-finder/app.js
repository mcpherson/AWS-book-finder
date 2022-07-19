// CHECK USER STATUS, CHANGE NAVIGATION
const loginNav = document.getElementById('login-link');
const logoutNav = document.getElementById('logout-link');
window.onload = () => {
    if (localStorage.getItem('book-finder-login-data')) {
        loginNav.style.display = "none";
        logoutNav.style.display = "flex";
        return;
    } else {
        loginNav.style.display = "flex";
        logoutNav.style.display = "none";
        return;
    }
};



// LOG OUT
logoutNav.addEventListener('click', () => {
    const logoutData = {
        accessToken : JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.AccessToken
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
            throw new Error("Logout failed. See console for details.");
        } else {
            // console.log(logoutReq.response); // response is the server response
            localStorage.removeItem('book-finder-login-data');
            window.location.href = "/book-finder/index.html";
        }
    };
});


    
