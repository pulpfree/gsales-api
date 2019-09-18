/* eslint-disable no-case-declarations, no-underscore-dangle */

import ramda from 'ramda'

const Boom = require('boom')
const sanz = require('mongo-sanitize')
const mongoose = require('mongoose')
const Config = require('../model/config')
const Dispenser = require('../model/dispenser')
const Journal = require('../model/journal')
const NonFuelSales = require('../model/non-fuel-sales')
const FuelDefinition = require('../model/fuel-definition')
const FuelSales = require('../model/fuel-sales')
const Sales = require('../model/sales')
const Station = require('../model/station')
const UtilHandler = require('./util')

// const cofore = require('co-foreach')
// const util = require('util')

const fetchShiftRecord = async (shiftID) => {
  try {
    const saleRec = await Sales.findById(shiftID).exec()
    return saleRec
  } catch (err) {
    return err
  }
}

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

const formatDate = (date) => {
  const fdt = {}
  const dt = new Date(date)
  fdt.year = dt.getFullYear()
  fdt.mon = String(`00${dt.getMonth() + 1}`).slice(-2)
  fdt.day = String(`00${dt.getDate()}`).slice(-2)
  return `${fdt.year}-${fdt.mon}-${fdt.day}`
}

const correctedDate = date => new Date(date.getTime() + (60000 * (date.getTimezoneOffset())))


function SalesHandler() {}

SalesHandler.prototype.find = async (request, h) => {
  const q = {}
  if (request.query.date) {
    q.recordDate = new Date(request.query.date)
  }
  if (request.query.stationID) {
    q.stationID = request.query.stationID
  }

  const p = Sales
    .find(q)
    .select({
      recordDate: 1,
      recordNum: 1,
      salesSummary: 1,
      shift: 1,
      stationID: 1,
    })
    .sort({ recordNum: 1 })

  if (request.query.populate) {
    p.populate('stationID')
  }

  try {
    const items = await p.exec()
    return h.response(items)
  } catch (error) {
    return Boom.badImplementation(error)
  }
}

SalesHandler.prototype.findByCriteria = async (request, h) => {
  let q
  const crit = sanz(request.params.crit)

  switch (crit) {
    case 'lastDay':
      if (!request.query.stationID) {
        return Boom.badRequest('Missing station id')
      }

      // Fetch last date for station
      let dte
      q = Sales
        .find({ stationID: request.query.stationID })
        .sort({ recordDate: -1 })
        .limit(1)
        .select({ recordDate: 1 })

      try {
        const item = await q.exec()
        dte = item[0].recordDate
      } catch (error) {
        return Boom.badImplementation(error)
      }

      q = Sales
        .find({
          stationID: request.query.stationID,
          recordDate: dte,
        })
        .select({
          recordDate: 1,
          recordNum: 1,
          shift: 1,
          stationID: 1,
        })
        .sort({ 'shift.number': 1 })
      if (request.query.populate) {
        q.populate('stationID')
      }

      try {
        const items = await q.exec()
        return h.response(items)
      } catch (error) {
        return Boom.badImplementation(error)
      }

    case 'shiftSales':
      if (!request.query.stationID) {
        return Boom.badRequest('Missing station id')
      }
      if (!request.query.recordNum) {
        return Boom.badRequest('Missing record number')
      }
      if (!request.query.shiftID) {
        return Boom.badRequest('Missing shift id')
      }

      q = {
        recordNum: sanz(request.query.recordNum),
        stationID: sanz(request.query.stationID),
      }

      const shift = Sales.findById(sanz(request.query.shiftID)).populate('attendant.ID')
      const fuelSales = FuelSales.find(q).sort({ dispenserID: 1 }).populate('dispenserID')
      const nonFuelSales = NonFuelSales.find(q).sort({ sortOrder: 1 }).populate('productID')
      const fuelDefinitions = FuelDefinition.find()

      try {
        const sales = {
          shift: await shift,
          fuelSales: await fuelSales,
          nonFuelSales: await nonFuelSales,
          fuelDefinitions: await fuelDefinitions,
        }
        return h.response(sales)
      } catch (error) {
        return Boom.badImplementation(error)
      }

    default:
      return Boom.badRequest('Invalid request')
  }
}

SalesHandler.prototype.findOne = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing sales id')
  }

  try {
    const item = await Sales.findById(sanz(request.params.id)).exec()
    return h.response(item)
  } catch (error) {
    return Boom.badImplementation(error)
  }
}

SalesHandler.prototype.createShift = async (request, h) => {
  if (!request.payload.employeeID) {
    return Boom.expectationFailed('Missing employeeID value')
  }
  if (!request.payload.stationID) {
    return Boom.expectationFailed('Missing stationID value')
  }
  if (!request.payload.date) {
    return Boom.expectationFailed('Missing date value')
  }

  /**
  Steps:
  1. sort out dates to determine valid day and shift
  2. fetch station
  3. fetch config
  4. fetch dispensers
  5. create new sales record
  */
  const reqEmployeeID = sanz(request.payload.employeeID)
  const stationID = sanz(request.payload.stationID)
  let reqDate = sanz(request.payload.date)
  let shift = 1

  // Fetch last record for station
  let lastRecord
  try {
    lastRecord = await Sales
      .findOne({ stationID })
      .sort({ recordNum: -1 })
      .limit(1)
      .select({
        recordDate: 1, recordNum: 1, shift: 1, fuelCosts: 1,
      })
  } catch (error) {
    return Boom.badImplementation(error)
  }

  const lastRecordDate = new Date(lastRecord.recordDate)
  if (lastRecord.shift.flag === false) {
    return Boom.expectationFailed('Last shift not closed')
  }

  // Fetch sale record based on date requested
  let saleRecord
  try {
    saleRecord = await Sales
      .findOne({ stationID, recordDate: reqDate })
      .select({ recordDate: 1, recordNum: 1, 'shift.number': 1 })
      .sort({ recordNum: -1 })
  } catch (error) {
    return Boom.badImplementation(error)
  }

  // if no saleRecord, set reqDate to next day of lastRecord
  if (saleRecord === null) {
    const d = new Date(lastRecordDate.setDate(lastRecordDate.getDate() + 1))
    reqDate = formatDate(correctedDate(d))
  // if saleRecord date < lastRecord date,
  // set reqDate to lastRecordDate and shift to saleRecord shift + 1
  } else if (saleRecord && saleRecord.recordDate.valueOf() < lastRecord.recordDate.valueOf()) {
    reqDate = formatDate(correctedDate(lastRecordDate))
    shift = saleRecord.shift.number + 1
  // all is as expected, set shift to saleRecord + 1
  } else {
    shift = saleRecord.shift.number + 1
  }
  const newRecordNum = `${reqDate}-${shift}`

  // Fetch station data
  let stationData
  const station = Station.findById(stationID)
  const config = Config.findById(1)
  const dispensers = Dispenser.find({ stationID })
  const fuelSaleRecords = FuelSales.find({ stationID, recordNum: lastRecord.recordNum })
  const nonFuelSaleRecords = NonFuelSales.find({ stationID, recordNum: lastRecord.recordNum })
    .sort({ sortOrder: 1 })

  try {
    stationData = {
      station: await station,
      config: await config,
      dispensers: await dispensers,
      fuelSaleRecords: await fuelSaleRecords,
      nonFuelSaleRecords: await nonFuelSaleRecords,
    }
  } catch (error) {
    return Boom.badImplementation(error)
  }

  // Create fuel sale records
  const records = []
  let grades = []

  stationData.dispensers.forEach((d) => {
    const lastR = stationData.fuelSaleRecords.find(
      r => r.dispenserID.toString() === d._id.toString()
    )
    grades.push(d.gradeID)
    // accommodate new dispensers
    const openDollars = lastR ? lastR.dollars.close : d.openingDollar
    const openLitres = lastR ? lastR.litres.close : d.openingLitre
    records.push({
      dispenserID: d._id,
      dollars: { open: openDollars },
      gradeID: d.gradeID,
      litres: { open: openLitres },
      recordDate: reqDate,
      recordNum: newRecordNum,
      stationID,
    })
  })

  await FuelSales.insertMany(records)

  // Create non-fuel records
  // Start with list of station products
  const prods = stationData.station.products
  if (prods.length > 0) {
    const nonFuelRecords = []
    prods.forEach((p) => {
      // check for an existing last record
      const lastR = stationData.nonFuelSaleRecords.find(
        nf => nf.productID.toString() === p.productID.toString()
      )

      // If existing product, carry over the close qty
      const openQty = lastR ? lastR.qty.close : 0
      const rec = {
        productID: p.productID,
        recordNum: newRecordNum,
        recordDate: reqDate,
        stationID,
        sortOrder: p.sortOrder,
        qty: {
          open: openQty,
        },
      }
      nonFuelRecords.push(rec)
    })

    await NonFuelSales.insertMany(nonFuelRecords)
  }

  // Create fuel costs
  grades = ramda.uniq(grades)

  // note: attempting to accommodate any change to dispensers here, ie: addition or new pump added
  const fuelCosts = {
    fuel_1: (grades.indexOf(1) >= 0)
      ? lastRecord.fuelCosts.fuel_1
      : null,
    fuel_2: (grades.indexOf(2) >= 0)
      ? (lastRecord.fuelCosts.fuel_1 + (stationData.config.hiGradePremium / 2))
      : null,
    fuel_3: (grades.indexOf(3) >= 0)
      ? (lastRecord.fuelCosts.fuel_1 + stationData.config.hiGradePremium)
      : null,
    fuel_4: (grades.indexOf(4) >= 0) ? lastRecord.fuelCosts.fuel_4 || 0.0 : null,
    fuel_5: (grades.indexOf(5) >= 0) ? lastRecord.fuelCosts.fuel_4 ? (lastRecord.fuelCosts.fuel_4 - stationData.config.colouredDieselDsc) : 0.0 : null, // eslint-disable-line
    fuel_6: (grades.indexOf(5) >= 0) ? lastRecord.fuelCosts.fuel_6 || 0.0 : null,
  }

  // Create sales record
  const newShift = {
    attendant: {
      ID: reqEmployeeID,
    },
    cash: {},
    creditCard: {},
    fuelCosts,
    overshort: {},
    recordNum: newRecordNum,
    recordDate: reqDate,
    stationID,
    shift: {
      flag: false,
      number: shift,
    },
    salesSummary: {
      nonFuel: 0,
    },
  }
  if (fuelCosts.fuel_6) {
    newShift.otherFuel = { propane: { dollar: 0, litre: 0 } }
  }

  const sales = new Sales(newShift)
  try {
    await sales.save()
    return h.response({ id: sales._id }).code(201)
  } catch (error) {
    return Boom.badImplementation(error)
  }
}

SalesHandler.prototype.update = async (request, h) => {
  const docId = sanz(request.params.id)
  const method = sanz(request.payload.method)
  let calcs = {}

  switch (method) {
    case 'updateNonFuelSales':
      let bobsFuelAdj = 0.00
      if (ramda.hasPath(['salesSummary', 'bobsFuelAdj'], request.payload.sales)) {
        bobsFuelAdj = parseFloat(sanz(request.payload.sales.salesSummary.bobsFuelAdj))
      }
      const calculations = sanz(request.payload.sales.calculations)
      const nonFuel = sanz(request.payload.sales.nonFuel)
      const otherNonFuel = sanz(request.payload.sales.otherNonFuel)
      const otherNonFuelBobs = sanz(request.payload.sales.otherNonFuelBobs)

      // Fetch record so we can combine sales.
      const sales = await Sales.findById(docId, { salesSummary: 1, stationID: 1 })
      const fuelSales = sales.salesSummary.fuelDollar

      let totalNonFuelSales = 0.00
      let productSales = 0.00

      await Promise.all(nonFuel.map(async (nf) => {
        const fields = {
          qty: nf.qty,
          sales: nf.sales,
        }
        productSales += nf.sales
        try {
          await NonFuelSales.findByIdAndUpdate(nf.id, fields).exec()
        } catch (error) {
          return Boom.badImplementation(error)
        }
        return true
      }))

      const otherNonFuelTotal = Object.values(otherNonFuel).reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      )

      totalNonFuelSales = parseFloat(productSales + otherNonFuelTotal)

      // save data entry calculations
      calcs = {}
      if (calculations) { // Create key/value array so we can store in mongo
        Object.keys(calculations).forEach((k) => {
          const key = k.replace('.', ':')
          calcs[key] = calculations[k]
        })
      }

      const fields = {
        otherNonFuel,
        otherNonFuelBobs,
        'salesSummary.bobsFuelAdj': bobsFuelAdj,
        'salesSummary.product': parseFloat(productSales),
        'salesSummary.totalNonFuel': parseFloat(totalNonFuelSales),
        'salesSummary.totalSales': parseFloat(totalNonFuelSales + fuelSales + bobsFuelAdj),
        'meta.calculations': calcs,
      }
      try {
        const doc = await Sales.findByIdAndUpdate(docId, fields, { new: true }).populate('attendant.ID')
        return h.response(doc).code(200)
      } catch (err) {
        console.error(err) // eslint-disable-line no-console
        return Boom.badRequest(err)
      }

    case 'saveSummary':

      const { shift } = request.payload

      let cardTotal = Object.values(shift.creditCard).reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      )
      let cashTotal = Object.values(shift.cash).reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      )
      cardTotal = parseFloat(cardTotal)
      cashTotal = parseFloat(cashTotal)
      const cashCCTotal = parseFloat(cashTotal + cardTotal)

      // save data entry calculations
      calcs = {}
      if (shift.calculations) { // Create key/value array so we can store in mongo
        Object.keys(shift.calculations).forEach((k) => {
          const key = k.replace('.', ':')
          calcs[key] = shift.calculations[k]
        })
      }

      const submitVals = {}

      // set defaults for totalSales calculation
      if (!Object.prototype.hasOwnProperty.call(shift.salesSummary, 'totalNonFuel')) {
        shift.salesSummary.totalNonFuel = 0
      }
      if (!Object.prototype.hasOwnProperty.call(shift.salesSummary, 'otherFuelDollar')) {
        shift.salesSummary.otherFuelDollar = 0
      }

      const otherFuel = {
        dollar: 0,
        litre: 0,
      }
      if (shift.otherFuel) {
        submitVals.otherFuel = shift.otherFuel
        Object.keys(shift.otherFuel).forEach((k) => {
          otherFuel.dollar += shift.otherFuel[k].dollar
          otherFuel.litre += shift.otherFuel[k].litre
        })
        submitVals['salesSummary.otherFuelDollar'] = otherFuel.dollar
        submitVals['salesSummary.otherFuelLitre'] = otherFuel.litre
      }

      let bobsFuelAdj2
      if (shift.salesSummary.bobsFuelAdj !== 'undefined') {
        bobsFuelAdj2 = shift.salesSummary.bobsFuelAdj
      }

      submitVals.creditCard = shift.creditCard
      submitVals.cash = shift.cash
      submitVals['attendant.sheetComplete'] = shift.attendant.sheetComplete
      submitVals['attendant.overshortValue'] = shift.attendant.overshortValue
      submitVals['attendant.overshortComplete'] = shift.attendant.overshortComplete
      submitVals['meta.calculations'] = calcs
      submitVals['overshort.descrip'] = shift.overshort.descrip
      submitVals['overshort.amount'] = cashCCTotal - shift.salesSummary.totalSales
      submitVals['salesSummary.cashTotal'] = cashTotal
      submitVals['salesSummary.creditCardTotal'] = cardTotal
      submitVals['salesSummary.cashCCTotal'] = cashCCTotal
      submitVals['salesSummary.totalSales'] = (shift.salesSummary.fuelDollar + otherFuel.dollar + shift.salesSummary.totalNonFuel + bobsFuelAdj2)

      try {
        const doc = await Sales.findByIdAndUpdate(docId, submitVals, { new: true }).populate('attendant.ID')
        return h.response(doc).code(200)
      } catch (err) {
        return Boom.badRequest(err)
      }

    default:
      return Boom.badRequest('Invalid request')
  }
}

SalesHandler.prototype.patch = async (request, h) => {
  const id = sanz(request.params.id)
  const field = sanz(request.payload.field)
  const value = sanz(request.payload.value)
  const method = sanz(request.payload.method)

  const q = {}
  const select = {}

  q[field] = value
  select[field] = 1

  let doc

  // Accommodate different methods
  switch (method) {
    case 'simple':
      doc = await Sales.findByIdAndUpdate(id, q, { select, new: true })
      return h.response(doc)

    case 'updateFuelCost':
      let fuelCosts = {}
      const grade = Number(field.split('.')[1].split('_')[1])
      const submitCost = parseFloat(value)

      let data
      const config = Config.findById(1)
      const shift = Sales.findById(id)
      try {
        data = {
          config: await config,
          shift: await shift,
        }
      } catch (error) {
        return Boom.badImplementation(error)
      }

      const hiGradeP = parseFloat(data.config.hiGradePremium)
      const grades = await Dispenser.find({ stationID: data.shift.stationID }).distinct('gradeID')

      if (grade === 1) {
        fuelCosts.fuel_1 = submitCost
        fuelCosts.fuel_2 = (grades.indexOf(2) >= 0) ? parseFloat(submitCost + (hiGradeP / 2)) : null
        fuelCosts.fuel_3 = (grades.indexOf(3) >= 0) ? parseFloat(submitCost + hiGradeP) : null
      } else if (grade === 4) {
        fuelCosts.fuel_4 = (grades.indexOf(4) >= 0) ? parseFloat(submitCost) : null
        fuelCosts.fuel_5 = (grades.indexOf(5) >= 0)
          ? parseFloat(submitCost - data.config.colouredDieselDsc)
          : null
      } else if (grade === 6) {
        fuelCosts.fuel_6 = (grades.indexOf(6) >= 0) ? parseFloat(submitCost) : null
      }
      fuelCosts = Object.assign(data.shift.fuelCosts, fuelCosts)

      try {
        doc = await Sales.findByIdAndUpdate(id, { fuelCosts }, { new: true }).populate('attendant.ID')
      } catch (err) {
        console.error(err) // eslint-disable-line no-console
        return Boom.badRequest(err)
      }

      // Now update any fuel sales
      const fs = await FuelSales.find({ stationID: doc.stationID, recordNum: doc.recordNum })

      // Now update existing fuel sale entries if
      // this has been made after fuel sales entries were made
      //
      // theoretical = net litre * fuelCost / 100
      // difference = theoretical - net dollar
      const ps = []
      fs.forEach((fr) => {
        if (fr.litres.net) {
          const fuelCost = doc.fuelCosts[`fuel_${fr.gradeID}`]
          const theoretical = fr.litres.net * fuelCost / 100
          const diff = theoretical - fr.dollars.net
          const rec = {
            dollars: {
              diff,
              close: fr.dollars.close,
              open: fr.dollars.open,
              net: fr.dollars.net,
              theoretical,
            },
          }
          const p = FuelSales.findByIdAndUpdate(fr._id, rec).exec()
          ps.push(p)
        }
      })
      if (ps.length > 0) {
        try {
          await Promise.all(ps)
        } catch (error) {
          return Boom.badRequest(error)
        }
      }

      return h.response(doc)

    case 'closeShift':
      try {
        doc = await Sales.findByIdAndUpdate(id, { 'shift.flag': true }, { new: true }).populate('attendant.ID')
        return h.response(doc).code(200)
      } catch (error) {
        console.error(error) // eslint-disable-line no-console
        return Boom.badRequest(error)
      }

    default:
      try {
        doc = await Sales.findByIdAndUpdate(id, q, { select, new: true })
      } catch (error) {
        return Boom.badRequest(error)
      }

      // Create Journal entry
      const jRec = {
        adjustDate: new Date(),
        recordsAffected: {
          salesID: mongoose.Types.ObjectId(doc.id),
        },
        recordNum: doc.recordNum,
        stationID: mongoose.Types.ObjectId(doc.stationID),
        type: 'salesSummaryAdjust',
        values: {
          attendantID: q[field],
        },
      }
      try {
        await Journal.create(jRec)
        return h.response(doc)
      } catch (error) {
        return Boom.badRequest(error)
      }
  }
}

SalesHandler.prototype.patchNonFuel = async (request, h) => {
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

  let saleRec
  try {
    saleRec = await Sales.findById(salesID).exec()
  } catch (error) {
    return Boom.badImplementation(error)
  }

  const saleRecord = ramda.clone(saleRec._doc)
  const isBobs = await stationIsBobs(saleRecord.stationID)

  // We are only making adjustments to the close value for either restock or sales,
  // the original restock value remains
  const nonFuelUpdate = {
    'qty.close': parseInt(payVals.close, 10),
  }
  // Here the sold and sales values are adjusted when a 'Sold' or 'sales' type adjustment is made
  if (payVals.type === 'sales') {
    nonFuelUpdate['qty.sold'] = parseInt(payVals.sold, 10)
    nonFuelUpdate.sales = parseFloat(payVals.sales)
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
    saleRecord.nonFuelAdjustOS = saleRecord.nonFuelAdjustVals.map(a => a.amount).reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    )
  }

  // Calculate new totals
  const otherNonFuelTotal = Object.keys(saleRecord.otherNonFuel)
    .map(k => saleRecord.otherNonFuel[k] || 0)
    .reduce((accumulator, currentValue) => accumulator + currentValue, 0)

  const totalNonFuel = otherNonFuelTotal + productTotal

  let totalSales = totalNonFuel
    + saleRecord.salesSummary.fuelDollar
    + saleRecord.salesSummary.otherFuelDollar
  if (isBobs) {
    totalSales = totalSales
      + saleRecord.nonFuelAdjustOS
      + saleRecord.salesSummary.bobsFuelAdj
  }
  const newSS = Object.assign(
    {},
    ramda.clone(saleRecord.salesSummary),
    { product: productTotal, totalNonFuel, totalSales }
  )

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
      const postS = ramda.clone(postSale)
      const restock = postS.qty.restock || 0
      const close = (newClose - postS.qty.sold + restock)
      postS.qty.open = newClose
      postS.qty.close = close

      newClose = close // Set value for next days` open
      const promise = NonFuelSales.update({ _id: postS._id }, { qty: postS.qty }).exec()
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

SalesHandler.prototype.patchSummary = async (request, h) => {
  if (!request.params.id) {
    return Boom.expectationFailed('Missing sales id value')
  }
  let shiftResponse

  const allowedFields = [
    'creditCard',
    'cash',
    'otherFuel',
    'otherNonFuel',
    'otherNonFuelBobs',
    'salesSummary', // actually 'salesSummary.bobsFuelAdj'
  ]

  const adjustment = sanz(request.payload.adjustment)
  const shift = sanz(request.payload.shift)
  let updateVals = {}
  let journalAdjTp

  // Extract field name parts
  const fieldPrts = adjustment.field.split('.')
  if (allowedFields.indexOf(fieldPrts[0]) < 0) {
    return Boom.expectationFailed('Invalid key name')
  }

  const saleRec = await fetchShiftRecord(shift.id)
  const saleRecord = ramda.clone(saleRec._doc)

  // Update submitted field
  const adjustValue = parseFloat(adjustment.adjustValue)
  shift[fieldPrts[0]][fieldPrts[1]] = adjustValue


  // Cash & Cards section
  if (fieldPrts[0] === allowedFields[0] || fieldPrts[0] === allowedFields[1]) {
    const cardTotal = Object.values(shift.creditCard).reduce((a, b) => a + b, 0)
    const cashTotal = Object.values(shift.cash).reduce((a, b) => a + b, 0)
    const cashCCTotal = parseFloat(cashTotal + cardTotal)

    updateVals = {
      cash: shift.cash,
      creditCard: shift.creditCard,
      'salesSummary.cashTotal': cashTotal,
      'salesSummary.creditCardTotal': cardTotal,
      'salesSummary.cashCCTotal': cashCCTotal,
      'overshort.amount': cashCCTotal - shift.salesSummary.totalSales,
    }
    journalAdjTp = 'salesSummaryAdjust'

  // otherFuel or otherNonFuel field
  } else if (fieldPrts[0] === allowedFields[2] || fieldPrts[0] === allowedFields[3]) {
    const otherNonFuelTotal = Object.values(shift.otherNonFuel).reduce((a, b) => a + b, 0)
    const totalNonFuel = shift.salesSummary.product + otherNonFuelTotal
    const totalSales = shift.salesSummary.fuelDollar
      + shift.salesSummary.otherFuelDollar
      + totalNonFuel
    updateVals = {
      otherNonFuel: shift.otherNonFuel,
      'salesSummary.totalNonFuel': totalNonFuel,
      'salesSummary.totalSales': totalSales,
      'overshort.amount': shift.salesSummary.cashCCTotal - totalSales,
    }
    journalAdjTp = 'nonFuelSaleAdjust'

  // otherNonFuelBobs field
  // note: this field appears to be independent of any total
  } else if (fieldPrts[0] === allowedFields[4]) {
    updateVals = {
      otherNonFuelBobs: shift.otherNonFuelBobs,
    }
    journalAdjTp = 'nonFuelSaleAdjust'

  // Bob's Fuel Misc Adjustment (bobsFuelAdj)
  } else if (fieldPrts[0] === allowedFields[5]) {
    const bobsFuelAdj = parseFloat(adjustment.adjustValue)
    const totalSales = parseFloat(
      saleRecord.salesSummary.totalNonFuel
      + saleRecord.salesSummary.fuelDollar
      + saleRecord.nonFuelAdjustOS
      + bobsFuelAdj
    )
    updateVals = {
      'salesSummary.bobsFuelAdj': bobsFuelAdj,
      'salesSummary.totalSales': totalSales,
      'overshort.amount': saleRecord.salesSummary.cashCCTotal - totalSales,
    }
    journalAdjTp = 'salesSummaryAdjust'
  }

  // let shiftResponse
  try {
    shiftResponse = await Sales.findByIdAndUpdate(
      { _id: mongoose.Types.ObjectId(shift.id) },
      updateVals,
      { new: true },
    )
  } catch (err) {
    return Boom.badImplementation(err)
  }

  // Now create the journal entry record
  const jRec = {
    adjustDate: new Date(),
    description: adjustment.description,
    recordsAffected: {
      curSaleRec: mongoose.Types.ObjectId(shift.id),
    },
    recordNum: shift.recordNum,
    stationID: mongoose.Types.ObjectId(shift.stationID),
    type: journalAdjTp,
    values: adjustment,
  }
  try {
    await Journal.create(jRec)
  } catch (err) {
    return Boom.badImplementation(err)
  }
  return h.response(shiftResponse).code(200)
}

// I believe this only affects the Thorold Stone Back location, propane related
SalesHandler.prototype.patchOtherFuel = async (request, h) => {
  if (!request.params.id) {
    return Boom.expectationFailed('Missing sales id value')
  }

  const values = sanz(request.payload.values)
  const salesID = sanz(request.params.id)

  // Start with the shift record so we can update totalSales
  let shift
  try {
    shift = await Sales.findById(salesID)
  } catch (err) {
    return Boom.badImplementation(err)
  }

  // Prep update vals
  const dollar = parseFloat(values.otherDollar)
  const litre = parseFloat(values.otherLitre)
  const totalSales = parseFloat(shift.salesSummary.fuelDollar
    + dollar
    + shift.salesSummary.totalNonFuel)
  const updateVals = {
    otherFuel: {
      [values.fuel]: {
        dollar,
        litre,
      },
    },
    'salesSummary.otherFuelLitre': litre,
    'salesSummary.otherFuelDollar': dollar,
    'salesSummary.totalSales': shift.salesSummary.fuelDollar + dollar + shift.salesSummary.totalNonFuel,
    'overshort.amount': shift.salesSummary.cashCCTotal - totalSales + shift.nonFuelAdjustOS,
  }

  let res
  try {
    res = await shift.update(updateVals).exec()
  } catch (err) {
    return Boom.badImplementation(err)
  }

  // Now create the journal entry record
  const jRec = {
    adjustDate: new Date(),
    description: values.description,
    recordsAffected: {
      curSaleRec: mongoose.Types.ObjectId(shift.id),
    },
    recordNum: shift.recordNum,
    stationID: mongoose.Types.ObjectId(shift.stationID),
    type: 'fuelSaleAdjust',
    values,
  }
  try {
    await Journal.create(jRec)
  } catch (err) {
    return Boom.badImplementation(err)
  }

  return h.response(res)
}

// Wondering if this is actually in use anywhere??
SalesHandler.prototype.remove = async (request, h) => {
  if (!request.params.id) {
    return Boom.expectationFailed('Missing sales id value')
  }

  const id = sanz(request.params.id)
  try {
    await Sales.findByIdAndRemove(id)
    return h.response({ responseOk: true }).code(200)
  } catch (error) {
    return Boom.badImplementation(error)
  }
}

SalesHandler.prototype.removeShift = async (request, h) => {
  if (!request.query.stationID) {
    return Boom.expectationFailed('Missing stationID value')
  }

  const stationID = sanz(request.query.stationID)
  let recordNum

  if (!request.query.recordNum) {
    const lastSale = await Sales
      .find({ stationID })
      .sort({ recordDate: -1, recordNum: -1 })
      .limit(1)
      .select({ recordDate: 1, recordNum: 1 })
      .exec()

    recordNum = lastSale[0].recordNum // eslint-disable-line prefer-destructuring
  } else {
    recordNum = sanz(request.query.recordNum)
  }

  // Delete all associated records
  let deleteData
  const q = { stationID, recordNum }

  const nonFuelSales = NonFuelSales.deleteMany(q)
  const fSales = FuelSales.deleteMany(q)
  const sales = Sales.deleteMany(q)
  const journal = Journal.deleteMany(q)

  try {
    deleteData = {
      nonFuelSales: await nonFuelSales,
      fSales: await fSales,
      sales: await sales,
      journal: await journal,
    }
  } catch (error) {
    return Boom.badImplementation(error)
  }

  return h.response(deleteData).code(200)
}

module.exports = SalesHandler
