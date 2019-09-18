

const mongoose = require('mongoose')

const { Schema } = mongoose

const PropaneSchema = new Schema(
  {
    _id: String,
    fuel_sales: Number,
    import_date: Date,
    record_date: Number,
    record_ts: Date,
    store_id: Schema.Types.ObjectId,
    tank_id: Number,
  },
  {
    collection: 'propane',
  }
)

const PropaneImportSchema = new Schema(
  {
    dispenser_id: Schema.Types.ObjectId,
    litres: Number,
    record_date: Number,
    record_ts: Date,
    status: String,
    store_id: Schema.Types.ObjectId,
  },
  {
    collection: 'propane_import',
  }
)

module.exports = {
  PropaneSchema,
  PropaneImportSchema,
}
