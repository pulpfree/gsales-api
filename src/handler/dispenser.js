import Boom from '@hapi/boom'

const sanz = require('mongo-sanitize')
// const mongoose = require('mongoose')
const Dispenser = require('../model/dispenser')

function DispenserHandler() {}

DispenserHandler.prototype.find = async (request, h) => {
  const q = {}
  if (request.query.station) {
    q.stationID = sanz(request.query.station)
  }

  try {
    const items = await Dispenser.find(q)
    return h.response(items)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

/* DispenserHandler.prototype.findOne = (req, reply) => {
  Dispenser.findById(sanz(req.params.id), (err, item) => {
    if (err) {
      return reply(Boom.badRequest(err))
    }
    reply(item)
  })
}

DispenserHandler.prototype.create = (req, reply) => {
  const dispenser = new Dispenser({
    gradeID: sanz(req.payload.gradeID),
    number: sanz(req.payload.number),
    numberAndGrade: sanz(req.payload.numberAndGrade),
    openingDollar: sanz(req.payload.openingDollar),
    openingLitre: sanz(req.payload.openingLitre),
    openingResetDate: sanz(req.payload.openingResetDate),
    stationID: sanz(req.payload.stationID),
  })
  const error = dispenser.validateSync()
  if (error) return reply(Boom.badRequest(error))

  dispenser.save((err) => {
    if (err) return reply(Boom.badRequest(err))
    reply(dispenser).code(201)
  })
}

DispenserHandler.prototype.update = (req, reply) => {
  const id = sanz(req.params.id)
  const updateVals = {}

  const props = Object.keys(Dispenser.schema.paths)
  props.map((key) => {
    if (req.payload[key]) {
      updateVals[key] = sanz(req.payload[key])
    }
  })

  Dispenser.findByIdAndUpdate(id, updateVals, { runValidators: true, new: true }, (err, data) => {
    if (err) return reply(Boom.badRequest(err))
    reply(data).code(200)
  })
}

DispenserHandler.prototype.patch = (req, reply) => {
  const id = sanz(req.params.id)
  const field = sanz(req.payload.field)
  const value = sanz(req.payload.value)

  const q = {}
  const select = {}

  q[field] = value
  select[field] = 1

  Dispenser.findByIdAndUpdate(id, q, { select, new: true }, (err, model) => {
    if (err) return reply(Boom.badRequest(err))
    reply(model).code(200)
  })
}

DispenserHandler.prototype.remove = (req, reply) => {
  const id = sanz(req.params.id)

  Dispenser.findByIdAndRemove(id, (err) => {
    if (err) reply(Boom.badRequest(err))
    reply({ responseOk: true }).code(200)
  })
} */


module.exports = DispenserHandler
