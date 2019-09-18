'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')

// test command NODE_ENV=test ./node_modules/.bin/tape 'test/route/util.js'

// **** Describe GET /fuel-definitions **** //

test('GET /fuel-definitions', t => {
  const opts = {
    method: 'GET',
    url: '/fuel-definitions',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    // console.log('res: ', res)
    t.equal(resp.statusCode, 200)
    t.ok(res.length > 0, 'result length ok')
    server.stop(t.end)
  })
})

test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})