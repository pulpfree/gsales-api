'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')

let recordID = null,
  stations = [],
  stationID = null,
  fuels = []

// *** Fetching dispensers based on station, and populating fuel types to result
// test command NODE_ENV=test ./node_modules/.bin/tape 'test/route/dspr-sttn-ftype.js'


// *** First Fetchall stations *** //

test('GET /stations', t => {
  const opts = {
    method: 'GET',
    url: '/stations',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.ok(res.length > 0, 'stations result length ok')
    stations = res
    // console.log('stations: -- ', res[4])
    server.stop(t.end)
  })
})

// *** Fetchall fuel definitions *** //

test('GET /fuel-definitions', t => {
  const opts = {
    method: 'GET',
    url: '/fuel-definitions',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.ok(res.length > 0, 'fuel-definitions result length ok')
    fuels = {}
    res.map(f => {
      fuels[f._id] =  f.label
    })
    server.stop(t.end)
  })
})

// *** Now fetch dispensers by station and populate the fuel types

test('GET /dispensers?{station}', t => {
  // pick a random station
  stationID = stations[4]._id
  const opts = {
    method: 'GET',
    url: `/dispensers?station=${stationID}`,
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.ok(res.length > 0, 'dispensers result length ok')
    
    res.forEach(d => {
        d.gradeLabel = fuels[d.gradeID]
        d.gradeID = 999
    })
    server.stop(t.end)
  })
})


// Use this if testing alone
test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})