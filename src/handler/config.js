import Boom from '@hapi/boom'

const sanz = require('mongo-sanitize')
const Config = require('../model/config')

function ConfigHandler() {}

ConfigHandler.prototype.findOne = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing product id')
  }

  try {
    const item = await Config.findById(sanz(request.params.id))
    return h.response(item)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

ConfigHandler.prototype.update = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing config id')
  }

  const id = sanz(request.params.id)
  const updateVals = {}

  const props = Object.keys(Config.schema.paths)
  const payKeys = Object.keys(request.payload)
  payKeys.forEach((p) => {
    if (props.includes(p)) {
      updateVals[p] = sanz(request.payload[p])
    }
  })

  try {
    const ret = await Config.findByIdAndUpdate(id, updateVals, { runValidators: true, new: true })
    return h.response(ret)
  } catch (error) {
    return Boom.badRequest(error)
  }
}

ConfigHandler.prototype.patch = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing config id')
  }

  const id = sanz(request.params.id)
  const field = sanz(request.payload.field)
  const value = sanz(request.payload.value)

  const q = {}
  const select = {}

  q[field] = value
  select[field] = 1

  try {
    const ret = await Config.findByIdAndUpdate(id, q, { select, runValidators: true, new: true })
    return h.response(ret)
  } catch (error) {
    return Boom.badRequest(error)
  }
}

module.exports = ConfigHandler
