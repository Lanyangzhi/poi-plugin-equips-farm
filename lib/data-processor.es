// lib/data-processor.es
// Handles WCTF Data Processing and Inventory Quota Logic
//
// The farming map is built from MULTIPLE sources so that the plugin stays
// usable even when one source is missing or stale:
//   1. WCTF data (state.wctf.ships) - best source, provides equip arrays
//      and remodel chains, but depends on the whocallsthefleet-database
//      npm package being installed/updated (may be empty on user machines)
//   2. POI master data (const.$ships) - always available once game data
//      is loaded; provides api_aftershipid for remodel chains
//   3. Local master cache (master_cache.json in APPDATA) - persisted
//      snapshot of api_start2, used as name lookup fallback
//   4. Bundled initial_equip_ships.json (Akashi data) - provides initial
//      equipment by ship name, matched through a normalized name index

let cachedFarmingMap = null
let cachedWctfShips = null
let cachedMasterShips = null
let cachedParentMap = {} // Cache for parent lookups
let lastStats = null

// Helper: Find Base Ancestor (Module Level)
const findRoot = (id) => {
    let curr = id
    let steps = 0
    while (cachedParentMap[curr] && steps < 20) {
        curr = cachedParentMap[curr]
        steps++
    }
    return curr
}

// --- Name Index ---

const normalizeKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '')

// Collect every searchable name variant of a ship entry.
// Handles both WCTF format (name: {ja_jp, zh_cn, ...}) and POI master
// format (api_name / api_yomi / chinese_name).
const collectShipNameVariants = (ship) => {
    const variants = []
    if (!ship) return variants
    const push = (v) => {
        const n = normalizeKey(v)
        if (n) variants.push(n)
    }

    push(ship.api_name)
    push(ship.api_yomi)
    push(ship.chinese_name)

    const names = ship.name
    if (typeof names === 'string') {
        push(names)
    } else if (names && typeof names === 'object') {
        push(names.ja_jp)
        push(names.japanese)
        push(names.zh_cn)
        push(names.chinese)
        push(names.ja_kana)
        push(names.ja_romaji)
        push(names.romaji)
        push(names.en_us)
        push(names.en)
        push(names.ko_kr)
    }

    push(ship.filename)
    push(ship.wiki_id)
    return variants
}

// Build a normalized name -> shipId index.
// Earlier sources win on conflicts (master data is the most authoritative
// for Japanese names).
const buildShipIndex = (sources) => {
    const index = new Map()
    sources.forEach(source => {
        if (!source || typeof source !== 'object') return
        Object.values(source).forEach(ship => {
            if (!ship || typeof ship !== 'object') return
            const rawId = ship.api_id !== undefined ? ship.api_id : ship.id
            const id = parseInt(rawId, 10)
            if (!Number.isInteger(id) || id <= 0) return
            collectShipNameVariants(ship).forEach(v => {
                if (!index.has(v)) index.set(v, id)
            })
        })
    })
    return index
}

// --- 1. Farming Map ---

export function getFarmingMap(wctf, $ships) {
    const wctfShips = (wctf && wctf.ships) || {}
    if (cachedFarmingMap && cachedWctfShips === wctfShips && cachedMasterShips === $ships) return cachedFarmingMap

    const map = {}

    // Pre-Pass: Build Level Requirements Map (Child -> Level to reach from Parent)
    const levelMap = {}
    Object.keys(wctfShips).forEach(sId => {
        const ship = wctfShips[sId]
        if (ship && ship.remodel && ship.remodel.next && ship.remodel.next_lvl) {
            levelMap[parseInt(ship.remodel.next, 10)] = parseInt(ship.remodel.next_lvl, 10)
        }
    })

    // 1st Pass: Identify direct providers from WCTF stock equipment.
    // Tolerates equip entries shaped as number, {id}, {id, star}, null or ''.
    const directProvision = {}
    Object.keys(wctfShips).forEach(sId => {
        const ship = wctfShips[sId] || {}
        const rawEquip = ship.equip || ship.slots || ship.init_equip
        if (!rawEquip || !Array.isArray(rawEquip)) return

        const myStock = []
        rawEquip.forEach(slot => {
            let eId = -1
            if (typeof slot === 'number') eId = slot
            else if (slot && typeof slot === 'object' && Number.isInteger(slot.id)) eId = slot.id
            else if (typeof slot === 'string' && slot.trim() !== '') eId = parseInt(slot, 10)

            if (Number.isInteger(eId) && eId > 0) myStock.push(eId)
        })

        if (myStock.length > 0) {
            const pId = parseInt(sId, 10)
            if (Number.isInteger(pId) && pId > 0) {
                directProvision[pId] = {
                    shipId: pId,
                    stock: myStock,
                    level: levelMap[pId] || 1 // Default to 1 if no parent req (Base)
                }
            }
        }
    })

    // 2nd Pass: Build Parent Map (Child -> Parent) for fast lookups
    const parentMap = {}
    Object.keys(wctfShips).forEach(sId => {
        const ship = wctfShips[sId]
        if (ship && ship.remodel && ship.remodel.prev) {
            parentMap[sId] = parseInt(ship.remodel.prev, 10)
        }
    })

    // 2.1 Pass: Supplement Parent Map from Master Data (reversed api_aftershipid)
    const processMasterForParents = (source) => {
        if (!source) return
        Object.values(source).forEach(s => {
            if (!s) return
            const afterId = parseInt(s.api_aftershipid, 10)
            const currentId = s.api_id
            if (afterId > 0 && !parentMap[afterId]) {
                parentMap[afterId] = currentId
            }
        })
    }

    let masterCache = { ships: {} }
    try {
        const { loadMasterCache } = require('./master-cache')
        masterCache = loadMasterCache() || { ships: {} }
    } catch (e) {
        // ignore: cache is an optional enhancement
    }

    processMasterForParents(masterCache.ships)
    processMasterForParents($ships)
    cachedParentMap = parentMap

    // 3rd Pass: Group by Base Ancestor
    Object.keys(directProvision).forEach(providerIdStr => {
        const providerId = parseInt(providerIdStr, 10)
        const providerData = directProvision[providerId]

        const rootId = findRoot(providerId)

        // Initialize Root Entry
        if (!map[rootId]) {
            map[rootId] = {
                baseId: rootId,
                provides: []
            }
        }

        // Add items to Root. No Deduplication: Show ALL forms that provide
        // the item, so intermediate forms appear in the Ship List.
        providerData.stock.forEach(eqId => {
            map[rootId].provides.push({
                equipId: eqId,
                providerId: providerId,
                level: providerData.level
            })
        })
    })

    // 4th Pass: Merge External Initial Equipment Data (from Akashi-list)
    // Matches ship names through a normalized multi-variant index, so it
    // works even when WCTF data is entirely missing (relies on master data
    // and/or the local master cache).
    let initialMatched = 0
    try {
        const initialEquipData = require('../initial_equip_ships.json')
        if (initialEquipData) {
            const shipIndex = buildShipIndex([$ships, masterCache.ships, wctfShips])

            Object.keys(initialEquipData).forEach(eqIdStr => {
                const eqId = parseInt(eqIdStr, 10)
                if (!Number.isInteger(eqId) || eqId <= 0) return
                const providers = initialEquipData[eqIdStr]
                if (!Array.isArray(providers)) return

                providers.forEach(p => {
                    const foundId = p && p.name ? shipIndex.get(normalizeKey(p.name)) : undefined

                    if (foundId && foundId > 0) {
                        // Ensure foundId is treated as a valid ship even if not in wctf.ships
                        const rootId = findRoot(foundId) || foundId // Fallback to self if no root found

                        if (!map[rootId]) {
                            map[rootId] = {
                                baseId: rootId,
                                provides: []
                            }
                        }

                        // Check for duplicates
                        const exists = map[rootId].provides.some(existing =>
                            existing.equipId === eqId &&
                            existing.providerId === foundId &&
                            existing.level === p.level
                        )

                        if (!exists) {
                            map[rootId].provides.push({
                                equipId: eqId,
                                providerId: foundId,
                                level: p.level,
                                isInitial: true
                            })
                            initialMatched++
                        }
                    }
                })
            })
        }
    } catch (e) {
        console.error('Failed to load initial_equip_ships.json', e)
    }

    lastStats = {
        wctfShips: Object.keys(wctfShips).length,
        masterShips: $ships ? Object.keys($ships).length : 0,
        cacheLoaded: !!(masterCache && masterCache.ships && Object.keys(masterCache.ships).length > 0),
        cacheShips: masterCache && masterCache.ships ? Object.keys(masterCache.ships).length : 0,
        initialEquipIds: Object.keys(require('../initial_equip_ships.json')).length,
        initialMatched,
        directProviders: Object.keys(directProvision).length,
        mapRoots: Object.keys(map).length
    }

    cachedFarmingMap = map
    cachedWctfShips = wctfShips
    cachedMasterShips = $ships
    return map
}

// Diagnostics: expose counts of the last farming-map build for the UI
// troubleshooting panel. Returns null before the first build.
export function getFarmingMapStats() {
    return lastStats
}

// Force the next getFarmingMap() call to rebuild the map from scratch
// (e.g. the "Reload" button in the troubleshooting panel, after the local
// master cache file has been repaired).
export function invalidateFarmingMapCache() {
    cachedFarmingMap = null
}

// --- 2. Inventory Check ---

export function checkQuota(targetCount, equipId, userEquips, userShips, farmingMap) {
    targetCount = parseInt(targetCount, 10)
    if (isNaN(targetCount) || targetCount <= 0) return { isSatisfied: true, current: 0 }

    let holding = 0
    Object.values(userEquips || {}).forEach(item => {
        if (item && item.api_slotitem_id === equipId) {
            holding++
        }
    })

    let potential = 0
    // Check Potential: Do I have a ship that is an ancestor of a Provider?
    Object.values(userShips || {}).forEach(ship => {
        if (!ship) return
        const masterId = ship.api_ship_id

        // Use findRoot to handle merged ships (e.g. Eidsvold Kai -> Eidsvold)
        // If we don't do this, we won't find the entry in farmingMap which is keyed by Root ID.
        const rootId = findRoot(masterId)

        const info = farmingMap[rootId] || farmingMap[masterId] // Try Root first, then direct (fallback)

        if (info && info.provides) {
            // Check if this ship (or its family) provides the target equip,
            // and specifically if the form I have is NOT the one that provides it.
            const useful = info.provides.some(p => p.equipId === equipId && p.providerId !== masterId)
            if (useful) {
                potential++
            }
        }
    })

    const current = holding + potential
    return {
        current,
        holding,
        potential,
        isSatisfied: current >= targetCount
    }
}
