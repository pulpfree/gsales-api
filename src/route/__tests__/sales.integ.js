import config from '../../config/config'
import db from '../../mongo/connect'

const { init } = require('../../server')

describe('GET /', () => {
  let server
  let dbConn

  // NOTE: might be better to use beforeAll and afterAll outside of the "describe" statement
  beforeEach(async () => {
    const cfg = await config.load()
    dbConn = await db.connect(cfg)
    server = await init()
  })

  afterEach(async () => {
    await server.stop()
    await dbConn.close()
  })

  test('get sales by station', async () => {
    expect(1).toEqual(1)
  })

  it('sales by date', async () => {
    const res = await server.inject({
      method: 'get',
      url: '/sales?date=2019-01-20',
    })
    expect(res.statusCode).toEqual(200)
    expect(res.result.length).toBeGreaterThan(2)
  })
})
