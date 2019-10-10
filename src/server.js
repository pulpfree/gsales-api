import Hapi from '@hapi/hapi'
import glob from 'glob'

import config from './config/config'
import mongoose from './mongo/connect'

let cfg
let db

const routes = async () => {
  if (!cfg) {
    cfg = await config.load()
  }

  const server = Hapi.server({
    port: cfg.serverPort,
    host: cfg.serverHost,
    routes: { cors: true },
  })

  glob.sync('/route/*.js', {
    root: __dirname,
  }).forEach((file) => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const route = require(file)
    server.route(route)
  })
  return server
}

exports.initRoutes = routes

exports.init = async () => {
  if (!cfg) {
    cfg = await config.load()
  }

  const server = Hapi.server({
    port: cfg.serverPort,
    host: cfg.serverHost,
  })

  glob.sync('./route/*.js', {
    root: __dirname,
  }).forEach((file) => {
    const route = require(file) // eslint-disable-line
    server.route(route)
  })

  await server.initialize()
  console.log('Server running on %s', server.info.uri) // eslint-disable-line no-console
  return server
}

exports.start = async () => {
  if (!db) {
    cfg = await config.load()
    db = await mongoose.connect(cfg)
  }
  const server = await routes()

  await server.start()
  // eslint-disable-next-line no-console
  console.log('Server running on: %s in stage: %s', server.info.uri, cfg.nodeEnv)
  return server
}

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.log(err)
  process.exit(1)
})
