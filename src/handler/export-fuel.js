

import Boom from '@hapi/boom'
const sanz = require('mongo-sanitize')
const co = require('co')
const cofore = require('co-foreach')
const moment = require('moment')
const mongoose = require('mongoose')

const _ = require('lodash')
const RecordExport = require('../model/export-log')
const Sales = require('../model/sales')
const DipsSchemas = require('../model/dips-fuelsale-import')

const constants = require('../config/constants')


function ExportFuelHandler() {}

module.exports = ExportFuelHandler

ExportFuelHandler.prototype.export = (req, reply) => {
  if (!req.payload.startDate) {
    return reply(Boom.badRequest('Missing start date'))
  }
  if (!req.payload.endDate) {
    return reply(Boom.badRequest('Missing end date'))
  }
  const db = mongoose.createConnection(constants.database.uri, constants.database.options)
  const db2 = db.useDb(constants.dbNames.dips)
  const DFSI = db2.model('DFSI', DipsSchemas.FuelSaleImportSchema)
  const DIL = db2.model('DIL', DipsSchemas.ImportLogSchema)
  const DStore = db2.model('DStore', DipsSchemas.StoreSchema)
  const DFS = db2.model('DFS', DipsSchemas.FuelSaleSchema)

  const sDte = moment.utc(sanz(req.payload.startDate))
  const eDte = moment.utc(sanz(req.payload.endDate))

  co(function* () {
    let data
    try {
      data = yield Sales.aggregate([
        { $match: { recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() } } },
        {
          $group: {
            _id: { recordDate: '$recordDate', stationID: '$stationID', recordNum: '$recordNum' },
            fuel1: { $sum: '$salesSummary.fuel.fuel_1.litre' },
            fuel2: { $sum: '$salesSummary.fuel.fuel_2.litre' },
            fuel3: { $sum: '$salesSummary.fuel.fuel_3.litre' },
            fuel4: { $sum: '$salesSummary.fuel.fuel_4.litre' },
            fuel5: { $sum: '$salesSummary.fuel.fuel_5.litre' },
            fuel6: { $sum: '$salesSummary.fuel.fuel_6.litre' },
            fuel_costs: { $last: '$fuelCosts' },
          },
        },
        { $sort: { '_id.recordDate': 1 } },
      ])
    } catch (err) {
      return reply(Boom.badRequest(err))
    }

    yield cofore(data, function* (d) {
      const fuelSplit = d.fuel2 / 2
      const dte = moment.utc(d._id.recordDate)
      const rec = {
        fuel_sales: {
          NL: (d.fuel1 + fuelSplit),
          SNL: (d.fuel3 + fuelSplit),
          DSL: d.fuel4,
          CDSL: d.fuel5,
          PROP: d.fuel6,
        },
        fuel_sums: {
          fuel1: d.fuel1,
          fuel2: d.fuel2,
          fuel3: d.fuel3,
          fuel4: d.fuel4,
          fuel5: d.fuel5,
          fuel6: d.fuel6,
        },
        fuel_costs: d.fuel_costs,
        record_date: parseInt(dte.format('YYYYMMDD')),
        status: 'imported',
        station_id: d._id.stationID,
      }
      try {
        yield DFSI.create(rec)
      } catch (err) {
        return reply(Boom.badRequest(err))
      }
    })

    // Create log record in dips db
    const logRec = {
      timestamp: new Date(),
      date_from: sDte,
      date_to: eDte,
    }
    try {
      DIL.create(logRec) // not worried about promise here
    } catch (err) {
      return reply(Boom.badRequest(err))
    }

    // Last step, compile imported data
    // First create a list of store aggregate ids
    let stores
    try {
      stores = yield DStore.find({ aggregate_ids: { $ne: null } }, { aggregate_ids: 1 })
    } catch (err) {
      return reply(Boom.badRequest(err))
    }

    const group = {
      $group: {
        _id: { recordDate: '$record_date' },
        fuel1_cost: { $avg: { $cond: [{ $gt: ['$fuel_costs.fuel_1', 0] }, '$fuel_costs.fuel_1', null] } },
        NL: { $sum: '$fuel_sales.NL' },
        SNL: { $sum: '$fuel_sales.SNL' },
        DSL: { $sum: '$fuel_sales.DSL' },
        CDSL: { $sum: '$fuel_sales.CDSL' },
        PROP: { $sum: '$fuel_sales.PROP' },
      },
    }

    const importRes = []
    yield cofore(stores, function* (store) {
      const res = yield DFSI.aggregate([
        { $match: { station_id: { $in: store.aggregate_ids }, status: 'imported' } },
        group,
      ]).exec()
      importRes.push({ store_id: store._id, res })
    }).catch(err => reply(Boom.badRequest(err)))

    // Update import status to ensure no repeats
    yield DFSI.updateMany({ status: 'imported' }, { status: 'processed' }, { multi: true })

    let saveQty = 0
    let recordDtes = []

    yield cofore(importRes, function* (imp) {
      const storeID = imp.store_id.toString()

      yield cofore(imp.res, function* (iR) {
        const recordDteStr = iR._id.recordDate.toString()
        recordDtes.push(recordDteStr)

        const rec = {
          _id: `${recordDteStr}-${storeID}`,
          fuel_sales: {
            NL: iR.NL,
            SNL: iR.SNL,
            DSL: iR.DSL,
            CDSL: iR.CDSL,
            PROP: iR.PROP,
          },
          fuel1_cost: iR.fuel1_cost,
          import_date: new Date(),
          record_date: iR._id.recordDate,
          record_ts: moment.utc(recordDteStr).toDate(),
          store_id: storeID,
        }
        saveQty++

        let doc
        try { // update existing record
          doc = yield DFS.findByIdAndUpdate(rec._id, rec).exec()
        } catch (err) {
          return reply(Boom.badRequest(err))
        }
        if (!doc) { // create new record
          try {
            yield DFS.create(rec)
          } catch (err) {
            return reply(Boom.badRequest(err))
          }
        }
      })
    })

    // Now save summary
    recordDtes = _.uniq(recordDtes).sort()

    // Intentionally not using UTC so we can display dates in current locale NOTE: no longer true
    // live server is in UTC so we get inconsistencies testing locally and then on production server
    // so I'm using utc here as well. We may have to deal with the display in the GUI
    const records = recordDtes.map(d => moment.utc(d.toString()).toDate())
    const recordRange = { start: records[0], end: records[records.length - 1] }

    const exportRec = {
      type: 'fuel',
      exportDate: new Date(),
      details: {
        recordDates: records,
        recordQty: saveQty,
        recordRange,
      },
    }
    try {
      yield RecordExport.create(exportRec)
    } catch (err) {
      return reply(Boom.badRequest(err))
    }

    reply({ status: 'OK' }).code(201)
  }).catch(err => reply(Boom.badRequest(err)))
}
