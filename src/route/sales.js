const SalesHandler = require('../handler/sales')

const handler = new SalesHandler()

module.exports = [
  {
    method: 'GET',
    path: '/sales',
    handler: handler.find,
  },
  {
    method: 'GET',
    path: '/sales/{crit}',
    handler: handler.findByCriteria,
  },
  {
    method: 'GET',
    path: '/sale/{id}',
    handler: handler.findOne,
  },
  {
    method: 'POST',
    path: '/sale-shift',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.createShift,
  },
  {
    method: 'PUT',
    path: '/sale/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.update,
  },
  {
    method: 'PUT',
    path: '/sale-attendant/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.updateAttendant,
  },
  {
    method: 'PUT',
    path: '/sale-otherfuel/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.updateOtherFuel,
  },
  {
    method: 'PATCH',
    path: '/sale/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.patch,
  },
  {
    method: 'PATCH',
    path: '/sale-summary/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.patchSummary,
  },
  {
    method: 'PATCH',
    path: '/sale-otherfuel/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.patchOtherFuel,
  },
  {
    method: 'DELETE',
    path: '/sale/{id}',
    handler: handler.remove,
  },
  {
    method: 'DELETE',
    path: '/sale-shift',
    handler: handler.removeShift,
  },
]
