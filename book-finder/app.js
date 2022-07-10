const submitButton = document.getElementById('form-submit');
const alertArea = document.getElementById('alert');
const alertMessage = document.getElementById('alert-message');

submitButton.addEventListener('click', (event) => {
    event.preventDefault();
    const emailField = document.getElementById('email').value;
    const phoneField = document.getElementById('phone').value;
    const passwordField = document.getElementById('password').value;
    const confirmPasswordField = document.getElementById('confirm-password').value;
    validateEmail(emailField);
    validatePhone(phoneField);
    checkPassword(passwordField);
    comparePasswords(passwordField, confirmPasswordField);
    signUp();
});

function validateEmail(emailField) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailField)) {
        return true;
    } else {
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerText = "PLEASE ENTER A VALID EMAIL ADDRESS."
        throw new Error("PLEASE ENTER A VALID EMAIL ADDRESS.");
    }
}

function validatePhone(phoneField) {
    if (/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(phoneField)) {
        return true;
    } else {
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerText = "PLEASE ENTER A VALID PHONE NUMBER."
        throw new Error("PLEASE ENTER A VALID PHONE NUMBER.");
    }
}

function checkPassword(passwordField) {
    const checkedPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,32}$/;
    if (passwordField.match(checkedPassword)) {
        return true;
    }
    else {
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerText = "PASSWORD LENGTH MUST BE BETWEEN 8 AND 32 CHARACTERS. PASSWORD MUST CONTAIN AT LEAST ONE NUMBER, SYMBOL, AND CAPITAL LETTER.";
        throw new Error("PASSWORD LENGTH MUST BE BETWEEN 8 AND 32 CHARACTERS. PASSWORD MUST CONTAIN AT LEAST ONE NUMBER, SYMBOL, AND CAPITAL LETTER.");
    }
}



function comparePasswords(passwordField, confirmPasswordField) {
    if (passwordField === confirmPasswordField && passwordField.length != 0) {
        return true;
    } else {
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerText = "PASSWORD CONFIRMATION MISMATCH.";
        throw new Error("PASSWORD CONFIRMATION MISMATCH.");
    }
}



function signUp(emailField, phoneField, passwordField) {

}