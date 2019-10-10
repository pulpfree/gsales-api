/* eslint-disable no-underscore-dangle */
import Boom from '@hapi/boom'

const sanz = require('mongo-sanitize')
const mongoose = require('mongoose')
const FuelSales = require('../model/fuel-sales')
const Sales = require('../model/sales')
const Journal = require('../model/journal')


const calculateFuelSummary = async (recordNum, stationID) => {
  const findQuery = { recordNum, stationID }
  const totalFuelSales = { litres: 0, dollars: 0 }

  // Fetch record so we can combine sales.
  const sales = await Sales.findOne(findQuery, { salesSummary: 1, nonFuelAdjustOS: 1 })
  const nonFuelSales = sales.salesSummary.totalNonFuel || 0.00
  const otherFuelDollar = sales.salesSummary.otherFuelDollar || 0.00

  const fs = await FuelSales.aggregate([
    { $match: { stationID: mongoose.Types.ObjectId(stationID), recordNum } },
    { $group: { _id: '$gradeID', dollars: { $sum: '$dollars.net' }, litres: { $sum: '$litres.net' } } },
    { $sort: { _id: 1 } },
  ])

  const fuel = {}
  fs.forEach((f) => {
    fuel[`fuel_${f._id}`] = {
      dollar: f.dollars,
      litre: f.litres,
    }
    totalFuelSales.dollars += f.dollars
    totalFuelSales.litres += f.litres
  })

  const totalFuelDollarSales = parseFloat(totalFuelSales.dollars)
  const totalSales = parseFloat(totalFuelDollarSales
    + nonFuelSales
    + otherFuelDollar
    + sales.salesSummary.bobsFuelAdj)
  const update = {
    'salesSummary.fuelDollar': totalFuelDollarSales,
    'salesSummary.fuelLitre': parseFloat(totalFuelSales.litres),
    'salesSummary.totalSales': totalSales,
    'salesSummary.fuel': fuel,
    'overshort.amount': parseFloat(sales.salesSummary.cashCCTotal - totalSales),
  }

  try {
    const doc = await Sales.findOneAndUpdate(findQuery, update, { new: true }).populate('attendant.ID')
    return doc
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
    return Boom.badImplementation(err)
  }
}

function FuelSalesHandler() {}

FuelSalesHandler.prototype.updateAll = async (request, h) => {
  if (!request.payload.length > 0) {
    return Boom.expectationFailed('Missing fuel sales records')
  }

  const extractKeys = ['litres', 'dollars']
  const { recordNum } = request.payload[0]
  const { stationID } = request.payload[0]

  // Extract litres and dollars then set the litres for each fuel sale record
  const txs = []
  let fss
  request.payload.forEach((fs) => {
    if (fs.dollars.close || fs.litres.close) {
      const docId = fs.id
      const fuelSale = {}
      extractKeys.forEach((k) => {
        fuelSale[k] = fs[k]
      })
      fss = FuelSales.findByIdAndUpdate(docId, fuelSale).exec()
      txs.push(fss)
    }
  })
  await Promise.all(txs)

  let retCalc
  try {
    retCalc = await calculateFuelSummary(recordNum, stationID)
  } catch (err) {
    return Boom.badImplementation(err)
  }
  return h.response(retCalc).code(200)
}

FuelSalesHandler.prototype.adjustOpening = async (request, h) => {
  if (!request.payload.stationID) {
    return Boom.badRequest('Missing station id')
  }
  if (!request.payload.recordNum) {
    return Boom.badRequest('Missing recordNum')
  }
  if (!request.payload.dispenserID) {
    return Boom.badRequest('Missing dispenserID')
  }

  const values = sanz(request.payload.values)
  const stationID = mongoose.Types.ObjectId(request.payload.stationID)
  const dispenserID = mongoose.Types.ObjectId(request.payload.dispenserID)
  const { recordNum } = request.payload

  const curFuelDocFindQuery = {
    dispenserID,
    recordNum,
  }
  const prevFuelDocFindQuery = {
    dispenserID,
    recordNum: { $lt: recordNum },
  }

  const curFuelDoc = FuelSales.findOne(curFuelDocFindQuery)
  const prevFuelDoc = FuelSales.findOne(prevFuelDocFindQuery).sort({ recordNum: -1 })
  const curSaleDoc = Sales.findOne({ stationID, recordNum }, { fuelCosts: 1, recordNum: 1 })

  let fData
  try {
    fData = {
      curFuelDoc: await curFuelDoc,
      prevFuelDoc: await prevFuelDoc,
      curSaleDoc: await curSaleDoc,
    }
    fData.prevSaleDoc = await Sales.findOne(
      { stationID, recordNum: fData.prevFuelDoc.recordNum },
      { fuelCosts: 1 },
    )
  } catch (err) {
    return Boom.badImplementation(err)
  }

  let fuelCost = fData.prevSaleDoc.fuelCosts[`fuel_${fData.prevFuelDoc.gradeID}`]
  let netLitres = values.litres.adjust - fData.prevFuelDoc.litres.open
  let netDollars = values.dollars.adjust - fData.prevFuelDoc.dollars.open
  let theory = netLitres * fuelCost / 100
  let diff = theory - netDollars
  const prevRec = {
    dollars: {
      diff,
      close: values.dollars.adjust,
      open: fData.prevFuelDoc.dollars.open,
      net: netDollars,
      theoretical: theory,
    },
    litres: {
      close: values.litres.adjust,
      net: netLitres,
      open: fData.prevFuelDoc.litres.open,
    },
  }
  try {
    await FuelSales.updateOne(
      { _id: mongoose.Types.ObjectId(fData.prevFuelDoc.id) },
      prevRec,
    )
  } catch (err) {
    return Boom.badImplementation(err)
  }

  // Now update previous sales record
  try {
    await calculateFuelSummary(fData.prevFuelDoc.recordNum, stationID)
  } catch (err) {
    return Boom.badImplementation(err)
  }

  fuelCost = fData.curSaleDoc.fuelCosts[`fuel_${fData.curFuelDoc.gradeID}`]
  netLitres = fData.curFuelDoc.litres.close - values.litres.adjust
  netDollars = fData.curFuelDoc.dollars.close - values.dollars.adjust
  theory = netLitres * fuelCost / 100
  diff = theory - netDollars
  const curRec = {
    dollars: {
      diff: diff || 0.00,
      close: fData.curFuelDoc.dollars.close || 0.00,
      net: netDollars || 0.00,
      open: values.dollars.adjust,
      theoretical: theory || 0.00,
    },
    litres: {
      close: fData.curFuelDoc.litres.close || 0.00,
      net: netLitres || 0.00,
      open: values.litres.adjust,
    },
  }

  try {
    await FuelSales.updateOne({ _id: mongoose.Types.ObjectId(fData.curFuelDoc.id) }, curRec)
  } catch (err) {
    return Boom.badImplementation(err)
  }

  // Now create the journal entry record
  const jRec = {
    adjustDate: new Date(),
    description: values.description,
    recordsAffected: {
      prevFuelRec: mongoose.Types.ObjectId(fData.prevFuelDoc.id),
      curFuelRec: mongoose.Types.ObjectId(fData.curFuelDoc.id),
      prevSaleRec: mongoose.Types.ObjectId(fData.prevSaleDoc.id),
      curSaleRec: mongoose.Types.ObjectId(fData.curSaleDoc.id),
      prevRecordNum: fData.prevFuelDoc.recordNum,
      curRecordNum: fData.curSaleDoc.recordNum,
    },
    recordNum: fData.curSaleDoc.recordNum,
    stationID,
    type: 'fuelSaleAdjust',
    values,
  }
  try {
    await Journal.create(jRec)
  } catch (err) {
    return Boom.badImplementation(err)
  }

  const retVal = Object.assign({}, fData.curFuelDoc._doc, curRec)
  return h.response(retVal).code(200)
}

FuelSalesHandler.prototype.resetDispenser = async (request, h) => {
  if (!request.payload.stationID) {
    return Boom.badRequest('Missing station id')
  }
  if (!request.payload.dispenserID) {
    return Boom.badRequest('Missing dispenserID')
  }

  const values = sanz(request.payload.values)
  const stationID = mongoose.Types.ObjectId(request.payload.stationID)
  const dispenserID = mongoose.Types.ObjectId(request.payload.dispenserID)
  const { recordNum } = request.payload

  const findQuery = {
    dispenserID,
    recordNum,
  }

  const updateVals = {
    'dollars.open': parseFloat(values.dollars.adjust),
    'litres.open': parseFloat(values.litres.adjust),
  }
  try {
    await FuelSales.updateOne(findQuery, updateVals)
  } catch (err) {
    return Boom.badImplementation(err)
  }

  // Now create the journal entry record
  const jRec = {
    adjustDate: new Date(),
    description: values.description,
    recordsAffected: {
      dispenserID: mongoose.Types.ObjectId(dispenserID),
    },
    recordNum,
    stationID,
    type: 'dispenserReset',
    values,
  }
  try {
    await Journal.create(jRec)
  } catch (err) {
    return Boom.badImplementation(err)
  }

  return h.response({ success: 'OK' }).code(200)
}

module.exports = FuelSalesHandler
