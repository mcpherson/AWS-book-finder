//
// let all_found;
// let rekog_img = original (save a basename version of original, too)
// for (i < max_trys) {
//   found = rekog(rekog_img)
//     if (found = 0) break
//   all_found += found.reduced_precision
//   save_thumb(rekog_img)
//   save_annotated_img(rekog_img)
//   rekog_img = save_whiteout_img(regog_img)
// }
// write_json(all_found)
//
// log_info = {
//   s3_bucket
//   original_img
//   original_basename
//   original_size
// }
const path = require('path')
const { Image, createCanvas } = require('canvas')
//const {consumers} = require('stream/consumers')

const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3")
const s3client = new S3Client();
const { RekognitionClient, DetectTextCommand } = require("@aws-sdk/client-rekognition")
const rekClient = new RekognitionClient()

let logInfo = {
  images: [],
  timing: []
};

// Failsafe to stop potentially runaway lambda
const MAX_PASSES = 10;


exports.handler = async (event, context) => {
  const originalBucket = event.Records[0].s3.bucket.name;
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
  const originalKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

  logInfo.images.push({
    bucket: originalBucket,
    key: originalKey
  })

  let originalBasename = path.basename(originalKey, '.png')   // strip prefix and extension
  let originalImage = await loadOriginalImage(originalBucket, originalKey)
  console.log(`original image    w: ${originalImage.width}  h: ${originalImage.height}`)

  //  s3://originalBucket/originals/originalBasename    .png
  //  s3://originalBucket/debug/originalBasename-n      .png
  //  s3://originalBucket/white/originalBasename-n      .png
  //  s3://originalBucket/json/originalBasename         .json
  //  s3://originalBucket/thumbs/originalBasename       .png
  let allFound = { TextDetections: [] }
  let rekogKey = originalKey;         // NOT the basename version
  let rekogImage = originalImage
  for (let i=0; i<MAX_PASSES; i++) {
    let found = await rekogText(originalBucket, rekogKey)
    console.log(`length of TextDetections: ${found.TextDetections.length}`)
    if (found.TextDetections.length == 0) break
    allFound = mergeFound(allFound, found)
    await saveAnnotatedImage(rekogImage, originalBucket, originalBasename, found, i)
    // https://stackoverflow.com/a/31013390/227441
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#:~:text=Note%3A%20The-,parentheses,-(%20...%20)%20around%20the
    // These next two lines are described in the above links.
    // Can't [x, y] = function(...)     must ([x,y] = function(...))
    // Preceding function call must have ending semicolon. JavaScript is weird.
    console.log(`rekogKey: ${rekogKey}`);
    ([rekogKey, rekogImage] = await saveWhiteoutImage(rekogImage, originalBucket, originalBasename, found, i))
  }
  await saveThumbnailImage(originalImage, originalBucket, originalBasename)
  await writeMergedFound(originalBucket, originalBasename, allFound)       // JSON output (reduced precision)
} 


// --------------------------------------------------
// Find text in image
// Image (PNG file) is in S3 bucket  
async function rekogText(bucket, key) {
  const params = {
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    }
  }
  const command = new DetectTextCommand(params);

  try {
    let start = performance.now()
    const data = await rekClient.send(command)
    let et = performance.now() - start
    console.log(`text detection took ${et/1000.} sec`)
    return data
  } catch (error) {
    console.log(`Rekognition failed: ${JSON.stringify(error)}`)
    return undefined
  }
}


// --------------------------------------------------
// Write JSON version of ALL text found in image
// Written data is result of merging data from all passes
// into the single object.
async function writeMergedFound(bucket, basename, found) {
  // Make returned JSON smaller by reducing precision of the
  // X and Y values o the text's bounding polygon.
  // https://stackoverflow.com/a/9340239/227441
  let start = performance.now()
  console.log(found.TextDetections.length)
  found.TextDetections.forEach(label => {
    delete label.Geometry.BoundingBox
  })
  console.log(found.TextDetections.length)
/*   console.log(JSON.stringify(found))
  const reduced = JSON.stringify(found, function (key, val) {
    return val.toFixed ? Number(val.toFixed(3)) : val;
  }) */
  let et = performance.now() - start
  console.log(`reducing precision took ${et/1000.} sec`)

  const mergedKey = basename.replace('.png', '.json')
  console.log(mergedKey)
  console.log(found.TextDetections.length)
  const params = {
    Bucket : bucket,
    Key : `json/${mergedKey}`,
    Body : JSON.stringify(found)
  }
  const command = new PutObjectCommand(params)

  try {
    let start = performance.now()
    const data = await s3client.send(command);
    let et = performance.now() - start
    console.log(`put S3 merged found took ${et/1000.} sec`)
    return [bucket, mergedKey]
  } catch (err) {
    console.log(`writeMergedFound failed: ${JSON.stringify(error)}`);
    return undefined
  }
}


// --------------------------------------------------
// Merge found text from current pass (additions) into
// cumulative object (all) containing text found in previous passes.
function mergeFound(all, additions) {
  all.TextDetections = all.TextDetections.concat(additions.TextDetections)
  return all
}


// --------------------------------------------------
// Read original source image from S3 and make a node-canvas
// Image object out of it.
async function loadOriginalImage(bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key
  }
  const command = new GetObjectCommand(params)
  console.log(`Loading original: ${bucket}   ${key}`)

  const streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  };
  
  let original = new Image;
  try {
    let start = performance.now()
    // https://github.com/aws/aws-sdk-js-v3/issues/1877
    //const { Body: stream } = await s3client.send(command)
    //const buffer = await consumers.buffer(stream)
    const data = await s3client.send(command);
    console.log(`content length: ${data.ContentLength}`)
    const body = await streamToBuffer(data.Body);
    let et = performance.now() - start
    console.log(`get S3 image took ${et/1000.} sec`)
    //original.src = data.Body;
    original.src = body
    return original
  } catch (error) {
    console.log(`loadOriginalImage failed: ${JSON.stringify(error)}`);
    return undefined
  }
}


// --------------------------------------------------
// Save a reduced size version of the original image.
async function saveThumbnailImage(image, bucket, basename) {

  const w = image.width;
  const h = image.height;
  const canvas = createCanvas(w/4, h/4);
  const ctx = canvas.getContext('2d');
  let start = performance.now()
  ctx.drawImage(image, 0, 0, w/4, h/4);
  let et = performance.now() - start
  console.log(`saveThumbnailImage:drawImage took ${et/1000.} sec`)

  start = performance.now()
  const buffer = canvas.toBuffer("image/png", {compressionLevel: 1, filters: canvas.PNG_ALL_FILTERS});
  et = performance.now() - start
  console.log(`saveThumbnailImage:toBuffer took ${et/1000.} sec`)
  const params = {
    Bucket : bucket,
    Key : `thumbs/${basename}.png`,
    Body : buffer
  }
  const command = new PutObjectCommand(params)

  try {
    let start = performance.now()
    const data = await s3client.send(command);
    let et = performance.now() - start
    console.log(`put S3 thumbnail image took ${et/1000.} sec`)
    return basename
  } catch (err) {
    console.log(`saveThumbnailImage failed: ${JSON.stringify(error)}`);
    return undefined
  }
}


// --------------------------------------------------
// Save a reduced size version of the original image.
// Draw boxes and paths that show text found in this image
// on this pass.
async function saveAnnotatedImage(image, bucket, basename, found, pass) {

  const w = image.width;
  const h = image.height;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  let start = performance.now()
  ctx.drawImage(image, 0, 0);
  let et = performance.now() - start
  console.log(`saveAnnotatedImage:drawImage took ${et/1000.} sec`)

    //ctx.scale(1, -1)   // need a push/pop around this?
  found.TextDetections.forEach(label => {
    //console.log(`Detected Text: ${label.DetectedText} ${label.Type}`)
    if (label.Type == "LINE") {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
      ctx.beginPath();
      let first = true;
      label.Geometry.Polygon.forEach(poly => {
        if (first) {
          ctx.moveTo(w*poly.X, h*poly.Y)
          first = false
        } else {
          ctx.lineTo(w*poly.X, h*poly.Y)
        }
      })
      ctx.fill()
    } else {
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(227, 11, 11, 0.92)';
      ctx.beginPath();
      let first = true;
      label.Geometry.Polygon.forEach(poly => {
        if (first) {
          ctx.moveTo(w*poly.X, h*poly.Y)
          first = false
        } else {
          ctx.lineTo(w*poly.X, h*poly.Y)
        }
      })
      ctx.closePath()
      ctx.stroke()
    }
  })

  start = performance.now()
  const buffer = canvas.toBuffer("image/png", {compressionLevel: 1, filters: canvas.PNG_ALL_FILTERS});
  et = performance.now() - start
  console.log(`saveAnnotatedImage:toBuffer took ${et/1000.} sec`)

  const annotationKey = basename + `-${pass}.png`
  const params = {
    Bucket : bucket,
    Key : `debug/${annotationKey}`,
    Body : buffer
  }
  const command = new PutObjectCommand(params)

  try {
    let start = performance.now()
    const data = await s3client.send(command);
    let et = performance.now() - start
    console.log(`put S3 annotated image took ${et/1000.} sec`)
    return [bucket, annotationKey]
  } catch (err) {
    console.log(`saveAnnotatedImage failed: ${JSON.stringify(error)}`);
    return undefined
  }
}




// --------------------------------------------------
// Save image for next pass at text reognition. The input
// image is the source image of the previous pass. Here we
// draw white boxes over the text that was detected and
// write that as a new source image for the next pass
// (so Rekognition doesn't detect the same text again).
async function saveWhiteoutImage(image, bucket, basename, found, pass) {

  const w = image.width;
  const h = image.height;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  let start = performance.now()
  ctx.drawImage(image, 0, 0);
  let et = performance.now() - start
  console.log(`saveWhiteoutImage:drawImage took ${et/1000.} sec`)

    //ctx.scale(1, -1)   // need a push/pop around this?
  found.TextDetections.forEach(label => {
    //console.log(`Detected Text: ${label.DetectedText} ${label.Type}`)
    if (label.Type == "LINE") {
      ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.beginPath();
      let first = true;
      label.Geometry.Polygon.forEach(poly => {
        if (first) {
          ctx.moveTo(w*poly.X, h*poly.Y)
          first = false
        } else {
          ctx.lineTo(w*poly.X, h*poly.Y)
        }
      })
      ctx.fill()
    }
  })

  start = performance.now()
  const buffer = canvas.toBuffer("image/png", {compressionLevel: 1, filters: canvas.PNG_ALL_FILTERS});
  et = performance.now() - start
  console.log(`saveWhiteoutImage:toBuffer took ${et/1000.} sec`)
  console.log(`basename: ${basename}`)
  const whiteoutKey = basename + `-${pass}.png`
  console.log(`whiteoutKey: ${whiteoutKey}`)
  const params = {
    Bucket : bucket,
    Key : `white/${whiteoutKey}`,    // lose `originals' from originalKey
    Body : buffer
  }
  console.log(`params.Key: ${params.Key}`)
  const command = new PutObjectCommand(params)


  const nextPassImage = new Image
  nextPassImage.src = buffer
  
  try {
    let start = performance.now()
    const data = await s3client.send(command);
    let et = performance.now() - start
    console.log(`put S3 whiteout image took ${et/1000.} sec`)
    return [params.Key, nextPassImage]
    // return nextPassImage
  } catch (err) {
    console.log(`saveWhiteoutImage failed: ${JSON.stringify(error)}`);
    return undefined
  }
}