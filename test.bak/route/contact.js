'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')

let contactID = null,
    userEmail = null


// **** Describe GET /contact **** //

test('GET /contacts', t => {
  const opts = {
    method: 'GET',
    url: '/contacts'
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})


// **** Describe POST /contact **** //

test('POST /contact type=personal success', t => {
  const opts = {
    method: 'POST',
    url: '/contact',
    payload: {
      name: {
        first: 'Test',
        last: 'User'
      },
      email: `${Math.random()}test@example.com`,
      type: 'personal',
      phones: {number: '123-456-7890', countryCode: '1', extension: '3300', _id: 'work'},
      position: 'employee',
      type: 'business',
      addresses: {city: 'someplace', countryCode: 'CA', _id: 'mailing'}
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    contactID = resp.result._id
    userEmail = resp.result.email
    server.stop(t.end)
  })
})


// **** Describe PUT /contact **** //

test('PUT /contact/{id} update user', t => {
  const opts = {
    method: 'PUT',
    url: `/contact/${contactID}`,
    payload: {
      type: 'business'
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.type, 'business')
    server.stop(t.end)
  })
})


// **** Describe PATCH /contact **** //

test('PATCH /contact/{id} position field change', t => {
  const opts = {
    method: 'PATCH',
    url: `/contact/${contactID}`,
    payload: {
      field: 'position',
      value: 'other'
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.position, 'other')
    server.stop(t.end)
  })
})


// **** Describe DELETE /contact **** //

test('DELETE /contact/{id}', t => {
  const opts = {
    method: 'DELETE', 
    url: `/contact/${contactID}`
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})

