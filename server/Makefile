#  Rewrite to used CRUD so initial deploy is create. Then update, delete.
#  Read would be used to dump status of stack.
.DEFAULT_GOAL := deploy

stack_name = build-book-db
cfn_file = build-book-db.yml
lambda_file_name-rekog = rekog.js
apigw_lambda = apigw.js
lambda_file_name-db-test = db-test.js
lambda_file_name-signup = signup.js
lambda_file_name-confirm-signup = confirm-signup.js
lambda_file_name-login = login.js
lambda_file_name-logout = logout.js
lambda_file_name-library = library.js
lambda_file_name-library = library-upload.js

# Bucket must exist and have versioning enabled
lambda_bucket = losalamosal-udemy-uploads-3

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

# OLD
# lambda.zip: lambda/$(lambda_file_name-rekog) lambda/$(lambda_file_name-db-test) lambda/node_modules
# 	@echo "Lambda(s) modified. Zipping and uploading new version..."
# 	@cd lambda; zip -r -q ../lambda.zip *
# 	@aws s3 cp lambda.zip s3://$(lambda_bucket)

# Need to use zip like this to avoid leaving deleted file in the ZIP archive
# https://superuser.com/a/351020
# zip -FSr -q ../lambda.zip $(rekog_lambda) $(apigw_lambda) node_modules
lambda.zip: lambda/$(rekog_lambda) lambda/$(apigw_lambda) lambda/$(lambda_file_name-signup) lambda/$(lambda_file_name-confirm-signup) lambda/$(lambda_file_name-login) lambda/$(lambda_file_name-logout) lambda/$(lambda_file_name-library) lambda/$(lambda_file_name-library-upload)
	@echo "Lambda modified. Zipping and uploading new version..."
	@cd lambda; zip -FS -r -q ../lambda.zip $(rekog_lambda) $(apigw_lambda) $(lambda_file_name-signup) $(lambda_file_name-confirm-signup) $(lambda_file_name-login) $(lambda_file_name-logout) $(lambda_file_name-library) $(lambda_file_name-library-upload) node_modules
	@aws s3 cp lambda.zip s3://$(lambda_bucket)