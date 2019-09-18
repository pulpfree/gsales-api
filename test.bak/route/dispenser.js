'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')

let dispenserID = null

// test command NODE_ENV=test ./node_modules/.bin/tape 'test/route/dispenser.js'

// **** Describe GET /contact **** //

test('GET /dispensers', t => {
  const opts = {
    method: 'GET',
    url: '/dispensers',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})

// *** Describe POST /dispenser *** //

test('POST /dispenser create success', t => {
  const opts = {
    method: 'POST',
    url: '/dispenser',
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      gradeID: 2,
      number: 9,
      numberAndGrade: '2 9',
      openingDollar: 108349.58,
      openingLitre: 79969.75,
      openingResetDate: '2016-01-02',
      stationID: '56cf1815982d82b0f3000010'
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    dispenserID = resp.result._id
    server.stop(t.end)
  })
})

// **** Describe PUT /contact **** //

test('PUT /dispenser/{id} update dispenser', t => {
  // console.log('DispenserID', dispenserID)
  const opts = {
    method: 'PUT',
    url: `/dispenser/${dispenserID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      gradeID: 3,
      numberAndGrade: '3 9'
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.gradeID, 3)
    server.stop(t.end)
  })
})

// **** Describe PATCH /contact **** //

test('PATCH /dispenser/{id} openingDollar field change', t => {
  const newDollar = 855001.69
  const opts = {
    method: 'PATCH',
    url: `/dispenser/${dispenserID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      field: 'openingDollar',
      value: newDollar
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.openingDollar, newDollar)
    server.stop(t.end)
  })
})

// **** Describe DELETE /contact **** //

test('DELETE /dispenser/{id}', t => {
  const opts = {
    method: 'DELETE', 
    url: `/dispenser/${dispenserID}`,
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