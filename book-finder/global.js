// called when any page loads - checks for tokens in localstorage, refreshes them if needed. Changes UI state between logged in / logged out.
function setUserState() {
    // HANDLE FOUC
    window.setTimeout(() => {
        document.getElementById('fouc').style.display = "none"
    }, 40)

    const authNav = document.getElementById('auth-link')
    const signupNav = document.getElementById('signup-link')
    const libraryNav = document.getElementById('library-link')
    const homeSignup = document.getElementById('home-option-signup')
    const homeLogin = document.getElementById('home-option-login')
    const homeLibraryLayout = 
        `<a href="./library">
        <div id="home-library-option-button" class="home-option-button">
            <span id="home-library-option-title" class="home-option-title">
            <i class="fa-solid fa-book-open"></i>&nbsp;&nbsp;LIBRARY
            </span>
        </div>
        </a>
        <div id="home-library-option-description-container" class="home-option-description-container">
            <span id="home-library-option-description" class="home-option-description">View, search, and curate your library.</span>
        </div>`
        const homeLogoutLayout = 
        `<a href="javascript:void(0);" id="home-logout-link">
        <div id="home-logout-option-button" class="home-option-button">
            <span id="home-logout-option-title" class="home-option-title">
            <i class="fa-solid fa-hand-peace"></i>&nbsp;&nbsp;LOGOUT
            </span>
        </div>
        </a>
        <div id="home-logout-option-description-container" class="home-option-description-container">
            <span id="home-logout-option-description" class="home-option-description">See you next time.</span>
        </div>`

    if (!localStorage.getItem('book-finder-login-data')) { // user is not logged in
        if (authNav !== null) {
            authNav.setAttribute('href', '/login/');
            authNav.innerText = 'LOGIN';
        }
        if (libraryNav !== null) { libraryNav.style.display = 'none' }
        return;
    } else { // user is logged in
        if (homeSignup !== null) { homeSignup.innerHTML = homeLibraryLayout } // home page, change signup option
        if (homeLogin !== null) { homeLogin.innerHTML = homeLogoutLayout } // home page, change login option
        if (signupNav !== null) { signupNav.style.display = 'none' }
        if (authNav !== null) {
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
        } else { // home
            let homeLogout = document.getElementById('home-logout-link')
            homeLogout.addEventListener('click', () => {
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
            })
        }
    }

    
    
}


// compare current time with last login - refresh if necessary.
const refreshTokens = function () {
    
    let checkTime = new Date();

    if (checkTime.getTime() > JSON.parse(localStorage.getItem('book-finder-token-expiration'))) {
        cognitoRefresh(apiEndpoints.API_USER_REFRESH)
        .then((data) => {
            if(data.$metadata.httpStatusCode !== 200) {
                // TODO ERROR HANDLING
                console.log('Token refresh error - status code: ', data.$metadata.httpStatusCode);
            } else {
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