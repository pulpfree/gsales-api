'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')

let recordID = null

// test command NODE_ENV=test ./node_modules/.bin/tape 'test/route/product.js'


// *** Describe POST /product *** //

test('POST /product create success', t => {
  const opts = {
    method: 'POST',
    url: '/product',
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      category: 'cigarettes',
      commissionEligible: true,
      cost: 12.95,
      name: 'Cigs #3',
      sortOrder: 55,
      taxable: true
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    recordID = resp.result._id
    server.stop(t.end)
  })
})

// **** Describe GET /product **** //

test('GET /products', t => {
  const opts = {
    method: 'GET',
    url: '/products',
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.ok(res.length > 0, 'result length ok')
    server.stop(t.end)
  })
})

test('GET /product/{id}', t => {
  const opts = {
    method: 'GET',
    url: `/product/${recordID}`,
    headers: { authorization: 'Bearer 12345678'}
  }
  server.inject(opts, resp => {
    const res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.taxable, true)
    server.stop(t.end)
  })
})

// **** Describe PUT /product **** //

test('PUT /product/{id} update product', t => {
  const newCategory = 'oil'
  const newCost = 125.99
  const opts = {
    method: 'PUT',
    url: `/product/${recordID}`,
    headers: { authorization: 'Bearer 12345678'},
    payload: {
      category: newCategory,
      cost: newCost
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.category, newCategory)
    t.equal(res.cost, newCost)
    server.stop(t.end)
  })
})

// **** Describe PATCH /product **** //

test('PATCH /product/{id} commissionEligible field change', t => {
  const field = 'commissionEligible'
  const newValue = false
  const opts = {
    method: 'PATCH',
    url: `/product/${recordID}`,
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

// **** Describe DELETE /product **** //

test('DELETE /product/{id}', t => {
  const opts = {
    method: 'DELETE', 
    url: `/product/${recordID}`,
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
