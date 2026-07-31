const fs = require('fs-extra')
const path = require('path-extra')

const CACHE_DIR = path.join(window.APPDATA_PATH, 'poi-plugin-equips-farm')
const MASTER_CACHE_FILE = path.join(CACHE_DIR, 'master_cache.json')
const MASTER_CACHE_TMP_FILE = MASTER_CACHE_FILE + '.tmp'
const MAX_MASTER_SHIPS = 5000
const MAX_MASTER_SHIPGRAPH = 5000
let pendingWrite = Promise.resolve()

// Ensure directory exists
fs.ensureDirSync(CACHE_DIR)

const isValidCachePayload = (body) => {
    if (
        !body ||
        !Array.isArray(body.api_mst_ship) ||
        !Array.isArray(body.api_mst_shipgraph) ||
        body.api_mst_ship.length === 0 ||
        body.api_mst_shipgraph.length === 0 ||
        body.api_mst_ship.length > MAX_MASTER_SHIPS ||
        body.api_mst_shipgraph.length > MAX_MASTER_SHIPGRAPH
    ) {
        return false
    }
    return body.api_mst_ship.every(s => s && Number.isInteger(s.api_id)) &&
        body.api_mst_shipgraph.every(g => g && Number.isInteger(g.api_id))
}

// Validate cached data structure. Returns { valid, reason }
const validateCacheData = (data) => {
    if (!data || typeof data !== 'object') return { valid: false, reason: 'not-an-object' }
    if (!data.ships || typeof data.ships !== 'object') return { valid: false, reason: 'missing-ships' }
    if (!data.shipgraph || typeof data.shipgraph !== 'object') return { valid: false, reason: 'missing-shipgraph' }
    const shipValues = Object.values(data.ships)
    if (shipValues.length === 0 || shipValues.length > MAX_MASTER_SHIPS) return { valid: false, reason: 'bad-ship-count' }
    if (shipValues.some(s => !s || !Number.isInteger(s.api_id))) return { valid: false, reason: 'bad-ship-record' }
    const graphValues = Object.values(data.shipgraph)
    if (graphValues.length === 0 || graphValues.length > MAX_MASTER_SHIPGRAPH) return { valid: false, reason: 'bad-graph-count' }
    return { valid: true }
}

export function saveMasterCache(body) {
    if (!isValidCachePayload(body)) {
        return Promise.resolve(false)
    }

    pendingWrite = pendingWrite.then(async () => {
        try {
            const cacheData = {
                ships: {},
                shipgraph: {},
                updatedAt: new Date().toISOString(),
                schemaVersion: 1
            }

            // Extract essential ship data
            body.api_mst_ship.forEach(s => {
                cacheData.ships[s.api_id] = {
                    api_id: s.api_id,
                    api_name: s.api_name,
                    api_yomi: s.api_yomi,
                    api_sortno: s.api_sortno,
                    api_aftershipid: s.api_aftershipid,
                    api_stype: s.api_stype
                }
            })

            // Extract essential graph data (filename)
            body.api_mst_shipgraph.forEach(g => {
                cacheData.shipgraph[g.api_id] = {
                    api_id: g.api_id,
                    api_filename: g.api_filename,
                    api_version: g.api_version
                }
            })

            // Atomic write: write to tmp file first, then rename.
            // This prevents a crash mid-write from leaving a corrupted cache file.
            await fs.writeJson(MASTER_CACHE_TMP_FILE, cacheData)
            await fs.move(MASTER_CACHE_TMP_FILE, MASTER_CACHE_FILE, { overwrite: true })
            console.log('[Farming Plugin] Master data cached successfully.')
            return true
        } catch (e) {
            console.error('[Farming Plugin] Failed to save master cache:', e)
            return false
        }
    })

    return pendingWrite
}

export function loadMasterCache() {
    try {
        if (!fs.existsSync(MASTER_CACHE_FILE)) {
            return null
        }
        const data = fs.readJsonSync(MASTER_CACHE_FILE)
        const check = validateCacheData(data)
        if (!check.valid) {
            // Corrupted or outdated cache: remove it so the next api_start2
            // response can rebuild a fresh one. Never silently fall back.
            console.error(`[Farming Plugin] Master cache invalid (${check.reason}), removing it.`)
            fs.removeSync(MASTER_CACHE_FILE)
            return null
        }
        return data
    } catch (e) {
        // Corrupted JSON file: remove it and return null
        console.error('[Farming Plugin] Failed to load master cache, removing corrupted file:', e)
        try {
            fs.removeSync(MASTER_CACHE_FILE)
        } catch (rmErr) {
            console.error('[Farming Plugin] Failed to remove corrupted master cache:', rmErr)
        }
        return null
    }
}

// Diagnostics: expose cache status for the UI troubleshooting panel.
// Never throws; always returns a plain object.
export function getMasterCacheStatus() {
    try {
        if (!fs.existsSync(MASTER_CACHE_FILE)) {
            return { exists: false }
        }
        const stat = fs.statSync(MASTER_CACHE_FILE)
        let data = null
        let valid = false
        let error = null
        try {
            data = fs.readJsonSync(MASTER_CACHE_FILE)
            const check = validateCacheData(data)
            valid = check.valid
            if (!check.valid) error = `invalid:${check.reason}`
        } catch (e) {
            error = String(e && e.message ? e.message : e)
        }
        return {
            exists: true,
            valid,
            error,
            size: stat.size,
            updatedAt: data ? data.updatedAt : null,
            shipCount: data && data.ships ? Object.keys(data.ships).length : 0,
            graphCount: data && data.shipgraph ? Object.keys(data.shipgraph).length : 0
        }
    } catch (e) {
        return { exists: false, error: String(e && e.message ? e.message : e) }
    }
}
