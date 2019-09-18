'use strict'

// to use, enter environment and date, ie:
// NODE_ENV=development node --harmony validate-summary.js yyyy-mm-dd

const co      = require('co')
const mongoose = require('mongoose')
const moment = require('moment')
// const _ = require('lodash')

const constants = require('../src/config/constants')
const FuelSales = require('../src/model/fuel-sales')
const Sales = require('../src/model/sales')

if (!process.argv[2]) {
  throw Error('Missing date')
}

let sDte = moment.utc(process.argv[2])
let eDte = sDte.clone().endOf('month')

mongoose.Promise = global.Promise

// let ps = [] // array of promises
// let resP // reponse promise


co(function*() {

  mongoose.connect(constants.database['uri'], constants.database['options'])

  // Fetch each shift of date range
  let sales
  try {
    sales = yield Sales.find({recordDate: {$gte: sDte.toDate(), $lte: eDte.toDate()}})
  } catch (err) {
    return console.log(err)
  }

  // Now aggregate fuel sales
  let ps = [], resP
  sales.forEach(sale => {
    let p = FuelSales.aggregate(
      {$match: {stationID: mongoose.Types.ObjectId(sale.stationID), recordNum: sale.recordNum}},
      {$group: {_id: '$gradeID', 'dollars': {$sum: '$dollars.net'}, 'litres': {$sum: '$litres.net'}}},
      {$sort: {'_id': 1}}
    ).exec((err, res) => {

      ps.push(p)

      if (err) return console.log(err)

      sale.salesSummary.fuel = {}
      sale.salesSummary.fuelDollar = 0.00,
      sale.salesSummary.fuelLitre  = 0.00

      res.forEach(f => {
        sale.salesSummary.fuel[`fuel_${f._id}`] = {
          dollar: f.dollars,
          litre:  f.litres
        }
        sale.salesSummary.fuelDollar += f.dollars
        sale.salesSummary.fuelLitre += f.litres
      })

      // Now calculate totals
      // submit['salesSummary.otherFuelDollar']  = otherFuel.dollar
      // submit['salesSummary.otherFuelLitre']
      // sales.salesSummary.otherFuel.propane.dollar
      let otherPropaneDollars = 0
      if (sale.otherFuel.propane && sale.otherFuel.propane.dollar) {
        // otherPropaneDollars = sale.salesSummary.otherFuel.propane.dollar
        // console.log('otherPropaneDollars:', sale.otherFuel.propane)
        otherPropaneDollars = sale.otherFuel.propane.dollar
      }

      sale.salesSummary.totalSales = sale.salesSummary.totalNonFuel + otherPropaneDollars + sale.salesSummary.fuelDollar
      sale.overshort.amount = sale.salesSummary.cashCCTotal - sale.salesSummary.totalSales

      Sales.findByIdAndUpdate(sale._id, sale).exec(err => {
        if (err) return console.log('err:', err)
      })
    })
  })

  resP = yield Promise.all(ps).then(r => {
    console.log('Summary update complete')
    // mongoose.disconnect()
    // process.exit(0)
  })

})


