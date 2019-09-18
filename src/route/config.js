const ConfigHandler = require('../handler/config')

const handler = new ConfigHandler()

module.exports = [
  {
    method: 'GET',
    path: '/config/{id}',
    config: {
      handler: handler.findOne,
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'PUT',
    path: '/config/{id}',
    config: {
      payload: {
        output: 'data',
      },
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
    handler: handler.update,
  },
  {
    method: 'PATCH',
    path: '/config/{id}',
    config: {
      payload: {
        output: 'data',
      },
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
    handler: handler.patch,
  },
]
