

const mongoose = require('mongoose')

const { Schema } = mongoose

const exportSchema = new Schema(
  {
    type: String,
    exportDate: Date,
    details: {},
  },
  {
    timestamps: true,
    collection: 'record-export',
  }
)

const RecordExport = mongoose.model('RecordExport', exportSchema)

module.exports = RecordExport
