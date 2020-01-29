# if the KEY environment variable is not set to either stage or prod, makefile will fail
# KEY is confirmed below in the check_env directive
# example:
# for stage run: ENV=stage make
# for production run: ENV=prod make
include .env-$(ENV)

default: check_env compileapp awspackage awsdeploy

deploy: check_env buildapp awspackage awsdeploy

check_env:
	@echo -n "Your environment file is .env-$(ENV)? [y/N] " && read ans && [ $${ans:-N} = y ]

buildapp:
	@rm -fr build/* && \
	yarn run build && \
	cp ./src/config/defaults.yml build/config/ && \
	cp package.json build/ && \
	cp ./src/authorizer/jwks.json build/authorizer/ && \
	cd ./build && \
	yarn install --prod

# leaving this here, as it was a requirement in a past build of another project
	# find . -mtime +10950 -print -exec touch {} \;

compileapp:
	yarn run build

run: compileapp
	sam local start-api -n env.json

awspackage:
	@aws cloudformation package \
   --template-file ${FILE_TEMPLATE} \
   --output-template-file ${FILE_PACKAGE} \
   --s3-bucket $(AWS_BUCKET_NAME) \
   --s3-prefix $(AWS_BUCKET_PREFIX) \
   --profile $(AWS_PROFILE) \
   --region $(AWS_REGION)

awsdeploy:
	@aws cloudformation deploy \
   --template-file ${FILE_PACKAGE} \
   --region $(AWS_REGION) \
   --stack-name $(AWS_STACK_NAME) \
   --capabilities CAPABILITY_NAMED_IAM \
   --profile $(AWS_PROFILE) \
   --force-upload \
	 --parameter-overrides \
			ParamCertificateArn=$(CERTIFICATE_ARN) \
			ParamCustomDomainName=$(CUSTOM_DOMAIN_NAME) \
			ParamENV=$(ENV) \
			ParamHostedZoneId=$(HOSTED_ZONE_ID) \
			ParamKMSKeyID=$(KMS_KEY_ID) \
			ParamThundraKey=$(THUNDRA_API_KEY) \
	 		ParamAccountId=$(AWS_ACCOUNT_ID) \
	 	  ParamProjectName=$(AWS_STACK_NAME)

describe:
	@aws cloudformation describe-stacks \
		--region $(AWS_REGION) \
		--stack-name $(AWS_STACK_NAME)

outputs:
	@ make describe \
		| jq -r '.Stacks[0].Outputs'

.PHONY: buildapp compileapp configure default deploy buildapp run validate awspackage awsdeploy describe outputs check_env
