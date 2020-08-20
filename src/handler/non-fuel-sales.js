/* eslint-disable no-case-declarations, no-underscore-dangle */
import ramda from 'ramda'
import Boom from '@hapi/boom'

const sanz = require('mongo-sanitize')
const mongoose = require('mongoose')
const UtilHandler = require('./util')

const Journal = require('../model/journal')
const NonFuelSales = require('../model/non-fuel-sales')
const Sales = require('../model/sales')
const Station = require('../model/station')

const stationIsBobs = async (stationID) => {
  if (!stationID) {
    console.error('Missing stationID in stationIsBobs function') // eslint-disable-line no-console
    return false
  }
  try {
    const station = await Station.findById(stationID, { isBobs: 1 }).exec()
    return station.isBobs
  } catch (err) {
    return err
  }
}

const calculateTotals = async (docId) => {
  // Start with sales shift record
  let saleRec
  try {
    saleRec = await Sales.findById(docId).exec()
  } catch (error) {
    return Boom.badImplementation(error)
  }
  const { stationID, recordNum } = saleRec
  const { fuelDollar, fuelAdjust, otherFuelDollar } = saleRec.salesSummary

  // Fetch products total
  const ps = await NonFuelSales.aggregate([
    { $match: { stationID, recordNum } },
    { $group: { _id: 'pSales', sales: { $sum: '$sales' } } },
  ])
  const productSales = ps[0].sales

  // Mongo adds various keys, transforming to JSON first removes them
  const otherNonFuelTotal = Object.values(saleRec.otherNonFuel.toJSON()).reduce(
    (accum, val) => accum + val,
    0
  )

  const totalSales = parseFloat(
    otherFuelDollar + otherNonFuelTotal + productSales + fuelDollar + fuelAdjust
  )
  const fields = {
    'salesSummary.product': parseFloat(productSales),
    'salesSummary.totalNonFuel': parseFloat(otherNonFuelTotal + productSales),
    'salesSummary.totalSales': totalSales,
    'overshort.amount': parseFloat(saleRec.salesSummary.cashCCTotal - totalSales),
  }
  try {
    await Sales.findByIdAndUpdate(docId, fields)
  } catch (err) {
    throw new Error(err)
  }
  return true
}

function NonFuelSalesHandler() { }

NonFuelSalesHandler.prototype.updateMisc = async (request, h) => {
  const docId = sanz(request.params.id)
  const { items } = request.payload

  const fieldKeys = Object.keys(items)
  const fields = {}
  const calcs = {}

  fieldKeys.forEach((key) => {
    fields[key] = items[key].value
    if (items[key].calc) {
      const calcKey = key.replace('.', ':')
      calcs[calcKey] = items[key].calc
    }
  })
  if (Object.keys(calcs).length) {
    fields.meta = { calculations: calcs }
  }

  try {
    await Sales.findByIdAndUpdate(docId, fields).exec()
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
    return Boom.badImplementation(err)
  }

  await calculateTotals(docId)
  return h.response({ docId }).code(200)
}

NonFuelSalesHandler.prototype.updateProducts = async (request, h) => {
  const docId = sanz(request.params.id)
  const products = sanz(request.payload.products)

  await Promise.all(products.map(async (nf) => {
    const fields = {
      qty: nf.qty,
      sales: nf.sales,
    }
    try {
      await NonFuelSales.findByIdAndUpdate(nf.id, fields).exec()
    } catch (error) {
      return Boom.badImplementation(error)
    }
    return true
  }))

  await calculateTotals(docId)
  return h.response({ docId }).code(200)
}

NonFuelSalesHandler.prototype.patch = async (request, h) => {
  /*
    Steps:
    1. fetch sales record
    2. update and return nonFuelSale record
    3. update nonFuelSales total on sales record
    4. propagate open/close stock values for product
  */

  const utlHdlr = new UtilHandler()

  const salesID = sanz(request.params.id)
  const nonFuelSaleID = sanz(request.payload.nonFuelSaleID)
  const payVals = request.payload.values
  const description = sanz(request.payload.description)
  const productID = sanz(request.payload.productID)

  // Fetch original sales record
  let saleRec
  try {
    saleRec = await Sales.findById(salesID).exec()
  } catch (error) {
    return Boom.badImplementation(error)
  }

  const saleRecord = ramda.clone(saleRec._doc)
  const isBobs = await stationIsBobs(saleRecord.stationID)

  // Fetch original non-fuel-sales record
  let origNonFuelRec
  try {
    origNonFuelRec = await NonFuelSales.findById(nonFuelSaleID).exec()
  } catch (error) {
    return Boom.badImplementation(error)
  }

  // We are now making adjustment to the close value for either restock or sales
  const nonFuelUpdate = {
    'qty.close': Number(payVals.close),
  }
  // sold and sales values are adjusted when a 'Sold' or 'sales' type adjustment is made
  if (payVals.type === 'sales') {
    nonFuelUpdate['qty.sold'] = parseInt(payVals.sold, 10)
    nonFuelUpdate.sales = parseFloat(payVals.sales)
  // restock change adjusted
  } else if (payVals.type === 'stock') {
    nonFuelUpdate['qty.restock'] = Number(payVals.stock)
  }


  let nonFuelDoc
  try {
    nonFuelDoc = await NonFuelSales.findByIdAndUpdate(nonFuelSaleID, nonFuelUpdate, { new: true })
  } catch (error) {
    return Boom.badImplementation(error)
  }

  // Now aggregate the nonFuel products for the shift to get summary
  let nfs
  try {
    nfs = await NonFuelSales.aggregate([
      {
        $match: {
          stationID: mongoose.Types.ObjectId(saleRecord.stationID),
          recordNum: saleRecord.recordNum,
        },
      },
      {
        $group: {
          _id: '$recordNum',
          sales: { $sum: '$sales' },
        },
      },
    ])
  } catch (error) {
    return Boom.badImplementation(error)
  }

  const productTotal = nfs[0].sales

  // Create attendant nonFuel adjustment
  if (payVals.adjustAttend && payVals.adjustAttend.amount) {
    payVals.adjustAttend.productID = mongoose.Types.ObjectId(payVals.adjustAttend.productID)
    saleRecord.nonFuelAdjustVals.push(payVals.adjustAttend)
    saleRecord.nonFuelAdjustOS = saleRecord.nonFuelAdjustVals.map((a) => a.amount).reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    )
  }

  // Calculate new totals
  const otherNonFuelTotal = Object.keys(saleRecord.otherNonFuel)
    .map((k) => saleRecord.otherNonFuel[k] || 0)
    .reduce((accumulator, currentValue) => accumulator + currentValue, 0)

  const totalNonFuel = otherNonFuelTotal + productTotal

  let totalSales = totalNonFuel
    + saleRecord.salesSummary.fuelDollar
    + saleRecord.salesSummary.otherFuelDollar
    + saleRecord.salesSummary.fuelAdjust
  if (isBobs) {
    totalSales = totalSales
      + saleRecord.nonFuelAdjustOS
  }

  const newSS = {
    ...saleRecord.salesSummary,
    product: productTotal,
    totalNonFuel,
    totalSales,
  }

  // Now calculate over/short and update
  const os = newSS.cashCCTotal - newSS.totalSales
  const updateRec = {
    'overshort.amount': os,
    salesSummary: newSS,
  }

  if (payVals.adjustAttend) {
    updateRec.nonFuelAdjustOS = saleRecord.nonFuelAdjustOS
    updateRec.nonFuelAdjustVals = saleRecord.nonFuelAdjustVals
  }
  let updatedSaleRec
  try {
    updatedSaleRec = await Sales.findByIdAndUpdate(salesID, updateRec, { new: true }).exec()
  } catch (error) {
    return Boom.badImplementation(error)
  }

  // Roll forward opening and closing stock values
  let newClose = nonFuelDoc.qty.close
  const postSales = await NonFuelSales
    .find(
      {
        productID: nonFuelDoc.productID,
        recordNum: { $gt: saleRec.recordNum },
        stationID: saleRec.stationID,
      },
      { qty: 1 }
    )
    .sort({ recordNum: 1 })
    .exec()

  const ps = []
  if (postSales.length) {
    postSales.forEach((postSale) => {
      const postS = ramda.clone(postSale.toJSON())
      const restock = postS.qty.restock || 0
      if (postS.qty.sold === undefined) {
        postS.qty.sold = 0
      }
      const close = (newClose - postS.qty.sold + restock)
      postS.qty.open = newClose
      postS.qty.close = close

      newClose = close // Set value for next days` open
      const promise = NonFuelSales.updateOne({ _id: postS._id }, { qty: postS.qty })
      ps.push(promise)
    })
    if (ps.length > 0) {
      try {
        await Promise.all(ps)
      } catch (error) {
        return Boom.badRequest(error)
      }
    }
  }

  // Create Journal entry
  payVals.attendantID = mongoose.Types.ObjectId(saleRec.attendant.ID)
  const validatedPayVals = utlHdlr.validateValues(payVals, 'nonFuelSaleAdjust')
  const jRec = {
    adjustDate: new Date(),
    description,
    productID,
    productRecord: productID,
    quantities: {
      original: origNonFuelRec.qty,
      adjusted: nonFuelDoc.qty,
    },
    recordsAffected: {
      nonFuelID: mongoose.Types.ObjectId(nonFuelDoc.id),
      salesID: mongoose.Types.ObjectId(salesID),
      recordNum: saleRec.recordNum,
    },
    recordNum: saleRec.recordNum,
    stationID: mongoose.Types.ObjectId(saleRec.stationID),
    type: 'nonFuelSaleAdjust',
    values: validatedPayVals,
  }
  try {
    await Journal.create(jRec)
  } catch (error) {
    return Boom.badImplementation(error)
  }

  return h.response(updatedSaleRec)
}

module.exports = NonFuelSalesHandler
