

import Boom from '@hapi/boom'
const Bluebird = require('bluebird')
const sanz = require('mongo-sanitize')
const co = require('co')
const moment = require('moment')
const mongoose = require('mongoose')

const _ = require('lodash')
const FuelSales = require('../model/fuel-sales')
const PropaneSchemas = require('../model/propane-import')
const RecordExport = require('../model/export-log')

const constants = require('../config/constants')


const gradeID = 6
const stationID = mongoose.Types.ObjectId('56cf1815982d82b0f3000012')

const dispenserMap = {
  '56e7593f982d82eeff262cd5': 475,
  '56e7593f982d82eeff262cd6': 476,
}

function ExportPropaneHandler() {}

module.exports = ExportPropaneHandler

ExportPropaneHandler.prototype.export = (req, reply) => {
  if (!req.payload.startDate) {
    return reply(Boom.badRequest('Missing start date'))
  }
  if (!req.payload.endDate) {
    return reply(Boom.badRequest('Missing end date'))
  }

  const db = mongoose.createConnection(constants.database.uri, constants.database.options)
  const db2 = db.useDb(constants.dbNames.dips)

  const PIMP = db2.model('PIMP', PropaneSchemas.PropaneImportSchema)
  const PPS = db2.model('PPS', PropaneSchemas.PropaneSchema)

  const sDte = moment.utc(sanz(req.payload.startDate))
  const eDte = moment.utc(sanz(req.payload.endDate))

  co(function* () {
    // STEP 1 - Start by importing propane fuel sale records
    let fsData
    try {
      fsData = yield FuelSales.aggregate([
        { $match: { stationID, recordDate: { $gte: sDte.toDate(), $lte: eDte.toDate() }, gradeID } },
        {
          $group: {
            _id: { recordDate: '$recordDate', dispenserID: '$dispenserID' },
            litres: { $sum: '$litres.net' },
          },
        },
        { $sort: { '_id.recordDate': 1 } },
      ]).exec()
    } catch (err) {
      return reply(Boom.badRequest(err))
    }

    const ps = []
    fsData.forEach((d) => {
      const dte = moment.utc(d._id.recordDate)
      const rec = {
        dispenser_id: d._id.dispenserID,
        litres: d.litres,
        record_date: parseInt(dte.format('YYYYMMDD')),
        status: 'imported',
        store_id: stationID,
      }
      try {
        const p = PIMP.create(rec)
        ps.push(p)
      } catch (err) {
        return reply(Boom.badRequest(err))
      }
    })

    yield Promise.all(ps)

    // STEP 2 - Compile imported records
    const propRecs = []
    let impRecs

    try {
      impRecs = yield PIMP.find({ status: 'imported' })
    } catch (err) {
      return reply(Boom.badRequest(err))
    }
    impRecs.forEach((imp) => {
      const recordDteStr = imp.record_date.toString()
      const tankID = dispenserMap[imp.dispenser_id.toString()]
      const rec = {
        _id: `${imp.record_date}-${tankID}`,
        fuel_sales: imp.litres,
        import_date: new Date(),
        record_date: imp.record_date,
        record_ts: moment.utc(recordDteStr).toDate(),
        store_id: imp.store_id,
        tank_id: tankID,
      }
      propRecs.push(rec)
    })

    // STEP 3 - Update import status to ensure no repeats
    yield PIMP.update({ status: 'imported' }, { status: 'processed' }, { multi: true })


    // STEP 4 - Either update or create record. For whatever, cannot seem to use 'save' for both
    // This was taken from : https://www.reddit.com/r/node/comments/34j4vp/how_should_we_run_foreach_loops_inside_co/
    // as a way to deal with using forEach inside co contexts
    const errs = []
    let recordDtes = []
    let saveQty = 0
    yield Bluebird.each(propRecs, co.wrap(function* (rec) {
      let retu
      try {
        retu = yield PPS.findByIdAndUpdate(rec._id, rec).exec()
      } catch (err) {
        errs.push(err)
      }
      if (retu === null) {
        try {
          yield PPS.create(rec)
        } catch (err) {
          errs.push(err)
        }
      }

      recordDtes.push(rec.record_date.toString())
    }))

    if (errs.length) {
      const errStr = errs.join('\n')
      return reply(Boom.badRequest(errStr))
    }

    saveQty = propRecs.length
    recordDtes = _.uniq(recordDtes).sort()

    // Intentionally not using UTC so we can display dates in current locale
    const records = recordDtes.map(d => moment(d.toString()).toDate())
    const recordRange = { start: records[0], end: records[records.length - 1] }

    // STEP 5 - Create log record
    const exportRec = {
      type: 'propane',
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
