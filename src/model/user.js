

// const bcrypt    = require('bcrypt')
// const bcrypt    = require('bcrypt-nodejs')
const mongoose = require('mongoose')

const { Schema } = mongoose
const SALT_FACTOR = 10

const userSchema = new Schema(
  {
    email: {
      type: String,
      index: true,
      unique: true,
    },
    password: {
      type: String,
      // required: true,
    },
    role: {
      type: String,
    },
    scopeBits: {
      type: Number,
    },
    scope: {
      type: Array,
    },
    active: {
      type: Boolean,
      index: true,
      default: false,
      required: true,
    },
    contact: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

/* userSchema.pre('save', function(next) {

  let user = this
  if (!user.isModified('password')) return next()

  if (user.scope) {
    user.scopeBits = setBits(user.scope)
  }

  bcrypt.genSalt(10, (err, salt) => {

    if (err) return next(err)
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err)
      user.password = hash
      // console.log('hash', hash)
      next()
    })
  })
}) */

/* userSchema.method('hashPassword', function () {

  // if (this.password !== undefined) {
  if (this.password && this.password.length > 0) {
    const salt = bcrypt.genSaltSync(SALT_FACTOR)
    this.password = bcrypt.hashSync(this.password, salt)
    // this.password = bcrypt.hashSync(this.password, SALT_FACTOR)
  }
}) */

userSchema.method('setBits', function () {
  if (!this.scope) return
  this.scopeBits = setBits(this.scope)
})

const User = mongoose.model('User', userSchema)

const authRole = {
  accounts: 256,
  admin: 512,
  cash: 1024,
  su: 1,
}

/* const authPrivilege = {
  create:  2,
  read:    4,
  update:  8,
  delete:  16,
  all:     32
} */

const setBits = (scopes) => {
  let bits = 0
  if (!scopes) return bits

  scopes.map((s) => {
    bits += authRole[s]
  })
  return bits
}

/* const getBits = function(bitString) {
  let pcs = bitString.split('.')
  if (pcs.length < 1) return 0

  let bits = authRole[pcs[0]]
  if (pcs.length === 1) return bits

  for (let i=1; i < pcs.length; i++) {
    bits += authPrivilege[pcs[i]]
  }

  return bits
} */

module.exports = User
