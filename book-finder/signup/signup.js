const submitButton = document.getElementById('sign-up-form-submit');
const alertArea = document.getElementById('sign-up-alert');
const alertMessage = document.getElementById('sign-up-alert-message');
const formArea = document.querySelector('.form');
const spinner = document.querySelector('.spinner');


submitButton.addEventListener('click', (event) => {
    event.preventDefault();
    formArea.style.visibility = "hidden";
    spinner.style.display = "block";
    spinner.style.left = `${(0.5*window.innerWidth)-100}px`;
    spinner.style.top = `${(formArea.getBoundingClientRect().top)+(0.5*formArea.offsetHeight)-100}px`;
    const emailField = document.getElementById('email').value;
    // const phoneField = document.getElementById('phone').value;
    const passwordField = document.getElementById('password').value;
    const confirmPasswordField = document.getElementById('confirm-password').value;
    validateEmail(emailField);
    // validatePhone(phoneField);
    checkPassword(passwordField);
    comparePasswords(passwordField, confirmPasswordField);
    const userData = {
        email: emailField,
        // phone: phoneField,
        password: passwordField
    };
    createUser(userData);
});



// EMAIL ADDRESS VALIDATION
function validateEmail(emailField) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailField)) {
        return true;
    } else {
        formArea.style.visibility = "visible";
        spinner.style.display = "none";
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerText = "PLEASE ENTER A VALID EMAIL ADDRESS."
        throw new Error("PLEASE ENTER A VALID EMAIL ADDRESS.");
    }
}



// PHONE NUMBER VALIDATION
// function validatePhone(phoneField) {
//     if (/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(phoneField)) {
//         return true;
//     } else {
//         alertArea.style.backgroundColor = "lightcoral";
//         alertMessage.innerText = "PLEASE ENTER A VALID PHONE NUMBER."
//         throw new Error("PLEASE ENTER A VALID PHONE NUMBER.");
//     }
// }



// PASSWORD VALIDATION
function checkPassword(passwordField) {
    const checkedPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,32}$/;
    if (passwordField.match(checkedPassword)) {
        return true;
    }
    else {
        formArea.style.visibility = "visible";
        spinner.style.display = "none";
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerText = "PASSWORD LENGTH MUST BE BETWEEN 8 AND 32 CHARACTERS. PASSWORD MUST CONTAIN AT LEAST ONE NUMBER, SPECIAL CHARACTER LOWERCASE LETTER, AND UPPERCASE LETTER.";
        throw new Error("PASSWORD LENGTH MUST BE BETWEEN 8 AND 32 CHARACTERS. PASSWORD MUST CONTAIN AT LEAST ONE NUMBER, SPECIAL CHARACTER LOWERCASE LETTER, AND UPPERCASE LETTER.");
    }
}



function comparePasswords(passwordField, confirmPasswordField) {
    if (passwordField === confirmPasswordField && passwordField.length != 0) {
        return true;
    } else {
        formArea.style.visibility = "visible";
        spinner.style.display = "none";
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerText = "PASSWORD CONFIRMATION MISMATCH.";
        throw new Error("PASSWORD CONFIRMATION MISMATCH.");
    }
}


// USER CREATION
async function createUser(userData) {

    // const response = await fetch("https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/signup", {
    //     method: 'POST',
    //     mode: 'cors',
    //     cache: 'no-cache',
    //     credentials: 'same-origin',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Access-Control-Allow-Origin': '*'
    //     },
    //     redirect: 'follow',
    //     referrerPolicy: 'no-referrer',
    //     body: JSON.stringify(userData)
    // });

    const signupReq = new XMLHttpRequest();
    signupReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/signup");
    signupReq.send(JSON.stringify(userData));

    signupReq.onload = function() {
        if (signupReq.status != 200 || signupReq.response.$metadata.httpStatusCode != 200) { // analyze HTTP status of the response
            formArea.style.visibility = "visible";
            spinner.style.display = "none";
            console.log(`Error ${signupReq.status}: ${signupReq.statusText} - AWS Error: ${signupReq.response}`);
            alertArea.style.backgroundColor = "lightcoral";
            alertMessage.innerText = "Signup failed. See console for details. Contact administrator if necessary.";
            throw new Error("Signup failed. See console for details. Contact administrator if necessary.");
        } else {
            console.log(signupReq.response); // response is the server response
            localStorage.setItem('UserSub', signupReq.response.UserSub);
            localStorage.setItem('bookFinderUsername', userData.email); 
            // window.location.href = "/book-finder/signup/verification/";
        }
    };

    
}
