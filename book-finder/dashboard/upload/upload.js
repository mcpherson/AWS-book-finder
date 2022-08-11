const entirePage = document.getElementById('entire-page');
// CONTROLS 
const fileName = document.getElementById('file-name');
const cropButton = document.getElementById('crop-button');
const clearButton = document.getElementById('clear-button');
const newFileNameField = document.getElementById("new-file-name");
const uploadButton = document.getElementById("upload-button");
const imageInputLabel = document.getElementById('image-input-label');
const imageInput = document.getElementById("file-upload");
imageInput.addEventListener("change", handleImage, false);
const uploadSpinner = document.getElementById('upload-spinner');
const alertArea = document.getElementById('upload-alert-area');
const alertMessage = document.getElementById('upload-alert-message');
// CANVASES 
const imageCanvas = document.getElementById("uploaded-image");
const drawCanvas = document.getElementById('draw-area');
const finalCanvas = document.getElementById('final-image');
const context = imageCanvas.getContext('2d');
const drawContext = drawCanvas.getContext('2d');
const finalContext = finalCanvas.getContext('2d');
// DATA 
const cropRect = {
    startX : 0,
    startY : 0,
    width  : 0,
    height : 0
};
let userImage;
let finalImage;
let buf;
let newFileName;
let isMouseDown = false;
let imageScale = 1;

let returnedURL;



// WINDOW RESIZE DETECTION TO PRESERVE SCALE
window.addEventListener('resize', () => {
    if (userImage != undefined) {
        const screenWidth = document.documentElement.clientWidth;
        if (screenWidth < (userImage.width)*.95) {
            imageScale = (screenWidth*.95) / userImage.width;
        }
    }
});



// UPLOAD IMAGE, ADD TO IMAGE CANVAS
function handleImage(e) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const uploadedImage = new Image();
        uploadedImage.onload = () => {
            imageCanvas.width = uploadedImage.width;
            imageCanvas.height = uploadedImage.height;
            context.drawImage(uploadedImage, 0, 0);
            drawCanvas.height = uploadedImage.height;
            drawCanvas.width = uploadedImage.width;
            // get window size
            const screenWidth = document.documentElement.clientWidth;
            // set scale for large images
            if (screenWidth < (uploadedImage.width)*.95) {
                imageScale = (screenWidth*.95) / uploadedImage.width;
            }
        }
        uploadedImage.src = event.target.result;
        userImage = uploadedImage;
        
    };
    reader.readAsDataURL(e.target.files[0]);
    imageInputLabel.style.display = "none";
    cropButton.style.visibility = "visible";
    clearButton.style.visibility = "visible";
};



// GET START COORD ON DRAW CANVAS
drawCanvas.addEventListener('mousedown', (event) => {
    // reset rectangle dimensions
    Object.keys(cropRect).forEach((i) => {
        cropRect[i] = 0
    });
    isMouseDown = true;
    const startPosition = [event.offsetX, event.offsetY];
    cropRect.startX = startPosition[0];
    cropRect.startY = startPosition[1];
});



// DRAW RECT ON DRAW CANVAS WHILE MOVING
drawCanvas.addEventListener('mousemove', (ev) => {
    if (isMouseDown) {
        drawContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        drawContext.fillStyle = 'rgba(187, 255, 0, .3)';
        drawContext.fillRect(
            cropRect.startX/imageScale, 
            cropRect.startY/imageScale, 
            (ev.offsetX - cropRect.startX)/imageScale, 
            (ev.offsetY - cropRect.startY)/imageScale
        );
    }
});



// GET END COORD, DRAW RECTANGLE ON DRAW CANVAS
drawCanvas.addEventListener('mouseup', (event) => {
    if (isMouseDown) {
        const endPosition = [event.offsetX, event.offsetY];
        cropRect.width = (endPosition[0] - cropRect.startX);
        cropRect.height = (endPosition[1] - cropRect.startY);
        if (cropRect.width === 0 && cropRect.height === 0) {
            drawContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        } else {
            drawContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            drawContext.fillStyle = 'rgba(187, 255, 0, .3)';
            drawContext.fillRect(
                cropRect.startX/imageScale, 
                cropRect.startY/imageScale, 
                cropRect.width/imageScale, 
                cropRect.height/imageScale
            );
            drawContext.strokeRect(
                cropRect.startX/imageScale, 
                cropRect.startY/imageScale, 
                cropRect.width/imageScale, 
                cropRect.height/imageScale
            );
        }
    }
    isMouseDown = false;
    cropButton.disabled = false;
    cropButton.style.backgroundColor = "#bbff00";
});



// RESET DRAW IF CURSOR LEAVES CANVAS AND UNCLICKS, BUT PRESERVE DRAW IF CURSOR REENTERS CANVAS - THIS WAS HARD
// cursor leaves draw area 
// case 1: user unclicks. canvas must be cleared to avoid an incorrect draw.
//     mouseup listener added to html, calls mouseup handler function 
//         handler function sends mouseup event to draw area and clears canvas 
//         handler function removes listeners added via this logic
// case 2: user moves mouse back to canvas while mouse is down 
//     mouseenter listener added to draw area, calls mouseenter handler function 
//         handler function removes listeners added via this logic 
//         return to regular flow of cropping image (mouse is down, still drawing rectangle)
drawCanvas.addEventListener('mouseleave', (event) =>{
    if (isMouseDown) {
        let handleMouseup = function () {
            let mouseupEvent = new MouseEvent('mouseup', {
                view : window,
                bubbles: false,
                cancelable: true
            });
            drawCanvas.dispatchEvent(mouseupEvent);
            drawContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            entirePage.removeEventListener('mouseup', handleMouseup);
            drawCanvas.removeEventListener('mouseenter', handleMouseenter);
        };
        let handleMouseenter = function () {
            entirePage.removeEventListener('mouseup', handleMouseup);
            drawCanvas.removeEventListener('mouseenter', handleMouseenter);
        };
        entirePage.addEventListener('mouseup', handleMouseup);
        drawCanvas.addEventListener('mouseenter', handleMouseenter);
    }
});



// CLEAR ALL CANVASES AND RESET PAGE TO STARTING STATE
const clearImages = function () {
    // RESET CANVASES 
    imageCanvas.style.display = "block";
    context.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    imageCanvas.height = 0;
    imageCanvas.width = 0;
    drawCanvas.style.display = "block";
    drawContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    drawCanvas.height = 0;
    drawCanvas.width = 0;
    finalCanvas.style.display = "none";
    finalContext.clearRect(0, 0, cropRect.width, cropRect.height);
    finalCanvas.height = 0;
    finalCanvas.width = 0;
    // RESET CONTROLS AND DATA 
    fileName.innerText = "";
    newFileNameField.value = "";
    newFileName = "";
    imageInputLabel.style.display = "inline";
    fileName.style.visibility = "hidden";
    clearButton.style.visibility = "hidden";
    clearButton.innerHTML = `<i class="fa-solid fa-trash-can"></i> &nbsp;CLEAR IMAGE`;
    cropButton.style.display = "inline";
    cropButton.style.backgroundColor = "white";
    cropButton.style.visibility = "hidden";
    cropButton.disabled = true;
    newFileNameField.style.visibility = "hidden";
    uploadButton.style.display = "none";
    uploadButton.style.backgroundColor = "white";
    uploadButton.disabled = true;
    alertArea.style.display = "none";
    userImage = undefined;
    Object.keys(cropRect).forEach((i) => {
        cropRect[i] = 0
    });
    imageScale = 1;
}

clearButton.addEventListener('click', clearImages);



// DRAW CROPPED IMAGE TO FINAL CANVAS 
cropButton.addEventListener('click', () => {
    finalCanvas.style.display = "block";
    finalCanvas.width = cropRect.width/imageScale;
    finalCanvas.height = cropRect.height/imageScale;
    finalContext.drawImage(
        userImage, 
        cropRect.startX/imageScale, 
        cropRect.startY/imageScale, 
        cropRect.width/imageScale, 
        cropRect.height/imageScale, 
        0, 
        0, 
        cropRect.width/imageScale, 
        cropRect.height/imageScale
    );
    newFileNameField.style.visibility = "visible";
    imageCanvas.style.display = "none";
    drawCanvas.style.display = "none";
    cropButton.style.display = "none";
    cropButton.style.backgroundColor = "white";
    cropButton.disabled = "true";
    uploadButton.style.display = "inline"
    uploadButton.style.visibility = "visible"

    finalImage = finalCanvas.toDataURL('image/png', 1);
});



// RENAME IMAGE
newFileNameField.addEventListener('keyup', (event) => {
    if (newFileNameField.value != "") {
        uploadButton.disabled = false;
        uploadButton.style.backgroundColor = "#bbff00";
        fileName.innerText = `${newFileNameField.value}.png`;
        newFileName = newFileNameField.value;
        fileName.style.visibility = "visible";
        if (!/^[^\\/:\*\?"<>\|]+$/.test(fileName.innerText)) {
            newFileNameField.style.backgroundColor = 'lightcoral';
            uploadButton.disabled = true;
            uploadButton.style.backgroundColor = "white";
        } else {
            newFileNameField.style.backgroundColor = 'white';
            uploadButton.disabled = false;
            uploadButton.style.backgroundColor = "#bbff00";
        }
    } else {
        fileName.innerText = "";
        uploadButton.disabled = true;
        uploadButton.style.backgroundColor = "white";
        newFileNameField.style.backgroundColor = 'white';
    }
});



// UPLOAD IMAGE TO S3
uploadButton.addEventListener('click', () => {

    // CATCH OBVIOUS ERRORS
    if (fileName.innerText === "") {
        alertArea.style.display = "block";
        alertArea.style.backgroundColor = "lightcoral";
        alertMessage.innerText = "Enter a name for your file.";
    }

    // CHANGE UI STATE
    uploadSpinner.style.display = "block";
    finalCanvas.style.display = "none";
    clearButton.style.display = "none";
    uploadButton.style.display = "none";
    newFileNameField.style.visibility = "hidden";
    fileName.style.visibility = "hidden";

    // DATA TO SEND TO S3
    // const uploadData = {
    //     UserSub: JSON.parse(localStorage.getItem('book-finder-login-data')).UserSub,
    //     fileName: fileName.innerHTML,
    //     imageBody: finalImage
    // };

    // const uploadReq = new XMLHttpRequest();

    // uploadReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/upload-object");
    // uploadReq.setRequestHeader('Authorization', 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken);

    // uploadReq.send(JSON.stringify(uploadData));

    // uploadReq.onload = function() {
    //     if (uploadReq.status != 200 || JSON.parse(uploadReq.response).hasOwnProperty('__type') || JSON.parse(uploadReq.response).hasOwnProperty('errorType')) { // analyze HTTP status of the response
    //         uploadSpinner.style.display = "none";
    //         console.log(`Error ${uploadReq.status}: ${uploadReq.statusText} - AWS Error: ${uploadReq.response}`);
    //         alertArea.style.display = "block";
    //         alertArea.style.backgroundColor = "lightcoral";
    //         // TODO error handling - invalid usersub, invalid img data, other AWS errors
    //         alertMessage.innerText = `Image upload failed. ${JSON.parse(uploadReq.response).errorMessage}`;
    //         throw new Error("Image upload failed.");
    //     } else {
    //         uploadSpinner.style.display = "none";
    //         alertArea.style.display = "block";
    //         alertArea.style.backgroundColor = "#bbff00";
    //         alertMessage.innerHTML = `Image upload successful. Book Finder will now process your image to identify and catalogue text. Depending on the amount of text in your image, this process may take up to several minutes. You can check your <a href="/book-finder/dashboard/library/">Library</a> to view the status of your upload or continue uploading images.`;
    //         // CHANGE CLEAR BUTTON STYLE
    //         clearButton.innerHTML = `<i class="fa-solid fa-arrow-rotate-right"></i> &nbsp;UPLOAD ANOTHER IMAGE`;
    //         clearButton.style.display = "inline";
    //         // CHECK FOR IMAGE URLS ARRAY IN LOCAL STORAGE - CREATE IF IT DOESN'T EXIST YET
    //         if (!localStorage.getItem('imageURLs')) {
    //             let imageURLs = [];
    //             localStorage.setItem('imageURLs', JSON.stringify(imageURLs));
    //         }
    //         // TRACK NUMBER OF UPLOADS BY USER IN LOCAL STORAGE TO PREVENT UNNECESSARY API CALLS ON LIBRARY PAGE
    //         if (!localStorage.getItem('numUploads')) {
    //             localStorage.setItem('numUploads', JSON.stringify(1));
    //         } else {
    //             let numUploads = JSON.parse(localStorage.getItem('numUploads'));
    //             numUploads++;
    //             localStorage.setItem('numUploads', JSON.stringify(numUploads));
    //         }
    //         // CREATE URL DATA AND PUSH TO LOCAL STORAGE FOR USE ON LIBRARY PAGE
    //         let urlObj = {
    //             "Key" : uploadData.fileName,
    //             "imageURL" : `https://book-finder-${uploadData.UserSub}.s3.amazonaws.com/${uploadData.fileName}`
    //         };
    //         let imageURLStorage = JSON.parse(localStorage.getItem('imageURLs'));
    //         imageURLStorage.push(urlObj);
    //         localStorage.setItem('imageURLs', JSON.stringify(imageURLStorage));
    //     }
    // };
    const urlData = {
        UserSub: JSON.parse(localStorage.getItem('book-finder-login-data')).UserSub,
        fileName: fileName.innerHTML
    };

    const imageData = {
        imageBody: finalImage
    };

    const urlReq = new XMLHttpRequest();

    urlReq.open("POST", "https://4y5tf8v53d.execute-api.us-west-2.amazonaws.com/dev/get-s3-signed-url");
    urlReq.setRequestHeader('Authorization', 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken);

    urlReq.send(JSON.stringify(urlData));
    urlReq.onload = function() {
        returnedURL = JSON.parse(urlReq.response);
        console.log(JSON.parse(urlReq.response));
        const bigReq = new XMLHttpRequest();
    
        bigReq.open("PUT", `${returnedURL}`);
        // bigReq.setRequestHeader('Authorization', 'Bearer ' + JSON.parse(localStorage.getItem('book-finder-login-data')).AuthenticationResult.IdToken);
        // bigReq.setRequestHeader('x-amz-acl', 'public-read');

        bigReq.send(JSON.stringify(imageData));
        bigReq.onload = function() {
            console.log(JSON.parse(bigReq.response));
        };
    };



    
});





