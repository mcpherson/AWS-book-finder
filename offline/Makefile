#  Rewrite to used CRUD so initial deploy is create. Then update, delete.
#  Read would be used to dump status of stack.
.DEFAULT_GOAL := deploy

stack_name = build-book-db
cfn_file = build-book-db.yml
lambda_file_name = index.js

# Bucket must exist and have versioning enabled
lambda_bucket = losalamosal-udemy-uploads

# https://stackoverflow.com/a/20714468/227441
# https://stackoverflow.com/a/69710710/227441
# https://stackoverflow.com/a/67423033/227441
# Don't need to depend on the Cloudformation YAML file mod time.
# If a new ZIP file is not generated, Cloudformation will not
# create a change set.
deploy: lambda.zip
	@set -e                                                                      ;\
	zip_version=$$(aws s3api list-object-versions                                 \
		--bucket $(lambda_bucket) --prefix lambda.zip                             \
		--query 'Versions[?IsLatest == `true`].VersionId | [0]'                   \
		--output text)                                                           ;\
	echo "Running aws cloudformation deploy with ZIP version $$zip_version..."   ;\
	aws cloudformation deploy --stack-name $(stack_name)                          \
		--template-file $(cfn_file)                                               \
		--parameter-overrides ZipVersionId=$$zip_version                          \
		--capabilities CAPABILITY_NAMED_IAM

lambda.zip: lambda/$(lambda_file_name)
	@echo "Lambda modified. Zipping and uploading new version..."
	@cd lambda; zip -r -q ../lambda.zip *
	@aws s3 cp lambda.zip s3://$(lambda_bucket)
