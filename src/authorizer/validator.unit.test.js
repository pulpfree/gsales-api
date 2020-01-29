/* cSpell:disable */
/**
 * Docs for libs are:
 * jose: https://github.com/cisco/node-jose
 * jsonwebtoken: https://github.com/auth0/node-jsonwebtoken
 * to test, use: yarn test:w ./src/authorizer/jwks.unit.test.js
 */

import validator from './validator'

import { COGNITO_CLIENT_ID as clientID } from './constants'

const expiredToken = 'eyJraWQiOiI3SUh0cXdKRThJVHg3MXJEdkJCRkgrUTByNm5DZXd5ZERqVWpUZ0ZjNFhFPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyYThkYWE0ZC1hMGNhLTQ0MWUtYjA3OS03YmE5MjNkZmZjYzkiLCJkZXZpY2Vfa2V5IjoiY2EtY2VudHJhbC0xXzE0ZWY5YjM5LTEyMTYtNGM4Ny1iNzI2LTM5MGY4OWI5ZjRmMCIsImV2ZW50X2lkIjoiMjBmOTM2NjQtNmZhOS00OWIyLWJlMDMtYTViYjAzYTQ0MDc5IiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJhd3MuY29nbml0by5zaWduaW4udXNlci5hZG1pbiIsImF1dGhfdGltZSI6MTU3OTgyMjI3NywiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmNhLWNlbnRyYWwtMS5hbWF6b25hd3MuY29tXC9jYS1jZW50cmFsLTFfbG9sd2ZZSUFyIiwiZXhwIjoxNTgwMjI4NzQ0LCJpYXQiOjE1ODAyMjUxNDQsImp0aSI6ImRmNTc5MTAwLTI3NjEtNDRjZC1iZTFlLWVmZGY0MDFkMjFiMiIsImNsaWVudF9pZCI6IjJ0YTVuZDFxNnNwMmFoaTVubmZxMnVqdWsiLCJ1c2VybmFtZSI6InB1bHBmcmVlIn0.J6aPHlPIBISkRmzm-CUTorViz0Cph8C0FTi9Kokb2e2ys1iQA5BGES23IEui-8_hcOB1K5AzlPwym3BaGB66zuRxTg-P9RwXalWdHAgXC1ZXBUrjrZOgkg4S-llLCfIvCe-ZUoJUymJYCcJa5vsfPVPM0taIXim089zY4IYijoNavql9iv2kEpuw8j1sQJislbb3x2PhoF5QG-PvF8NnMsbL5gTb6ueVavzUtmQ8Z5wYWgfvv__txoQKIg4E44FkT2shx0UWo51uzQg3fBC8Fv6pM_S9ye60Hml3tBfeAG-44el-u3m2UYhSHsXfW6R07wF1rP8aNxKc1ZqprSdEqg'
const token = 'eyJraWQiOiI3SUh0cXdKRThJVHg3MXJEdkJCRkgrUTByNm5DZXd5ZERqVWpUZ0ZjNFhFPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyYThkYWE0ZC1hMGNhLTQ0MWUtYjA3OS03YmE5MjNkZmZjYzkiLCJkZXZpY2Vfa2V5IjoiY2EtY2VudHJhbC0xXzE0ZWY5YjM5LTEyMTYtNGM4Ny1iNzI2LTM5MGY4OWI5ZjRmMCIsImV2ZW50X2lkIjoiMjBmOTM2NjQtNmZhOS00OWIyLWJlMDMtYTViYjAzYTQ0MDc5IiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJhd3MuY29nbml0by5zaWduaW4udXNlci5hZG1pbiIsImF1dGhfdGltZSI6MTU3OTgyMjI3NywiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmNhLWNlbnRyYWwtMS5hbWF6b25hd3MuY29tXC9jYS1jZW50cmFsLTFfbG9sd2ZZSUFyIiwiZXhwIjoxNTgwMjQwMjEyLCJpYXQiOjE1ODAyMzY2MTIsImp0aSI6ImJmNDM0NzIxLTYyN2MtNDJmNS04MmMzLWM3OWQzM2VlNjVjMCIsImNsaWVudF9pZCI6IjJ0YTVuZDFxNnNwMmFoaTVubmZxMnVqdWsiLCJ1c2VybmFtZSI6InB1bHBmcmVlIn0.UdrwlgEbatCyjRjJN2TzPyPkO61Ywm1CjFPbC-UBYC-59luKXCjT9SYt3Satv21iaoTSUcApaBHC0AtSNemfCoSq7gNStRwgrQlCNcvYt3uvo4iHf9WLklFtCFJFMKX82Dk0qwHTrrXka6BRt_RAzn80TBryX2NFqW-gb63zd1-VALqgwPSOXDjcE41wbXPpNmDuAq6AF9VNHOcpELcJ29xF5ZnydhDqk5kMJub67EhcIN3A9t9B4GxFRzRL_aC6QpDF8ojz2BvnPUvJ1WJIHdemaB_OWkS4lthrUWGpcYTgPdjgogT--oY2YOCVAr6Egu5Fl8ZgQUI6BO5bzgBjAQ'

test('has correct return', async () => {
  const res = await validator(clientID, token)
  // expect(res).toEqual(typeof string)
  expect(res).toContain(clientID)
})

test('token has expired', async () => {
  let thrownError
  try {
    await validator(clientID, expiredToken)
  } catch (err) {
    thrownError = err
  }
  expect(thrownError).toEqual(expect.any(Error))
  expect(thrownError).toMatchObject({ message: 'Token is expired' })
})

test('validate has missing params', async () => {
  let thrownError
  try {
    await validator(null, token)
  } catch (err) {
    thrownError = err
  }
  expect(thrownError).toEqual(expect.any(Error))
  expect(thrownError).toMatchObject({ message: 'Missing clientID' })

  try {
    await validator(clientID)
  } catch (err) {
    thrownError = err
  }
  expect(thrownError).toEqual(expect.any(Error))
  expect(thrownError).toMatchObject({ message: 'Missing token' })
})

test('has invalid client id', async () => {
  const invalidClientID = '5n63nd473pv7ne2qskv30gkcbh'
  let thrownError
  try {
    await validator(invalidClientID, token)
  } catch (err) {
    thrownError = err
  }
  expect(thrownError).toEqual(expect.any(Error))
  expect(thrownError).toMatchObject({ message: 'Token was not issued for this audience' })
})
