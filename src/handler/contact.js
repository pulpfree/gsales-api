import Boom from '@hapi/boom'

const sanz = require('mongo-sanitize')
const util = require('util')
const Contact = require('../model/contact')
const User = require('../model/user')

function ContactHandler() {}

ContactHandler.prototype.find = (req, reply) => {
  Contact.find({}, (err, items) => {
    if (err) {
      return reply(Boom.badRequest(err))
    }
    reply(items)
  })
}

ContactHandler.prototype.findOne = (req, reply) => {
  Contact.findById(sanz(req.params.id), (err, item) => {
    if (err) {
      return reply(Boom.badRequest(err))
    }
    reply(item)
  })
}

ContactHandler.prototype.create = (req, reply) => {
  const contact = new Contact({
    name: {
      first: sanz(req.payload.name.first),
      last: sanz(req.payload.name.last),
      prefix: sanz(req.payload.name.prefix),
    },
    addresses: setNewAddresses(req.payload.addresses),
    email: sanz(req.payload.email),
    client: sanz(req.payload.client),
    phones: formatPhones(req.payload.phones),
    position: sanz(req.payload.position),
    type: sanz(req.payload.type),
  })
  const error = contact.validateSync()
  if (error) return reply(Boom.badRequest(error))

  contact.save((err) => {
    if (err) return reply(Boom.badRequest(err))
    reply(contact).code(201)
  })
}

ContactHandler.prototype.createUserAndContact = (req, reply) => {
  const contact = new Contact({
    name: {
      first: sanz(req.payload.contact.name.first),
      last: sanz(req.payload.contact.name.last),
      prefix: sanz(req.payload.contact.name.prefix),
    },
    addresses: setNewAddresses(req.payload.contact.addresses),
    email: sanz(req.payload.contact.email),
    client: sanz(req.payload.contact.client),
    phones: formatPhones(req.payload.contact.phones),
    position: sanz(req.payload.contact.position),
    type: sanz(req.payload.contact.type),
  })
  const error = contact.validateSync()
  if (error) return reply(Boom.badRequest(error))

  contact.save((err) => {
    if (err) return reply(Boom.badRequest(err))
    if (!contact._id) return reply(Boom.badRequest('Failed to create contact id'))

    const user = new User({
      email: sanz(req.payload.user.email),
      password: req.payload.user.password,
      contact: String(sanz(contact._id)),
      active: req.payload.user.active,
      scope: sanz(req.payload.user.scope),
    })
    const error = user.validateSync()
    if (error) return reply(Boom.badRequest(error))

    user.save((err) => {
      if (err) return reply(Boom.badRequest(err))
      reply(user).code(201)
    })
  })
}

ContactHandler.prototype.updateUserAndContact = (req, reply) => {
  const id = sanz(req.params.id)
  const contactProps = Object.keys(Contact.schema.paths)
  const userProps = Object.keys(User.schema.paths)

  User.findById(id, { email: 1, scope: 1, contact: 1 }, (err, user) => {
    if (err) return reply(Boom.badRequest(err))
    userProps.map((key) => {
      if (typeof req.payload.user[key] !== 'undefined') {
        user[key] = sanz(req.payload.user[key])
      }
    })
    user.hashPassword()
    user.setBits()

    User.updateOne({ _id: id }, user, { runValidators: true }, (err) => {
      if (err) return reply(Boom.badRequest(err))
    })
    Contact.findById(user.contact, (err, contact) => {
      if (err) return reply(Boom.badRequest(err))

      contactProps.map((key) => {
        // fixme: need a better method for this
        if (req.payload.contact.name.first) {
          contact.name.first = sanz(req.payload.contact.name.first)
        }
        if (req.payload.contact.name.last) {
          contact.name.last = sanz(req.payload.contact.name.last)
        }
        if (req.payload.contact[key]) {
          contact[key] = sanz(req.payload.contact[key])
        }
      })
      Contact.updateOne({ _id: user.contact }, contact, { runValidators: true }, (err) => {
        if (err) return reply(Boom.badRequest(err))
        user.contact = contact
        reply(user).code(200)
      })
    })
  })
}

ContactHandler.prototype.update = (req, reply) => {
  const id = sanz(req.params.id)
  const props = Object.keys(Contact.schema.paths)

  Contact.findById(id, (err, contact) => {
    if (err) return reply(Boom.badRequest(err))
    props.map((key) => {
      if (req.payload[key]) {
        // todo: abstract to method
        if (key === 'addresses') {
          const addresses = util.isArray(req.payload.addresses) ? req.payload.addresses : new Array(req.payload.addresses)

          addresses.map((a) => {
            if (contact.addresses.length) { // we have existing addresses
              for (let i = 0; i < contact.addresses.length; i++) { // match existing
                if (a._id == contact.addresses[i]._id) {
                  contact.addresses[i] = a
                } else {
                  contact.addresses.push(a)
                }
              }
            } else { // add new address to addresses field
              contact.addresses.push(a)
            }
          })
        } else if (key === 'phones') {
          const phones = util.isArray(req.payload.phones) ? req.payload.phones : new Array(req.payload.phones)

          phones.map((a) => {
            a.number = formatPhone(a.number)

            if (contact.phones.length) { // we have existing phones
              for (let i = 0; i < contact.phones.length; i++) { // match existing
                if (a._id == contact.phones[i]._id) {
                  contact.phones[i] = a
                } else {
                  contact.phones.push(a)
                }
              }
            } else { // add new address to phones field
              contact.phones.push(a)
            }
          })
        } else {
          contact[key] = sanz(req.payload[key])
        }
      }
    })

    Contact.updateOne({ _id: id }, contact, { runValidators: true }, (err) => {
      if (err) return reply(Boom.badRequest(err))
      reply(contact).code(200)
    })
  })
}

ContactHandler.prototype.patch = (req, reply) => {
  const id = sanz(req.params.id)
  const field = sanz(req.payload.field)
  const value = sanz(req.payload.value)

  const q = {}
  const select = {}

  q[field] = value
  select[field] = 1

  Contact.findByIdAndUpdate(id, q, { select, new: true }, (err, model) => {
    if (err) return reply(Boom.badRequest(err))
    reply(model).code(200)
  })
}

ContactHandler.prototype.remove = (req, reply) => {
  const id = sanz(req.params.id)

  Contact.findByIdAndRemove(id, (err) => {
    if (err) reply(Boom.badRequest(err))
    reply({ responseOk: true }).code(200)
  })
}

function formatPhone(phone) {
  const numbers = phone.replace(/[^\d]/g, '')
  let nums = /^(\d{3})(\d{3})(\d{4})$/.exec(numbers)
  if (nums) {
    nums = `(${nums[1]}) ${nums[2]}-${nums[3]}`
  }
  return nums
}

function formatPhones(phones) {
  if (!phones) return []
  if (!util.isArray(phones)) phones = new Array(phones)
  const ps = []
  phones.map((p) => {
    p.number = formatPhone(p.number)
    ps.push(p)
  })
  return ps
}

function setNewAddresses(addresses) {
  if (!addresses) return []
  if (!util.isArray(addresses)) addresses = new Array(addresses)
  return addresses
}

module.exports = ContactHandler
