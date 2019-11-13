/* eslint-disable no-underscore-dangle, no-case-declarations */
import ramda from 'ramda'
import Boom from '@hapi/boom'

import {
  HST_DIVISOR,
  MAX_NUM_RECORDS,
  PROPANE_DISPENSER_ID,
} from '../constants'
import { cleanInput } from '../utils'

const sanz = require('mongo-sanitize')
const mongoose = require('mongoose')
const moment = require('moment')

const FuelDefinition = require('../model/fuel-definition')
const FuelSales = require('../model/fuel-sales')
const Journal = require('../model/journal')
const NonFuelSales = require('../model/non-fuel-sales')
const Product = require('../model/product')
const Sales = require('../model/sales')
const Station = require('../model/station')

// const util = require('util')

function ReportHandler() {}

ReportHandler.prototype.attendant = async (request, h) => {
  const {
    employeeID,
    reportID,
    startYear,
  } = cleanInput(request.query)
  if (!employeeID) {
    return Boom.badRequest('Missing employee id parameter')
  }
  if (!reportID) {
    return Boom.badRequest('Missing reportID parameter')
  }
  if (!startYear) {
    return Boom.badRequest('Missing startYear parameter')
  }

  const dateKeys = ['startYear', 'startMonth', 'endYear', 'endMonth']
  const qDates = {}

  dateKeys.forEach((k) => {
    if (request.query[k]) {
      if (k.indexOf('Month') > 0) {
        qDates[k] = String(`00${Number(request.query[k]) + 1}`).slice(-2)
      } else {
        qDates[k] = sanz(request.query[k])
      }
    }
  })

  const q = {
    'attendant.ID': mongoose.Types.ObjectId(employeeID),
  }
  let sDte; let
    eDte

  if (qDates.startYear && qDates.startMonth && qDates.endYear && qDates.endMonth) {
    sDte = moment.utc(`${qDates.startYear}-${qDates.startMonth}`)
    eDte = moment.utc(`${qDates.endYear}-${qDates.endMonth}`).endOf('month')
  } else if (qDates.startYear && qDates.endYear) {
    sDte = moment.utc(`${qDates.startYear}-01`)
    eDte = moment.utc(`${qDates.endYear}-12`).endOf('year')
  } else if (qDates.startYear && qDates.startMonth && qDates.endMonth) {
    sDte = moment.utc(`${qDates.startYear}-${qDates.startMonth}`)
    eDte = moment.utc(`${qDates.startYear}-${qDates.endMonth}`).endOf('month')
  } else if (qDates.startYear && qDates.startMonth) {
    sDte = moment.utc(`${qDates.startYear}-${qDates.startMonth}`)
    eDte = sDte.clone().endOf('month')
  } else {
    sDte = moment.utc(`${qDates.startYear}-01`)
    eDte = sDte.clone().endOf('year')
  }

  q.recordDate = { $gte: sDte.format(), $lte: eDte.format() }

  const fields = {
    attendant: 1,
    stationID: 1,
    overshort: 1,
    recordDate: 1,
    recordNum: 1,
    salesSummary: 1,
  }

  const dataRet = {
    id: reportID,
    meta: {
      startDate: sDte.format(),
      endDate: eDte.format(),
    },
    records: null,
  }
  // console.log(util.inspect(q, {showHidden: false, depth: null}))
  let sales
  try {
    sales = await Sales
      .find(q, fields)
      .limit(MAX_NUM_RECORDS)
      .sort({ recordNum: 1 })
      .populate('stationID')
  } catch (err) {
    return Boom.badRequest(err)
  }

  dataRet.records = sales
  const recordLength = sales.length
  dataRet.meta.recordLength = recordLength
  if (recordLength >= MAX_NUM_RECORDS) {
    dataRet.meta.maxLength = MAX_NUM_RECORDS
    dataRet.meta.maxLengthExceeded = true
  }
  return h.response(dataRet)
}

ReportHandler.prototype.monthlySales = async (request, h) => {
  const {
    date,
    reportID,
  } = cleanInput(request.query)
  if (!date) {
    return Boom.badRequest('Missing date parameter')
  }
  if (!reportID) {
    return Boom.badRequest('Missing reportID parameter')
  }

  const sDte = moment.utc(date)
  const eDte = sDte.clone().endOf('month')

  let salesData
  let stations
  const stationData = []

  try {
    stations = await Station.find({}, { name: 1 }).sort({ name: 1 })
  } catch (err) {
    return Boom.badRequest(err)
  }

  try {
    salesData = await Sales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $group: {
          _id: '$stationID',
          'sales-fuelDollar': { $sum: '$salesSummary.fuelDollar' },
          'sales-nonFuel': { $sum: '$salesSummary.totalNonFuel' },
          'sales-cash': { $sum: '$salesSummary.cashTotal' },
          'sales-creditCard': { $sum: '$salesSummary.creditCardTotal' },
          'sales-cashAndCards': { $sum: '$salesSummary.cashCCTotal' },
          'sales-totalSales': { $sum: '$salesSummary.totalSales' },
          overshort: { $sum: '$overshort.amount' },
          fuel1Avg: { $avg: '$fuelCosts.fuel_1' },
        },
      },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  // Need to find the station name, we could create a more complex aggregate but we still need
  // to modify data
  //
  // Because there are stations that may not have data for the specified date range
  // we eliminate any stations without sales data
  stations.forEach((station) => {
    const sData = salesData.find((sd) => sd._id.toString() === station._id.toString())
    if (sData) {
      sData.stationName = station.name
      sData['sales-fuelDollar-NoHST'] = sData['sales-fuelDollar'] / HST_DIVISOR
      sData['sales-fuelDollar-HST'] = sData['sales-fuelDollar'] - sData['sales-fuelDollar-NoHST']
      stationData.push(sData)
    }
  })

  const dataRet = {
    id: reportID,
    meta: {
      date,
    },
    records: stationData,
  }

  return h.response(dataRet)
}

ReportHandler.prototype.monthlyCash = async (request, h) => {
  if (!request.query.date) {
    return Boom.badRequest('Missing date')
  }

  const sDte = moment.utc(request.query.date)
  const eDte = sDte.clone().endOf('month')
  let data

  try {
    data = await Sales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $group: {
          _id: 'cash',
          'cash-bills': { $sum: '$cash.bills' },
          'cash-debit': { $sum: '$cash.debit' },
          'cash-dieselDiscount': { $sum: '$cash.dieselDiscount' },
          'cash-giftCertRedeem': { $sum: '$cash.giftCertRedeem' },
          'cash-galesLoyaltyRedeem': { $sum: '$cash.galesLoyaltyRedeem' },
          'cash-driveOffNSF': { $sum: '$cash.driveOffNSF' },
          'cash-other': { $sum: '$cash.other' },
          'cash-lotteryPayout': { $sum: '$cash.lotteryPayout' },
          'cash-payout': { $sum: '$cash.payout' },
          'cash-osAdjusted': { $sum: '$cash.osAdjusted' },
          'cash-writeOff': { $sum: '$cash.writeOff' },
          'creditCard-amex': { $sum: '$creditCard.amex' },
          'creditCard-discover': { $sum: '$creditCard.discover' },
          'creditCard-gales': { $sum: '$creditCard.gales' },
          'creditCard-mc': { $sum: '$creditCard.mc' },
          'creditCard-visa': { $sum: '$creditCard.visa' },
          'sales-cash': { $sum: '$salesSummary.cashTotal' },
          'sales-creditCard': { $sum: '$salesSummary.creditCardTotal' },
          'sales-cashAndCards': { $sum: '$salesSummary.cashCCTotal' },
        },
      },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  const dataRet = {
    id: 'cash',
    result: data[0],
  }
  return h.response(dataRet)
}

ReportHandler.prototype.monthlyFuel = async (request, h) => {
  if (!request.query.date) {
    return Boom.badRequest('Missing date')
  }

  const sDte = moment.utc(request.query.date)
  const eDte = sDte.clone().endOf('month')
  let data

  let grades

  try {
    grades = await FuelDefinition.find()
  } catch (err) {
    return Boom.badRequest(err)
  }

  try {
    data = await FuelSales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $group: {
          _id: '$gradeID',
          'dollars-diff': { $sum: '$dollars.diff' },
          'dollars-theoretical': { $sum: '$dollars.theoretical' },
          'dollars-net': { $sum: '$dollars.net' },
          'litres-net': { $sum: '$litres.net' },
        },
      },
      { $sort: { _id: 1 } },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  const gs = {}
  grades.forEach((g) => { gs[g._id] = g.label })

  // Calculate HST
  data = data.map((d) => {
    const dup = ramda.clone(d)
    dup['dollars-net-NoHST'] = dup['dollars-net'] / HST_DIVISOR
    dup['dollars-net-HST'] = dup['dollars-net'] - dup['dollars-net-NoHST']
    return dup
  })

  const dataRet = {
    id: 'fuel',
    meta: {
      grades: gs,
    },
    result: data,
  }
  return h.response(dataRet)
}

ReportHandler.prototype.monthlyNonFuel = async (request, h) => {
  if (!request.query.date) {
    return Boom.badRequest('Missing date')
  }

  const sDte = moment.utc(request.query.date)
  const eDte = sDte.clone().endOf('month')
  let data

  try {
    data = await NonFuelSales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $lookup: {
          from: 'products', localField: 'productID', foreignField: '_id', as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          qty: { $sum: '$qty.sold' },
          sales: { $sum: '$sales' },
        },
      },
      { $sort: { 'product.category': 1 } },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  // Now fetch 'other' nonFuel
  let otherNonFuel
  try {
    otherNonFuel = await Sales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $group: {
          _id: 'otherNonFuel',
          giftCerts: { $sum: '$otherNonFuel.giftCerts' },
          bobs: { $sum: '$otherNonFuel.bobs' },
          payout: { $sum: '$cash.payout' },
          lotteryPayout: { $sum: '$cash.lotteryPayout' },
        },
      },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  const other = {}
  otherNonFuel.forEach((o) => {
    other._id = 'otherNonFuel'
    other.giftCerts = o.giftCerts
    other.bobs = o.bobs
    other.payout = o.payout
    other.lotteryPayout = o.lotteryPayout
  })
  const ret = {
    nonFuel: data,
    otherNonFuel: other,
  }

  const dataRet = {
    id: 'nonFuel',
    result: ret,
  }
  return h.response(dataRet)
}

ReportHandler.prototype.monthlyStation = async (request, h) => {
  if (!request.query.date) {
    return Boom.badRequest('Missing date')
  }
  if (!request.query.stationID) {
    return Boom.badRequest('Missing stationID')
  }
  const { date } = request.query
  const stationID = mongoose.Types.ObjectId(request.query.stationID)

  const sDte = moment.utc(date)
  const eDte = sDte.clone().endOf('month')

  let data
  let stationName
  try {
    const st = await Station.findById(stationID, { name: 1 }).exec()
    stationName = st.name
  } catch (err) {
    return Boom.badRequest(err)
  }

  try {
    data = await Sales.aggregate([
      { $match: { stationID, recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $group: {
          _id: null,
          'cash-bills': { $sum: '$cash.bills' },
          'cash-debit': { $sum: '$cash.debit' },
          'cash-dieselDiscount': { $sum: '$cash.dieselDiscount' },
          'cash-giftCertRedeem': { $sum: '$cash.giftCertRedeem' },
          'cash-driveOffNSF': { $sum: '$cash.driveOffNSF' },
          'cash-other': { $sum: '$cash.other' },
          'cash-payout': { $sum: '$cash.payout' },
          'cash-lotteryPayout': { $sum: '$cash.lotteryPayout' },
          'creditCard-amex': { $sum: '$creditCard.amex' },
          'creditCard-discover': { $sum: '$creditCard.discover' },
          'creditCard-gales': { $sum: '$creditCard.gales' },
          'creditCard-mc': { $sum: '$creditCard.mc' },
          'creditCard-visa': { $sum: '$creditCard.visa' },
          'sales-fuelDollar': { $sum: '$salesSummary.fuelDollar' },
          'sales-nonFuel': { $sum: '$salesSummary.totalNonFuel' },
          'sales-cash': { $sum: '$salesSummary.cashTotal' },
          'sales-creditCard': { $sum: '$salesSummary.creditCardTotal' },
          'sales-cashAndCards': { $sum: '$salesSummary.cashCCTotal' },
          'sales-product': { $sum: '$salesSummary.product' },
          'sales-totalSales': { $sum: '$salesSummary.totalSales' },
          osAdjust: { $sum: '$cash.osAdjust' },
          overshort: { $sum: '$overshort.amount' },
          'otherNonFuel-giftCerts': { $sum: '$otherNonFuel.giftCerts' },
          'otherNonFuelBobs-giftCerts': { $sum: '$otherNonFuelBobs.bobsGiftCerts' },
          'otherNonFuel-bobs': { $sum: '$otherNonFuel.bobs' },
          otherFuelPropaneDollar: { $sum: '$otherFuel.propane.dollar' },
          otherFuelPropaneLitre: { $sum: '$otherFuel.propane.litre' },
          fuel1Avg: { $avg: '$fuelCosts.fuel_1' },
        },
      },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  // Now product categories
  let prodCat
  try {
    prodCat = await NonFuelSales.aggregate([
      { $match: { stationID, recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $lookup: {
          from: 'products', localField: 'productID', foreignField: '_id', as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          qty: { $sum: '$qty.sold' },
          sales: { $sum: '$sales' },
        },
      },
      { $sort: { _id: 1 } },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  const dRet = data[0]
  const productCats = prodCat.map((p) => ({ category: p._id, qty: p.qty, sales: p.sales }))
  dRet.productCats = productCats

  // report1 products
  let nf
  try {
    nf = await NonFuelSales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() }, stationID } },
      {
        $lookup: {
          from: 'products', localField: 'productID', foreignField: '_id', as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.type': 'report1' } },
      {
        $group: {
          _id: { id: '$product._id', name: '$product.name' },
          qty: { $sum: '$qty.sold' },
        },
      },
    ])
    if (nf.length > 0) {
      const report1 = nf.map((n) => ({ id: n._id.id, name: n._id.name, qty: n.qty }))
      report1.sort((a, b) => {
        if (a.name > b.name) { return 1 }
        if (a.name < b.name) { return -1 }
        return 0
      })
      dRet.report1 = report1
    }
  } catch (err) {
    return Boom.badRequest(err)
  }

  const dataRet = {
    id: 'station',
    meta: {
      stationName,
    },
    result: dRet,
  }
  return h.response(dataRet)
}

ReportHandler.prototype.monthlyStationSummary = async (request, h) => {
  if (!request.query.date) {
    return Boom.badRequest('Missing date')
  }

  const sDte = moment.utc(request.query.date)
  const eDte = sDte.clone().endOf('month')

  const salesRes = []
  // const dataRet
  let fuelData
  let oilData
  let salesData
  let stations

  try {
    stations = await Station.find({}, { name: 1 }).sort({ name: 1 })
  } catch (err) {
    return Boom.badRequest(err)
  }

  try {
    salesData = await Sales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $group: {
          _id: '$stationID',
          'cash-payout': { $sum: '$cash.payout' },
          'otherNonFuel-bobs': { $sum: '$otherNonFuel.bobs' },
        },
      },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  try {
    oilData = await NonFuelSales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
      {
        $lookup: {
          from: 'products', localField: 'productID', foreignField: '_id', as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.category': 'oil' } },
      {
        $group: {
          _id: '$stationID',
          sold: { $sum: '$qty.sold' },
        },
      },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  try {
    fuelData = await FuelSales.aggregate([
      {
        $match: {
          recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() },
          dispenserID: PROPANE_DISPENSER_ID,
        },
      },
      {
        $group: {
          _id: '$stationID',
          litres: { $sum: '$litres.net' },
          dollars: { $sum: '$dollars.net' },
        },
      },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }

  salesData.forEach((sd) => {
    const saleData = ramda.clone(sd)
    const station = stations.find((s) => saleData._id.toString() === s._id.toString())
    saleData.stationName = station.name
    saleData.oil = null
    saleData.propane = null

    const oilD = oilData.find((o) => o._id.toString() === saleData._id.toString())
    if (oilD !== undefined) {
      saleData.oil = oilD.sold
    }
    // Set propane on Thorold Stone Back
    if (saleData._id.toString() === fuelData[0]._id.toString()) {
      [saleData.propane] = fuelData
    }
    salesRes.push(saleData)
  })

  salesRes.sort((a, b) => {
    if (a.stationName > b.stationName) {
      return 1
    }
    if (a.stationName < b.stationName) {
      return -1
    }
    return 0
  })

  const dataRet = {
    id: 'stationSum',
    meta: {},
    result: salesRes,
  }
  return h.response(dataRet)
}

ReportHandler.prototype.shifts = async (request, h) => {
  const {
    endDate,
    reportID,
    startDate,
    stationID,
  } = cleanInput(request.query)
  if (!reportID) {
    return Boom.badRequest('Missing reportID parameter')
  }
  if (!startDate) {
    return Boom.badRequest('Missing start date parameter')
  }

  let eDte
  const q = {}
  if (endDate) {
    eDte = moment.utc(endDate)
  }
  const sDte = moment.utc(startDate)

  if (sDte && eDte) {
    q.recordDate = { $gte: sDte.format(), $lte: eDte.format() }
  } else {
    q.recordDate = { $gte: sDte.format() }
  }
  if (stationID) {
    q.stationID = mongoose.Types.ObjectId(stationID)
  }

  const fields = {
    attendant: 1,
    recordDate: 1,
    recordNum: 1,
    'shift.number': 1,
    salesSummary: 1,
    stationID: 1,
    overshort: 1,
    'otherNonFuel.giftCerts': 1,
  }

  const dataRet = {
    id: reportID,
    meta: {
      dates: {
        startDate: sDte,
        endDate: eDte,
      },
      stationID,
    },
    records: null,
  }

  let items
  try {
    items = await Sales.find(q, fields)
      .populate(['attendant.ID', 'stationID'])
      .sort({ stationID: 1, recordNum: 1 })
      .limit(MAX_NUM_RECORDS)
  } catch (err) {
    return Boom.badRequest(err)
  }

  dataRet.records = items
  const recordLength = items.length
  dataRet.meta.recordLength = recordLength
  if (recordLength >= MAX_NUM_RECORDS) {
    dataRet.meta.maxLength = MAX_NUM_RECORDS
    dataRet.meta.maxLengthExceeded = true
  }
  return h.response(dataRet)
}

ReportHandler.prototype.shiftHistory = async (request, h) => {
  const {
    endDate,
    reportID,
    startDate,
    stationID,
  } = cleanInput(request.query)
  if (!reportID) {
    return Boom.badRequest('Missing reportID parameter')
  }
  if (!startDate) {
    return Boom.badRequest('Missing start date parameter')
  }
  if (!stationID) {
    return Boom.badRequest('Missing station id parameter')
  }

  let eDte
  const q = {}
  const sDte = moment.utc(startDate)
  if (endDate) {
    eDte = moment.utc(sanz(endDate))
  }

  if (sDte && eDte) {
    q.recordDate = { $gte: sDte.format(), $lte: eDte.format() }
  } else {
    q.recordDate = { $gte: sDte.format() }
  }
  q.stationID = mongoose.Types.ObjectId(stationID)

  const fields = {
    otherNonFuel: 1,
    overshort: 1,
    salesSummary: 1,
    'shift.number': 1,
    stationID: 1,
    attendant: 1,
    cash: 1,
    creditCard: 1,
    recordDate: 1,
    recordNum: 1,
  }

  const dataRet = {
    id: 'shift-history',
    meta: {
      dates: {
        startDate: sDte,
        endDate: eDte,
        stationID,
      },
    },
    records: null,
  }

  let items
  try {
    items = await Sales.find(q, fields)
      .populate('attendant.ID')
      .sort({ recordNum: -1 })
      .limit(MAX_NUM_RECORDS)
  } catch (err) {
    return Boom.badRequest(err)
  }

  dataRet.records = items
  const recordLength = items.length
  dataRet.meta.recordLength = recordLength
  if (recordLength >= MAX_NUM_RECORDS) {
    dataRet.meta.maxLength = MAX_NUM_RECORDS
    dataRet.meta.maxLengthExceeded = true
  }
  return h.response(dataRet)
}

ReportHandler.prototype.shift = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing shift id')
  }
  const shiftID = sanz(request.params.id)

  try {
    const saleItems = await Sales.findById(shiftID)
      .populate(['attendant.ID', 'stationID'])

    const dataRet = {
      id: 'shift-detail',
      meta: {
        shiftID,
      },
      result: saleItems,
    }
    return h.response(dataRet)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

ReportHandler.prototype.productSales = async (request, h) => {
  const {
    date,
    reportID,
    stationID: station,
  } = cleanInput(request.query)
  if (!date) {
    return Boom.badRequest('Missing date parameter')
  }
  if (!reportID) {
    return Boom.badRequest('Missing reportID parameter')
  }
  if (!station) {
    return Boom.badRequest('Missing stationID parameter')
  }

  const sDte = moment.utc(date)
  const eDte = sDte.clone().endOf('month')
  const stationID = mongoose.Types.ObjectId(station)
  const endDate = eDte.clone().startOf('day')

  let data
  let closeRecords
  let openRecords
  let flags = {}

  try {
    data = await NonFuelSales.aggregate([
      { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() }, stationID } },
      {
        $lookup: {
          from: 'products', localField: 'productID', foreignField: '_id', as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: { id: '$product._id', category: '$product.category', name: '$product.name' },
          restock: { $sum: '$qty.restock' },
          sales: { $sum: '$sales' },
          sold: { $sum: '$qty.sold' },
        },
      },
      { $sort: { '_id.category': 1, '_id.name': 1 } },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }
  // console.log(util.inspect(data, {showHidden: false, depth: null}))

  // Now fetch opening and closing stock values
  try {
    openRecords = await NonFuelSales
      .find({ recordDate: sDte.toDate(), stationID })
      .sort({ productID: 1, recordNum: 1 })
  } catch (err) {
    return Boom.badRequest(err)
  }
  try {
    closeRecords = await NonFuelSales
      .find({ recordDate: { $gte: sDte.toDate(), $lte: endDate.toDate() }, stationID })
      .sort({ productID: 1, recordNum: -1 })
  } catch (err) {
    return Boom.badRequest(err)
  }

  // filter unique products
  flags = {}
  const open = openRecords.filter((entry) => {
    if (flags[entry.productID]) {
      return false
    }
    flags[entry.productID] = true
    return true
  })

  flags = {}
  const close = closeRecords.filter((entry) => {
    if (flags[entry.productID]) {
      return false
    }
    flags[entry.productID] = true
    return true
  })

  const records = await data.map((r) => {
    const record = ramda.clone(r)
    // Set opening stock
    let openEle = open.find((o) => {
      if (o.productID.toString() === record._id.id.toString()) {
        return o
      }
      return false
    })
    // This next case is when a new product is added after the 1st of the month
    // and we need an opening value
    if (!openEle) {
      openEle = { qty: { open: 0 } }
    }
    record.openStock = openEle.qty.open
    // Set closing stock
    const closeEle = close.find((o) => {
      if (o.productID.toString() === record._id.id.toString()) {
        return o
      }
      return null
    })
    record.closeStock = closeEle.qty.close
    // Now balance should be zero
    record.balance = record.openStock + record.restock - record.sold - record.closeStock
    record.id = record._id.id.toString()
    record.category = record._id.category
    record.name = record._id.name
    delete record._id
    return record
  })

  const dataRet = {
    id: reportID,
    meta: {
      dates: {
        startDate: sDte,
        endDate: eDte,
      },
      stationID,
    },
    records,
  }
  const recordLength = records.length
  dataRet.meta.recordLength = recordLength
  // As we're limited to only 1 months records, unlikely we need to deal with exceeding max length
  if (recordLength >= MAX_NUM_RECORDS) {
    dataRet.meta.maxLength = MAX_NUM_RECORDS
    dataRet.meta.maxLengthExceeded = true
  }

  return h.response(dataRet)
}

ReportHandler.prototype.productSalesAdjust = async (request, h) => {
  const {
    date,
    reportID,
    stationID: station,
  } = cleanInput(request.query)
  if (!date) {
    return Boom.badRequest('Missing date parameter')
  }
  if (!reportID) {
    return Boom.badRequest('Missing reportID parameter')
  }
  if (!station) {
    return Boom.badRequest('Missing stationID parameter')
  }

  const sDte = moment.utc(request.query.date)
  const eDte = sDte.clone().add({ months: 1 })
  const stationID = mongoose.Types.ObjectId(station)

  const q = [
    {
      $match: {
        type: 'nonFuelSaleAdjust',
        'recordsAffected.recordNum': {
          $gte: sDte.format('YYYY-MM-DD'),
          $lt: eDte.format('YYYY-MM-DD'),
        },
        stationID,
      },
    },
    {
      $lookup: {
        from: 'products', localField: 'productRecord', foreignField: '_id', as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: { id: '$productID', name: '$product.name' },
        qty: { $sum: 1 },
        adjust: { $sum: { $abs: '$values.adjust' } },
      },
    },
    { $sort: { '_id.name': 1 } },
  ]
  // console.log(util.inspect(q, {showHidden: false, depth: null}))

  let records
  try {
    records = await Journal.aggregate(q)
  } catch (err) {
    return Boom.badRequest(err)
  }

  const dataRet = {
    id: reportID,
    meta: {
      dates: {
        startDate: sDte,
        endDate: eDte,
      },
      stationID,
      recordLength: records.length,
    },
    records,
  }
  return h.response(dataRet)
}

ReportHandler.prototype.oilProductSales = async (request, h) => {
  const {
    date,
    reportID,
    stationID: station,
  } = cleanInput(request.query)
  if (!date) {
    return Boom.badRequest('Missing date parameter')
  }
  if (!reportID) {
    return Boom.badRequest('Missing reportID parameter')
  }
  if (!station) {
    return Boom.badRequest('Missing stationID parameter')
  }

  const sDte = moment.utc(date)
  const eDte = sDte.clone().endOf('month')
  const stationID = mongoose.Types.ObjectId(station)
  const endDate = eDte.clone().startOf('day')

  let data
  let products
  let closeRecords
  let openRecords
  let flags = {}

  const dataRet = {
    id: reportID,
    meta: {
      dates: {
        startDate: sDte,
        endDate: eDte,
      },
      stationID,
      recordLength: 0,
    },
    records: null,
  }

  try {
    products = await Product.find({ oilProduct: true }, { _id: 1 })
  } catch (err) {
    return Boom.badRequest(err)
  }
  const productIDs = products.map((p) => p._id)

  try {
    data = await NonFuelSales.aggregate([
      {
        $match: {
          recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() },
          stationID,
          productID: { $in: productIDs },
        },
      },
      {
        $lookup: {
          from: 'products', localField: 'productID', foreignField: '_id', as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: { id: '$product._id', category: '$product.category', name: '$product.name' },
          restock: { $sum: '$qty.restock' },
          sales: { $sum: '$sales' },
          sold: { $sum: '$qty.sold' },
        },
      },
      { $sort: { '_id.category': 1, '_id.name': 1 } },
    ])
  } catch (err) {
    return Boom.badRequest(err)
  }
  if (!data.length) {
    dataRet.records = data
    return h.response(dataRet)
  }

  // Now fetch opening and closing stock values
  try {
    openRecords = await NonFuelSales
      .find({ recordDate: sDte.toDate(), stationID })
      .sort({ productID: 1, recordNum: 1 })
  } catch (err) {
    return Boom.badRequest(err)
  }

  try {
    closeRecords = await NonFuelSales
      .find({ recordDate: endDate.toDate(), stationID })
      .sort({ productID: 1, recordNum: -1 })
  } catch (err) {
    return Boom.badRequest(err)
  }

  flags = {}
  const open = openRecords.filter((entry) => {
    if (flags[entry.productID]) {
      return false
    }
    flags[entry.productID] = true
    return true
  })

  flags = {}
  const close = closeRecords.filter((entry) => {
    if (flags[entry.productID]) {
      return false
    }
    flags[entry.productID] = true
    return true
  })

  const records = data.map((r) => {
    const record = ramda.clone(r)
    // Set opening stock
    const openEle = open.find((o) => {
      if (o.productID.toString() === record._id.id.toString()) {
        return o
      }
      return null
    })
    record.openStock = openEle.qty.open
    // Set closing stock
    record.closeStock = null
    if (close.length) {
      const closeEle = close.find((o) => {
        if (o.productID.toString() === record._id.id.toString()) {
          return o
        }
        return null
      })
      record.closeStock = closeEle.qty.close
    }

    // Now balance should be zero
    record.balance = record.openStock + record.restock - record.sold - record.closeStock
    record.id = record._id.id.toString()
    record.category = record._id.category
    record.name = record._id.name
    delete record._id
    return record
  })

  dataRet.records = records
  dataRet.meta.recordLength = records.length

  return h.response(dataRet)
}

module.exports = ReportHandler
