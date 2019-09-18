'use strict'

const test = require('tape')
const UtilHandler = require('../../src/handler/util')
const u = new UtilHandler()

test('simple equality', t => {

  const vals = {
    adjust: -1,
    adjustAttend: {
      amount: '25.24',
      comments: 'bb',
      productID: '56cf4bfe982d82b41d00000f',
      productName: 'Cigs #2' },
    close: '148',
    sales: '23.50',
    sold: 0,
    stock: '10',
    type: 'stock',
    attendantID: '5733c671982d828347021f02',
  }
  const vVals = u.validateValues(vals, 'nonFuelSaleAdjust')

  t.notDeepEqual(vals, vVals, 'objects are not equal')
  t.equal(vals.adjust, vVals.adjust)
  t.end()
})
