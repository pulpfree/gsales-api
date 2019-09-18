const SalesHandler = require('../handler/sales')

const handler = new SalesHandler()

module.exports = [
  {
    method: 'GET',
    path: '/sales',
    handler: handler.find,
    // config: {
    // auth: {
    //   scope: ['accounts', 'admin', 'cash', 'su']
    // }
    // }
  },
  {
    method: 'GET',
    path: '/sales/{crit}',
    handler: handler.findByCriteria,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'GET',
    path: '/sale/{id}',
    handler: handler.findOne,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'POST',
    path: '/sale-shift',
    config: {
      payload: {
        output: 'data',
      },
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
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
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
    handler: handler.update,
  },
  {
    method: 'PATCH',
    path: '/sale/{id}',
    config: {
      payload: {
        output: 'data',
      },
    //   auth: {
    //     scope: ['accounts', 'admin', 'cash', 'su']
    //   }
    },
    handler: handler.patch,
  },
  {
    method: 'PATCH',
    path: '/sale-non-fuel/{id}',
    config: {
      payload: {
        output: 'data',
      },
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
    handler: handler.patchNonFuel,
  },
  {
    method: 'PATCH',
    path: '/sale-summary/{id}',
    config: {
      payload: {
        output: 'data',
      },
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
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
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
    handler: handler.patchOtherFuel,
  },
  {
    method: 'DELETE',
    path: '/sale/{id}',
    handler: handler.remove,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'DELETE',
    path: '/sale-shift',
    handler: handler.removeShift,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
]
