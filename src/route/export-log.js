

const ExportLogHandler = require('../handler/export-log')

const handler = new ExportLogHandler()

module.exports = {
  method: 'GET',
  path: '/export-log',
  handler: handler.find,
  config: {
    // auth: {
    //   scope: ['accounts', 'admin', 'cash', 'su']
    // }
  },
}
