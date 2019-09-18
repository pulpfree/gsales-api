

const Boom = require('boom')
const sanz = require('mongo-sanitize')
const Product = require('../model/product')

function ProductHandler() {}

ProductHandler.prototype.find = async (request, h) => {
  try {
    const items = await Product.find({}).sort({ category: -1, sortOrder: 1, name: 1 })
    return h.response(items)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

ProductHandler.prototype.findOne = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing product id')
  }

  try {
    const item = await Product.findById(sanz(request.params.id))
    return h.response(item)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

ProductHandler.prototype.create = async (request, h) => {
  const product = new Product({
    category: sanz(request.payload.category),
    commissionEligible: sanz(request.payload.commissionEligible),
    cost: sanz(request.payload.cost),
    name: sanz(request.payload.name),
    sortOrder: sanz(request.payload.sortOrder),
    taxable: sanz(request.payload.taxable),
    type: sanz(request.payload.type),
  })
  const error = product.validateSync()
  if (error) return Boom.badRequest(error)

  try {
    const ret = await product.save()
    return h.response(ret)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

ProductHandler.prototype.update = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing product id')
  }

  const id = sanz(request.params.id)
  const updateVals = {}

  const props = Object.keys(Product.schema.paths)
  const payKeys = Object.keys(request.payload)
  payKeys.forEach((p) => {
    if (props.includes(p)) {
      updateVals[p] = sanz(request.payload[p])
    }
  })

  try {
    const ret = await Product.findByIdAndUpdate(id, updateVals, { runValidators: true, new: true })
    return h.response(ret)
  } catch (error) {
    return Boom.badRequest(error)
  }
}

ProductHandler.prototype.patch = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing product id')
  }

  const id = sanz(request.params.id)
  const field = sanz(request.payload.field)
  const value = sanz(request.payload.value)

  const q = {}
  const select = {}

  q[field] = value
  select[field] = 1

  try {
    const ret = await Product.findByIdAndUpdate(id, q, { select, runValidators: true, new: true })
    return h.response(ret)
  } catch (error) {
    return Boom.badRequest(error)
  }
}

ProductHandler.prototype.remove = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing station id')
  }

  const id = sanz(request.params.id)

  try {
    await Product.findByIdAndRemove(id)
    return h.response()
  } catch (error) {
    return Boom.badRequest(error)
  }
}

module.exports = ProductHandler
