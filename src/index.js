import * as api from './server'

const thundra = require('@thundra/core')()

// OR use require('hapi-lambda');
const { transformRequest, transformResponse } = require('./serverless')

let server

/**
 * This module maps the Lambda proxy requests to the Hapijs router
 */
/* exports.handler = async (event) => {
  if (!server) {
    server = await api.start()
  }

  const request = transformRequest(event)
  const response = await server.inject(request)

  return transformResponse(response)
} */
exports.handler = thundra(async (event) => {
  // console.log('event', JSON.stringify(event))
  if (!server) {
    server = await api.start()
  }

  const request = transformRequest(event)
  const response = await server.inject(request)

  return transformResponse(response)
})

/* exports.graphqlHandler = thundra(server.createHandler({
  cors: {
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  },
})) */
