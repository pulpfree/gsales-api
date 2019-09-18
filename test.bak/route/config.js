'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')

const recordID = 1

// test command NODE_ENV=test ./node_modules/.bin/tape 'test/route/config.js'

test('GET /config/{id}', t => {
  const opts = {
    method: 'GET',
    url: `/config/${recordID}`,
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    // console.log('res:', res)
    t.ok(res.commission > 1, 'Commision gt')
    // t.equal(res.HST, 13)
    // t.equal(res.hiGradePremium, 13)
    // t.equal(res.colouredDieselDiscount, 14)
    server.stop(t.end)
  })
})

// **** Describe PATCH /config **** //

test('PATCH /config/{id} openingDollar field change', t => {
  const field = 'hiGradePremium'
  const value = 10
  const opts = {
    method: 'PATCH',
    url: `/config/${recordID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      field: field,
      value: value
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res[field], value)
    server.stop(t.end)
  })
})

// **** Describe PUT /config **** //

test('PUT /config/{id} update config', t => {
  const newVal1 = 7
  const newVal2 = 14
  const opts = {
    method: 'PUT',
    url: `/config/${recordID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      commission: newVal1,
      hiGradePremium: newVal2
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.commission, newVal1)
    t.equal(res.hiGradePremium, newVal2)
    server.stop(t.end)
  })
})

// Use this if testing alone
test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})
