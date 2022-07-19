const alertArea = document.getElementById('sign-up-alert');
const alertMessage = document.getElementById('sign-up-alert-message');
const emailField = document.getElementById('emailField');
const confirmField = document.getElementById('confirmation');
const confirmButton = document.getElementById('cofirmation-form-submit');



confirmButton.addEventListener('click', (event) => {
    event.preventDefault();

    const confirmationData = {
        username: emailField.value || localStorage.getItem('bookFinderUsername'),
        confirmationCode: confirmField.value
    };

    const confirmationReq = new XMLHttpRequest();
    confirmationReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/signup/confirmation");
    confirmationReq.send(JSON.stringify(confirmationData));

    confirmationReq.onload = function() {
        if (confirmationReq.status != 200) { // analyze HTTP status of the response
            console.log(`Error ${confirmationReq.status}: ${confirmationReq.statusText}`);
            alertArea.style.backgroundColor = "lightcoral";
            alertMessage.innerText = "The information you entered is invalid. Please check your email address and verification code and try again.";
            throw new Error("Verification failed. Enter correct information or see console for details. Contact administrator if necessary.");
        } else {
            // console.log(confirmationReq.response); // response is the server response
            window.location.href = "/book-finder/login/";
        }
    };


});