

const DispenserHandler = require('../handler/dispenser')

const handler = new DispenserHandler()

module.exports = [
  {
    method: 'GET',
    path: '/dispensers',
    handler: handler.find,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  /* {
    method: 'GET',
    path: '/dispenser/{id}',
    handler: handler.findOne,
  }, */
  /* {
    method: 'POST',
    path: '/dispenser',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.create,
  },
  {
    method: 'PUT',
    path: '/dispenser/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.update,
  },
  {
    method: 'PATCH',
    path: '/dispenser/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.patch,
  },
  {
    method: 'DELETE',
    path: '/dispenser/{id}',
    handler: handler.remove,
  }, */
]
