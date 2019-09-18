'use strict'

const mongoose = require('mongoose')
const server = require('../mock/server')
const test = require('tape')
const co      = require('co')
const Sales = require('../../src/model/sales')
const cloneDeep = require('lodash').cloneDeep

const headers = { authorization: 'Bearer 12345678'}

let shiftComp = []
let shiftRes
let stationID = '56cf1815982d82b0f3000012' // Thorold Stone Back

// NODE_ENV=test ./node_modules/.bin/tape test/route/other-fuel.js | ./node_modules/.bin/tap-spec

// Start with a closed shift
test('Ensure last shift is closed', t => {
  co(function*() {
    let doc = yield Sales
      .find({stationID: stationID})
      .sort({recordDate: -1})
      .limit(1)
      .select({recordDate: 1, shift: 1})
      .exec()

    doc = doc[0]
    if (doc.shift.flag === false) {
      // delete shift
      const opts = {
        method: 'DELETE',
        url: `/sale-shift?stationID=${stationID}`,
        headers
      }
      server.inject(opts, resp => {
        t.equal(resp.statusCode, 200, 'Last shift deleted')
        server.stop(t.end)
      })
    } else {
      t.end()
    }
  })
})


test('fetch last shift', t => {
  co(function*() {
    shiftRes = yield Sales
      .find({stationID: stationID})
      .sort({recordDate: -1})
      .limit(1)
      .select({recordDate: 1, shift: 1, recordNum: 1})
      .exec()
    t.end()
    shiftRes = shiftRes[0]
  })
})


test('GET /sales/shiftSales fetch shift sales prior to patch', t => {
  const opts = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${stationID}&recordNum=${shiftRes.recordNum}&shiftID=${shiftRes._id}`,
    headers
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    shiftComp[0] = cloneDeep(resp.result)
    t.ok(typeof shiftComp[0].shift === 'object')
    server.stop(t.end)
  })
})


test('PATCH /sale-non-fuel/{id} - patch previous', t => {
  let numSold = 0
  let curSalesNonF = shiftComp[0].nonFuelSales[1]
  let qtyVals = {
    close: curSalesNonF.qty.open - numSold,
    sold:  numSold
  }

  const opts = {
    method: 'PATCH',
    url: `/sale-non-fuel/${shiftRes._id}`,
    headers,
    payload: {
      description:    'adjust non-fuel product',
      nonFuelSaleID:  curSalesNonF._id,
      values: qtyVals
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})


test('GET /sales/shiftSales fetch shift sales after patch', t => {

  const opts = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${stationID}&recordNum=${shiftRes.recordNum}&shiftID=${shiftRes._id}`,
    headers
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    shiftComp[1] = cloneDeep(resp.result)
    t.equal(shiftComp[0].shift.overshort.amount, shiftComp[1].shift.overshort.amount, 'overshort values equal')
    server.stop(t.end)
  })
})

test('DELETE /sale-shift delete', t => {
  const opts = {
    method: 'DELETE',
    url: `/sale-shift?stationID=${stationID}`,
    headers
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