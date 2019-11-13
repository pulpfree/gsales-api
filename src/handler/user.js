

import Boom from '@hapi/boom'
const sanz = require('mongo-sanitize')
const User = require('../model/user')
const Contact = require('../model/contact')

function UserHandler() {}

UserHandler.prototype.find = (req, reply) => {
  User.find({}).sort({ email: 1 }).exec((err, items) => {
    if (err) return reply(Boom.badRequest(err))
    reply(items)
  })
}

UserHandler.prototype.findOne = (req, reply) => {
  const userID = sanz(req.params.id)
  const q = User.findById(userID)
  if (req.query.populate) {
    q.populate('contact')
  }
  q.exec().then((item) => {
    reply(item)
  })
}

UserHandler.prototype.create = (req, reply) => {
  const user = new User({
    email: sanz(req.payload.email),
    password: req.payload.password,
    contact: String(sanz(req.payload.contact)),
    active: sanz(req.payload.active),
    scope: sanz(req.payload.scope),
  })

  const error = user.validateSync()
  if (error) return reply(Boom.badRequest(error))

  user.save((err) => {
    if (err) return reply(Boom.badRequest(err))
    reply(user).code(201)
  })
}

UserHandler.prototype.update = (req, reply) => {
  const id = sanz(req.params.id)
  const updateVals = {}

  const props = Object.keys(User.schema.paths)
  props.map((key) => {
    if (req.payload[key]) {
      updateVals[key] = sanz(req.payload[key])
    }
  })

  User.findByIdAndUpdate(id, updateVals, { runValidators: true, new: true }, (err, data) => {
    if (err) return reply(Boom.badRequest(err))
    reply(data).code(200)
  })
}

UserHandler.prototype.patch = (req, reply) => {
  const id = sanz(req.params.id)
  const field = sanz(req.payload.field)
  const value = sanz(req.payload.value)

  const q = {}
  const select = {}

  q[field] = value
  select[field] = 1

  User.findByIdAndUpdate(id, q, { select, new: true }, (err, model) => {
    if (err) return reply(Boom.badRequest(err))
    reply(model).code(200)
  })
}

UserHandler.prototype.remove = (req, reply) => {
  const id = sanz(req.params.id)

  User.findById(id, (err, user) => {
    if (err) reply(Boom.badRequest(err))
    Contact.findByIdAndRemove(user.contact, (err) => {
      if (err) reply(Boom.badRequest(err))
    })
    User.findByIdAndRemove(id, (err) => {
      if (err) reply(Boom.badRequest(err))
      reply(true).code(200)
    })
  })
}

module.exports = UserHandler
