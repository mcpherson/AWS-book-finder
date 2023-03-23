const alertArea = document.getElementById('login-alert');
const alertMessage = document.getElementById('login-alert-message');
const emailField = document.getElementById('login-email');
const passwordField = document.getElementById('login-password');
const loginButton = document.getElementById('login-form-submit');
const formArea = document.querySelector('.form');
const spinner = document.querySelector('.spinner');

// RUN WHEN PAGE LOADS
window.onload = () => {
    emailField.value = localStorage.getItem('bookFinderUsername');
    setUserState(); // in global js file
}

loginButton.addEventListener('click', (event) => {
    event.preventDefault();

    // clear old login data
    localStorage.removeItem('book-finder-login-data');

    formArea.style.visibility = "hidden";
    spinner.style.display = "block";
    spinner.style.left = `${(0.5*window.innerWidth)-100}px`;
    spinner.style.top = `${(formArea.getBoundingClientRect().top)+(0.5*formArea.offsetHeight)-100}px`;

    const loginData = {
        username: emailField.value,
        password: passwordField.value
    };

    cognitoLogin(apiEndpoints.API_USER_LOGIN, loginData)
    .then((data) => {
        if(data.$metadata.httpStatusCode !== 200) {
            console.log(data);
            formArea.style.visibility = "visible";
            spinner.style.display = "none";
            alertArea.style.display = "block";
            alertArea.style.backgroundColor = "lightcoral";
            alertMessage.innerHTML = 'Login error. Check your email address/password and try again. Accounts must be <a href="../signup/verification">verified</a> after signup using the code sent to the email address you provided. Reset password if necessary.';
        } else {
            data.sessionStart = new Date
            localStorage.setItem('book-finder-login-data', JSON.stringify(data));
            window.location.href = "/library/";
        }
    })
    .catch((error) => {
        console.log(error);
        formArea.style.visibility = "visible";
        spinner.style.display = "none";
        alertArea.style.display = "block";
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerHTML = 'Login error. Check your email address/password and try again. Accounts must be <a href="../signup/verification">verified</a> after signup using the code sent to the email address you provided. Reset password if necessary.';
    });
});

// fetch (POST) for Cognito login
async function cognitoLogin(url = '', data = {}) {

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
};