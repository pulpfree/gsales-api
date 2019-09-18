

const co = require('co')
const moment = require('moment')
const Sales = require('./model/sales')

const tPaths = ['sale', 'sale-non-fuel', 'sale-summary', 'sale-otherfuel']
// const monthDayLimit = 15
const monthDayLimit = 30

const RequestValidator = {

  test: (params) => {
    const path = params.path.split('/')[1]
    const idx = tPaths.indexOf(path)
    if (idx < 0 || params.method === 'get') {
      return true
    }

    const today = moment.utc()
    let recordDate

    return co(function* () {
      let doc
      try {
        doc = yield Sales.findById(params.params.id, { recordDate: 1 }).exec()
      } catch (err) {
        console.error(err) // eslint-disable-line
        return false
      }
      recordDate = moment.utc(doc.recordDate)

      if (recordDate.month() === today.month()) {
        return true
      }
      const monthDiff = (today.month() - recordDate.month())
      if (monthDiff > 1) {
        console.error(`Month invalid: ${today.month()}`) // eslint-disable-line
        return false
      }
      // at this point it's safe to assume the record date is in the previous month. Now just check the current day
      if (today.get('date') >= monthDayLimit) {
        console.error(`Past ${monthDayLimit} day limit: ${today.get('date')}`) // eslint-disable-line
        return false
      }
      return true
    })
  },
}

module.exports = RequestValidator
