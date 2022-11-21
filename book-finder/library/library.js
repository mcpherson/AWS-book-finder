const alertArea = document.getElementById('alert-area')
const alertMessage = document.getElementById('alert-message')
const loadingSpinner = document.getElementById('fouc')
const libraryContainer = document.getElementById('library-container')
const refreshButton = document.getElementById('refresh-images-button')
const searchInput = document.getElementById('search-input')
const userSub = JSON.parse(localStorage.getItem('book-finder-login-data')).UserSub

window.onload = () => {
    
    setUserState() // in global js file
    
    // CLEAR LOADING SPINNER
    loadingSpinner.style.display = "none";

    // LOAD IMAGES AND KEYS FROM S3 VIA API CALL OR URLS IN LOCALSTORAGE
    
    // ONLY CALL S3 IF NECESSARY
    if (localStorage.getItem('hasUploaded') || !localStorage.getItem('book-finder-data')) {
        getS3URLs(`${apiEndpoints.API_LIBRARY}/?usersub=${userSub}`)
        .then((data) => {
            // if (Object.keys(data.dynamoData)[0].$metadata.httpStatusCode !== 200) {
            if (JSON.stringify(data).includes('error')) {
                // TODO error handling
                // console.log(Object.keys(data.dynamoData)[0]);
                console.log(data);
            } else {
                // TODO fix rekog lambda
                let dataArray = Object.entries(data.dynamoData)
                // double parse rekog data
                for (i=0; i<dataArray.length; i++) {
                    data.dynamoData[dataArray[i][0]] = JSON.parse(JSON.parse(dataArray[i][1].Item.RekogResults.S))
                }
                localStorage.setItem('book-finder-data', JSON.stringify(data))
                localStorage.removeItem('hasUploaded'); // reset upload tracking (prevents unnecessary API calls)
                displayImages();
            }
        })
        .catch((error) => {
            // TODO error handling
            console.log(error);
        });
    } else {
        // BYPASS S3 - DISPLAY EACH IMAGE AND KEY WITH LOCALSTORAGE DATA
        displayImages(); 
    }
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
    const reqData = {UserSub: userSub}
    // TODO HANDLE ERROR IF NOT LOGGED IN
    const keysReq = new XMLHttpRequest();
    keysReq.open("GET", `https://${apiEndpointID}.execute-api.us-east-1.amazonaws.com/dev/library/${reqData.UserSub}`);
    keysReq.setRequestHeader('Authorization', 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken)
    keysReq.send(JSON.stringify(reqData))
    keysReq.onload = function() {
        if (JSON.parse(keysReq.response).length === 0) { // no keys returned
            loadingSpinner.style.display = "none"
            alertArea.style.display = "block"
            alertArea.style.backgroundColor = "lightcoral"
            alertMessage.innerHTML = 'No images found. <a href="./upload/">Upload some images</a> and they will appear here.'
        } else if (keysReq.status != 200 || JSON.parse(keysReq.response).hasOwnProperty('errorType')) { // error received
            // TODO error handling - invalid usersub, invalid img data, other AWS errors
            loadingSpinner.style.display = "none"
            throw new Error("Image request failed.")
        } else { // create and store URLs
            loadingSpinner.style.display = "none"
            
            localStorage.removeItem('hasUploaded') // reset upload tracking (prevents unnecessary API calls)
            let storedURLs = []
            
            localStorage.setItem('imageURLs', JSON.stringify(storedURLs))
        }
    }
    // DISPLAY EACH IMAGE AND KEY
    displayImages()
}

// fetch (GET) to retrieve S3 URLs
async function getS3URLs(url = '') {

    const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: null
    })
    return response.json()
}
        
// DISPLAY IMAGES ON PAGE
const displayImages = function() {
    // CLEAR EXISTING IMAGES
    libraryContainer.innerHTML = ""

    JSON.parse(localStorage.getItem('book-finder-data')).s3URLs.forEach((i, index) => {
        let imageName = i.split('/')[4]
        let newItem = document.createElement('div')
        newItem.classList.add('library-item')
        newItem.setAttribute('id', `library-item-${index}`)
        newItem.innerHTML = `
        <div class="library-image">
        <img id="library-image-${index}" src="${i}" alt="${i}">
        </div>
        <div class="delete-area">
        <button id="delete-image-${index}" class="delete-image-button" title="Delete image."><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="library-item-label-area">
        <p id="library-item-label-${index}" class="library-item-label">${i.split('/').pop().split('#')[0].split('?')[0]}</p>
        </div>
        <div class="details-area">
        <button id="image-details-${index}" class="image-details-button" title="View text retrieved from image."><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
        <div class="expand-area">
        <button id="expand-image-${index}" class="expand-image-button" title="View full image."><i class="fa-solid fa-maximize"></i></button>
        </div>
        `; // https://stackoverflow.com/questions/511761/js-function-to-get-filename-from-url
        libraryContainer.appendChild(newItem)
    });
    // IMAGE CONTROLS - DELETE, VIEW DETAILS, ENLARGE

    // ADD LISTENERS TO DELETE BUTTONS
    let deleteButtons = Array.from(document.getElementsByClassName('delete-image-button'))
    deleteButtons.forEach((i) => {
        i.addEventListener('click', (e) => {
            console.log(e.currentTarget.id.split('-')[e.currentTarget.id.split('-').length-1])
            // get ID from clicked delete button and grab corresponding image name
            let clickedID = e.currentTarget.id.split('-')[e.currentTarget.id.split('-').length-1]
            let clickedImage = document.getElementById(`library-image-${clickedID}`)
            let clickedImageName = clickedImage.getAttribute('src').split('/')[4]
            // DELETE IMAGE
            deleteImage(clickedImageName) 
            .then((data) => {
                console.log(data)
                // Remove data from localStorage
                let currentURLs = JSON.parse(localStorage.getItem('book-finder-data')).s3URLs
                let currentData = JSON.parse(localStorage.getItem('book-finder-data')).dynamoData
                currentURLs.splice(clickedID, 1)
                let imageKey = `${userSub}/${clickedImageName}.png`
                delete currentData[imageKey]
                let newData = {
                    s3URLs: currentURLs,
                    dynamoData: currentData
                }
                localStorage.setItem('book-finder-data', newData)
                // Remove image from UI
                let deletedImage = document.getElementById(`library-image-${clickedID}`)
                libraryContainer.removeChild(deletedImage)
            })
            .catch((error) => {
                // TODO error handling
                console.log(error)
            })
        })
    })
}

// DELETE AN IMAGE
async function deleteImage(clickedImageName = "") {

    // Delete image from S3. Also deletes associated data from DynamoDB.
    const response = await fetch(`${apiEndpoints.API_LIBRARY}/?usersub=${userSub}&key=${clickedImageName}`, {
        method: 'DELETE',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: null
    })

    return response.json()
}

// REFRESH IMAGES MANUALLY
refreshButton.addEventListener('click', () => {
    getS3URLs(`${apiEndpoints.API_LIBRARY}/?usersub=${userSub}`)
    .then((data) => {
        // if (Object.keys(data.dynamoData)[0].$metadata.httpStatusCode !== 200) {
        if (JSON.stringify(data).includes('error')) {
            // TODO error handling
            // console.log(Object.keys(data.dynamoData)[0]);
            console.log(data)
        } else {
            localStorage.setItem('book-finder-data', JSON.stringify(data))
            localStorage.removeItem('hasUploaded'); // reset upload tracking (prevents unnecessary API calls)
            displayImages()
        }
    })
    .catch((error) => {
        // TODO error handling
        console.log(error)
    });
})

/////////////////////////////////////////////////////////////////////   SEARCH   /////////////////////////////////////////////////////////////////////

function searchLibrary() {
    const dataArray = Object.entries(JSON.parse(localStorage.getItem('book-finder-data')).dynamoData) // only works as const - why?
    const results = [];
    const query = searchInput.value.toLowerCase()
    const terms = query.split(/[, ]+/) // Thanks https://bobbyhadz.com/blog/javascript-split-by-space-or-comma
    dataArray.forEach((itemI, i) => {
        // const detectedText = item[1].TextDetections
        itemI[1].TextDetections.forEach((itemX, x) => {
            terms.forEach((itemY, y) => {
                // console.log(itemX)
                if (itemX.DetectedText.toLowerCase().includes(`${itemY}`)) {
                    let result = {
                        image: itemI[0],
                        data: itemX
                    }
                    results.push(result)
                }
            })
        })
    })
    console.log(results)
    highlightItems(results)
}

function highlightItems() {

}

function displayResults() {

}