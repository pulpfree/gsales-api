

const Boom = require('boom')
const flatten = require('flat')
const { unflatten } = require('flat')
const Fueldefinition = require('../model/fuel-definition')

function UtilHandler() {}

UtilHandler.prototype.fetchFuelDefinitions = (req, reply) => {
  Fueldefinition.find({}, (err, items) => {
    if (err) return reply(Boom.badRequest(err))
    reply(items)
  })
}

UtilHandler.prototype.validateValues = (values, type) => {
  let keyMap = []

  if (type === 'nonFuelSaleAdjust') {
    keyMap = [
      {
        key: 'adjust',
        type: 'integer',
      },
      {
        key: 'amount',
        type: 'float',
      },
      {
        key: 'close',
        type: 'integer',
      },
      {
        key: 'sales',
        type: 'float',
      },
      {
        key: 'sold',
        type: 'integer',
      },
      {
        key: 'stock',
        type: 'integer',
      },
      {
        key: 'attendantID',
        type: 'skip',
      },
      {
        key: 'productID',
        type: 'skip',
      },
    ]
  }

  return convert(values, keyMap)
}

const convert = (obj, objMap) => {
  const newObj = {}
  const flatObj = flatten(obj)

  for (const key in flatObj) {
    let haveKey = false

    objMap.forEach((m) => {
      const regex = new RegExp(`${m.key}$`)
      if (regex.test(key)) {
        haveKey = true
        switch (m.type) {
          case 'integer':
            newObj[key] = parseInt(flatObj[key], 10)
            break
          case 'float':
            newObj[key] = parseFloat(flatObj[key])
            break
          default:
            newObj[key] = flatObj[key]
        }
      }
    })

    if (!haveKey) {
      newObj[key] = flatObj[key]
    }
  }
  return unflatten(newObj)
}

module.exports = UtilHandler
