#  Rewrite to used CRUD so initial deploy is create. Then update, delete.
#  Read would be used to dump status of stack.
.DEFAULT_GOAL := deploy

stack_name = build-book-db
cfn_file = build-book-db.yml
λ_rekog = rekog.js
λ_apigw = apigw.js
λ_db_test = db-test.js
λ_signup = signup.js
λ_confirm_signup = confirm-signup.js
λ_login = login.js
λ_logout = logout.js
λ_library = library.js
λ_library_upload = library-upload.js
λ_dependencies = 

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
lambda.zip: lambda/$(λ_rekog) lambda/$(λ_apigw) lambda/$(λ_signup) lambda/$(λ_confirm_signup) lambda/$(λ_login) lambda/$(λ_logout) lambda/$(λ_library) lambda/$(λ_library_upload)
	@echo "Lambda modified. Zipping and uploading new version..."
	@cd lambda; zip -FS -r -q ../lambda.zip $(λ_rekog) $(λ_apigw) $(λ_signup) $(λ_confirm_signup) $(λ_login) $(λ_logout) $(λ_library) $(λ_library_upload) node_modules
	@aws s3 cp lambda.zip s3://$(lambda_bucket)