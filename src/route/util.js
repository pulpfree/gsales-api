

const UtilHandler = require('../handler/util')

const handler = new UtilHandler()

module.exports = {
  method: 'GET',
  path: '/fuel-definitions',
  handler: handler.fetchFuelDefinitions,
  config: {
    // auth: {
    //   scope: ['accounts', 'admin', 'cash', 'su']
    // }
  },
}
