/* eslint-disable import/prefer-default-export */

const sanitize = require('mongo-sanitize')

export const cleanInput = (inputObject) => {
  const returnObject = {}
  Object.keys(inputObject).forEach((k) => {
    returnObject[k] = sanitize(inputObject[k])
  })
  return returnObject
}
