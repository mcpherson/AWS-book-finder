.DEFAULT_GOAL := deploy

stack_name = book-finder
cfn_file = book-finder.yml
λ_apigw = apigw.js
λ_user_signup = user-signup.js
λ_user_confirm_signup = user-confirm-signup.js
λ_user_login = user-login.js
λ_user_logout = user-logout.js
λ_user_refresh = user-refresh.js
λ_user_delete = user-delete.js
λ_library_get = library-get.js
λ_library_upload = library-upload.js
λ_library_delete = library-delete.js
λ_rekog = rekog.js

# Bucket must exist and have versioning enabled
lambda_bucket = book-finder-lambda-unique

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

# Need to use zip like this to avoid leaving deleted file in the ZIP archive
# https://superuser.com/a/351020
# zip -FSr -q ../lambda.zip $(rekog_lambda) $(apigw_lambda) node_modules
lambda.zip: lambda/$(λ_apigw) lambda/$(λ_user_signup) lambda/$(λ_user_confirm_signup) lambda/$(λ_user_login) lambda/$(λ_user_logout) lambda/$(λ_user_refresh) lambda/$(λ_user_delete) lambda/$(λ_library_get) lambda/$(λ_library_upload) lambda/$(λ_library_delete) lambda/$(λ_rekog)
	@echo "Lambda modified. Zipping and uploading new version..."
	@cd lambda; zip -FS -r -q ../lambda.zip $(λ_apigw) $(λ_user_signup) $(λ_user_confirm_signup) $(λ_user_login) $(λ_user_logout) $(λ_user_refresh) $(λ_user_delete) $(λ_library_get) $(λ_library_upload) $(λ_library_delete) $(λ_rekog) node_modules
	@aws s3 cp lambda.zip s3://$(lambda_bucket)