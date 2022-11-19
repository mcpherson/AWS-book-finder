const alertArea = document.querySelector('.alert');
const alertMessage = document.querySelector('.alert-message');
const emailField = document.getElementById('emailField');
const confirmField = document.getElementById('confirmation');
const confirmButton = document.getElementById('cofirmation-form-submit');
const formArea = document.querySelector('.form');
const spinner = document.querySelector('.spinner');

// RUN WHEN PAGE LOADS
window.onload = () => {
    emailField.value = localStorage.getItem('bookFinderUsername');
    setUserState();  // in global js file
}

confirmButton.addEventListener('click', (event) => {
    event.preventDefault();

    formArea.style.visibility = "hidden";
    spinner.style.display = "block";
    spinner.style.left = `${(0.5*window.innerWidth)-100}px`;
    spinner.style.top = `${(formArea.getBoundingClientRect().top)+(0.5*formArea.offsetHeight)-100}px`;

    const confirmationData = {
        username: emailField.value,
        confirmationCode: confirmField.value
    };

    const confirmationReq = new XMLHttpRequest();
    confirmationReq.open("POST", `https://${apiEndpointID}.execute-api.us-east-1.amazonaws.com/dev/user/confirm-signup`);
    confirmationReq.send(JSON.stringify(confirmationData));

    confirmationReq.onload = function() {
        if (confirmationReq.status != 200 || JSON.parse(confirmationReq.response).hasOwnProperty('__type')) { // analyze HTTP status of the response
            formArea.style.visibility = "visible";
            spinner.style.display = "none";
            console.log(`Error ${confirmationReq.status}: ${confirmationReq.statusText} - AWS Error: ${confirmationReq.response}`);
            alertArea.style.backgroundColor = "lightcoral";
            alertMessage.innerText = "Verification failed. Enter correct information or see console for details. Contact administrator if necessary.";
            throw new Error("Verification failed. Enter correct information or see console for details. Contact administrator if necessary.");
        } else {
            // console.log(confirmationReq.response); // response is the server response
            window.location.href = "../../login/";
        }
    };
});