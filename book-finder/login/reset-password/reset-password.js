// RUN WHEN PAGE LOADS
window.onload = () => {
    setUserState(); // in global js file
}

document.getElementById('forgot-password-form-submit').addEventListener('submit', cognitoNewPassword(apiEndpoints.API_USER_NEW_PASSWORD, {email: document.getElementById('')}))

// Cognito password reset
async function cognitoNewPassword(url = '', data = {}) {

    await refreshTokens()

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
        body: JSON.stringify(data)
    });

    return response.json();
}