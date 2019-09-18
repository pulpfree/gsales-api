'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')

let recordID = null

// test command NODE_ENV=test ./node_modules/.bin/tape 'test/route/station.js'


// *** Describe POST /station *** //

test('POST /station create success', t => {
  const opts = {
    method: 'POST',
    url: '/station',
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      name: 'My New Store',
      street: '7537 Thorold Stone Full Serve',
      city: 'Niagara Falls',
      phone: '(905) 354-3171'
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    recordID = resp.result._id
    server.stop(t.end)
  })
})

// **** Describe GET /station **** //

test('GET /stations', t => {
  const opts = {
    method: 'GET',
    url: '/stations',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.ok(res.length > 0, 'result length ok')
    server.stop(t.end)
  })
})

test('GET /stations list only', t => {
  const opts = {
    method: 'GET',
    url: '/stations?list=true',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    // console.log('store: ', Object.keys(res[0]).length)
    // console.log('store: ', Object.keys(res[0]))
    // console.log('store: ', res[0])
    // t.ok(res.length > 0, 'result length ok')
    server.stop(t.end)
  })
})

test('GET /station/{id}', t => {
  const opts = {
    method: 'GET',
    url: `/station/${recordID}`,
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    // console.log('res: ', res)
    t.equal(resp.statusCode, 200)
    t.equal(res.name, 'My New Store')
    server.stop(t.end)
  })
})

// **** Describe PUT /station **** //

test('PUT /station/{id} update station', t => {
  const newName = 'Another Store Name'
  const newCity = 'Welland'
  const opts = {
    method: 'PUT',
    url: `/station/${recordID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      name: newName,
      city: newCity
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.name, newName)
    t.equal(res.city, newCity)
    server.stop(t.end)
  })
})

// **** Describe PATCH /station **** //

test('PATCH /station/{id} phone field change', t => {
  const field = 'phone'
  const newValue = '(289) 123-4567'
  const opts = {
    method: 'PATCH',
    url: `/station/${recordID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      field: field,
      value: newValue
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res[field], newValue)
    server.stop(t.end)
  })
})

// **** Describe DELETE /station **** //

test('DELETE /station/{id}', t => {
  const opts = {
    method: 'DELETE', 
    url: `/station/${recordID}`,
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})

// Use this if testing alone
test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})
