## Useful AWS CLI Commands

# S3
S3 bucket names can't have `+` or `/` in them. Object names can mimic a file system hierarchy
by using `/`.

```sh
aws s3 ls
aws s3 ls s3://bucket-name --recursive --human-readable --summarize
aws s3 mb s3://new-bucket     # make bucket
aws s3 rb s3://old-bucket     # delete bucket (empty)
aws s3 cp local.file s3://bucket-name/prefix1/prefix2/object-name
```

## Lambda
Use the CLI to query your lambdas.

```sh
aws lambda list-functions
aws lambda get-function --function-name funckie-name
curl -i https://awslambda-region...temp-link-to-lambda --output funckie.zip
unzip funckie.zip       # the source for the lambda function; link expires in 10 minutes
aws lambda invoke --function-name funckie-name output.json   # runs function
```