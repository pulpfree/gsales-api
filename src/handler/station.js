

import Boom from '@hapi/boom'
const sanz = require('mongo-sanitize')
const Station = require('../model/station')

function StationHandler() {}

StationHandler.prototype.find = async (request, h) => {
  const q = {}
  let fields = {}

  if (request.query.list) {
    fields = { name: 1, street: 1, phone: 1 }
  }

  try {
    const items = await Station.find(q, fields).sort({ name: 1 })
    return h.response(items)
  } catch (err) {
    return Boom.badImplementation(err)
  }
}

StationHandler.prototype.findOne = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing station id')
  }
  try {
    const item = await Station.findById(sanz(request.params.id))
    return h.response(item)
  } catch (err) {
    return Boom.badImplementation(err)
  }
}

StationHandler.prototype.create = async (request, h) => {
  if (!request.payload.city) {
    return Boom.badRequest('Missing city value')
  }
  if (!request.payload.name) {
    return Boom.badRequest('Missing name value')
  }
  if (!request.payload.phone) {
    return Boom.badRequest('Missing phone value')
  }
  if (!request.payload.street) {
    return Boom.badRequest('Missing street value')
  }

  const station = new Station({
    city: sanz(request.payload.city),
    name: sanz(request.payload.name),
    phone: sanz(request.payload.phone),
    street: sanz(request.payload.street),
  })
  const error = station.validateSync()
  if (error) return Boom.badRequest(error)

  try {
    const res = await station.save()
    return h.response(res)
  } catch (err) {
    console.error('err:', err) // eslint-disable-line no-console
    return Boom.badRequest(err)
  }
}

StationHandler.prototype.update = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing station id')
  }

  const id = sanz(request.params.id)
  const updateVals = {}

  const props = Object.keys(Station.schema.paths)
  const payKeys = Object.keys(request.payload)
  payKeys.forEach((p) => {
    if (props.includes(p)) {
      updateVals[p] = sanz(request.payload[p])
    }
  })

  // return Boom.badRequest('Test error message with some more info here...')
  try {
    const ret = await Station.findByIdAndUpdate(id, updateVals, { runValidators: true, new: true })
    return h.response(ret)
  } catch (error) {
    return Boom.badRequest(error)
  }
}

StationHandler.prototype.patch = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing station id')
  }

  const id = sanz(request.params.id)
  const field = sanz(request.payload.field)
  const value = sanz(request.payload.value)

  const q = {}
  const select = {}

  q[field] = value
  select[field] = 1

  try {
    const ret = await Station.findByIdAndUpdate(id, q, { select, runValidators: true, new: true })
    return h.response(ret)
  } catch (error) {
    return Boom.badRequest(error)
  }
}

StationHandler.prototype.remove = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing station id')
  }

  const id = sanz(request.params.id)

  try {
    await Station.findByIdAndRemove(id)
    return h.response()
  } catch (error) {
    return Boom.badRequest(error)
  }
}

module.exports = StationHandler
