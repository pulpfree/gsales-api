

const mongoose = require('mongoose')

const { Schema } = mongoose

const configSchema = new Schema(
  {
    _id: Number,
    hiGradePremium: Number,
    colouredDieselDsc: Number,
    discrepancyFlag: Number,
    commission: Number,
    hST: Number,
  },
  {
    collection: 'config',
    timestamps: true,
  }
)

const Config = mongoose.model('Config', configSchema)

module.exports = Config
