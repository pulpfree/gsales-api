

const mongoose = require('mongoose')

const { Schema } = mongoose

const productSchema = new Schema(
  {
    productID: Schema.Types.ObjectId,
    sortOrder: Number,
  }
)

const stationSchema = new Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
    },
    isBobs: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    products: [productSchema],
  },
  {
    timestamps: true,
  }
)

const Station = mongoose.model('Station', stationSchema)

module.exports = Station
