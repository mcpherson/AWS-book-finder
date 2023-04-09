const alertArea = document.getElementById('alert-area')
const alertMessage = document.getElementById('alert-message')
const loadingSpinner = document.getElementById('fouc')
const libraryContainer = document.getElementById('library-container')
const messageContainer = document.getElementById('message-container')
const searchInput = document.getElementById('search-input')
const resetButton = document.getElementById('reset-button')
const searchForm = document.getElementById('search-form')

let baseLayout = `
<div class="library-item" id="library-item-0">
<div id="library-image-container-0" class="library-image-container">
<div id="library-overlay-0" class="library-overlay"></div>
    <img id="library-image-0" class="library-image" src="../resources/demo-1.JPEG" alt="Demo image">
</div>
<div class="delete-area">
    
</div>
<div class="library-item-label-area">
    <p id="library-item-label-0" class="library-item-label">demo-1</p>
</div>
<div class="details-area">
    
</div>
<div class="expand-area">
    <button id="expand-image-0" class="expand-image-button" title="View full image."><i class="fa-solid fa-maximize"></i></button>
</div>
</div>
<div class="library-item" id="library-item-1">
<div id="library-image-container-1" class="library-image-container">
<div id="library-overlay-1" class="library-overlay"></div>
    <img id="library-image-1" class="library-image" src="../resources/demo-2.JPEG" alt="Demo image">
</div>
<div class="delete-area">
    
</div>
<div class="library-item-label-area">
    <p id="library-item-label-1" class="library-item-label">demo-2</p>
</div>
<div class="details-area">
    
</div>
<div class="expand-area">
    <button id="expand-image-1" class="expand-image-button" title="View full image."><i class="fa-solid fa-maximize"></i></button>
</div>
</div>
<div class="library-item" id="library-item-2">
<div id="library-image-container-2" class="library-image-container">
<div id="library-overlay-2" class="library-overlay"></div>
    <img id="library-image-2" class="library-image" src="../resources/demo-3.JPEG" alt="Demo image">
</div>
<div class="delete-area">
    
</div>
<div class="library-item-label-area">
    <p id="library-item-label-2" class="library-item-label">demo-3</p>
</div>
<div class="details-area">
    
</div>
<div class="expand-area">
    <button id="expand-image-2" class="expand-image-button" title="View full image."><i class="fa-solid fa-maximize"></i></button>
</div>
</div>
<div class="library-item" id="library-item-3">
<div id="library-image-container-3" class="library-image-container">
<div id="library-overlay-3" class="library-overlay"></div>
    <img id="library-image-3" class="library-image" src="../resources/demo-4.JPEG" alt="Demo image">
</div>
<div class="delete-area">
    
</div>
<div class="library-item-label-area">
    <p id="library-item-label-3" class="library-item-label">demo-4</p>
</div>
<div class="details-area">
    
</div>
<div class="expand-area">
    <button id="expand-image-3" class="expand-image-button" title="View full image."><i class="fa-solid fa-maximize"></i></button>
</div>
</div>
<div class="library-item" id="library-item-4">
<div id="library-image-container-4" class="library-image-container">
<div id="library-overlay-4" class="library-overlay"></div>
    <img id="library-image-4" class="library-image" src="../resources/demo-5.JPEG" alt="Demo image">
</div>
<div class="delete-area">
    
</div>
<div class="library-item-label-area">
    <p id="library-item-label-4" class="library-item-label">demo-5</p>
</div>
<div class="details-area">
    
</div>
<div class="expand-area">
    <button id="expand-image-4" class="expand-image-button" title="View full image."><i class="fa-solid fa-maximize"></i></button>
</div>
</div>
` // store current library items displayed for reset/delete

let searchLayout = [] // store the library layout post-search

let searchResults = [] // store search results

window.onload = () => {

    resetUI()

    searchInput.innerText = '' // clear search field
    // searchLibrary() // "search" - returns immediately, just here to trigger listeners

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
}

function searchLibrary() {

    const results = [];
    const query = searchInput.value.trim().toLowerCase()
    
    if (query === '') {       // empty search form (pageload + backspace) -> reset layout
        resetUI()
        return
    }

    const dataArray = Object.entries(JSON.parse(demoData)) // only works as const - why?
    
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

    libraryKeys.forEach((item, index) => {
        libraryKeys[index] = item.replace('png', 'JPEG')
    })

    let resultsImages = {
        positiveImages: [],
        negativeImages: []
    }

    libraryImages.forEach((item, index) => {
        if (libraryKeys.includes(`${item.getAttribute('src').split('/')[2]}`)) {
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
    // remove expanded image via ESC or click
    window.addEventListener('keydown', closeExpandedImage)

    displayArea.addEventListener('click', closeExpandedImage)

    displayArea.addEventListener('contextmenu', (event) => {        // display image details on right-click
        event.preventDefault()
        console.log('right click')
        return false
    })

    if (searchResults !== []) {                                     // if search data is present, draw detected text polygons on expanded image canvas
        drawResults(`${clickedImageURL.split('/')[2]}`)
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
        if (item.image.split('/')[1].split('.')[0] === clickedImageKey.split('.')[0]) {
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

// IMAGE CONTROLS - DELETE, VIEW DETAILS, EXPAND
function addListeners() {

    let images = Array.from(document.getElementsByClassName('library-image'))

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

// remove expanded image + listener
function closeExpandedImage(event) {

    if (event.code === "Escape" || event.type === "click") {
        document.getElementById('expand-container').remove()
        window.removeEventListener('keydown', closeExpandedImage)
    }
}