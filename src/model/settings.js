

const mongoose = require('mongoose')

const { Schema } = mongoose

const settingsSchema = new Schema(
  {
    grade: String,
    label: String,
  },
  {
    timestamps: true,
  }
)

const Settings = mongoose.model('Settings', settingsSchema)

module.exports = Settings
