.DEFAULT_GOAL := deploy

# Bucket must exist and have versioning enabled
lambda_bucket = losalamosal-udemy-uploads

# https://stackoverflow.com/a/20714468/227441
# https://stackoverflow.com/a/69710710/227441
# https://stackoverflow.com/a/67423033/227441
# Don't need to depend on the Cloudformation YAML file mod time.
# If a new ZIP file is not generated, Cloudformation will not
# create a change set.
deploy: lambda.zip
	@set -e                                                                       ;\
	lambda_version=$$(aws s3api list-object-versions                               \
		--bucket $(lambda_bucket) --prefix lambda.zip                              \
		--query 'Versions[?IsLatest == `true`].VersionId | [0]'                    \
		--output text)                                                            ;\
	echo "Running aws cloudformation deploy with ZIP version $$lambda_version..." ;\
	aws cloudformation deploy --stack-name zip-lambda                              \
		--template-file test.yml                                                   \
		--parameter-overrides LambdaVersionId=$$lambda_version                     \
		--capabilities CAPABILITY_NAMED_IAM

lambda.zip: lambda/rekog.js
	@cd lambda; zip ../lambda.zip *
	@aws s3 cp lambda.zip s3://$(lambda_bucket)
