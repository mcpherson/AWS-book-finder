const alertArea = document.getElementById('alert-area');
const alertMessage = document.getElementById('alert-message');
const loadingSpinner = document.getElementById('fouc');
const libraryContainer = document.getElementById('library-container');

window.onload = () => {
    // LOAD IMAGES AND KEYS FROM S3 VIA API CALL OR URLS IN LOCALSTORAGE
    if (!localStorage.getItem('imageURLs')) {
        
        const reqData = {UserSub: JSON.parse(localStorage.getItem('book-finder-login-data')).UserSub}

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
                console.log(JSON.parse(keysReq.response));
                JSON.parse(keysReq.response).forEach((i) => {
                    let urlObj = {
                        "Key" : reqData.fileName,
                        "imageURL" : `https://book-finder-${reqData.UserSub}.s3.amazonaws.com/${JSON.parse(keysReq.response[i])}`
                    };
                    localStorage.getItem('imageURLs').push(urlObj);
                });
            }
        };

        // TODO - construct URLs with AWS listobjects
    } else {
        // DISPLAY EACH IMAGE AND KEY
        localStorage.getItem('imageURLs').forEach((i) => {
            console.log(i);
        });
    }


}