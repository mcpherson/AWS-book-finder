// CHECK USER STATUS, CHANGE INTERFACE
const loginNav = document.getElementById('login-link');
const logoutNav = document.getElementById('logout-link');

const alertArea = document.getElementById('alert-area');
const alertMessage = document.getElementById('alert-message');
const loadingSpinner = document.getElementById('fouc');
const libraryContainer = document.getElementById('library-container');
const refreshButton = document.getElementById('refresh-images-button');
const searchInput = document.getElementById('search-input');

window.onload = () => {
    // CHANGE UI BASED ON LOGGED IN STATE
    if (localStorage.getItem('book-finder-login-data')) {
        loginNav.style.display = "none";
        logoutNav.style.display = "flex";
    } else {
        loginNav.style.display = "flex";
        logoutNav.style.display = "none";
    }
    
    // RESIZE ELEMENTS BASED ON WINDOW WIDTH
    // resizeElements();
    
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

const resizeElements = function () {
    // SCALE SEARCH INPUT WIDTH TO LIBRARY ITEM WIDTH
    searchInput.style.maxWidth = `${Array.from(document.getElementsByClassName('library-item'))[0].offsetWidth}px`;
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
    keysReq.open("GET", "https://md4kiwaaya.execute-api.us-east-1.amazonaws.com/dev/library");
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
            let storedURLs = [];
            objKeys.forEach((i, index) => {
                let urlObj = {
                    "Key" : JSON.parse(keysReq.response)[index],
                    "imageURL" : `https://book-finder-uploads.s3.amazonaws.com/${JSON.parse(keysReq.response)[index]}`
                };
                storedURLs.push(urlObj);
            });
            localStorage.setItem('imageURLs', JSON.stringify(storedURLs));
        };
    };
    // DISPLAY EACH IMAGE AND KEY
    displayImages(); 
};
        
// DISPLAY IMAGES ON PAGE
const displayImages = function() {
    // CLEAR EXISTING IMAGES
    libraryContainer.innerHTML = "";

    JSON.parse(localStorage.getItem('imageURLs')).forEach((i, index) => {
        let newItem = document.createElement('div');
        newItem.classList.add('library-item');
        newItem.setAttribute('id', `library-item-${index}`)
        newItem.innerHTML = `
        <div class="library-image">
        <img src="${i.imageURL}" alt="${i.Key}">
        </div>
        <div class="delete-area">
        <button id="delete-image-${index}" class="delete-image-button" title="Delete image."><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="library-item-label-area">
        <p class="library-item-label">${i.Key.slice(0, -4)}</p>
        </div>
        <div class="details-area">
        <button id="image-details-${index}" class="image-details-button" title="View text retrieved from image."><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
        <div class="expand-area">
        <button id="expand-image-${index}" class="expand-image-button" title="View full image."><i class="fa-solid fa-maximize"></i></button>
        </div>
        `;
        libraryContainer.appendChild(newItem);
    });
    // IMAGE CONTROLS - DELETE, VIEW DETAILS, ENLARGE
    // ADD LISTENERS TO DELETE BUTTONS
    let deleteButtons = Array.from(document.getElementsByClassName('delete-image-button'))
    deleteButtons.forEach((i) => {
        i.addEventListener('click', (e) => {
            // DELETE IMAGE
                deleteImage(e.currentTarget.id.slice(-1)); // WON'T WORK WITH 2+ digits
        });
    });
    return;
};

// DELETE AN IMAGE
const deleteImage = function(selectedImageNumber) {
    let selectedImage = JSON.parse(localStorage.getItem('imageURLs'))[selectedImageNumber];
    // let selectedIndex = JSON.parse(localStorage.getItem('imageURLs')).findIndex(object => {return object.imageNumber == selectedImageNumber});
    // console.log(selectedIndex);
    const deleteData = {
        UserSub: JSON.parse(localStorage.getItem('book-finder-login-data')).UserSub,
        Key: selectedImage.Key
    };

    // SEND DELETE REQUEST TO API GATEWAY
    const deleteReq = new XMLHttpRequest();

    deleteReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/delete-object");
    deleteReq.setRequestHeader('Authorization', 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken);

    deleteReq.send(JSON.stringify(deleteData));

    deleteReq.onload = function() {
        if (deleteReq.status != 200 || JSON.parse(deleteReq.response).hasOwnProperty('__type') || JSON.parse(deleteReq.response).hasOwnProperty('errorType')) { // analyze HTTP status of the response
            console.log(JSON.parse(deleteReq.response));
        } else {
            // UPDATE LOCALSTORAGE
            localStorage.setItem('numUploads', JSON.parse(localStorage.getItem('numUploads'))-1);
            let updatedURLs = JSON.parse(localStorage.getItem('imageURLs'));
            updatedURLs.splice(selectedImageNumber, 1);
            console.log(updatedURLs);
            localStorage.setItem('imageURLs', JSON.stringify(updatedURLs));
            // UPDATE UI
            displayImages();
        }
    }
};

// REFRESH IMAGES MANUALLY
refreshButton.addEventListener('click', getImageURLs);


// LOG OUT
if (logoutNav != null) {
    logoutNav.addEventListener('click', () => {
        const logoutData = {
            accessToken : JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.AccessToken
        }
        const logoutReq = new XMLHttpRequest();
        logoutReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/logout");
        logoutReq.send(JSON.stringify(logoutData));
    
        logoutReq.onload = function() {
            if (logoutReq.status != 200) { // analyze HTTP status of the response
                console.log(`Error ${logoutReq.status}: ${logoutReq.statusText}`);
                // alertArea.style.display = "block";
                // alertArea.style.backgroundColor = "lightcoral";
                // alertMessage.innerText = "Invalid logout information. Please check your email address and re-type your password and try again. Make sure that your account has been verified. Reset password if necessary.";
                throw new Error("Logout failed. See console for details.");
            } else {
                // console.log(logoutReq.response); // response is the server response
                localStorage.removeItem('book-finder-login-data');
                window.location.href = "/book-finder/";
            }
        };
    });
}