

const mongoose = require('mongoose')

const { Schema } = mongoose
const addressSchema = require('./address')

const phoneSchema = new Schema(
  {
    countryCode: {
      type: String,
      trim: true,
      default: '1',
    },
    extension: String,
    number: String,
    _id: String,
  }
)

const validateEmail = function (email) {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return re.test(email)
}

const contactSchema = new Schema(
  {
    name: {
      first: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 35,
      },
      last: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 35,
      },
      prefix: String,
    },
    email: {
      type: String,
      index: true,
      trim: true,
      unique: true,
      validate: [validateEmail, 'Please fill a valid email address'],
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
    },
    phones: [phoneSchema],
    position: {
      type: String,
      trim: true,
      validate: {
        validator: value => /^(president|executive|employee|other)$/i.test(value),
      },
    },
    type: {
      type: String,
      trim: true,
      validate: {
        validator: value => /^(personal|business|other|user)$/i.test(value),
      },
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
  }
)

const Contact = mongoose.model('Contact', contactSchema)

module.exports = Contact
