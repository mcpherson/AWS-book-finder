const entirePage = document.getElementById('entire-page');
// CONTROLS 
const fileName = document.getElementById('file-name');
const cropButton = document.getElementById('crop-button');
const clearButton = document.getElementById('clear-button');
const imageInput = document.getElementById("file-upload");
imageInput.addEventListener("change", handleImage, false);
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
let isMouseDown = false;
let imageScale = 1;



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
    fileName.innerText = `${e.target.files[0].name}`;
    reader.readAsDataURL(e.target.files[0]);
    fileName.style.visibility = "visible";
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
        drawContext.fillStyle = 'rgba(40, 230, 0, .3)';
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
            drawContext.fillStyle = 'rgba(40, 230, 0, .3)';
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
    fileName.style.visibility = "hidden";
    clearButton.style.visibility = "hidden";
    cropButton.style.visibility = "hidden";
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
    imageCanvas.style.display = "none";
    drawCanvas.style.display = "none";
});