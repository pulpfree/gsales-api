# Decode and Verify

See: [Verifying a JSON Web Token](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)

To fetch the public key of the user pool:  
region: '[region]'  
userPoolId: '[pool id]'

format: https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json  
