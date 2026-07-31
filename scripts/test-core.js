// scripts/test-core.js
// Standalone test runner for the plugin's pure logic (data-processor,
// master-cache, search-utils). Loads the .es modules through a small
// transform + vm sandbox, since the repo has no build toolchain.
//
// Run: node scripts/test-core.js

'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')
const assert = require('assert')

const ROOT = path.join(__dirname, '..')
const TEST_DATA_DIR = path.join(require('os').tmpdir(), 'equips-farm-test-' + Date.now())
fs.mkdirSync(TEST_DATA_DIR, { recursive: true })

// --- fs-extra / path-extra stubs (poi provides these globally; not in deps) ---
const fse = {
  ensureDirSync: (p) => fs.mkdirSync(p, { recursive: true }),
  existsSync: (p) => fs.existsSync(p),
  removeSync: (p) => fs.rmSync(p, { force: true, recursive: true }),
  statSync: (p) => fs.statSync(p),
  readJsonSync: (p) => JSON.parse(fs.readFileSync(p, 'utf8')),
  writeJson: async (p, data) => {
    await fs.promises.writeFile(p, JSON.stringify(data))
  },
  move: async (src, dst, opts) => {
    if (opts && opts.overwrite && fs.existsSync(dst)) fs.rmSync(dst, { force: true })
    await fs.promises.rename(src, dst)
  },
}
const pextra = { join: (...args) => path.join(...args) }

const initialEquipData = require(path.join(ROOT, 'initial_equip_ships.json'))

// --- .es loader ---
function loadEs(file, extraRequire = {}) {
  let src = fs.readFileSync(file, 'utf8')
  // strip import statements
  src = src.replace(/^import\s+[^;]+;\s*$/gm, '')
  // convert `export function/class/const X` -> declaration, collect names
  const exportedNames = []
  src = src.replace(/^export\s+(default\s+)?(function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
    (m, def, kind, name) => {
      exportedNames.push(name)
      return kind + ' ' + name
    })
  src += '\nmodule.exports = {' + exportedNames.join(', ') + '};\n'
  const moduleObj = { exports: {} }
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    require: (request) => {
      if (request === 'fs-extra') return fse
      if (request === 'path-extra') return pextra
      if (request === './master-cache') return masterCacheApi
      if (request === '../initial_equip_ships.json') return initialEquipData
      if (extraRequire[request]) return extraRequire[request]
      throw new Error('unexpected require: ' + request)
    },
    window: { APPDATA_PATH: TEST_DATA_DIR },
    console,
    process,
    Map, Set, Object, Array, Number, String, Boolean, JSON, Promise, Date, Math,
    parseInt, parseFloat, isNaN, isFinite, Error, TypeError, RegExp, Symbol,
  }
  vm.createContext(sandbox)
  vm.runInContext(src, sandbox, { filename: file })
  return moduleObj.exports
}

const masterCacheApi = loadEs(path.join(ROOT, 'lib', 'master-cache.es'))
const dataProcessor = loadEs(path.join(ROOT, 'lib', 'data-processor.es'))
const searchUtils = loadEs(path.join(ROOT, 'lib', 'search-utils.es'))

let passed = 0
let failed = 0
const tests = []
function test(name, fn) {
  tests.push([name, fn])
}

async function runTests() {
  for (const [name, fn] of tests) {
    try {
      await fn()
      passed++
      console.log('  ok - ' + name)
    } catch (e) {
      failed++
      console.error('  FAIL - ' + name)
      console.error('    ' + (e && e.message ? e.message : String(e)))
    }
  }
}

// --- Mock data ---
const $ships = {
  1: { api_id: 1, api_name: '睦月', api_aftershipid: 254, api_yomi: 'むつき', api_stype: 2 },
  171: { api_id: 171, api_name: 'Bismarck', api_aftershipid: 172, api_yomi: 'びすまるく' },
  172: { api_id: 172, api_name: 'Bismarck改', api_aftershipid: 173, api_yomi: 'びすまるくかい' },
  173: { api_id: 173, api_name: 'Bismarck Zwei', api_aftershipid: 178, api_yomi: 'びすまるくつばい' }, // note: capitalized Zwei on purpose
  178: { api_id: 178, api_name: 'Bismarck drei', api_aftershipid: 0, api_yomi: 'びすまるくどらい' },
}

const wctfShips = {
  173: {
    name: { ja_jp: 'Bismarck zwei', zh_cn: '俾斯麦zwei' },
    equip: [123, 124, null],
    remodel: { next: 178, next_lvl: 40 },
  },
  178: {
    name: { ja_jp: 'Bismarck drei', zh_cn: '俾斯麦drei' },
    equip: [],
  },
}

const wctf = { ships: wctfShips, items: { 123: { name: { zh_cn: '测试装备' } } } }

console.log('\n=== master-cache ===')

test('saveMasterCache rejects invalid payload', async () => {
  const r = await masterCacheApi.saveMasterCache({ api_mst_ship: [], api_mst_shipgraph: [] })
  assert.strictEqual(r, false)
})

test('saveMasterCache + loadMasterCache roundtrip', async () => {
  const body = {
    api_mst_ship: [{ api_id: 1, api_name: '睦月' }],
    api_mst_shipgraph: [{ api_id: 1, api_filename: 'snohitatusbk' }],
  }
  const r = await masterCacheApi.saveMasterCache(body)
  assert.strictEqual(r, true)
  const loaded = masterCacheApi.loadMasterCache()
  assert.ok(loaded)
  assert.strictEqual(loaded.ships['1'].api_name, '睦月')
  assert.ok(loaded.updatedAt, 'cache should carry updatedAt')
})

test('loadMasterCache removes corrupted file and returns null', () => {
  const cacheFile = path.join(TEST_DATA_DIR, 'poi-plugin-equips-farm', 'master_cache.json')
  fs.writeFileSync(cacheFile, '{ this is not valid json !!!')
  const loaded = masterCacheApi.loadMasterCache()
  assert.strictEqual(loaded, null)
  assert.strictEqual(fs.existsSync(cacheFile), false, 'corrupted cache must be removed')
})

test('loadMasterCache rejects structurally invalid data', () => {
  const cacheFile = path.join(TEST_DATA_DIR, 'poi-plugin-equips-farm', 'master_cache.json')
  fs.writeFileSync(cacheFile, JSON.stringify({ ships: 'not-an-object' }))
  const loaded = masterCacheApi.loadMasterCache()
  assert.strictEqual(loaded, null)
  assert.strictEqual(fs.existsSync(cacheFile), false)
})

test('getMasterCacheStatus never throws', () => {
  const status = masterCacheApi.getMasterCacheStatus()
  assert.ok(status && typeof status === 'object')
})

console.log('\n=== data-processor: farming map ===')

test('REGRESSION: empty wctf + master data only -> non-empty map (the reported bug)', () => {
  const map = dataProcessor.getFarmingMap({}, $ships)
  assert.ok(map, 'map must not be null')
  assert.ok(Object.keys(map).length > 0, 'map must not be empty when $ships is available')
  // 睦月 (id 1) is in the bundled initial data; the merge must find it by api_name
  assert.ok(map[1], 'base ship 睦月 should be present')
  const provides1 = map[1].provides
  assert.ok(provides1.some(p => p.equipId === 1), '睦月 should provide equip 1 (12cm連装砲)')
})

test('case-insensitive name matching ("Bismarck zwei" vs "Bismarck Zwei")', () => {
  const map = dataProcessor.getFarmingMap({}, $ships)
  // 'Bismarck zwei' (Akashi data) must match $ships api_name 'Bismarck Zwei' (capitalized)
  const bismarck = map[171]
  assert.ok(bismarck, 'Bismarck family should be present via case-insensitive match')
  const eqIds = bismarck.provides.map(p => p.equipId)
  // real bundled data: Bismarck family provides 76 (41cm連装砲) among others
  assert.ok(eqIds.includes(76), 'expected equip 76 in Bismarck family, got: ' + eqIds.join(','))
})

test('wctf equip arrays feed direct provisioning and remodel chain grouping', () => {
  const map = dataProcessor.getFarmingMap(wctf, $ships)
  const bismarck = map[171]
  assert.ok(bismarck, 'Bismarck (root 171) should exist')
  const eqIds = bismarck.provides.map(p => p.equipId)
  assert.ok(eqIds.includes(123), 'equip 123 from wctf should be in the map: ' + eqIds.join(','))
  assert.ok(eqIds.includes(124), 'equip 124 from wctf should be in the map: ' + eqIds.join(','))
})

test('checkQuota counts holding + potential family ships', () => {
  const map = dataProcessor.getFarmingMap(wctf, $ships)
  const userEquips = { a: { api_slotitem_id: 123 }, b: { api_slotitem_id: 999 } }
  const userShips = { s1: { api_ship_id: 172 } } // 172 is ancestor of provider 173
  const quota = dataProcessor.checkQuota(3, 123, userEquips, userShips, map)
  assert.strictEqual(quota.holding, 1)
  assert.strictEqual(quota.potential, 1)
  assert.strictEqual(quota.current, 2)
  assert.strictEqual(quota.isSatisfied, false)
})

test('checkQuota guards against NaN/undefined inputs', () => {
  const q1 = dataProcessor.checkQuota('abc', 123, undefined, undefined, {})
  assert.strictEqual(q1.isSatisfied, true)
  const q2 = dataProcessor.checkQuota(NaN, 123, null, null, {})
  assert.strictEqual(q2.isSatisfied, true)
  const q3 = dataProcessor.checkQuota(1, 123, undefined, undefined, {})
  assert.strictEqual(q3.isSatisfied, false)
  assert.strictEqual(q3.current, 0)
})

test('fully empty inputs do not crash', () => {
  const map = dataProcessor.getFarmingMap({}, {})
  assert.strictEqual(Object.keys(map).length, 0)
})

test('invalidateFarmingMapCache forces a rebuild', () => {
  dataProcessor.getFarmingMap({}, $ships) // build once
  dataProcessor.invalidateFarmingMapCache()
  const map = dataProcessor.getFarmingMap({}, $ships)
  assert.ok(Object.keys(map).length > 0, 'map should rebuild after invalidation')
})

test('getFarmingMapStats reports source counts', () => {
  dataProcessor.getFarmingMap(wctf, $ships)
  const stats = dataProcessor.getFarmingMapStats()
  assert.ok(stats)
  assert.strictEqual(stats.wctfShips, 2)
  assert.strictEqual(stats.masterShips, 5)
  assert.ok(stats.initialEquipIds > 100)
  assert.ok(stats.initialMatched > 0)
  assert.ok(stats.directProviders >= 1)
})

console.log('\n=== search-utils ===')

test('matchesSearch: chinese name', () => {
  assert.strictEqual(searchUtils.matchesSearch('五十铃', { chinese_name: '五十铃' }), true)
})

test('matchesSearch: japanese name', () => {
  assert.strictEqual(searchUtils.matchesSearch('五十鈴', { api_name: '五十鈴' }), true)
})

test('matchesSearch: kana -> romaji', () => {
  assert.strictEqual(searchUtils.matchesSearch('isuzu', { yomi: 'いすず' }), true)
  assert.strictEqual(searchUtils.matchesSearch('nagato', { api_yomi: 'ながと' }), true)
})

test('matchesSearch: no query matches everything', () => {
  assert.strictEqual(searchUtils.matchesSearch('', {}), true)
})

test('matchesSearch: normalization (spaces/case)', () => {
  assert.strictEqual(searchUtils.matchesSearch('Bismarck  Zwei', { api_name: 'bismarck zwei' }), true)
})

test('hiraganaToRomaji basic', () => {
  assert.strictEqual(searchUtils.hiraganaToRomaji('いすず'), 'isuzu')
  assert.strictEqual(searchUtils.hiraganaToRomaji('きゃりー'), 'kyari')
  assert.strictEqual(searchUtils.hiraganaToRomaji('まつ'), 'matsu')
  assert.strictEqual(searchUtils.hiraganaToRomaji('みっつ'), 'mitsu')
})

console.log('\n=== summary ===')
runTests().then(() => {
  console.log('passed: ' + passed + ', failed: ' + failed)
  // cleanup
  fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  if (failed > 0) {
    process.exit(1)
  }
})
