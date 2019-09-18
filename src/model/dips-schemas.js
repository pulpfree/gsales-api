const mongoose = require('mongoose')

const { Schema } = mongoose

const FuelSalesSchema = new Schema(
  {
    fuel_sales: {
      NL: Number,
      SNL: Number,
      DSL: Number,
      CDSL: Number,
    },
    record_date: Number,
    record_ts: Date,
    store_id: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
  },
  {
    collection: 'fuelsale',
  }
)

const StoreSchema = new Schema(
  {
    name: String,
  },
  {
    collection: 'store',
  }
)

module.exports = {
  FuelSales: FuelSalesSchema,
  Stores: StoreSchema,
}
