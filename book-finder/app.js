// CHECK USER STATUS, CHANGE INTERFACE
const loginNav = document.getElementById('login-link');
const logoutNav = document.getElementById('logout-link');

// RUN WHEN PAGE LOADS
window.onload = () => {

    // RUN ONLY ON VERIFICATION AND LOGIN PAGES
    if (window.location.href === "https://mcpherson.dev/book-finder/signup/verification/" || window.location.href === "https://mcpherson.dev/book-finder/login/") {
        if (localStorage.getItem('bookFinderUsername')) {
            emailField.value = localStorage.getItem('bookFinderUsername');
        }
    }

    // RUN ON ALL PAGES
    if (localStorage.getItem('book-finder-login-data') && loginNav != null && logoutNav != null) {
        loginNav.style.display = "none";
        logoutNav.style.display = "flex";
        return;
    } else if (loginNav != null && logoutNav != null) {
        loginNav.style.display = "flex";
        logoutNav.style.display = "none";
        return;
    }
};



// LOG OUT
if (logoutNav != null) {
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
                window.location.href = "/book-finder/";
            }
        };
    });
}


    
