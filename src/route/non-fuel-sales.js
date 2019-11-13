const NonFuelSalesHandler = require('../handler/non-fuel-sales')

const handler = new NonFuelSalesHandler()

module.exports = [
  {
    method: 'PUT',
    path: '/non-fuel-sale-misc/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.updateMisc,
  },
  {
    method: 'PUT',
    path: '/non-fuel-sale-products/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.updateProducts,
  },
  {
    method: 'PATCH',
    path: '/non-fuel-sale/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.patch,
  },
]
