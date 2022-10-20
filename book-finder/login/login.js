const alertArea = document.getElementById('login-alert');
const alertMessage = document.getElementById('login-alert-message');
const emailField = document.getElementById('login-email');
const passwordField = document.getElementById('login-password');
const loginButton = document.getElementById('login-form-submit');
const formArea = document.querySelector('.form');
const spinner = document.querySelector('.spinner');



loginButton.addEventListener('click', (event) => {
    event.preventDefault();

    formArea.style.visibility = "hidden";
    spinner.style.display = "block";
    spinner.style.left = `${(0.5*window.innerWidth)-100}px`;
    spinner.style.top = `${(formArea.getBoundingClientRect().top)+(0.5*formArea.offsetHeight)-100}px`;

    const loginData = {
        username: emailField.value || localStorage.getItem('bookFinderUsername'),
        password: passwordField.value
    };

    const loginReq = new XMLHttpRequest();
    loginReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/login");
    loginReq.send(JSON.stringify(loginData));

    loginReq.onload = function() {
        if (loginReq.status != 200 || JSON.parse(loginReq.response).hasOwnProperty('__type')) { // analyze HTTP status of the response
            formArea.style.visibility = "visible";
            spinner.style.display = "none";
            console.log(`Error ${loginReq.status}: ${loginReq.statusText} - AWS Error: ${loginReq.response}`);
            alertArea.style.display = "block";
            alertArea.style.backgroundColor = "lightcoral";
            alertMessage.innerText = "Invalid login information. Please check your email address and re-type your password and try again. Make sure that your account has been verified. Reset password if necessary.";
            throw new Error("Login failed. Enter correct information or see console for details. Reset password if necessary.");
        } else {
            // console.log(loginReq.response); // response is the server response
            localStorage.setItem('book-finder-login-data', loginReq.response);
            window.location.href = "../library/";
        }
    };


});