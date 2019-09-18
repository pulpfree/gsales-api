

const mongoose = require('mongoose')

const { Schema } = mongoose

const employeeSchema = new Schema(
  {
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    nameFirst: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 55,
      trim: true,
    },
    nameLast: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 55,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    primaryStationID: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
    },
  },
  {
    timestamps: true,
  }
)

const Employee = mongoose.model('Employee', employeeSchema)

module.exports = Employee
