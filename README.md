# Book Finder

Book Finder is a simple OCR app powered by AWS Serverless. It allows a user to upload images and search for text contained in them.



## Requirements
- AWS account
    - IAM Admin (ability to create roles and permissions)
- Shell (bash)
    - make
    - aws
        - [How to install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Static website hosting

## Disclaimer

As with any AWS resource, there are financial risks. Please monitor any resources that you create with these instructions. I have accounted for security and throttling across the app, but my solution may not be comprehensive. Proceed at your own risk.

## Creating the Lambda Bucket

You must create a versioned S3 bucket before creating the main stack. This is where Lambda code will be stored for deployment via CFN. 

Run the following commands (replace 'my-bucket' with a GLOBALLY UNIQUE bucket name):

```sh
aws s3 mb my-bucket
aws s3api put-bucket-versioning --bucket my-bucket --versioning-configuration Status=Enabled
```

In `Makefile`, change the value of `lambda_bucket` to your bucket name.
In `book-finder.yml`, change the default value of the `LambdaBucketName` parameter to your bucket name.

## Creating the Node.js Canvas Lambda Layer

Before creating the main stack, you will need to create the node.js canvas lambda layer and add its ARN to your CFN file (`book-finder.yml`).

1. In your AWS console, navigate to the Serverless Application Repository via **Services**.
1. Click **Available applications** on the left
1. Search for **canvas**
1. Click **lambda-layer-canvas-nodejs** by Charoite Lee
1. Click **Deploy**
1. In your terminal, run: `aws lambda list-layers`
1. Copy the value of `LayerVersionArn` for `LayerName` `canvas-nodejs`
1. Search for `REKOG LAMBDA` in `book-finder.yml`
1. Update the value of the `Layers` property of the `S3TriggerLambda` resource with the `LayerVersionArn` and save the file

## Creating the AWS Stack

The rest of the AWS resources are contained in a single stack created via `Makefile`. 

1. In your local terminal, navigate to the `server` directory
2. Run `make`

The Makefile will check for updates to Lambda code before zipping the functions and uploading them to the previously created versioned Lambda bucket.

## Front-End Hosting
The front-end is a simple static site, so it can run on localhost. I used VS Code's Live Server extension for development. The site is hosted via Netlify's Continuous Deployment feature.

(**NOTE:** If you are testing with localhost, please be aware that the resource paths for some links may not work correctly. This is because the root directory name is excluded from the URL by Netlify, but is required in localhost.)

You will need to change a few values in your `config.js` file to hook it up to your AWS stack.

1. `APIEndpointID`
    - To find the ID of your REST API (`bookfinder-api-gateway`), run: `aws apigateway get-rest-apis`
2. `region`
    - Replace with the default region of your AWS account as defined in your `config` file, e.g. `us-west-2`

You can also find the above information in the console.

Thank you for checking out my project. If you encountered any issues, or if you have a suggestion or request, [submit an issue](https://github.com/mcpherson/AWS-book-finder/issues/new).

## Deletion
To delete the main stack, run: 
```sh
aws cloudformation delete-stack --stack-name book-finder
```
To delete the node.js canvas lambda layer, run:
```sh
aws lambda list-layers
``` 
Note the `Version` (`your-version-number` in the following command), then run: 
```sh
aws lambda delete-layer-version --layer-name canvas-nodejs --version-number your-version-number
```
To delete the versioned Lambda bucket, run (replace `my-bucket` with your bucket name): 
```sh
aws s3api delete-objects --bucket my-bucket --delete "$(aws s3api list-object-versions \
    --bucket my-bucket --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"
aws s3api delete-objects --bucket my-bucket --delete "$(aws s3api list-object-versions \
    --bucket my-bucket --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')"
aws s3 rb s3://my-bucket
```

## License

This software is licensed under the GNU General Public License v3.0 or later.

See [LICENSE](https://github.com/mcpherson/AWS-book-finder/blob/main/LICENSE) to see the full text of the license.