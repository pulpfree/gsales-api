// Connections
var uri = 'dbp.pflabs.vpc:27017'
// var uri = 'localhost:27017'
var conn = new Mongo(uri)
var db = conn.getDB('gales-sales')

// sales collection indexes
db.sales.ensureIndex( { 'attendant.ID': 1 })
db.sales.ensureIndex( { recordDate: 1 })
db.sales.ensureIndex( { recordNum: 1 } )
db.sales.ensureIndex( { stationID: 1, recordNum: 1 }, {unique: true} )

// fuel-sales indexes
db['fuel-sales'].ensureIndex( { stationID: 1, recordNum: 1 } )
db['fuel-sales'].ensureIndex( { dispenserID: 1, recordNum: 1 } )

// non-fuel-sales indexes
db['non-fuel-sales'].ensureIndex( { productID: 1 } )
db['non-fuel-sales'].ensureIndex( { recordNum: 1 } )
db['non-fuel-sales'].ensureIndex( { recordDate: 1 } )

// journals indexes
db.journals.ensureIndex( { adjustDate: 1, stationID: 1 })


// employees indexes
db.employees.ensureIndex( {active: 1} )
db.employees.ensureIndex( {nameLast: 1} )