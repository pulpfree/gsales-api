

const mongoose = require('mongoose')

const { Schema } = mongoose

const FuelSaleSchema = new Schema(
  {
    _id: String,
    fuel_sales: {
      NL: Number,
      SNL: Number,
      DSL: Number,
      CDSL: Number,
      PROP: Number,
    },
    fuel1_cost: Number,
    import_date: Date,
    record_date: Number,
    record_ts: Date,
    store_id: String,
  },
  {
    collection: 'fuelsale',
  }
)

const FuelSaleImportSchema = new Schema(
  {
    fuel_costs: {},
    fuel_sales: {
      NL: Number,
      SNL: Number,
      DSL: Number,
      CDSL: Number,
      PROP: Number,
    },
    fuel_sums: {
      fuel1: Number,
      fuel2: Number,
      fuel3: Number,
      fuel4: Number,
      fuel5: Number,
      fuel6: Number,
    },
    import_date: Date,
    record_date: Number,
    record_ts: Date,
    shift: Number,
    status: String,
    station_id: Schema.Types.ObjectId,
  },
  {
    collection: 'fuelsale_import',
  }
)

const ImportLogSchema = new Schema(
  {
    timestamp: Date,
    date_from: Date,
    date_to: Date,
  },
  {
    collection: 'fuelsale_import_log',
  }
)

const StoreSchema = new Schema(
  {
    aggregate_ids: Array,
  },
  {
    collection: 'store',
  }
)

module.exports = {
  FuelSaleSchema,
  FuelSaleImportSchema,
  ImportLogSchema,
  StoreSchema,
}
