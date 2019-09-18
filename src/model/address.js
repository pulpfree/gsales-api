

const mongoose = require('mongoose')

const { Schema } = mongoose

const addressSchema = new Schema(
  {
    city: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 55,
      trim: true,
    },
    country: {
      type: String,
      minlength: 3,
      maxlength: 55,
      trim: true,
    },
    countryCode: {
      type: String,
      minlength: 2,
      maxlength: 2,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
    },
    provinceCode: {
      type: String,
      minlength: 2,
      maxlength: 2,
    },
    street1: {
      type: String,
      trim: true,
    },
    street2: {
      type: String,
      trim: true,
    },
    _id: {
      type: String,
      trim: true,
      // unique: true,
      validate: {
        validator: v => /^(home|work|office|mailing|shipping|other)$/i.test(v),
      },
    },
  },
  {
    timestamps: true,
  }
)

// const Address = mongoose.model('Address', addressSchema)

// module.exports = Address
module.exports = addressSchema
