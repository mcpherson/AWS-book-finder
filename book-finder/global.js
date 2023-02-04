// called when any page loads - checks for tokens in localstorage, refreshes them if needed. Changes UI state between logged in / logged out.
function setUserState() {

    const authNav = document.getElementById('auth-link');
    const signupNav = document.getElementById('signup-link');

    if (authNav === undefined) { // user is on a page without a login/logout link
        return;
    } else if (!localStorage.getItem('book-finder-login-data')) { // user is not logged in
        authNav.setAttribute('href', '/book-finder/login/');
        authNav.innerText = 'LOGIN';
        return;
    } else { // user is logged in
        signupNav.innerText = '';
        authNav.setAttribute('href', 'javascript:void(0);');
        authNav.innerText = 'LOGOUT';
        // add logout function to nav button
        authNav.addEventListener('click', () => {
            cognitoLogout(apiEndpoints.API_USER_LOGOUT)
            .then((data) => {
                console.log(data);
                if(data.status !== 200) {
                    // TODO ERROR HANDLING ////////////////////////////////////////////////////////////////////////////////////////////////////////
                    localStorage.removeItem('book-finder-login-data'); // TEMP FIX WHILE REWRITING LOGOUT
                    localStorage.removeItem('book-finder-data');
                    window.location.href = "/";
                    // TODO ERROR HANDLING ////////////////////////////////////////////////////////////////////////////////////////////////////////
                    console.log('Logout error: ', data);
                } else { // reset everything and send 'em home
                    localStorage.removeItem('book-finder-login-data');
                    localStorage.removeItem('book-finder-data');
                    window.location.href = "/";
                }
            })
            .catch((error) => {
                // TODO ERROR HANDLING
                console.log('Logout error: ', error);
                throw new Error("Logout failed. See console for details.");
            })
        });
    }

    // compare current time with last login - refresh if necessary.
    let checkTime = new Date();
    if (checkTime - JSON.parse(localStorage.getItem('book-finder-login-data')).sessionStart > 86400000) {
        cognitoRefresh(apiEndpoints.API_USER_LOGOUT)
        .then((data) => {
            console.log(data);
            if(data.status !== 200) {
                // TODO ERROR HANDLING
                console.log('Token refresh error: ', error);
            } else {
                localStorage.clear();
                window.location.href = "/";
            }
        })
        .catch((error) => {
            // TODO ERROR HANDLING
            console.log('Token refresh error: ', error);
            throw new Error("Token refresh failed. See console for details.");
        })
    }
}

// refreshes Cognito tokens
async function cognitoRefresh(url = '') {

    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({refreshToken : JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.RefreshToken})
    });

    return response.json();
}

// Cognito logout
async function cognitoLogout(url = '') {

    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({accessToken : JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.AccessToken})
    });

    return response.json();
}