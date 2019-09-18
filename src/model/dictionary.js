

const mongoose = require('mongoose')

const { Schema } = mongoose

const dictionarySchema = new Schema(
  {
    term: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    accepted: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: true,
      validate: {
        validator: v => /^(store|general)$/i.test(v),
      },
    },
    description: {
      type: String,
    },
    termHistory: Array,
  },
  {
    timestamps: true,
  }
)

const Dictionary = mongoose.model('Dictionary', dictionarySchema)

module.exports = Dictionary
