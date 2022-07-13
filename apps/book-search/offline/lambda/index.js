const aws = require('aws-sdk');
const rek = new aws.Rekognition();

const s3 = new aws.S3();

let { registerFont, createCanvas } = require('canvas');

exports.handler = async (event, context) => {
  const bucket = event.Records[0].s3.bucket.name;
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
  const photo = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const params = {
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: photo
      }
    }
  }

  console.log(`${bucket}   ${photo}`)

  let response = await rek.detectText(params).promise()

  const json_file = photo.replace('.png', '.json')
  // Make returned JSON smaller by reducing precision of the
  // X and Y values o the text's bounding polygon.
  // https://stackoverflow.com/a/9340239/227441
  const reduced_precision = JSON.stringify(response, function (key, val) {
    return val.toFixed ? Number(val.toFixed(3)) : val;
  })
  const s3_params = {
    Bucket : bucket,
    Key : `json/${json_file}`,
    Body : reduced_precision
  }

  const result = await s3.putObject(s3_params).promise()

  const try_get = {
    Bucket: bucket,
    Key: photo
  }

  try {
    console.log("Trying...");
    const file = await s3.getObject(try_get).promise();
    console.log("Good");
    console.log(file.ContentLength);
  } catch (err) {
    console.log(err);
  }
} 