const alertArea = document.getElementById('alert-area')
const alertMessage = document.getElementById('alert-message')
const loadingSpinner = document.getElementById('fouc')
const libraryContainer = document.getElementById('library-container')
const messageContainer = document.getElementById('message-container')
const searchInput = document.getElementById('search-input')
const resetButton = document.getElementById('reset-button')
const searchForm = document.getElementById('search-form')

let storedData  // current localstorage data

let userSub;
if (localStorage.getItem('book-finder-login-data') !== null) {
  userSub = JSON.parse(localStorage.getItem('book-finder-login-data')).UserSub
} else {
  userSub = "demo-user"
}

let baseLayout = [] // store current library items displayed for reset/delete

let searchLayout = [] // store the library layout post-search

let searchResults = [] // store search results

window.onload = () => {
    
    setUserState() // in global js file

    searchInput.innerText = '' // clear search field
    searchLibrary() // "search" - returns immediately, just here to trigger listeners

    // scale UI
    searchInput.style.height = resetButton.offsetHeight
    
    // CLEAR LOADING SPINNER
    loadingSpinner.style.display = "none"

    // Search event listener - fires on key up
    searchForm.addEventListener('keyup', (event) => {
        if (searchInput.value === '') {

        }
        event.preventDefault()
        searchLibrary()
    })

    // prevent submit events on search form
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault()
        return false
    })

    // Reset the search form and layout 
    resetButton.addEventListener('click', (event) => {
        resetUI()
        event.preventDefault()
    })

    // LOAD IMAGES AND KEYS FROM S3 VIA API CALL OR URLS IN LOCALSTORAGE
    
    // ONLY CALL S3 IF NECESSARY

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
            storedData = JSON.parse(localStorage.getItem('book-finder-data')) // record for global use
            localStorage.removeItem('hasUploaded'); // reset upload tracking (prevents unnecessary API calls)
            displayImages(data.signedURLs);
        }
    })
    .catch((error) => {
        // TODO error handling
        console.log(error)
    });


    searchInput.focus() // focus the search input (must do this last)
}



// reset the UI (called by onload, click on reset button, and empty search form after keyup (backspace))
function resetUI() {   
    if (document.getElementById('expanded-image-canvas')) {         // remove canvas if it exists
        document.getElementById('expanded-image-canvas').remove()        
    }
    libraryContainer.innerHTML = baseLayout
    addListeners()
    searchInput.value = ''
    searchInput.focus()
    searchResults = [] // reset results so expands after resets don't draw previous results
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
const displayImages = function(signedURLs = []) {
    // CLEAR EXISTING IMAGES
    libraryContainer.innerHTML = ""
    signedURLs.forEach((item, index) => {
        let imageName = item.split('/')[4]
        let newItem = document.createElement('div')
        newItem.classList.add('library-item')
        newItem.setAttribute('id', `library-item-${index}`)
        newItem.innerHTML = `
        <div id="library-image-container-${index}" class="library-image-container">
        <div id="library-overlay-${index}" class="library-overlay"></div>
        <img id="library-image-${index}" class="library-image" src="${item}" alt="${item}">
        </div>
        <div class="delete-area">
        <button id="delete-image-${index}" class="delete-image-button" title="Delete image."><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="library-item-label-area">
        <p id="library-item-label-${index}" class="library-item-label">${item.split('/').pop().split('#')[0].split('?')[0].split('.')[0]}</p>
        </div>
        <div class="details-area">
        <button id="image-details-${index}" class="image-details-button" title="View text retrieved from image."><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
        <div class="expand-area">
        <button id="expand-image-${index}" class="expand-image-button" title="View full image."><i class="fa-solid fa-maximize"></i></button>
        </div>
        `; // https://stackoverflow.com/questions/511761/js-function-to-get-filename-from-url

        libraryContainer.appendChild(newItem) // add to DOM
    });
    
    addListeners() // add listeners to buttons
    
    baseLayout = libraryContainer.innerHTML // set baseLayout for resets
}



// IMAGE CONTROLS - DELETE, VIEW DETAILS, EXPAND
function addListeners() {

    // ADD LISTENERS TO DELETE BUTTONS
    let deleteButtons = Array.from(document.getElementsByClassName('delete-image-button'))
    deleteButtons.forEach((i) => {
        i.addEventListener('click', (event) => {
            // get ID from clicked image delete button and grab corresponding image name
            let clickedID = event.currentTarget.id.split('-')[event.currentTarget.id.split('-').length-1]
            let clickedImage = document.getElementById(`library-image-${clickedID}`)
            let clickedImageName = clickedImage.getAttribute('src').split('/')[4].split('?')[0]
            if (window.confirm(`Permanently delete ${clickedImageName}?`) === false) { // Confirmation
                return
            }
            // DELETE IMAGE
            deleteImage(clickedImageName) 
            .then((data) => {
                console.log(data)
                console.log(clickedImageName.split('.')[0])
                // Remove data from localStorage
                let currentURLs = JSON.parse(localStorage.getItem('book-finder-data')).signedURLs
                let currentData = JSON.parse(localStorage.getItem('book-finder-data')).dynamoData
                currentURLs.splice(clickedID, 1)
                let imageKey = `${userSub}/${clickedImageName}`
                console.log(imageKey)
                delete currentData[imageKey]
                let newData = {
                    s3URLs: currentURLs,
                    dynamoData: currentData
                }
                localStorage.setItem('book-finder-data', JSON.stringify(newData))   // update localstorage data
                storedData = JSON.parse(localStorage.getItem('book-finder-data'))   // record for global use
                if (storedData === []) {                                            // remove book-finder-data from localstorage if it's empty after delete
                    localStorage.removeItem('book-finder-data')
                }
                // Remove image from UI
                let deletedImage = document.getElementById(`library-item-${clickedID}`)
                libraryContainer.removeChild(deletedImage)
                baseLayout.innerHTML = libraryContainer.innerHTML                  // set a new base layout
            })
            .catch((error) => {
                // TODO error handling
                console.log(error)
            })
        })
    })

    // ADD LISTENERS TO DETAILS BUTTONS
    let detailsButtons = Array.from(document.getElementsByClassName('image-details-button'))
    detailsButtons.forEach((i) => {
        i.addEventListener('click', (event) => {
            // get ID from clicked image details button and grab corresponding image name
            let clickedID = event.currentTarget.id.split('-')[event.currentTarget.id.split('-').length-1]
            let clickedImage = document.getElementById(`library-image-${clickedID}`)
            let clickedImageURL = clickedImage.getAttribute('src')
            expandImage(clickedImageURL, 'details')
        })
    })

    // ADD LISTENERS TO IMAGES (DETAILS)
    let images = Array.from(document.getElementsByClassName('library-image'))
    images.forEach((item, index) => {
        item.addEventListener('contextmenu', (event) => {
            event.preventDefault()
            // get ID from right-clicked image and grab corresponding image name
            let clickedID = event.currentTarget.id.split('-')[event.currentTarget.id.split('-').length-1]
            let clickedImage = document.getElementById(`library-image-${clickedID}`)
            let clickedImageURL = clickedImage.getAttribute('src')
            expandImage(clickedImageURL, 'details')
        })
    })

    // ADD LISTENERS TO EXPAND BUTTONS
    let expandButtons = Array.from(document.getElementsByClassName('expand-image-button'))
    expandButtons.forEach((item, index) => {
        item.addEventListener('click', (event) => {
            // get ID from clicked image expand button and grab corresponding image name
            let clickedID = event.currentTarget.id.split('-')[event.currentTarget.id.split('-').length-1]
            let clickedImage = document.getElementById(`library-image-${clickedID}`)
            let clickedImageURL = clickedImage.getAttribute('src')
            expandImage(clickedImageURL)
        })
    })

    // ADD LISTENERS TO IMAGES (EXPAND)
    images.forEach((item, index) => {
        item.addEventListener('click', (event) => {
            // get ID from clicked image and grab corresponding image name
            let clickedID = event.currentTarget.id.split('-')[event.currentTarget.id.split('-').length-1]
            let clickedImage = document.getElementById(`library-image-${clickedID}`)
            let clickedImageURL = clickedImage.getAttribute('src')
            expandImage(clickedImageURL)
        })
    })
}



/////////////////////////////////////////////////////////////////////   DELETE   /////////////////////////////////////////////////////////////////////

async function deleteImage(clickedImageName = "") {
    console.log(clickedImageName)
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



/////////////////////////////////////////////////////////////////////   SEARCH   /////////////////////////////////////////////////////////////////////

function searchLibrary() {

    const results = [];
    const query = searchInput.value.trim().toLowerCase()
    
    
    if (query === '') {       // empty search form (pageload + backspace) -> reset layout
        resetUI()
        return
    }

    const dataArray = Object.entries(JSON.parse(localStorage.getItem('book-finder-data')).dynamoData) // only works as const - why?
    
    dataArray.forEach((itemI, indexI) => {
        itemI[1].TextDetections.forEach((itemX, indexX) => {
            if (itemX.Type === 'LINE') return
            if (itemX.DetectedText.toLowerCase().includes(query)) {
                let result = {
                    image: itemI[0],
                    data: itemX
                }
                results.push(result)
            }
        })
    })

    searchResults = results
    displayResults(results)
}



// overlay or highlight items based on search results
function displayResults(results = []) {

    // no results found
    if (results.length === 0) {
        console.log('shit son')
    }

    // reset UI for sequential searches
    libraryContainer.innerHTML = baseLayout

    let libraryItems = Array.from(document.getElementsByClassName('library-item'))          // library item containers
    let libraryOverlays = Array.from(document.getElementsByClassName('library-overlay'))    // library item overlays
    let libraryImages = Array.from(document.getElementsByClassName('library-image'))        // image tags
    let libraryKeys = []                                                                    // image filenames

    results.forEach((item, index) => {
        libraryKeys.push(item.image.split('/')[1])
    })

    let resultsImages = {
        positiveImages: [],
        negativeImages: []
    }

    libraryImages.forEach((item, index) => {
        if (libraryKeys.includes(`${item.getAttribute('src').split('/')[4].split('?')[0]}`)) {
            resultsImages.positiveImages.push(libraryItems[index])
        } else {
            resultsImages.negativeImages.push(libraryItems[index])
        }
    })

    // reorganize images - TODO refactor for resizing issues
    libraryContainer.innerHTML = "" // reset container

    resultsImages.positiveImages.forEach((item, index) => {                                 // HANDLE POSITIVE RESULTS
        libraryContainer.appendChild(item)                                                  // append positive images
        item.style.outline = '3px solid #bbff00'                                            // highlight images containing results
    })

    resultsImages.negativeImages.forEach((item, index) => {                                 // HANDLE NEGATIVE RESULTS
        let currentID = item.id.split('-')[2]                                               // grab id # of current item
        libraryContainer.appendChild(item)                                                  // append negative images
        let currentItem = document.getElementById(`library-image-container-${currentID}`)   // grab new item from DOM
        let currentOverlay = libraryOverlays[currentID]                                     // grab associated overlay
        currentOverlay.style.width = `${currentItem.offsetWidth + 1}px`    // set overlay style (add 1 to dimensions because of image width rounding weirdness)
        currentOverlay.style.height = `${currentItem.offsetHeight + 1}px`
        currentOverlay.style.backgroundColor = 'rgba(44, 44, 44, .9)'
    })

    addListeners() // add event listeners
}



// view image full-screen
function expandImage(clickedImageURL = '', details = '') {

    let displayArea = document.createElement('div')                 // create image and canvas 
    displayArea.id = 'expand-container'
    displayArea.innerHTML = `
    <div id="expanded-image-container">
    <img id="expanded-image" src="${clickedImageURL}">
    <canvas id="expanded-image-canvas"></canvas>
    </div>
    `
    document.getElementById('body').appendChild(displayArea)        // add image and canvas to the DOM

    if (details) {                                                  // display image details when requested
        console.log('details')
    }

    displayArea.addEventListener('click', () => {                   // remove the expanded image from the DOM on left-click
        document.getElementById('expand-container').remove()    
    })

    displayArea.addEventListener('contextmenu', (event) => {        // display image details on right-click
        event.preventDefault()
        console.log('right click')
        return false
    })

    if (searchResults !== []) {                                     // if search data is present, draw detected text polygons on expanded image canvas
        drawResults(`${userSub}/${clickedImageURL.split('/')[4]}`)
    }
}



// draw detected text polygons on expanded image canvas
function drawResults(clickedImageKey = '') {
    let image = document.getElementById('expanded-image')
    let imageWidth = image.width
    let imageHeight = image.height
    let drawCanvas = document.getElementById('expanded-image-canvas')
    drawCanvas.height = image.height                                    // set canvas size to image size
    drawCanvas.width = image.width
    let drawContext = drawCanvas.getContext('2d')

    let strokes = [                                                     // different strokes (heh) used to highlight items on the canvas
        [8, "rgba(187,255,0,.5)"],
        [5, "#bbff00"],
        [2, "#000000"]
    ]

    searchResults.forEach((item, index) => {
        if (item.data.Type === 'LINE') {
            return
        }
        if (item.image === clickedImageKey.split('?')[0]) {
            let poly = item.data.Geometry.Polygon
            // draw a line around detected word
            strokes.forEach((itemX, indexX) => {
                drawContext.lineWidth = strokes[indexX][0]
                drawContext.strokeStyle = strokes[indexX][1]
                drawContext.beginPath()
                let first = true
                poly.forEach((itemY, indexY) => {
                    if (first) {
                        drawContext.moveTo(imageWidth * itemY.X, imageHeight * itemY.Y)
                        first = false;
                    } else {
                        drawContext.lineTo(imageWidth * itemY.X, imageHeight * itemY.Y)
                    }
                })
                drawContext.closePath()
                drawContext.stroke()
            })
        }
    })
}



// show full-screen image and all detected text side-by-side, hovering over items will draw the corresponding polygons