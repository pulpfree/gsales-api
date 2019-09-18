

const EmployeeHandler = require('../handler/employee')

const handler = new EmployeeHandler()

module.exports = [
  {
    method: 'GET',
    path: '/employees',
    handler: handler.find,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'GET',
    path: '/employee-list',
    handler: handler.activeList,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'GET',
    path: '/employee/{id}',
    handler: handler.findOne,
    config: {
      // auth: {
      //   scope: ['accounts', 'admin', 'cash', 'su']
      // }
    },
  },
  {
    method: 'POST',
    path: '/employee',
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
    path: '/employee/{id}',
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
    path: '/employee/{id}',
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
    path: '/employee/{id}',
    handler: handler.remove,
    config: {
      // auth: {
      //   scope: ['su', 'admin']
      // }
    },
  },
]
