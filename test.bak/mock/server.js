'use strict'

const Hapi = require('hapi')
const AuthBearer = require('hapi-auth-bearer-token')
const mongoose = require('mongoose')
const constants = require('../../src/config/constants')
const server = new Hapi.Server({debug: {request: ['info', 'error']}})
// const server = new Hapi.Server({debug: false})

mongoose.Promise = global.Promise

server.connection({
  host: constants.application['host'],
  port: constants.application['port']
})

const jwtValidateFunc = function(token, callback) {
  return callback(null, true, { token: token, scope: ['su'] })
}

mongoose.connect(constants.database['uri'], constants.database['options'])

const plugins = [
  {
    register: require('../../src/route/config'),
    options: {}
  },
  {
    register: require('../../src/route/contact'),
    options: {}
  },
  {
    register: require('../../src/route/dictionary'),
    options: {}
  },
  {
    register: require('../../src/route/dispenser'),
    options: {}
  },
  {
    register: require('../../src/route/employee'),
    options: {}
  },
  {
    register: require('../../src/route/fuel-sales'),
    options: {}
  },
  {
    register: require('../../src/route/journal'),
    options: {}
  },
  {
    register: require('../../src/route/product'),
    options: {}
  },
  {
    register: require('../../src/route/sales'),
    options: {}
  },
  {
    register: require('../../src/route/station'),
    options: {}
  },
  {
    register: require('../../src/route/util'),
    options: {}
  },
  {
    register: require('../../src/route/user'),
    options: {}
  }
]

server.register(AuthBearer, (err) => {
  server.auth.strategy('jwt_access_token', 'bearer-access-token', true, {
    validateFunc: jwtValidateFunc
  }) 
})

server.register(plugins, err => {  
  if (err) { throw err }

  if (!module.parent) {  
    server.start(err => {
      if (err) { throw err }
      // console.log(`Server running at ${server.info.uri}`)
      server.log('info', `Server running at ${server.info.uri}`)
    })
  }
})

module.exports = server