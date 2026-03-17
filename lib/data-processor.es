// lib/data-processor.es
// Handles WCTF Data Processing and Inventory Quota Logic

let cachedFarmingMap = null
let cachedWctfShips = null
let cachedMasterShips = null
let cachedParentMap = {} // Cache for parent lookups

// Helper: Find Base Ancestor (Module Level)
const findRoot = (id) => {
    let curr = id
    let steps = 0
    while(cachedParentMap[curr] && steps < 20) {
        curr = cachedParentMap[curr]
        steps++
    }
    return curr
}




// --- 1. WCTF Processing ---

export function getFarmingMap(wctf, $ships) {
    if (!wctf || !wctf.ships) return {}
    if (cachedFarmingMap && cachedWctfShips === wctf.ships && cachedMasterShips === $ships) return cachedFarmingMap

    const map = {}
    const ships = wctf.ships

    // 1st Pass: Identify direct providers (Who comes with what stock eq)
    // Map<ShipId, { level, stock: [] }>
    
    // Pre-Pass: Build Level Requirements Map (Child -> Level to reach from Parent)
    const levelMap = {}
    Object.keys(ships).forEach(sId => {
        const ship = ships[sId]
        if (ship.remodel && ship.remodel.next && ship.remodel.next_lvl) {
             const nextId = parseInt(ship.remodel.next) // Target ID
             const nextLvl = parseInt(ship.remodel.next_lvl)
             levelMap[nextId] = nextLvl
        }
    })

    const directProvision = {} 

    Object.keys(ships).forEach(sId => {
        const ship = ships[sId]
        // Try multiple known keys for stock equipment
        const rawEquip = ship.equip || ship.slots || ship.init_equip
        
        if (!rawEquip || !Array.isArray(rawEquip)) return
        
        const myStock = []
        rawEquip.forEach(slot => {
            let eId = -1
            if (typeof slot === 'number') eId = slot
            else if (slot && slot.id) eId = slot.id
            
            if (eId > 0) {
                 myStock.push(eId)
            }
        })

        if (myStock.length > 0) {
            // Get the level required to BECOME this ship
            const pId = parseInt(sId)
            const requiredLevel = levelMap[pId] || 1 // Default to 1 if no parent req (Base)
            
            directProvision[pId] = {
                shipId: pId,
                stock: myStock,
                level: requiredLevel
            }
        }
    })

    // 2nd Pass: Build Parent Map (Child -> Parent) for fast lookups
    const parentMap = {}
    Object.keys(ships).forEach(sId => {
        const ship = ships[sId]
        if (ship.remodel && ship.remodel.prev) {
            parentMap[sId] = parseInt(ship.remodel.prev)
        }
    })

    // 2.1 Pass: Supplement Parent Map from Master Data (Block 2 & Runtime)
    // Master Data links Forward (api_aftershipid), so we reverse it to get Child -> Parent
    const processMasterForParents = (source) => {
        if (!source) return
        Object.values(source).forEach(s => {
            const afterId = parseInt(s.api_aftershipid)
            const currentId = s.api_id
            
            // If this ship remodels into something valid
            if (afterId > 0) {
                // If the target (afterId) doesn't have a known parent yet, record this connection
                // This links "Next Form" back to "Current Form"
                if (!parentMap[afterId]) {
                    parentMap[afterId] = currentId
                }
            }
        })
    }

    // Load Master Cache if not already loaded (Optimization: Reuse if loaded later? No, needed here for findRoot)
    // We need to move the cache loading up or do it twice.
    // Let's load it once at the top of function for consistency.
    let masterCache = { ships: {} }
    try {
        const { loadMasterCache } = require('./master-cache')
        masterCache = loadMasterCache() || { ships: {} }
    } catch (e) {
        // console.warn ...
    }

    processMasterForParents(masterCache.ships)
    processMasterForParents($ships)
    cachedParentMap = parentMap

    // 3rd Pass: Group by Base Ancestor
    Object.keys(directProvision).forEach(providerIdStr => {
        const providerId = parseInt(providerIdStr)
        const providerData = directProvision[providerId]
        
        const rootId = findRoot(providerId)
        
        // Initialize Root Entry
        if (!map[rootId]) {
            map[rootId] = {
                baseId: rootId,
                provides: []
            }
        }

        // Add items to Root
        providerData.stock.forEach(eqId => {
            // No Deduplication: Show ALL forms that provide the item.
            // This ensures intermediate forms (like Tan Yang) appear in the Ship List
            // even if they provide the same equipment as an earlier form.
            
            map[rootId].provides.push({
                equipId: eqId,
                providerId: providerId,
                level: providerData.level,
            })
        })
    })

    // 4th Pass: Merge External Initial Equipment Data (from Akashi-list)
    try {
        // Master Cache already loaded above

        const initialEquipData = require('../initial_equip_ships.json')
        if (initialEquipData) {
            Object.keys(initialEquipData).forEach(eqIdStr => {
                const eqId = parseInt(eqIdStr, 10)
                const providers = initialEquipData[eqIdStr]
                
                

                
                providers.forEach(p => {
                    // p has { name, level }
                    
                    let foundId = -1;
                    
                    // Priority 1: Check WCTF (Block 1) - Best for multilingual support
                    for (const sId in ships) {
                        const s = ships[sId];
                        const names = s.name || {};
                        if (
                            names.ja_jp === p.name || 
                            names.zh_cn === p.name || 
                            names.japanese === p.name ||
                            (s.api_name && s.api_name === p.name)
                        ) {
                            foundId = parseInt(sId);
                            break;
                        }
                    }

                    // Priority 2: Check Master Cache (Block 2) - For new ships via stored cache
                    if (foundId === -1 && masterCache && masterCache.ships) {
                         Object.values(masterCache.ships).forEach(ms => {
                             if (ms.api_name === p.name) {
                                  foundId = ms.api_id
                             }
                         })
                    }

                    // Priority 3: Check Runtime Master Data ($ships) - For immediate validation if passed
                    if (foundId === -1 && $ships) {
                         Object.values($ships).forEach(ms => {
                             if (ms.api_name === p.name) {
                                  foundId = ms.api_id
                             }
                         })
                    }
                    
                    if (foundId > 0) {
                        // Ensure foundId is treated as a valid ship even if not in wctf.ships
                        // Effectively "mounting" the ID.
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
                        }
                    }
                })
            })
        }
    } catch (e) {
        console.error("Failed to load initial_equip_ships.json", e)
    }

    cachedFarmingMap = map
    cachedWctfShips = wctf.ships
    cachedMasterShips = $ships
    return map
}

// --- 2. Inventory Check ---

export function checkQuota(targetCount, equipId, userEquips, userShips, farmingMap) {
    if (targetCount <= 0) return { isSatisfied: true, current: 0 }

    let holding = 0
    Object.values(userEquips).forEach(item => {
        if (item.api_slotitem_id === equipId) {
            holding++
        }
    })

    let potential = 0
    // Check Potential: Do I have a ship that is an ancestor of a Provider?
    Object.values(userShips).forEach(ship => {
        const masterId = ship.api_ship_id
        
        // Use findRoot to handle merged ships (e.g. Eidsvold Kai -> Eidsvold)
        // If we don't do this, we won't find the entry in farmingMap which is keyed by Root ID.
        const rootId = findRoot(masterId)

        const info = farmingMap[rootId] || farmingMap[masterId] // Try Root first, then direct (fallback)
        
        if (info && info.provides) {
             // Check if this ship (or its family) provides the target equip
             // And specifically, if the form I have is NOT the one that provides it (or I have multiple forms)
             // Simplified Logic: If I have a ship in this family, count it as potential.
             // Refined: If I have usage for this ship family to get the equip.
             
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
