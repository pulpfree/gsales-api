

const mongoose = require('mongoose')

const { Schema } = mongoose

const journalSchema = new Schema(
  {
    adjustDate: {
      type: Date,
      required: true,
    },
    description: String,
    recordsAffected: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      trim: true,
      validate: {
        validator: value => /^(fuelSaleAdjust|dispenserReset|nonFuelSaleAdjust|salesSummaryAdjust)$/i.test(value),
      },
    },
    productID: Schema.Types.ObjectId,
    productRecord: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    recordNum: { type: String, required: true },
    stationID: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
    },
    values: Object,
  },
  {
    timestamps: true,
  }
)

const Journal = mongoose.model('Journal', journalSchema)

module.exports = Journal
