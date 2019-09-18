

const mongoose = require('mongoose')

const { Schema } = mongoose

const fuelDefinitionSchema = new Schema(
  {
    _id: Number,
    grade: { type: String },
    label: { type: String },
  },
  {
    collection: 'fuel-definitions',
  }
)

const FuelDefinition = mongoose.model('FuelDefinition', fuelDefinitionSchema)

module.exports = FuelDefinition
