import cfg from './config'

// to test just this file, run: yarn test:w src/config/config.test.js

test('ensure config path', () => {
  expect(() => { cfg.setDefaultsPath('badfile.yaml') }).toThrowError('ENOENT')
  expect(() => { cfg.setDefaultsPath('defaults.yml') }).not.toThrowError()
  expect(() => { cfg.setDefaultsPath() }).not.toThrowError()
})

test('set and get defaults', () => {
  process.env.Stage = 'test'
  expect(() => { cfg.setDefaults() }).not.toThrowError()
  const keyLen = Object.keys(cfg.getDefaults()).length
  expect(keyLen).toBeGreaterThan(2)
})

test('loads SSM params', async () => {
  process.env.Stage = 'test'
  const ssm = await cfg.loadSSM()
  expect(ssm).toBe(true)
})

test('load final params', async () => {
  process.env.Stage = 'test'
  const c = await cfg.load()
  expect(Object.keys(c).length).toBeGreaterThan(2)
  expect(c.mongoDBPassword).toBeNull()
})

test('production params', async () => {
  process.env.Stage = 'prod'
  const c = await cfg.load()
  expect(Object.keys(c).length).toBeGreaterThan(2)
  expect(c.mongoDBPassword).toBeTruthy()
})
