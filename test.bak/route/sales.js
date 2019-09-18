'use strict'

const test = require('tape')
const mongoose = require('mongoose')
const server = require('../mock/server')
const co      = require('co')
const FuelSales = require('../../src/model/fuel-sales')
const Sales = require('../../src/model/sales')
const cloneDeep = require('lodash').cloneDeep

const headers = { authorization: 'Bearer 12345678'}
const stationID = '56cf1815982d82b0f3000001' // Bridge
const employeeID = '576d66c8d163240100d8b00a'
const dispenserID = '56e7593f982d82eeff262b96'

let curRecordNum = null
let curSales = null
let prevFuelDoc = null
let prevSaleDoc = null
let prevSales = null
let recordDate = null
let recordID = null
let shiftRes = null

// NODE_ENV=test ./node_modules/.bin/tape test/route/sales.js | ./node_modules/.bin/tap-spec

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

    recordDate = shiftRes.recordDate
    curRecordNum = shiftRes.recordNum
  })
})

// Now we should have a valid recordDate to create a new shift
test('POST /sale-shift - create new shift', t => {
  const corDate = correctedDate(recordDate)
  const reqDate = formatDate(corDate)

  const opts = {
    method: 'POST',
    url: '/sale-shift',
    headers,
    payload: {
      stationID,
      employeeID,
      date: reqDate
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 201)
    const res = resp.result
    recordID = res.id
    server.stop(t.end)
  })
})

// Enter data in new shift
test('PUT /fuel-sales prep of fuel sales', t => {

  let fuelRecords = []
  let totalSales  = {litres: 0, dollars: 0}

  // First create a set of records
  Sales.findById(recordID).exec().then(doc => {

    // Now each of the fuel sale records
    FuelSales.find({stationID, recordNum: doc.recordNum}).exec().then(docs => {
      docs.forEach(d => {
        d = JSON.parse(JSON.stringify(d))
        setFuel(doc.fuelCosts, d)
        fuelRecords.push(d)
        totalSales.litres   += d.litres.net
        totalSales.dollars  += d.dollars.net
      })

      const opts = {
        method: 'PUT',
        url: '/fuel-sales',
        headers,
        payload: fuelRecords
      }
      server.inject(opts, resp => {
        t.equal(resp.statusCode, 200)
        const res = resp.result
        t.equal(res.salesSummary.fuelLitre, totalSales.litres, 'total litres match')
        t.equal(res.salesSummary.fuelDollar, totalSales.dollars, 'total dollars match')
        server.stop(t.end)
      })
    })
  })
})

test('GET /fuel-sales fetch prev fuel sale', t => {

  let prevFuelDocFindQuery = {
    dispenserID,
    recordNum: curRecordNum
  }
  co(function*() {
    prevFuelDoc = yield FuelSales.findOne(prevFuelDocFindQuery).sort({recordNum: -1})
    prevSaleDoc = yield Sales.findOne({stationID, recordNum: prevFuelDoc.recordNum})

    const tt = prevSaleDoc.salesSummary.totalNonFuel + prevSaleDoc.salesSummary.otherFuelDollar + prevSaleDoc.salesSummary.fuelDollar
    t.equal(prevSaleDoc.salesSummary.totalSales, tt, 'prev total sales accurate')

    t.end()
  })
})

test('PUT /fuel-sales-opening adjust opening', t => {

  let openAdjustObj = {
    dispenserID,
    recordNum: null,
    stationID,
    values: {
      description: 'Test Adjustment',
      dollars: {
        adjust: null,
        open: null
      },
      litres: {
        adjust: null,
        open: null
      }
    }
  }

  Sales.findById(recordID).exec().then(salesDoc => {
    openAdjustObj.recordNum = salesDoc.recordNum

    FuelSales.findOne({dispenserID, recordNum: salesDoc.recordNum}).exec().then(fuelDoc => {

      openAdjustObj.values.dollars.open   = fuelDoc.dollars.open
      openAdjustObj.values.dollars.adjust = fuelDoc.dollars.open - 10

      openAdjustObj.values.litres.open    = fuelDoc.litres.open
      openAdjustObj.values.litres.adjust  = fuelDoc.litres.open - 10

      const opts = {
        method: 'PUT',
        url: '/fuel-sales-opening',
        headers,
        payload: openAdjustObj
      }
      server.inject(opts, resp => {
        t.equal(resp.statusCode, 200)
        const res = resp.result
        t.equal(res.dollars.open, openAdjustObj.values.dollars.adjust, 'open dollars match')
        t.equal(res.litres.open, openAdjustObj.values.litres.adjust, 'open litres match')
        server.stop(t.end)
      })
    })
  })
})

test('fuel-sales-opening prev compare', t => {

  co(function*() {
    let prevFuelDoc2, prevSaleDoc2

    let prevFuelDocFindQuery = {
      dispenserID:  dispenserID,
      recordNum:    curRecordNum
    }
    try {
      prevFuelDoc2  = yield FuelSales.findOne(prevFuelDocFindQuery).sort({recordNum: -1})
      prevSaleDoc2  = yield Sales.findOne({stationID, recordNum: prevFuelDoc2.recordNum}, {salesSummary: 1})
    } catch (err) {
      console.error(err) // eslint-disable-line no-console
    }

    t.equal(prevSaleDoc.salesSummary.fuel.fuel_1.dollar, (prevSaleDoc2.salesSummary.fuel.fuel_1.dollar + 10), 'prev fuel summary dollar equal')
    t.equal(prevSaleDoc.salesSummary.fuel.fuel_1.litre, (prevSaleDoc2.salesSummary.fuel.fuel_1.litre + 10), 'prev fuel summary litre equal')

    t.end()
  })
})

test('GET /sales/shiftSales fetch shift sales', t => {

  const opts = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${stationID}&recordNum=${curRecordNum}&shiftID=${recordID}`,
    headers
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    curSales = resp.result
    t.ok(typeof curSales.shift === 'object')
    t.ok(typeof curSales.fuelSales === 'object')
    t.ok(typeof curSales.nonFuelSales === 'object')
    t.ok(typeof curSales.fuelDefinitions === 'object')
  })

  const opts2 = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${prevSaleDoc.stationID}&recordNum=${prevSaleDoc.recordNum}&shiftID=${prevSaleDoc._id}`,
    headers
  }
  server.inject(opts2, resp => {
    t.equal(resp.statusCode, 200)
    prevSales = resp.result
    t.ok(typeof prevSales.shift === 'object')
    t.ok(typeof prevSales.fuelSales === 'object')
    t.ok(typeof prevSales.nonFuelSales === 'object')
    t.ok(typeof prevSales.fuelDefinitions === 'object')
    server.stop(t.end)
  })
})

// Unfinished
/*test('PUT /sale/{id} updateNonFuelSales method', t => {
  // console.log('shift:', shift)

  // let shiftD = JSON.parse(JSON.stringify(shift))
  t.end()
})*/

test('PATCH /sale-summary/{id} creditCard adjustment', t => {
  let s = JSON.parse(JSON.stringify(prevSales.shift))
  s.id = s._id
  delete s._id

  let adjust = 10.50
  let adjustValue = s.creditCard.visa + adjust

  const opts = {
    method: 'PATCH',
    url: `/sale-summary/${s.id}`,
    headers,
    payload: {
      adjustment: {
        adjustValue,
        description: 'test adjust creditcard',
        field: 'creditCard.visa'
      },
      shift: s
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    const res = resp.result
    t.equal(res.creditCard.visa, adjustValue, 'visa adjustment matches')
    t.equal(res.salesSummary.creditCardTotal, (s.salesSummary.creditCardTotal + adjust), 'creditCardTotal matches')
    t.equal(res.salesSummary.cashCCTotal, (s.salesSummary.cashCCTotal + adjust), 'cashCCTotal matches')
    server.stop(t.end)
  })
})

test('GET /sales/shiftSales fetch prev shift', t => {

  const opts2 = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${prevSaleDoc.stationID}&recordNum=${prevSaleDoc.recordNum}&shiftID=${prevSaleDoc._id}`,
    headers
  }
  server.inject(opts2, resp => {
    t.equal(resp.statusCode, 200)
    prevSales = cloneDeep(resp.result)
    t.ok(typeof prevSales.shift === 'object')
    server.stop(t.end)
  })
})

test('PATCH /sale-summary/{id} cash adjustment', t => {
  let s = JSON.parse(JSON.stringify(prevSales.shift))
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

test('GET /sales/shiftSales fetch prev shift', t => {
  const opts2 = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${prevSaleDoc.stationID}&recordNum=${prevSaleDoc.recordNum}&shiftID=${prevSaleDoc._id}`,
    headers
  }
  server.inject(opts2, resp => {
    t.equal(resp.statusCode, 200)
    prevSales = cloneDeep(resp.result)
    t.ok(typeof prevSales.shift === 'object')
    server.stop(t.end)
  })
})

test('PATCH /sale-summary/{id} otherNonFuelBobs adjustment', t => {
  let s = JSON.parse(JSON.stringify(prevSales.shift))
  s.id = s._id
  delete s._id

  let adjust = 20.50
  let adjustValue = s.otherNonFuelBobs.bobsGiftCerts + adjust

  const opts = {
    method: 'PATCH',
    url: `/sale-summary/${s.id}`,
    headers,
    payload: {
      adjustment: {
        adjustValue,
        description: 'test otherNonFuelBobs ',
        field: 'otherNonFuelBobs.bobsGiftCerts'
      },
      shift: s
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    const res = resp.result
    t.equal(res.otherNonFuelBobs.bobsGiftCerts, adjustValue, 'otherNonFuelBobs.bobsGiftCerts adjustment matches')
    server.stop(t.end)
  })
})

test('GET /sales/shiftSales fetch prev shift', t => {
  const opts2 = {
    method: 'GET',
    url: `/sales/shiftSales?stationID=${prevSaleDoc.stationID}&recordNum=${prevSaleDoc.recordNum}&shiftID=${prevSaleDoc._id}`,
    headers
  }
  server.inject(opts2, resp => {
    t.equal(resp.statusCode, 200)
    prevSales = cloneDeep(resp.result)
    t.ok(typeof prevSales.shift === 'object')
    server.stop(t.end)
  })
})

test('PATCH /sale-non-fuel/{id} patchNonFuel', t => {
  let p = JSON.parse(JSON.stringify(prevSales.nonFuelSales[0]))
  let s = JSON.parse(JSON.stringify(prevSales.shift))
  s.id = s._id
  p.id = p._id
  delete s._id, p._id

  const stock = 10
  const sold = 5
  const soldAmount = sold * p.productID.cost
  const productStock = p.qty.stock + stock
  const productSold = p.qty.sold + sold
  const opts = {
    method: 'PATCH',
    url: `/sale-non-fuel/${prevSaleDoc._id}`,
    headers,
    payload: {
      description:    'adjust non-fuel product',
      nonFuelSaleID:  p.id,
      values: {
        close:  p.qty.open + productStock - productSold,
        sales:  productSold * p.productID.cost,
        sold:   productSold,
        stock:  productStock
      }
    }
  }
  server.inject(opts, resp => {
    t.equal(resp.statusCode, 200)
    const res = resp.result
    t.equal((res.salesSummary.product - s.salesSummary.product), soldAmount, 'product sales match')
    t.equal((res.salesSummary.totalSales - s.salesSummary.totalSales), soldAmount, 'totalSales sales match')
    server.stop(t.end)
  })
})


// **** Utilities **** //

function formatDate(date) {
  let fdt = {}
  let dt = new Date(date)
  fdt.year = dt.getFullYear()
  fdt.mon = String('00' + (dt.getMonth() + 1)).slice(-2)
  fdt.day = String('00' + dt.getDate()).slice(-2)
  return `${fdt.year}-${fdt.mon}-${fdt.day}`
}

function correctedDate(date) {
  return new Date(date.getTime() + (60000*(date.getTimezoneOffset())))
}

function setFuel(fuelCosts, fuelRecord, ltr = 10) {
  const fuelCost = fuelCosts[`fuel_${fuelRecord.gradeID}`] / 100
  fuelRecord.litres.close = fuelRecord.litres.open + ltr
  fuelRecord.litres.net = fuelRecord.litres.close - fuelRecord.litres.open
  const fuelDlr = fuelCost * ltr
  fuelRecord.dollars.close = fuelRecord.dollars.open + fuelDlr
  fuelRecord.dollars.net = fuelRecord.dollars.close - fuelRecord.dollars.open
  fuelRecord.id = fuelRecord._id
  delete fuelRecord._id
}

// Use this if testing alone
test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})
