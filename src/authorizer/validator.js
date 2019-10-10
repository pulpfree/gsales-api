import jose from 'node-jose'
import jwtSet from './jwks.json'

const validator = async (clientID, token) => {
  if (!clientID) {
    return {
      status: null,
      error: new Error('Missing clientID'),
    }
  }
  if (!token) {
    return {
      status: null,
      error: new Error('Missing token in validator'),
    }
  }

  const { keys } = jwtSet
  const sections = token.split('.')
  // get the kid from the headers prior to verification
  let header = jose.util.base64url.decode(sections[0])
  header = JSON.parse(header)
  const { kid } = header

  let keyIdx = -1
  for (let i = 0; i < keys.length; i += 1) {
    if (kid === keys[i].kid) {
      keyIdx = i
      break
    }
  }
  if (keyIdx === -1) {
    return {
      status: null,
      error: new Error('Public key not found in jwks.json'),
    }
  }

  const keyRes = await jose.JWK.asKey(keys[keyIdx])

  // verify the signature
  const verifyRes = await jose.JWS.createVerify(keyRes).verify(token)

  // extract claims
  const claims = JSON.parse(verifyRes.payload)

  // ensure token is not expired
  const currentTs = Math.floor(new Date() / 1000)
  if (currentTs > claims.exp) {
    return {
      status: 'unauthorized',
      error: new Error('Token is expired'),
    }
  }

  // check that clientID matches
  if (claims.client_id !== clientID) {
    return {
      status: 'deny',
      error: new Error('Token was not issued for this audience'),
    }
  }
  return { status: 'allow', error: null }
}

export default validator
