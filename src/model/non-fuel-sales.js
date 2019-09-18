

const mongoose = require('mongoose')

const { Schema } = mongoose

const nonFuelSalesSchema = new Schema(
  {
    productID: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    productCat: String,
    qty: {
      close: Number,
      open: Number,
      restock: Number,
      sold: Number,
    },
    recordDate: Date,
    recordNum: String,
    sales: Number,
    stationID: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
    },
    sortOrder: Number,
  },
  {
    collection: 'non-fuel-sales',
    timestamps: true,
  }
)

const NonFuelSales = mongoose.model('NonFuelSales', nonFuelSalesSchema)

module.exports = NonFuelSales
