'use strict'

const test = require('tape')
const co      = require('co')
const mongoose = require('mongoose')
const Sales = require('../../src/model/sales')

const server = require('../mock/server')
const headers = { authorization: 'Bearer 12345678'}
const numSold = 2
const reStock = 10
const stationID = '56cf1815982d82b0f300000c' // Stanley

const cloneDeep = require('lodash').cloneDeep

let shiftRes = []
let curNFSaleQty1 = null
let curSales = null
let prevSales = null


// NODE_ENV=test ./node_modules/.bin/tape test/route/non-fuel-adjust.js | ./node_modules/.bin/tap-spec

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

/*
  test instructions
  1. fetch _id of current shift based on: prevSaleDoc stationID, curRecordNum
  2. fetch _id of both non-fuel-sale records based on stationID and recordNum
  3. modify qty of current non-fuel-sale record to include a restock
  4. modify sold of prev non-fuel-sale and check if current stock is accurate
*/

test('fetch last 2 shifts', t => {
  co(function*() {
    shiftRes = yield Sales
      .find({stationID: stationID})
      .sort({recordDate: -1})
      .limit(2)
      .select({recordDate: 1, shift: 1, recordNum: 1})
      .exec()
    shiftRes.reverse()
    t.end()
  })
})


test('GET /sales/shiftSales fetch shift sales', t => {

  const opts = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${stationID}&recordNum=${shiftRes[1].recordNum}&shiftID=${shiftRes[1]._id}`,
    headers
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    curSales = cloneDeep(resp.result)
    t.ok(typeof curSales.shift === 'object')
    t.ok(typeof curSales.fuelSales === 'object')
    t.ok(typeof curSales.nonFuelSales === 'object')
    t.ok(typeof curSales.fuelDefinitions === 'object')
  })

  const opts2 = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${stationID}&recordNum=${shiftRes[0].recordNum}&shiftID=${shiftRes[0]._id}`,
    headers
  }
  server.inject(opts2, resp => {
    t.equal(resp.statusCode, 200)
    prevSales = cloneDeep(resp.result)
    t.ok(typeof prevSales.shift === 'object')
    t.ok(typeof prevSales.fuelSales === 'object')
    t.ok(typeof prevSales.nonFuelSales === 'object')
    t.ok(typeof prevSales.fuelDefinitions === 'object')
    server.stop(t.end)
  })
})


test('PATCH /sale-non-fuel/{id} - add stock to current', t => {

  let prevSalesNonF = cloneDeep(prevSales.nonFuelSales[1])
  let curSalesNonF = cloneDeep(curSales.nonFuelSales[1])
  let productCost = curSalesNonF.productID.cost

  // add stock to existing if exist
  let newStock = reStock

  let qtyVals = {
    close: prevSalesNonF.qty.close - numSold + newStock,
    sales: productCost * numSold,
    sold:  numSold,
    stock: newStock
  }

  const opts = {
    method: 'PATCH',
    url: `/sale-non-fuel/${shiftRes[1]._id}`,
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


test('GET /sales/shiftSales - test current close', t => {
  const opts = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${stationID}&recordNum=${shiftRes[1].recordNum}&shiftID=${shiftRes[1]._id}`,
    headers
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    const res = resp.result
    curNFSaleQty1 = cloneDeep(res.nonFuelSales[1].qty)
    t.equal(curNFSaleQty1.close, (curNFSaleQty1.open - numSold + reStock), 'current close is accurate')
    server.stop(t.end)
  })
})

test('PATCH /sale-non-fuel/{id} - patch previous', t => {
  let prevSalesNonF = JSON.parse(JSON.stringify(prevSales.nonFuelSales[1]))
  // Not changeing anything, as test is to determine if values rolling forward after update are accurate
  let qtyVals = {
    close: prevSalesNonF.qty.close,
    sold:  prevSalesNonF.qty.sold
  }
  const opts = {
    method: 'PATCH',
    url: `/sale-non-fuel/${shiftRes[0]._id}`,
    headers,
    payload: {
      description:    'adjust non-fuel product',
      nonFuelSaleID:  prevSalesNonF._id,
      values: qtyVals
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    server.stop(t.end)
  })
})

test('GET /sales/shiftSales test current close after adjustment', t => {
  const opts2 = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${stationID}&recordNum=${shiftRes[1].recordNum}&shiftID=${shiftRes[1]._id}`,
    headers
  }
  server.inject(opts2, resp => {
    t.equal(resp.statusCode, 200)
    const res = resp.result
    let curNFSaleQty2 = cloneDeep(res.nonFuelSales[1].qty)
    t.equal(curNFSaleQty2.close, curNFSaleQty1.close, 'Close is equal after a previous patch')
    server.stop(t.end)
  })
})


// Use this if testing alone
test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})

