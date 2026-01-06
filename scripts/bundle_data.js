const fs = require('fs-extra')
const path = require('path')

// Config
const PROJECT_ROOT = path.resolve(__dirname, '..')
const CACHE_DIR = path.join(process.env.APPDATA || '', 'poi/poi-plugin-equips-farm') // Helper for local dev testing
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'dist-data')

const MASTER_CACHE_FILE = 'master_cache.json'
const AKASHI_FILE = 'initial_equip_ships.json'

// Ensure output dir
fs.ensureDirSync(OUTPUT_DIR)

console.log('[Bundle] Starting data bundle process...')

// 1. Copy Akashi Data (Block 3)
try {
    const src = path.join(PROJECT_ROOT, AKASHI_FILE)
    const dest = path.join(OUTPUT_DIR, AKASHI_FILE)
    fs.copySync(src, dest)
    console.log(`[Bundle] Copied ${AKASHI_FILE}`)
} catch (e) {
    console.error(`[Bundle] Failed to copy ${AKASHI_FILE}`, e)
}

console.log('[Bundle] Skipped Master Cache snapshot (Client-side generation only).')

console.log('[Bundle] Done. Check /dist-data/ folder.')
