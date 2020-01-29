import jose from 'node-jose'
import jwt from 'jsonwebtoken'

import jwtSet from './jwks.json'

// import { COGNITO_POOL_ID, COGNITO_REGION } from './constants'
// const jwksUri = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}/.well-known/jwks.json`


const validator = async (clientID, token) => {
  if (!clientID) {
    throw new Error('Missing clientID')
  }
  if (!token) {
    throw new Error('Missing token')
  }

  let keyStore = jose.JWK.createKeyStore(jwtSet)

  const decoded = jwt.decode(token, { complete: true })
  const { kid } = decoded.header

  try {
    keyStore = await jose.JWK.asKeyStore(jwtSet)
  } catch (err) {
    throw new Error(err)
  }

  const key = keyStore.get(kid, { kty: 'RSA' })

  // verify the signature
  const verifyRes = await jose.JWS.createVerify(key).verify(token)

  // extract claims
  const claims = JSON.parse(verifyRes.payload)
  // console.log('claims:', claims)
  if (claims.client_id !== clientID) {
    throw new Error('Token was not issued for this audience')
  }

  // ensure token is not expired
  const currentTs = Math.floor(new Date() / 1000)
  if (currentTs > claims.exp) {
    throw new Error('Token is expired')
  }

  // principalID = fmt.Sprintf("%s|%s", claims["username"], claims["client_id"])
  const principalID = `${claims.username}|${claims.client_id}`

  return principalID
}

export default validator
