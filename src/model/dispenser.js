

const mongoose = require('mongoose')

const { Schema } = mongoose

const dispenserSchema = new Schema(
  {
    gradeID: {
      type: Number,
      required: true,
      index: true,
    },
    gradeLabel: {
      type: String,
    },
    openingDollar: {
      type: Number,
    },
    openingLitre: {
      type: Number,
    },
    openingResetDate: {
      type: Date,
    },
    number: {
      type: Number,
    },
    numberAndGrade: {
      type: String,
    },
    stationID: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Dispenser = mongoose.model('Dispenser', dispenserSchema)

module.exports = Dispenser
