/* eslint-disable no-undef */
//
// To run this file, use: mongo pruneLocalTest.js at prompt
//
// Connections
const uri = 'localhost:27017'
const conn = new Mongo(uri)
const removeDte = '2019-01-01'
const db = conn.getDB('gales-sales-test')

const fsRes = db['fuel-sales'].remove({ recordDate: { $lt: ISODate(removeDte) } })
printjson(`fuel-sales records removed: ${fsRes}`)

const nfsRes = db['non-fuel-sales'].remove({ recordDate: { $lt: ISODate(removeDte) } })
printjson(`non-fuel-sales records removed: ${nfsRes}`)

const sRes = db.sales.remove({ recordDate: { $lt: ISODate(removeDte) } })
printjson(`sales records removed: ${sRes}`)
