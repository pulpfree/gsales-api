/* eslint-disable no-case-declarations, no-underscore-dangle */

import Boom from '@hapi/boom'
const sanz = require('mongo-sanitize')
// const mongoose = require('mongoose')
// const util = require('util')
const Journal = require('../model/journal')

function JournalHandler() {}

JournalHandler.prototype.find = async (request, h) => {
  const q = {}
  if (request.query.type) {
    q.type = sanz(decodeURIComponent(request.query.type))
  }

  try {
    const items = await Journal.find(q).sort({ recordNum: -1 }).limit(50)
    return h.response(items)
  } catch (error) {
    return Boom.badImplementation(error)
  }
}

JournalHandler.prototype.findOne = async (request, h) => {
  if (!request.params.id) {
    return Boom.expectationFailed('Missing journal id')
  }
  const ID = sanz(request.params.id)

  try {
    const item = await Journal.findById(ID).exec()
    return h.response(item)
  } catch (error) {
    return Boom.badImplementation(error)
  }
}

JournalHandler.prototype.create = async (request, h) => {
  const { payload } = request
  const journal = new Journal({
    adjustDate: sanz(payload.adjustDate),
    description: sanz(payload.description),
    type: sanz(payload.type),
    recordDate: sanz(payload.recordDate),
    recordsAffected: sanz(payload.recordsAffected),
    recordNum: sanz(payload.recordNum),
    stationID: sanz(payload.stationID),
    values: sanz(payload.values),
  })
  const error = journal.validateSync()
  if (error) return Boom.badRequest(error)

  try {
    await journal.save()
    return h.response({ id: journal._id }).code(201)
  } catch (err) {
    return Boom.badImplementation(err)
  }
  /* journal.save((err) => {
    if (err) return reply(Boom.badRequest(err))
    reply(journal).code(201)
  }) */
}

JournalHandler.prototype.report = async (request, h) => {
  if (!request.query.stationID) {
    return Boom.expectationFailed('Missing stationID value')
  }
  if (!request.query.recordNum) {
    return Boom.expectationFailed('Missing recordNum value')
  }
  const stationID = sanz(decodeURIComponent(request.query.stationID))
  const recordNum = sanz(decodeURIComponent(request.query.recordNum))

  const q = {
    recordNum,
    stationID,
  }

  try {
    const items = await Journal.find(q).sort({ createdAt: 1 }).exec()
    return h.response(items)
  } catch (error) {
    return Boom.badImplementation(error)
  }
}

module.exports = JournalHandler
