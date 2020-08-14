

const mongoose = require('mongoose')

const { Schema } = mongoose

const salesSchema = new Schema(
  {
    attendant: {
      ID: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
      },
      adjustment: { type: String },
      overshortComplete: { type: Boolean, default: false },
      overshortValue: { type: Number, default: 0.00 },
      sheetComplete: { type: Boolean, default: false },
    },
    cash: {
      bills: { type: Number, default: 0.00 },
      debit: { type: Number, default: 0.00 },
      dieselDiscount: { type: Number, default: 0.00 },
      driveOffNSF: { type: Number, default: 0.00 },
      giftCertRedeem: { type: Number, default: 0.00 },
      galesLoyaltyRedeem: { type: Number, default: 0.00 },
      lotteryPayout: { type: Number, default: 0.00 },
      osAdjusted: { type: Number, default: 0.00 },
      other: { type: Number, default: 0.00 },
      payout: { type: Number, default: 0.00 },
      writeOff: { type: Number, default: 0.00 },
    },
    creditCard: {
      amex: { type: Number, default: 0.00 },
      discover: { type: Number, default: 0.00 },
      gales: { type: Number, default: 0.00 },
      mc: { type: Number, default: 0.00 },
      visa: { type: Number, default: 0.00 },
    },
    fuelCosts: {
      fuel_1: Number,
      fuel_2: Number,
      fuel_3: Number,
      fuel_4: Number,
      fuel_5: Number,
      fuel_6: Number,
    },
    meta: {
      calculations: {},
    },
    nonFuelAdjustVals: Array,
    nonFuelAdjustOS: { type: Number, default: 0.00 },
    otherFuel: {
      propane: {
        dollar: Number,
        litre: Number,
      },
    },
    otherNonFuel: {
      giftCerts: { type: Number, default: 0.00 },
      bobs: { type: Number, default: 0.00 },
    },
    otherNonFuelBobs: {
      bobsGiftCerts: { type: Number, default: 0.00 },
    },
    overshort: {
      amount: { type: Number, default: 0.0 },
      descrip: { type: String, default: '' },
    },
    recordNum: { type: String, required: true },
    recordDate: { type: Date, required: true },
    salesSummary: {
      // bobsFuelAdj: { type: Number, default: 0.0 }, //TODO: remove after renaming to fuelAdjust
      fuelAdjust: { type: Number, default: 0.0 },
      cashTotal: { type: Number, default: 0.0 },
      creditCardTotal: { type: Number, default: 0.0 },
      cashCCTotal: { type: Number, default: 0.0 },
      fuel: {
        fuel_1: {
          dollar: Number,
          litre: Number,
        },
        fuel_2: {
          dollar: Number,
          litre: Number,
        },
        fuel_3: {
          dollar: Number,
          litre: Number,
        },
        fuel_4: {
          dollar: Number,
          litre: Number,
        },
        fuel_5: {
          dollar: Number,
          litre: Number,
        },
        fuel_6: {
          dollar: Number,
          litre: Number,
        },
      },
      fuelDollar: { type: Number, default: 0.00 },
      fuelLitre: { type: Number, default: 0.000 },
      otherFuelDollar: { type: Number, default: 0.00 },
      otherFuelLitre: { type: Number, default: 0.000 },
      product: { type: Number, default: 0.00 },
      totalSales: { type: Number, default: 0.00 },
      totalNonFuel: { type: Number, default: 0.00 },
    },
    shift: {
      number: { type: Number, required: true },
      flag: { type: Boolean, default: false },
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

const Sales = mongoose.model('Sales', salesSchema)

module.exports = Sales
