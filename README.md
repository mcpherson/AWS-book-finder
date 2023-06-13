# Book Finder

Book Finder is a simple OCR app powered by AWS Serverless. It allows a user to upload images and search for text contained in them.

[Try the app](https://bookfinder.mcpherson.dev)

[Read about the app's development](https://mcpherson.dev/projects/AWS-book-finder)

## Requirements
- AWS account
    - Admin permissions
- Terminal (bash)
    - make
    - zip
    - aws
- Static website hosting

## Creating the Lambda Bucket

You must create a versioned S3 bucket before creating the main stack. This is where Lambda code will be stored for deployment via CFN. 

Run the following commands (replace 'my-bucket' with a GLOBALLY UNIQUE bucket name):
```aws s3 mb my-bucket```
```aws s3api put-bucket-versioning --bucket my-bucket --versioning-configuration Status=Enabled```

In `Makefile`, change the value of `lambda_bucket` to your bucket name.
In `book-finder.yml`, change the default value of the `LambdaBucketName` parameter to your bucket name.

## Creating the AWS Stack

Before creating the main stack, you will need to create the node.js canvas lambda layer and add its ARN to your CFN file (`book-finder.yml`).

1. In your AWS console, navigate to the Serverless Application Repository via “Services”.
2. Click “Available applications” on the left
3. Search for “canvas”
4. Click “lambda-layer-canvas-nodejs” by Charoite Lee
5. Click “Deploy”
6. Navigate to CloudFormation in the console and select the stack that was just created
7. Click the “Resources” tab on the right sidebar
8. Copy the resource’s ARN under “Physical ID”
9. Search for “REKOG LAMBDA” in `book-finder.yml`
10. Update the value of the `Layers` property of the `S3TriggerLambda` resource with the new ARN and save the file

The rest of the AWS resources are contained in a single stack created via Makefile. 

1. In your local terminal, navigate to the “server” directory
2. Run `make`

The Makefile will check for updates to Lambda code before zipping the functions and uploading them to the previously created versioned Lambda bucket.

## Front-End Hosting
The front-end is a simple static site. I use Netlify's Continuous Deployment feature to assist with development, but any static website hosting service will work. 

You will need to change a few values in your `config.js` file to hook it up to your AWS stack.

1. `APIEndpointID`
    - To find the ID of your REST API (`bookfinder-api-gateway`), run: `aws apigateway get-rest-apis`
2. `region`
    - Replace with the default region of your AWS account as defined in your `config` file, e.g. `us-west-2`

You can also find the above information in the console.

----
After following these steps, you should be able to spin up your own copy of Book Finder and tinker with it as you please. Thank you for checking out my project. If you encountered any issues, or if you have a suggestion or request, [submit an issue](https://github.com/mcpherson/AWS-book-finder/issues/new).

## License

This software is licensed under the GNU General Public License v3.0 or later.

See [LICENSE](https://github.com/mcpherson/AWS-book-finder/blob/main/LICENSE) to see the full text of the license.