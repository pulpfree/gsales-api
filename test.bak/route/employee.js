'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')

let recordID = null

// test command NODE_ENV=test ./node_modules/.bin/tape 'test/route/employee.js'


// *** Describe POST /employee *** //

test('POST /employee create success', t => {
  const opts = {
    method: 'POST',
    url: '/employee',
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      active: true,
      nameFirst: 'Test',
      nameLast: 'Dummy',
      notes: 'Notes for test dummy',
      primaryStationID: '56cf1815982d82b0f3000010'
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    recordID = resp.result._id
    server.stop(t.end)
  })
})

// **** Describe GET /employee **** //

test('GET /employees', t => {
  const opts = {
    method: 'GET',
    url: '/employees',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.ok(res.length > 0, 'result length ok')
    server.stop(t.end)
  })
})

test('GET /employee/{id}', t => {
  const opts = {
    method: 'GET',
    url: `/employee/${recordID}`,
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.active, true)
    server.stop(t.end)
  })
})

// **** Describe PUT /employee **** //

test('PUT /employee/{id} update employee', t => {
  const newNameFirst = 'Test 2'
  const newNameLast = 'Last 2'
  const opts = {
    method: 'PUT',
    url: `/employee/${recordID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      nameFirst: newNameFirst,
      nameLast: newNameLast
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.nameFirst, newNameFirst)
    t.equal(res.nameLast, newNameLast)
    server.stop(t.end)
  })
})

// **** Describe PATCH /employee **** //

test('PATCH /employee/{id} openingDollar field change', t => {
  const newActive = false
  const opts = {
    method: 'PATCH',
    url: `/employee/${recordID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      field: 'active',
      value: newActive
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.active, newActive)
    server.stop(t.end)
  })
})

// **** Describe DELETE /employee **** //

test('DELETE /employee/{id}', t => {
  const opts = {
    method: 'DELETE', 
    url: `/employee/${recordID}`,
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})

// Use this if testing alone
/*test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})*/
