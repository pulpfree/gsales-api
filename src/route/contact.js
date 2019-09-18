

const ContactHandler = require('../handler/contact')

const handler = new ContactHandler()

module.exports = [
  {
    method: 'GET',
    path: '/contacts',
    handler: handler.find,
  },
  {
    method: 'GET',
    path: '/contact/{id}',
    handler: handler.findOne,
  },
  {
    method: 'POST',
    path: '/contact',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.create,
  },
  {
    method: 'POST',
    path: '/contact-user',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.createUserAndContact,
  },
  {
    method: 'PUT',
    path: '/contact-user/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.updateUserAndContact,
  },
  {
    method: 'PUT',
    path: '/contact/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.update,
  },
  {
    method: 'PATCH',
    path: '/contact/{id}',
    config: {
      payload: {
        output: 'data',
      },
    },
    handler: handler.patch,
  },
  {
    method: 'DELETE',
    path: '/contact/{id}',
    handler: handler.remove,
  },
]
