'use strict'

const test      = require('tape')
const mongoose  = require('mongoose')
const server    = require('../mock/server')

let recordID
const recordNum   = '2016-04-04-1'
const recordDate  = new Date('2016-04-04')
const stationID   = '56cf1815982d82b0f3000001' // Bridge
const type        = 'fuelSale'

// test command NODE_ENV=test ./node_modules/.bin/tape 'test/route/journal.js'


// *** Describe POST /journal *** //

test('POST /journal create success', t => {
  const opts = {
    method: 'POST',
    url: '/journal',
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      recordNum:  recordNum,
      recordDate: recordDate,
      stationID:  stationID,
      type:       type,
      values: {
        foo: 'bar', 
        baz: 'far'
      }
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    recordID = resp.result._id
    server.stop(t.end)
  })
})

// **** Describe GET /journal **** //

test('GET /journals', t => {
  const opts = {
    method: 'GET',
    url: '/journals',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.ok(res.length > 0, 'result length ok')
    server.stop(t.end)
  })
})

test('GET /journal/{id}', t => {
  const opts = {
    method: 'GET',
    url: `/journal/${recordID}`,
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.recordNum, recordNum)
    server.stop(t.end)
  })
})


// Use this if testing alone
test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})