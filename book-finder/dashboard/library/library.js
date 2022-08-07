// CHECK USER STATUS, CHANGE INTERFACE
const loginNav = document.getElementById('login-link');
const logoutNav = document.getElementById('logout-link');

const alertArea = document.getElementById('alert-area');
const alertMessage = document.getElementById('alert-message');
const loadingSpinner = document.getElementById('fouc');
const libraryContainer = document.getElementById('library-container');
const refreshButton = document.getElementById('refresh-images-button');

window.onload = () => {
    // CHANGE UI BASED ON LOGGED IN STATE
    if (localStorage.getItem('book-finder-login-data')) {
        loginNav.style.display = "none";
        logoutNav.style.display = "flex";
    } else {
        loginNav.style.display = "flex";
        logoutNav.style.display = "none";
    }
    
    // CLEAR LOADING SPINNER
    loadingSpinner.style.display = "none";
    
    // LOAD IMAGES AND KEYS FROM S3 VIA API CALL OR URLS IN LOCALSTORAGE
    
    // ONLY CALL S3 IF NECESSARY
    if (!localStorage.getItem('imageURLs') || JSON.parse(localStorage.getItem('numUploads')) != JSON.parse(localStorage.getItem('imageURLs')).length) {
        getImageURLs();
    }
    
    // DISPLAY EACH IMAGE AND KEY
    displayImages(); 
}

const getImageURLs = function(event) {
    // CLEAR AND RESET LOCALSTORAGE FOR MANUAL REFRESH
    if (event) {
        localStorage.removeItem('numUploads');
        localStorage.removeItem('imageURLs');
        localStorage.setItem('numUploads', JSON.stringify(0));
        let imageURLs = [];
        localStorage.setItem('imageURLs', JSON.stringify(imageURLs));
    }
    // GET IMAGE KEYS FROM USER'S S3 BUCKET
    const reqData = {UserSub: JSON.parse(localStorage.getItem('book-finder-login-data')).UserSub}
    // TODO HANDLE ERROR IF NOT LOGGED IN
    const keysReq = new XMLHttpRequest();
    keysReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/get-s3-keys");
    keysReq.setRequestHeader('Authorization', 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken);
    keysReq.send(JSON.stringify(reqData));
    keysReq.onload = function() {
        if (JSON.parse(keysReq.response).length === 0) { // no keys returned
            loadingSpinner.style.display = "none";
            alertArea.style.display = "block";
            alertArea.style.backgroundColor = "lightcoral";
            alertMessage.innerHTML = 'No images found. <a href="/book-finder/dashboard/upload/">Upload some images</a> and they will appear here.';
        } else if (keysReq.status != 200 || JSON.parse(keysReq.response).hasOwnProperty('errorType')) { // error received
            // TODO error handling - invalid usersub, invalid img data, other AWS errors
            loadingSpinner.style.display = "none";
            throw new Error("Image request failed.");
        } else { // create and store URLs
            loadingSpinner.style.display = "none";
            let objKeys = JSON.parse(keysReq.response);
            localStorage.setItem('numUploads', JSON.stringify(objKeys.length)); // store number of uploaded images for comparison on pageload
            objKeys.forEach((i, index) => {
                let urlObj = {
                    "Key" : JSON.parse(keysReq.response)[index],
                    "imageURL" : `https://book-finder-${reqData.UserSub}.s3.amazonaws.com/${JSON.parse(keysReq.response)[index]}`
                };
                let storedURLs = JSON.parse(localStorage.getItem('imageURLs'));
                storedURLs.push(urlObj);
                localStorage.setItem('imageURLs', JSON.stringify(storedURLs));
            });
        };
    };
};

const displayImages = function() {
    JSON.parse(localStorage.getItem('imageURLs')).forEach((i, index) => {

    });
};

// REFRESH IMAGES MANUALLY
refreshButton.addEventListener('click', getImageURLs);