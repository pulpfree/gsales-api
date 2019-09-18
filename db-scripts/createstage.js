//
// To run this file, use: mongo createstage.js at prompt
//
// Connections
// var uri = 'dbp.pflabs.vpc:27017'
var uri = 'localhost:27017'
var conn = new Mongo(uri)
var removeDte='2017-01-01'
// var db = conn.getDB('gales-sales')
var db = conn.getDB('gales-sales-stage')

db.dropDatabase()

db = conn.getDB('gales-sales')

db.copyDatabase('gales-sales', 'gales-sales-stage')
db = conn.getDB('gales-sales-stage')
var res = db['fuel-sales'].remove({recordDate: {$lt: ISODate(removeDte)}})

printjson( 'fuel-sales records removed:' )
printjson( res )

var res = db['non-fuel-sales'].remove({recordDate: {$lt: ISODate(removeDte)}})
printjson( 'non-fuel-sales records removed:' )
printjson( res )

var res = db['sales'].remove({recordDate: {$lt: ISODate(removeDte)}})
printjson( 'sales records removed:' )
printjson( res )