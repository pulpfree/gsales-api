

const ProductHandler = require('../handler/product')

const handler = new ProductHandler()

module.exports = [
  {
    method: 'GET',
    path: '/products',
    handler: handler.find,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'GET',
    path: '/product/{id}',
    handler: handler.findOne,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'POST',
    path: '/product',
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
    path: '/product/{id}',
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
    path: '/product/{id}',
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
    path: '/product/{id}',
    handler: handler.remove,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
]
