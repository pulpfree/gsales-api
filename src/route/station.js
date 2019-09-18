const StationHandler = require('../handler/station')

const handler = new StationHandler()

module.exports = [
  {
    method: 'GET',
    path: '/stations',
    handler: handler.find,
    config: {
      // auth: {
      //   scope: ['su', 'admin', 'cash', 'accounts']
      // }
    },
  },
  {
    method: 'GET',
    path: '/station/{id}',
    handler: handler.findOne,
    config: {
      // auth: {
      //   scope: ['su', 'admin', 'cash', 'accounts']
      // }
    },
  },
  {
    method: 'POST',
    path: '/station',
    config: {
      payload: {
        output: 'data',
      },
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
    handler: handler.create,
  },
  {
    method: 'PUT',
    path: '/station/{id}',
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
    path: '/station/{id}',
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
  {
    method: 'DELETE',
    path: '/station/{id}',
    handler: handler.remove,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
]
