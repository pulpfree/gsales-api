

const mongoose = require('mongoose')

const { Schema } = mongoose

const fuelSalesSchema = new Schema(
  {
    dispenserID: {
      type: Schema.Types.ObjectId,
      ref: 'Dispenser',
    },
    dollars: {
      diff: Number,
      close: { type: Number, default: 0.00 },
      net: Number,
      open: Number,
      theoretical: Number,
    },
    gradeID: {
      type: Number,
      ref: 'FuelDefinition',
    },
    litres: {
      open: Number,
      close: { type: Number, default: 0.00 },
      net: Number,
    },
    recordDate: Date,
    recordNum: String,
    stationID: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
    },
  },
  {
    collection: 'fuel-sales',
    timestamps: true,
  }
)

const FuelSales = mongoose.model('FuelSales', fuelSalesSchema)

module.exports = FuelSales
