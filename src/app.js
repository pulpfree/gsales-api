import hapi from 'hapi'

import AuthBearer from 'hapi-auth-bearer-token'
import Boom from 'boom'
import fs from 'fs'
import glob from 'glob'
import jwt from 'jsonwebtoken'
import Mongoose from 'mongoose'
import path from 'path'

import constants from './config.old/constants'
import RequestValidator from './requestValidator'
import User from './model/user'

const SSLPATH = path.join(__dirname, '../ssl')
const DOMAIN_KEY = constants.domainKey

// authenticate props
// open this certificate file once then it's accessible for every request
const tokenFN = `${DOMAIN_KEY}-public.pem`
const tokenPath = path.join(SSLPATH, tokenFN)
const cert = fs.readFileSync(tokenPath)

const jwtValidateFunc = function (token, callback) {
  jwt.verify(token, cert, { algorithms: ['RS256'], issuer: DOMAIN_KEY }, (err, decoded) => {
    if (err) {
      return callback(null, false, { token })
    }
    // fetch user scopes
    const q = User.findById(decoded.jti, { active: 1, scope: 1 })
    q.exec().then((user) => {
      // If user is in-activated, forbid
      if (user.active === false) {
        return callback(null, false, { token })
      }
      const userID = user.id
      return callback(null, true, { token, scope: user.scope, userID })
    })
  })
}


// Setup Server
const server = new hapi.Server({ debug: { request: ['info', 'error'] } })
server.connection({
  host: constants.application.host,
  port: constants.application.port,
  routes: { cors: true },
})

server.ext('onPreHandler', (request, reply) => {
  const { method } = request.route
  const { path } = request.route
  const { params } = request

  const res = RequestValidator.test({ path, params, method })

  if (res instanceof Promise) {
    res.then((ret) => {
      if (ret) {
        return reply.continue()
      }
      return reply(Boom.badRequest('Invalid date request, period closed.'))
    })
  } else {
    return reply.continue()
  }
})

server.register(AuthBearer, (err) => {
  if (err) { throw err }

  Mongoose.Promise = global.Promise
  Mongoose.connect(constants.database.uri, constants.database.options)
    .then()
    .catch((err) => {
      // note: this is likely redundant, need to test which is better
      console.error('err:', err) // eslint-disable-line
      // todo: log error here
    })
  const db = Mongoose.connection
  db.on('error', console.error.bind(console, 'Connection error:')) // eslint-disable-line no-console
  db.once('open', () => console.log('We are connected!')) // eslint-disable-line no-console

  server.auth.strategy('jwt_access_token', 'bearer-access-token', 'required', {
    validateFunc: jwtValidateFunc,
  })

  glob.sync('/route/*.js', {
    root: __dirname,
  }).forEach((file) => {
    const route = require(file)
    server.route(route)
  })
})

server.start((err) => {
  if (err) { throw err }
  server.log('info', `Server running at ${server.info.uri}`)
})

module.exports = server
