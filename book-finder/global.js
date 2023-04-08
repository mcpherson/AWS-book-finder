// called when any page loads - checks for tokens in localstorage, refreshes them if needed. Changes UI state between logged in / logged out.
function setUserState() {

    const authNav = document.getElementById('auth-link');
    const signupNav = document.getElementById('signup-link');
    const libraryNav = document.getElementById('library-link');

    if (authNav === undefined || authNav === null) { // user is on a page without a login/logout link
        return;
    } else if (!localStorage.getItem('book-finder-login-data')) { // user is not logged in
        authNav.setAttribute('href', '/login/');
        authNav.innerText = 'LOGIN';
        libraryNav.style.display = 'none';
        return;
    } else { // user is logged in
        signupNav.style.display = 'none';
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

    
}


// compare current time with last login - refresh if necessary.
const refreshTokens = function () {
    
    let checkTime = new Date();
    console.log(checkTime.getTime())
    if (checkTime.getTime() > JSON.parse(localStorage.getItem('book-finder-token-expiration'))) {
        cognitoRefresh(apiEndpoints.API_USER_REFRESH)
        .then((data) => {
            console.log(data);
            if(data.$metadata.httpStatusCode !== 200) {
                // TODO ERROR HANDLING
                console.log('Token refresh error - status code: ', data.$metadata.httpStatusCode);
            } else {
                console.log('success')
                localStorage.setItem('book-finder-login-data', JSON.stringify(data))
                const sessionExpire = JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.ExpiresIn
                data.sessionStart = checkTime.getTime() + sessionExpire
                localStorage.setItem('book-finder-token-expiration', JSON.stringify(sessionExpire))
                // window.location.href = "/";
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
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({refreshToken : localStorage.getItem('book-finder-refresh-token')})
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