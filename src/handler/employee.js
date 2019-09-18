

const Boom = require('boom')
const sanz = require('mongo-sanitize')
const Employee = require('../model/employee')

function EmployeeHandler() {}

EmployeeHandler.prototype.find = async (request, h) => {
  const q = {}
  let field
  if (request.query.active) {
    q.active = request.query.active
  }
  if (request.query.field && request.query.search) {
    field = request.query.field // eslint-disable-line prefer-destructuring
    q[field] = new RegExp(`^${request.query.search}`, 'i')
  }
  const p = Employee.find(q)
  if (field) {
    p.sort({ [field]: 1 })
  } else {
    p.sort({ nameLast: 1 })
  }

  try {
    const item = await p.exec()
    return h.response(item)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

EmployeeHandler.prototype.activeList = async (request, h) => {
  try {
    const items = await Employee
      .find({ active: true })
      .select({ nameFirst: 1, nameLast: 1 })
      .sort({ nameLast: 1 })
      .exec()
    return h.response(items)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

EmployeeHandler.prototype.findOne = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing employee id')
  }

  try {
    const item = await Employee.findById(sanz(request.params.id))
    return h.response(item)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

EmployeeHandler.prototype.create = async (request, h) => {
  if (!request.payload) {
    return Boom.badRequest('Missing employee fields')
  }

  const empVals = {}
  const props = Object.keys(Employee.schema.paths)

  const payKeys = Object.keys(request.payload)
  payKeys.forEach((p) => {
    if (props.includes(p)) {
      empVals[p] = sanz(request.payload[p])
    }
  })

  const employee = new Employee(empVals)
  const error = employee.validateSync()
  if (error) return Boom.badRequest(error)

  try {
    const item = await employee.save()
    return h.response(item)
  } catch (err) {
    return Boom.badRequest(err)
  }
}

EmployeeHandler.prototype.update = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing employee id')
  }

  const id = sanz(request.params.id)
  const updateVals = {}
  const props = Object.keys(Employee.schema.paths)
  const payKeys = Object.keys(request.payload)
  payKeys.forEach((p) => {
    if (props.includes(p)) {
      updateVals[p] = sanz(request.payload[p])
    }
  })

  try {
    const ret = await Employee.findByIdAndUpdate(id, updateVals, { runValidators: true, new: true })
    return h.response(ret)
  } catch (error) {
    return Boom.badRequest(error)
  }
}

EmployeeHandler.prototype.patch = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing employee id')
  }

  const id = sanz(request.params.id)
  const field = sanz(request.payload.field)
  const value = sanz(request.payload.value)

  const q = {}
  const select = {}

  q[field] = value
  select[field] = 1

  try {
    const ret = await Employee.findByIdAndUpdate(id, q, { select, runValidators: true, new: true })
    return h.response(ret)
  } catch (error) {
    return Boom.badRequest(error)
  }
}

EmployeeHandler.prototype.remove = async (request, h) => {
  if (!request.params.id) {
    return Boom.badRequest('Missing employee id')
  }

  const id = sanz(request.params.id)

  try {
    await Employee.findByIdAndRemove(id)
    return h.response()
  } catch (error) {
    return Boom.badRequest(error)
  }
}

module.exports = EmployeeHandler
