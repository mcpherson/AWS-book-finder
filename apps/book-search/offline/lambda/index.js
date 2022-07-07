const aws = require('aws-sdk');
const rek = new aws.Rekognition();

exports.handler = async (event, context) => {
  const bucket = event.Records[0].s3.bucket.name;
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
  console.log(`Detected Text for: ${photo}`)
  
  // Need to write search results to new S3 bucket (versioned?)
  response.TextDetections.forEach(label => {
    console.log(`Detected Text: ${label.DetectedText}`)
    console.log(`Type: ${label.Type}`)
    console.log(`ID: ${label.Id}`)
  })
}