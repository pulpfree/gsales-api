'use strict'

const test = require('tape')
const co      = require('co')
const mongoose = require('mongoose')
const Sales = require('../../src/model/sales')
const Journal = require('../../src/model/journal')

const server = require('../mock/server')
const headers = { authorization: 'Bearer 12345678'}
const stationID = '56cf1815982d82b0f3000001' // Bridge

let shiftRes = null
let curSales = null

// NODE_ENV=test ./node_modules/.bin/tape test/route/sales-remove.js | ./node_modules/.bin/tap-spec

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


test('GET /sales/shiftSales fetch shift sales', t => {
  const opts = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${stationID}&recordNum=${shiftRes.recordNum}&shiftID=${shiftRes._id}`,
    headers
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    curSales = resp.result
    t.ok(typeof curSales.shift === 'object')
    t.ok(typeof curSales.fuelSales === 'object')
    t.ok(typeof curSales.nonFuelSales === 'object')
    t.ok(typeof curSales.fuelDefinitions === 'object')
    server.stop(t.end)
  })
})


test('Add comments to last shift with a patch', t => {
  let s = JSON.parse(JSON.stringify(curSales.shift))
  s.id = s._id
  delete s._id

  let adjust = 12.50
  let adjustValue = s.cash.bills + adjust

  const opts = {
    method: 'PATCH',
    url: `/sale-summary/${s.id}`,
    headers,
    payload: {
      adjustment: {
        adjustValue,
        description: 'test adjust cash',
        field: 'cash.bills'
      },
      shift: s
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    const res = resp.result
    t.equal(res.cash.bills, adjustValue, 'cash adjustment matches')
    t.equal(res.salesSummary.cashTotal, (s.salesSummary.cashTotal + adjust), 'cashTotal matches')
    t.equal(res.salesSummary.cashCCTotal, (s.salesSummary.cashCCTotal + adjust), 'cashCCTotal matches')
    server.stop(t.end)
  })
})

/*
 To find journal entries for a sale-summary patch:
 type = SalesSummaryAdjust
 recordNum & stationID
*/
test('Fetch and get count of journal entries', t => {
  const q = {
    // type: 'salesSummaryAdjust',
    recordNum: shiftRes.recordNum,
    stationID
  }
  co(function*() {
    const jres = yield Journal
      .find(q)
      .exec()
    t.ok(jres.length > 0, `Have '${jres.length}' journal entries`)
    // console.log('jres:', jres)
    t.end()
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

test('Fetch and get count of journal entries', t => {
  const q = {
    // type: 'salesSummaryAdjust',
    recordNum: shiftRes.recordNum,
    stationID
  }
  co(function*() {
    const jres = yield Journal
      .find(q)
      .exec()
    t.ok(jres.length == 0, 'Have no journal entries')
    // console.log('jres:', jres)
    t.end()
  })
})

// Use this if testing alone
test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})

