import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import AWS from 'aws-sdk'

// see https://hackernoon.com/you-should-use-ssm-parameter-store-over-lambda-env-variables-5197fc6ea45b
// for example using expiry with events

const config = {
  defaults: {},
  defaultsFN: 'defaults.yml',
  defaultsPath: '',
  ssmPath: '',
  config: {},
}

config.load = async function load() {
  try {
    this.setDefaults()
    await this.loadSSM()
    return this.config
  } catch (e) {
    throw new Error(e)
  }
}

config.setDefaultsPath = function setDefaultsPath(filename = this.defaultsFN) {
  this.defaultsPath = path.join(__dirname, filename)
  try {
    fs.accessSync(this.defaultsPath, fs.F_OK)
  } catch (e) {
    // console.error(e) // eslint-disable-line
    throw new Error(e)
  }
}

config.setDefaults = function setDefaults() {
  if (!this.defaultsPath) {
    this.setDefaultsPath()
  }
  try {
    this.defaults = yaml.safeLoad(fs.readFileSync(this.defaultsPath, 'utf8'))
  } catch (e) {
    // console.error(e) // eslint-disable-line
    throw new Error(e)
  }

  // Ensure we have ssm path
  if (this.defaults.usessm && !this.defaults.ssmPath) {
    throw new Error('Missing ssmPath in defaults')
  }

  // set stage
  this.defaults.nodeEnv = process.env.Stage ? process.env.Stage : process.env.NODE_ENV
}

config.getDefaults = function getDefaults() {
  return this.defaults
}

config.setSSMPath = function setSSMPath() {
  if (!this.defaults.ssmPath || !this.defaults.awsRegion) {
    throw new Error('Missing awsRegion, stage or ssmPath in defaults')
  }

  switch (this.defaults.nodeEnv) {
    case 'test':
      this.ssmPath = `/test/${this.defaults.ssmPath}`
      break
    case 'dev':
    case 'development':
      this.ssmPath = `/dev/${this.defaults.ssmPath}`
      break
    default:
      this.ssmPath = `/${this.defaults.nodeEnv}/${this.defaults.ssmPath}`
  }
}

config.loadSSM = async function loadSSM() {
  if (!this.defaults.usessm || !this.defaults.ssmPath) {
    console.log('loadSSM called without usessm or ssmPath variables set') // eslint-disable-line
    return false
  }
  this.setSSMPath()

  const ssm = new AWS.SSM({
    apiVersion: '2014-11-06',
    region: this.defaults.awsRegion,
  })

  const ssmParams = {
    Path: this.ssmPath,
    WithDecryption: true,
  }

  let params
  try {
    params = await ssm.getParametersByPath(ssmParams).promise()
  } catch (e) {
    throw new Error(e)
  }

  const ssmVals = {}
  params.Parameters.forEach((p) => {
    ssmVals[p.Name.split('/')[3]] = p.Value
  })

  this.config = Object.assign({}, this.defaults, ssmVals)

  return true
}

module.exports = config
