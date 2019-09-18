
var uri = 'dbp.pflabs.vpc:27017'
// var uri = 'localhost:27017'
var conn = new Mongo(uri)
var db = conn.getDB('gales-sales')
var cursor = db['non-fuel-sales'].find({recordDate: null}).sort({recordNum: 1})
printjson( 'number found: ' + cursor.count() )
while ( cursor.hasNext() ) {
  var p = cursor.next()
  // printjson( p.recordNum )
  // printjson( p.stationID )

  var srec = db.sales.find({recordNum: p.recordNum, stationID: p.stationID})
  // printjson( srec.count() )
  var recDate = srec.next().recordDate

  var bulk = db['non-fuel-sales'].initializeUnorderedBulkOp()
  bulk.find({recordNum: p.recordNum, stationID: p.stationID}).update({$set: {recordDate: recDate}})
  bulk.execute()
  // printjson( fs.count() )
}