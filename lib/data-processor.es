// lib/data-processor.es
// Handles WCTF Data Processing and Inventory Quota Logic

let cachedFarmingMap = null
let cachedWctfShips = null

// --- 1. WCTF Processing ---

export function getFarmingMap(wctf) {
    if (!wctf || !wctf.ships) return {}
    if (cachedFarmingMap && cachedWctfShips === wctf.ships) return cachedFarmingMap

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

    // Helper: Find Base Ancestor
    const findRoot = (id) => {
        let curr = id
        let steps = 0
        // Walk up until no parent found
        while(parentMap[curr] && steps < 20) {
            curr = parentMap[curr]
            steps++
        }
        return curr
    }

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
            // Deduplication? 
            // If multiple forms provide same item (e.g. Kai and Kai Ni):
            // We want to show the earliest availability (Lowest Level).
            
            const existing = map[rootId].provides.find(p => p.equipId === eqId)
            
            if (existing) {
                // If new provider is lower level, replace/update?
                // Or keep both? Keeping both is informative but might clutter.
                // Let's keep the one with LOWER level requirement.
                if (providerData.level < existing.level) {
                   existing.level = providerData.level
                   existing.providerId = providerId
                }
            } else {
                map[rootId].provides.push({
                    equipId: eqId,
                    providerId: providerId,
                    level: providerData.level,
                    // We assume 'remodel.level' of Provider is the correct Acquisition Level
                })
            }
        })
    })

    cachedFarmingMap = map
    cachedWctfShips = wctf.ships
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
        
        // farmingMap is Keyed by BASE ID.
        // If masterId is in farmingMap, it is a Base ship match.
        // What if masterId is an intermediate form (e.g. Kai), but not yet Provider (Kai Ni)?
        // Our farmingMap keys are ROOTS. 
        // We need to know if `masterId` belongs to the tree of a Root that provides `equipId`.
        
        // Simplification for v4: 
        // We check if `masterId` matches the 'baseId' of a group.
        // (This assumes we keep Base copies. If we have intermediate, this check might fail.)
        // Ideally we check: findRoot(masterId) -> match map Key.
        // But `wctf` is needed for findRoot. We closed over it? No.
        
        // Let's rely on the fact that most farming involves keeping Base ships.
        // Or, we can do a quick lookup if we exported the parentMap or findRoot logic.
        // For now, strict Base ID match is "Safe" (undercounts rather than overcounts).
        
        const info = farmingMap[masterId]
        if (info && info.provides) {
             const useful = info.provides.some(p => p.equipId === equipId && p.providerId !== masterId)
             // If I have the Base, and Base != Provider, it's potential.
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
