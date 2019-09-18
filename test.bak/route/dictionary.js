'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')
const util    = require('util')

let dictID = null;
const testCat = 'store'

// **** Describe POST /dictionary **** //
test('POST /dict success', t => {
  const opts = {
    method: 'POST',
    url: '/dict',
    payload: {
      term: 'Test Company-' + String(Math.random()),
      category: 'store',
      description: 'Store name'
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 201)
    dictID = res._id
    server.stop(t.end)
  })
})

test('POST /dict success', t => {
  const opts = {
    method: 'POST',
    url: '/dict',
    payload: {
      term: 'Test Company2-' + String(Math.random()),
      category: 'store',
      description: 'Store name'
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 201)
    server.stop(t.end)
  })
})


// **** Describe PUT /dict **** //

test('PUT /dict/{id} update dict', t => {
  const opts = {
    method: 'PUT',
    url: `/dict/${dictID}`,
    payload: {
      term: 'Updated Term1-' + String(Math.random())
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    // console.log('res', res)
    // t.equal(res.term, 'Another Term')
    server.stop(t.end)
  })
})

test('PUT /dict/{id} update dict', t => {
  const opts = {
    method: 'PUT',
    url: `/dict/${dictID}`,
    payload: {
      term: 'Updated Term2-' + String(Math.random())
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    // console.log('res', res)
    // t.equal(res.term, 'Another Term')
    server.stop(t.end)
  })
})

// **** Describe GET /dict **** //

test('GET /dict fetch all dict success', t => {
  const opts = {
    method: 'GET',
    url: '/dicts'
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(util.isArray(res), true)
    server.stop(t.end)
  })
})

test('GET /dict fetch dict by category success', t => {
  const opts = {
    method: 'GET',
    url: `/dicts?cat=${testCat}`
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(util.isArray(res), true)
    t.ok(res.length >= 2)
    server.stop(t.end)
  })
})

test('GET /dict/{id} fetch dict and compare ', t => {
  const opts = {
    method: 'GET',
    url: `/dict/${dictID}`
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.category, 'store')
    server.stop(t.end)
  })
})

// **** Describe PATCH /dict **** //

test('PATCH /dict/{id} category field change', t => {
  const opts = {
    method: 'PATCH',
    url: `/dict/${dictID}`,
    payload: {
      field: 'category',
      value: 'general'
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.category, 'general')
    server.stop(t.end)
  })
})

test('PATCH /dict/{id} accepted field change', t => {
  const opts = {
    method: 'PATCH',
    url: `/dict/${dictID}`,
    payload: {
      field: 'accepted',
      value: true
    }
  }
  server.inject(opts, resp => {
    let res = resp.result
    t.equal(resp.statusCode, 200)
    t.equal(res.accepted, true)
    server.stop(t.end)
  })
})


// **** Describe DELETE /dict **** //

test('DELETE /dict/{id}', t => {
  const opts = {
    method: 'DELETE', 
    url: `/dict/${dictID}`
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})

