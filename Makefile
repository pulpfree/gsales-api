include .env

default: compileapp awsPackage awsDeploy

deploy: buildapp awsPackage awsDeploy

buildapp:
	@rm -fr build/* && \
	yarn run build && \
	cp ./src/config/defaults.yml build/config/ && \
	cp package.json build/ && \
	# cp ./src/authorizer/jwks.json build/authorizer/ && \
	cd ./build && \
	rm index.js && \
	yarn install --prod
	# find . -mtime +10950 -print -exec touch {} \;

compileapp:
	yarn run build

# aws lambda invoke --function-name "HelloWorldFunction"
# aws lambda invoke --function-name "AuthLambda" --endpoint-url "http://127.0.0.1:3001" --no-verify-ssl out.txt
# sam local invoke [OPTIONS] [FUNCTION_IDENTIFIER]
# sam local invoke AuthLambda
run: compileapp
	sam local start-api -n env.json

awsPackage:
	@aws cloudformation package \
   --template-file ${FILE_TEMPLATE} \
   --output-template-file ${FILE_PACKAGE} \
   --s3-bucket $(AWS_BUCKET_NAME) \
   --s3-prefix $(AWS_BUCKET_PREFIX) \
   --profile $(AWS_PROFILE) \
   --region $(AWS_REGION)

awsDeploy:
	@aws cloudformation deploy \
   --template-file ${FILE_PACKAGE} \
   --region $(AWS_REGION) \
   --stack-name $(AWS_STACK_NAME) \
   --capabilities CAPABILITY_NAMED_IAM \
   --profile $(AWS_PROFILE) \
   --force-upload \
	 --parameter-overrides \
	 		ParamAccountId=$(AWS_ACCOUNT_ID) \
	 	  ParamProjectName=$(AWS_STACK_NAME) \
			ParamENV=$(ENV) \
			# ParamAppBucket=$(APP_BUCKET_NAME) \
			ParamKMSKeyID=$(KMS_KEY_ID)
			# ParamThundraKey=$(THUNDRA_API_KEY)

describe:
	@aws cloudformation describe-stacks \
		--region $(AWS_REGION) \
		--stack-name $(AWS_STACK_NAME)

outputs:
	@ make describe \
		| jq -r '.Stacks[0].Outputs'

.PHONY: buildapp compileapp configure default deploy buildapp run validate awspackage awsdeploy describe outputs
