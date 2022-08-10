// TODO: Add descriptive header comment.
const path = require("path");
const { Image, createCanvas } = require("canvas");
//const {consumers} = require('stream/consumers')

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const s3client = new S3Client();
const {
  RekognitionClient,
  DetectTextCommand,
} = require("@aws-sdk/client-rekognition");
const rekClient = new RekognitionClient();

// TODO: Make this work nicely or take it out.
//  Collect logging info
let logInfo = {
  images: [],
  timing: [],
};

// TODO: Expand on this.
// Failsafe to stop potentially runaway lambda
const MAX_PASSES = 10;

exports.handler = async (event, context) => {
  const originalBucket = event.Records[0].s3.bucket.name;
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
  const originalKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  // TODO: Make this work or take it out.
  logInfo.images.push({
    bucket: originalBucket,
    key: originalKey,
  });

  // TODO: Lots of comments and references here explaining the bucket and
  //        filename conventions. Discuss the trigget that gets put on the
  //        upload bucket
  // TODO: Try and think of some better names. uploadBucket?
  let originalBasename = path.basename(originalKey, ".png"); // strip prefix and extension
  let originalImage = await loadOriginalImage(originalBucket, originalKey);
  console.log(
    `original image    w: ${originalImage.width}  h: ${originalImage.height}`
  );

  //  s3://originalBucket/originals/originalBasename    .png
  //  s3://originalBucket/debug/originalBasename-n      .png
  //  s3://originalBucket/white/originalBasename-n      .png
  //  s3://originalBucket/json/originalBasename         .json
  //  s3://originalBucket/thumbs/originalBasename       .png

  // TODO: Explain the logic of this loop. Discuss the resetting of certain
  //        variables based on function results.
  let allFound = { TextDetections: [] };
  let rekogKey = originalKey; // NOT the basename version
  let rekogImage = originalImage;
  for (let i = 0; i < MAX_PASSES; i++) {
    let found = await rekogText(originalBucket, rekogKey);
    console.log(`length of TextDetections: ${found.TextDetections.length}`);
    if (found.TextDetections.length == 0) break;
    allFound = mergeFound(allFound, found);
    // TODO: Make one or more matrix "debug" images instead of one big one for
    //        each pass. Include a scaled down version of found text and whiteout.
    // TODO: Fix prettier to NOT do this type of formatting.
    await saveAnnotatedImage(
      rekogImage,
      originalBucket,
      originalBasename,
      found,
      i
    );
    // https://stackoverflow.com/a/31013390/227441
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#:~:text=Note%3A%20The-,parentheses,-(%20...%20)%20around%20the
    // These next two lines are described in the above links.
    // Can't [x, y] = function(...)     must ([x,y] = function(...))
    // Preceding function call must have ending semicolon. JavaScript is weird.
    // TODO: Thinh of a less hacky way of doing this than multiple retrun values.
    console.log(`rekogKey: ${rekogKey}`);
    [rekogKey, rekogImage] = await saveWhiteoutImage(
      rekogImage,
      originalBucket,
      originalBasename,
      found,
      i
    );
  }
  await saveThumbnailImage(originalImage, originalBucket, originalBasename);
  await writeMergedFound(originalBucket, originalBasename, allFound);
  // TODO: Does lambda have to return 200, status?
};

// --------------------------------------------------
// Find text in image
// Image (PNG file) is in S3 bucket
async function rekogText(bucket, key) {
  const params = {
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
  };
  const command = new DetectTextCommand(params);

  // TODO: Figure out better error handling here.
  try {
    let start = performance.now();
    const data = await rekClient.send(command);
    let et = performance.now() - start;
    console.log(`text detection took ${et / 1000} sec`);
    return data;
  } catch (error) {
    console.log(`Rekognition failed: ${JSON.stringify(error)}`);
    return undefined;
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
  let start = performance.now();
  console.log(found.TextDetections.length);
  // TODO: Also remove all "TEXT" entries. Only need to keep "LINE" entries
  //        since we're doing a free text search on the server. By this point
  //        there won't be any use for them--drawing their bounding boxed on
  //        debug images has already been done.
  found.TextDetections.forEach((label) => {
    delete label.Geometry.BoundingBox;
  });
  console.log(found.TextDetections.length);
  // TODO: Gotta get this reduced precision working.
  /*   console.log(JSON.stringify(found))
  const reduced = JSON.stringify(found, function (key, val) {
    return val.toFixed ? Number(val.toFixed(3)) : val;
  }) */
  let et = performance.now() - start;
  console.log(`reducing precision took ${et / 1000} sec`);

  const mergedKey = basename.replace(".png", ".json");
  console.log(mergedKey);
  console.log(found.TextDetections.length);
  const params = {
    Bucket: bucket,
    Key: `json/${mergedKey}`,
    Body: JSON.stringify(found),
  };
  const command = new PutObjectCommand(params);

  // TODO: Once we have a command, cas all S3 puts (ala below) be abstracted
  //        out into a single function?
  try {
    let start = performance.now();
    const data = await s3client.send(command);
    let et = performance.now() - start;
    console.log(`put S3 merged found took ${et / 1000} sec`);
    return [bucket, mergedKey];
  } catch (err) {
    console.log(`writeMergedFound failed: ${JSON.stringify(error)}`);
    return undefined;
  }
}

// --------------------------------------------------
// Merge found text from current pass (additions) into
// cumulative object (all) containing text found in previous passes.
// TODO: Decide whether to do this inline in the main loop.
function mergeFound(all, additions) {
  all.TextDetections = all.TextDetections.concat(additions.TextDetections);
  return all;
}

// --------------------------------------------------
// Read original source image from S3 and make a node-canvas
// Image object out of it.
async function loadOriginalImage(bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key,
  };
  const command = new GetObjectCommand(params);
  console.log(`Loading original: ${bucket}   ${key}`);

  const streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  };

  let original = new Image();
  try {
    let start = performance.now();
    // https://github.com/aws/aws-sdk-js-v3/issues/1877
    //const { Body: stream } = await s3client.send(command)
    //const buffer = await consumers.buffer(stream)
    const data = await s3client.send(command);
    console.log(`content length: ${data.ContentLength}`);
    const body = await streamToBuffer(data.Body);
    let et = performance.now() - start;
    console.log(`get S3 image took ${et / 1000} sec`);
    //original.src = data.Body;
    original.src = body;
    return original;
  } catch (error) {
    console.log(`loadOriginalImage failed: ${JSON.stringify(error)}`);
    // TODO: Better error handling here.
    return undefined;
  }
}

// --------------------------------------------------
// Save a reduced size version of the original image.
async function saveThumbnailImage(image, bucket, basename) {
  const w = image.width;
  const h = image.height;
  const canvas = createCanvas(w / 4, h / 4);
  const ctx = canvas.getContext("2d");
  let start = performance.now();
  ctx.drawImage(image, 0, 0, w / 4, h / 4);
  let et = performance.now() - start;
  console.log(`saveThumbnailImage:drawImage took ${et / 1000} sec`);

  start = performance.now();
  const buffer = canvas.toBuffer("image/png", {
    compressionLevel: 1,
    filters: canvas.PNG_ALL_FILTERS,
  });
  et = performance.now() - start;
  console.log(`saveThumbnailImage:toBuffer took ${et / 1000} sec`);
  const params = {
    Bucket: bucket,
    Key: `thumbs/${basename}.png`,
    Body: buffer,
  };
  const command = new PutObjectCommand(params);

  try {
    let start = performance.now();
    const data = await s3client.send(command);
    let et = performance.now() - start;
    console.log(`put S3 thumbnail image took ${et / 1000} sec`);
    return basename;
  } catch (err) {
    console.log(`saveThumbnailImage failed: ${JSON.stringify(error)}`);
    return undefined;
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
  const ctx = canvas.getContext("2d");
  let start = performance.now();
  ctx.drawImage(image, 0, 0);
  let et = performance.now() - start;
  console.log(`saveAnnotatedImage:drawImage took ${et / 1000} sec`);

  //ctx.scale(1, -1)   // need a push/pop around this?
  found.TextDetections.forEach((label) => {
    //console.log(`Detected Text: ${label.DetectedText} ${label.Type}`)
    if (label.Type == "LINE") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
      ctx.beginPath();
      let first = true;
      label.Geometry.Polygon.forEach((poly) => {
        if (first) {
          ctx.moveTo(w * poly.X, h * poly.Y);
          first = false;
        } else {
          ctx.lineTo(w * poly.X, h * poly.Y);
        }
      });
      ctx.fill();
    } else {
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(227, 11, 11, 0.92)";
      ctx.beginPath();
      let first = true;
      label.Geometry.Polygon.forEach((poly) => {
        if (first) {
          ctx.moveTo(w * poly.X, h * poly.Y);
          first = false;
        } else {
          ctx.lineTo(w * poly.X, h * poly.Y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    }
  });

  start = performance.now();
  const buffer = canvas.toBuffer("image/png", {
    compressionLevel: 1,
    filters: canvas.PNG_ALL_FILTERS,
  });
  et = performance.now() - start;
  console.log(`saveAnnotatedImage:toBuffer took ${et / 1000} sec`);

  const annotationKey = basename + `-${pass}.png`;
  const params = {
    Bucket: bucket,
    Key: `debug/${annotationKey}`,
    Body: buffer,
  };
  const command = new PutObjectCommand(params);

  try {
    let start = performance.now();
    const data = await s3client.send(command);
    let et = performance.now() - start;
    console.log(`put S3 annotated image took ${et / 1000} sec`);
    return [bucket, annotationKey];
  } catch (err) {
    console.log(`saveAnnotatedImage failed: ${JSON.stringify(error)}`);
    return undefined;
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
  const ctx = canvas.getContext("2d");
  let start = performance.now();
  ctx.drawImage(image, 0, 0);
  let et = performance.now() - start;
  console.log(`saveWhiteoutImage:drawImage took ${et / 1000} sec`);

  //ctx.scale(1, -1)   // need a push/pop around this?
  found.TextDetections.forEach((label) => {
    //console.log(`Detected Text: ${label.DetectedText} ${label.Type}`)
    if (label.Type == "LINE") {
      ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
      ctx.beginPath();
      let first = true;
      label.Geometry.Polygon.forEach((poly) => {
        if (first) {
          ctx.moveTo(w * poly.X, h * poly.Y);
          first = false;
        } else {
          ctx.lineTo(w * poly.X, h * poly.Y);
        }
      });
      ctx.fill();
    }
  });

  start = performance.now();
  const buffer = canvas.toBuffer("image/png", {
    compressionLevel: 1,
    filters: canvas.PNG_ALL_FILTERS,
  });
  et = performance.now() - start;
  console.log(`saveWhiteoutImage:toBuffer took ${et / 1000} sec`);
  console.log(`basename: ${basename}`);
  // TODO: Clean up (abstract) all this basename/prefix handling.
  const whiteoutKey = basename + `-${pass}.png`;
  console.log(`whiteoutKey: ${whiteoutKey}`);
  const params = {
    Bucket: bucket,
    Key: `white/${whiteoutKey}`, // lose `originals' from originalKey
    Body: buffer,
  };
  console.log(`params.Key: ${params.Key}`);
  const command = new PutObjectCommand(params);

  const nextPassImage = new Image();
  nextPassImage.src = buffer;

  try {
    let start = performance.now();
    const data = await s3client.send(command);
    let et = performance.now() - start;
    console.log(`put S3 whiteout image took ${et / 1000} sec`);
    return [params.Key, nextPassImage];
  } catch (err) {
    console.log(`saveWhiteoutImage failed: ${JSON.stringify(error)}`);
    return undefined;
  }
}
