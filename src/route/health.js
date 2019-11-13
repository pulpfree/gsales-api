const HealthHandler = require('../handler/health')

const handler = new HealthHandler()

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: handler.getCheck,
  },
]
