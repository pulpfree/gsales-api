'use strict'

const test = require('tape')
const mongoose = require('mongoose')

test('main endpoints teardown', function(t) {
  mongoose.disconnect(t.end)
})