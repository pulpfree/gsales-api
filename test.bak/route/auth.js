'use strict'

const path = require('path')
const Boom = require('boom')
const Hapi = require('hapi')
const AuthBearer = require('hapi-auth-bearer-token');
const fs = require('fs')
const test = require('tape')
const jwt = require('jsonwebtoken')
const constants = require('../../src/config/constants')
const fetch = require('node-fetch')
const co    = require('co')

const SSLPATH = path.join(__dirname, '../../ssl')
// const LOGIN_URL = 'http://localhost:3001/'
const LOGIN_URL = 'http://192.168.99.100:3001/'
const USER_DOMAIN = constants.domainKey

// to run test just this file: NODE_ENV=test USER_DOMAIN=test.gales.sales ./node_modules/.bin/tape 'test/route/auth.js'

let userInfo = {
  password: 'mypassword'
}
let token


// *** Server setup *** //

const mongoose = require('mongoose')
mongoose.connect(constants.database['uri'], constants.database['options'])
const defaultHandler = (request, reply) => {
  reply('success');
}

const jwtValidateFunc = function(token, callback) {
  let tokenFN = USER_DOMAIN + '-public.pem'
  let tokenPath = path.join(SSLPATH, tokenFN)
  let cert = fs.readFileSync(tokenPath)
  jwt.verify(token, cert, { algorithms: ['RS256'], issuer: USER_DOMAIN }, function(err, decoded) {
    // console.log('decoded', decoded) 
    // console.log('err', err)
    if (err) {
      return callback(null, false, { token: token })
    } else {
      return callback(null, true, { token: token });
    }
  });
}

const plugins = [
  {
    register: require('../../src/route/contact'),
    options: {}
  },
  {
    register: require('../../src/route/user'),
    options: {}
  }
] 

// *** Mock up Server *** //
let server = new Hapi.Server({debug: {request: ['info', 'error']}})
server.connection({
  host: constants.application['host'],
  port: 3030
})
server.register(AuthBearer, (err) => {
  server.auth.strategy('jwt_access_token', 'bearer-access-token', {
    validateFunc: jwtValidateFunc
  })
  server.route([
    { method: 'GET', path: '/jwt', handler: defaultHandler, config: { auth: 'jwt_access_token' } },
  ])  
})

server.register(plugins, err => {  
  if (err) { throw err }
})

if (!module.parent) {  
  server.start(err => {
    if (err) { throw err }
    // console.log(`Server running at ${server.info.uri}`)
    console.log('info', `Server running at ${server.info.uri}`)
  })
}


// *** POST to create test user *** //

test('POST /user-contact create user and contact combination success', t => {
  const email = Math.random() + 'test@example.com'
  const opts = {
    method: 'POST',
    url: '/contact-user',
    payload: {
      contact: {
        name: {
          first: 'Test',
          last: 'Dummy'
        },
        email: email,
        type: 'user'
      },
      user: {
        email: email,
        password: userInfo.password,
        active: true
      }
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    const res = resp.result
    userInfo.email = res.email
    server.stop(t.end)
  })
})


// *** Login then verify token with a GET *** //

test('Fetch Token', t => {
  let config = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  }
  let body = {
    username: userInfo.email,
    password: userInfo.password,
    domain: USER_DOMAIN
  }
  config.body = JSON.stringify(body)
  
  fetch(`${LOGIN_URL}login`, config)
    .then(response => {
      return response.json()
    }).then(json => {
      token = json.token
      const opts = {
        method: 'GET',
        url: '/jwt',
        headers: { authorization: `Bearer ${token}`}
      }
      server.inject(opts, resp => {
        t.equal(resp.statusCode, 200)
      })

    })
  server.stop(t.end)
})


test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})

