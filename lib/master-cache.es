const fs = require('fs-extra')
const path = require('path-extra')

const CACHE_DIR = path.join(window.APPDATA_PATH, 'poi-plugin-equips-farm')
const MASTER_CACHE_FILE = path.join(CACHE_DIR, 'master_cache.json')
const MAX_MASTER_SHIPS = 5000
const MAX_MASTER_SHIPGRAPH = 5000
let pendingWrite = Promise.resolve()

// Ensure directory exists
fs.ensureDirSync(CACHE_DIR)

export function saveMasterCache(body) {
    if (
        !body ||
        !Array.isArray(body.api_mst_ship) ||
        !Array.isArray(body.api_mst_shipgraph) ||
        body.api_mst_ship.length === 0 ||
        body.api_mst_shipgraph.length === 0 ||
        body.api_mst_ship.length > MAX_MASTER_SHIPS ||
        body.api_mst_shipgraph.length > MAX_MASTER_SHIPGRAPH
    ) {
        return Promise.resolve(false)
    }

    pendingWrite = pendingWrite.then(async () => {
        try {
        const cacheData = {
            ships: {},
            shipgraph: {}
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

        await fs.writeJson(MASTER_CACHE_FILE, cacheData)
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
        if (fs.existsSync(MASTER_CACHE_FILE)) {
            return fs.readJsonSync(MASTER_CACHE_FILE)
        }
    } catch (e) {
        console.error('[Farming Plugin] Failed to load master cache:', e)
    }
    return null
}
