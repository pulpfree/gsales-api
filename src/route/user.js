

const UserHandler = require('../handler/user')

const handler = new UserHandler()

module.exports = [
  {
    method: 'GET',
    path: '/users',
    handler: handler.find,
    config: {
      // auth: {
      //   scope: ['su', 'admin']
      // }
    },
  },
  {
    method: 'GET',
    path: '/user/{id}',
    config: {
      handler: handler.findOne,
    },
  },
  {
    method: 'POST',
    path: '/user',
    config: {
      // auth: {
      //   scope: ['su', 'admin']
      // },
      payload: {
        output: 'data',
      },
    },
    handler: handler.create,
  },
  {
    method: 'PUT',
    path: '/user/{id}',
    config: {
      payload: {
        output: 'data',
      },
      // auth: {
      //   scope: ['su', 'admin']
      // }
    },
    handler: handler.update,
  },
  {
    method: 'PATCH',
    path: '/user/{id}',
    config: {
      // auth: {
      //   scope: ['su', 'admin']
      // },
      payload: {
        output: 'data',
      },
    },
    handler: handler.patch,
  },
  {
    method: 'DELETE',
    path: '/user/{id}',
    handler: handler.remove,
    config: {
      // auth: {
      //   scope: ['su', 'admin']
      // }
    },
  },
]
