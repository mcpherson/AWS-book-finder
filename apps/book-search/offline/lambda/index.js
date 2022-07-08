const aws = require('aws-sdk');
const rek = new aws.Rekognition();

const s3 = new aws.S3();

exports.handler = async (event, context) => {
  const bucket = event.Records[0].s3.bucket.name;
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
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
  const s3_params = {
    Bucket : bucket,
    Key : `json/${json_file}ls`,
    Body : JSON.stringify(response)
  }

  const result = await s3.putObject(s3_params).promise()

  // Need to write search results to new S3 bucket (versioned?)
/*   response.TextDetections.forEach(label => {
    console.log(`Detected Text: ${label.DetectedText}`)
    console.log(`Type: ${label.Type}`)
    console.log(`ID: ${label.Id}`)
  }) */
} 