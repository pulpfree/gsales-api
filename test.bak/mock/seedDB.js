var uri = 'localhost:27017'
var conn = new Mongo(uri)
var db = conn.getDB('gales-sales')
var rmDte = '2016'

var res = db.sales.remove({recordNum: {$lt: rmDte}})
printjson( 'sales res: ' + res)

res = db['fuel-sales'].remove({recordNum: {$lt: rmDte}})
printjson( 'fuel-sales res: ' + res)

res = db['non-fuel-sales'].remove({recordNum: {$lt: rmDte}})
printjson( 'non-fuel-sales res: ' + res)

res = db['propane-sales'].remove({recordNum: {$lt: rmDte}})
printjson( 'propane-sales res: ' + res)