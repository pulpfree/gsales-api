import mongoose from 'mongoose'

const db = {
  cfg: {},
  dipsUri: '',
  uri: '',
}

const logToConsole = process.env.NODE_ENV === 'production'
const isTestEnv = process.env.NODE_ENV === 'test'

db.connect = async function connect(cfg) {
  this.cfg = cfg
  this.setUri()

  mongoose.connect(this.uri, { useNewUrlParser: true })
  mongoose.set('useCreateIndex', true)
  mongoose.set('useNewUrlParser', true)
  mongoose.set('useFindAndModify', false)

  // see: https://medium.com/@vsvaibhav2016/best-practice-of-mongoose-connection-with-mongodb-c470608483f0
  // for info on best practices
  const dbConn = mongoose.connection

  dbConn.on('error', (ee) => {
    if (!isTestEnv) {
      console.error('Mongoose connection error: ', ee.message) // eslint-disable-line
    }
  })
  if (logToConsole) {
    dbConn.once('open', () => {
      console.log('Mongoose open to ', this.uri) // eslint-disable-line
    })
    dbConn.on('disconnected', () => {
      console.log('Mongoose disconnected') // eslint-disable-line
    })
    process.on('SIGINT', () => {
      dbConn.close(() => {
        console.log('Mongoose disconnected due to application termination') // eslint-disable-line
        process.exit(0)
      })
    })
  }

  return dbConn
}

db.setUri = function setUri() {
  if (!this.cfg.mongoDBName || !this.cfg.mongoDBPort) {
    throw new Error('Missing mongoDBName')
  }

  if (this.cfg.nodeEnv === 'stage') {
    // we expect that username and password are set in config
    if (!this.cfg.mongoDBUsername || !this.cfg.mongoDBPassword) {
      throw new Error('Missing mongoDBUsername or mongoDBPassword in config')
    }
    this.uri = `mongodb+srv://${this.cfg.mongoDBUsername}:${this.cfg.mongoDBPassword}@${this.cfg.mongoDBHost}/${this.cfg.mongoDBName}?retryWrites=true&w=majority`
  } else if (this.cfg.nodeEnv === 'prod') {
    if (!this.cfg.mongoDBUsername || !this.cfg.mongoDBPassword) {
      throw new Error('Missing mongoDBUsername or mongoDBPassword in config')
    }
    if (!this.cfg.mongoDBDipsUsername || !this.cfg.mongoDBDipsPassword) {
      throw new Error('Missing mongoDBDipsUsername or mongoDBDipsPassword in config')
    }
    this.uri = `mongodb://${this.cfg.mongoDBUsername}:${this.cfg.mongoDBPassword}@${this.cfg.mongoDBHost}/${this.cfg.mongoDBName}?retryWrites=true&authSource=admin&replicaSet=repl-0`
  } else {
    this.uri = `mongodb://${this.cfg.mongoDBHost}/${this.cfg.mongoDBName}`
  }
}

module.exports = db
