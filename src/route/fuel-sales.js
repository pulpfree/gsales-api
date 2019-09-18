

const FuelSalesHandler = require('../handler/fuel-sales')

const handler = new FuelSalesHandler()

module.exports = [
  {
    method: 'PUT',
    path: '/fuel-sales',
    handler: handler.updateAll,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'PUT',
    path: '/fuel-sales-opening',
    handler: handler.adjustOpening,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'PUT',
    path: '/fuel-sales-reset',
    handler: handler.resetDispenser,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
]
