

const Boom = require('boom')
// const sanz = require('mongo-sanitize')

const RecordExport = require('../model/export-log')

const recordLimit = 30

function ExportLogHandler() {}

ExportLogHandler.prototype.find = (req, reply) => {
  RecordExport.find().limit(recordLimit).sort({ exportDate: -1 }).exec((err, res) => {
    if (err) { return reply(Boom.badRequest(err)) }

    reply(res).code(200)
  })
}

module.exports = ExportLogHandler
