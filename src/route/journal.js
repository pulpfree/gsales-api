

const JournalHandler = require('../handler/journal')

const handler = new JournalHandler()

module.exports = [
  {
    method: 'GET',
    path: '/journals',
    handler: handler.find,
  },
  {
    method: 'GET',
    path: '/journal/{id}',
    handler: handler.findOne,
  },
  {
    method: 'GET',
    path: '/journal-report',
    handler: handler.report,
  },
  {
    method: 'POST',
    path: '/journal',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.create,
  },
]
