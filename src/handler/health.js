function HealthHandler() {}

HealthHandler.prototype.getCheck = async (request, h) => h.response({ status: 'OK' })

module.exports = HealthHandler
