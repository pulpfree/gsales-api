

const mongoose = require('mongoose')

const { Schema } = mongoose

const productSchema = new Schema(
  {
    category: {
      type: String,
      trim: true,
      indexed: true,
    },
    commissionEligible: {
      type: Boolean,
      default: false,
    },
    cost: {
      type: Number,
    },
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 55,
      trim: true,
      indexed: true,
    },
    oilProduct: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    taxable: {
      type: Boolean,
      indexed: true,
      default: false,
    },
    type: {
      type: String,
      indexed: true,
    },
  },
  {
    timestamps: true,
  }
)

const Product = mongoose.model('Product', productSchema)

module.exports = Product
