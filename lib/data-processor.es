// lib/data-processor.es
// Handles WCTF Data Processing and Inventory Quota Logic

/*
  Farming Map Structure:
  {
    [shipId]: {
      name: "Ship Name", // From WCTF (ja_jp)
      provides: [
         { equipId: 1, level: 12, remodelDepth: 0 }, // Direct
         { equipId: 2, level: 50, remodelDepth: 1 }  // From Remodel
      ]
    }
  }
*/

let cachedFarmingMap = null
let cachedWctfShips = null

// --- 1. WCTF Processing ---

export function getFarmingMap(wctf) {
    if (!wctf || !wctf.ships) return {}
    // Cache check
    if (cachedFarmingMap && cachedWctfShips === wctf.ships) return cachedFarmingMap

    const map = {}
    const ships = wctf.ships

    // DEBUG: Log WCTF Schema
    if (ships) {
        const sampleIds = Object.keys(ships).slice(0, 3)
        console.log('--- FarmingAssistant DEBUG ---')
        console.log('WCTF Ships Count:', Object.keys(ships).length)
        sampleIds.forEach(id => {
            console.log(`Ship ${id} Keys:`, Object.keys(ships[id])) // Log ALL keys
            const possibleEquip = ships[id].equip || ships[id].slots || ships[id].init_equip
            console.log(`Ship ${id} Equip Data:`, possibleEquip)
        })
        console.log('------------------------------')
    }

    // 1st Pass: Identify direct providers
    const directProvision = {} 

    Object.keys(ships).forEach(sId => {
        const ship = ships[sId]
        // Try multiple known keys for stock equipment
        const rawEquip = ship.equip || ship.slots || ship.init_equip
        
        if (!rawEquip || !Array.isArray(rawEquip)) return
        
        const myStock = []
        rawEquip.forEach(slot => {
            // Support multiple formats: {id: 123} or just 123
            let eId = -1
            if (typeof slot === 'number') eId = slot
            else if (slot && slot.id) eId = slot.id
            
            if (eId > 0) {
                 myStock.push(eId)
            }
        })

        if (myStock.length > 0) {
            directProvision[sId] = myStock
        }
    })

    /*
      2nd Pass: Reverse Remodel Lookup
      We want to know: If I have Ship A, can it become Ship B (who provides Item X)?
      WCTF `remodel` object:
      "remodel": {
        "next": 111, <-- ShipId of Next Form
        "next_lvl": 12,
        "prev": 110 <-- ShipId of Prev Form
      }

      We iterate recursively from 'Children' (Providers) back to 'Parents' (Farmable/Drop Base).
      
      For every Ship ID in `directProvision` (The "Provider"):
         Trace back `remodel.prev` until no prev (Base Ship).
         For *every* ship in that chain, record that it *can eventually provide* the items.
    */
   
    const processedShips = new Set()

    // Helper to trace back
    const traceBack = (currentId, providerId, items, depth = 0) => {
        // Record logic:
        // map[currentId] = { ... provides: [ {equipId, level: ?, remodelDepth: depth} ] }
        
        // We know 'providerId' provides 'items'.
        // 'currentId' is an ancestor (or self) of 'providerId'.
        
        // Ensure map entry
        if (!map[currentId]) {
            const s = ships[currentId]
            map[currentId] = {
                id: currentId,
                name: (s.name && s.name.ja_jp) ? s.name.ja_jp : `Ship#${currentId}`,
                provides: []
            }
        }

        // Add items
        items.forEach(equipId => {
            // Avoid dupe entries if multiple paths? (Linear path so ok)
            // But check if exists
            const exists = map[currentId].provides.find(p => p.equipId === equipId)
            if (!exists) {
                // Get Level Req.
                // If currentId == providerId, level is 1 (or current level).
                // If ancestor, we need the level to reach Provider.
                // Actually, WCTF `remodel` on the PREVIOUS ship tells us the level to reach NEXT.
                // That's hard to sum up backwards.
                
                // Simpler: Just trace back and mark "It provides X via remodel".
                // UI can show "Remodel Depth: 1" etc.
                
                // Better: Get the level of the Provider.
                // The Provider ship itself usually has `remodel.level` (level required to remodel INTO it).
                // If it's a base ship, that might be undefined or 1.
                const providerShip = ships[providerId]
                const reqLevel = (providerShip.remodel && providerShip.remodel.level) ? providerShip.remodel.level : 1

                map[currentId].provides.push({
                    equipId: equipId,
                    level: reqLevel,
                    remodelDepth: depth,
                    providerId: providerId // Who actually has it
                })
            }
        })

        // Recursive step: Go to Prev
        const currentShip = ships[currentId]
        if (currentShip && currentShip.remodel && currentShip.remodel.prev) {
            const prevId = currentShip.remodel.prev
            if (prevId) { // check valid
                traceBack(prevId, providerId, items, depth + 1)
            }
        }
    }

    Object.keys(directProvision).forEach(pId => {
        const items = directProvision[pId]
        traceBack(pId, pId, items, 0)
    })

    cachedFarmingMap = map
    cachedWctfShips = wctf.ships
    return map
}

// --- 2. Inventory Check ---

export function checkQuota(targetCount, equipId, userEquips, userShips, farmingMap) {
    if (targetCount <= 0) return { isSatisfied: true, current: 0 }

    // 1. Holding
    let holding = 0
    Object.values(userEquips).forEach(item => {
        if (item.api_slotitem_id === equipId) {
            holding++
        }
    })

    // 2. Potential
    // Check if any User Ship is in the farmingMap AND provides the target equip.
    // AND is *not* the provider itself (or is it? if I have the provider, I likely stripped the equipment already? 
    // Or it's still on it. If it's on it, `holding` counts it (via userEquips). 
    // Wait, userEquips includes equipped items? YES.
    // So `holding` covers items on ships.
    // `potential` should ONLY cover "Future Remodels". 
    // i.e. I have Isuzu (Lv 1), she *will* give Radar at Lv 12.
    // I have Isuzu Kai (Lv 12), she *gave* Radar. It's now in inventory (or on her).
    
    // So, for Potential, we count ships that provide the item, BUT exclude the case where the ship IS the provider form (and thus likely already gave it/accounted for).
    // Or simply: If I have a ship that *can remodel* into the Provider.
    
    let potential = 0
    Object.values(userShips).forEach(ship => {
        const masterId = ship.api_ship_id
        const info = farmingMap[masterId]
        if (info && info.provides) {
             const useful = info.provides.some(p => p.equipId === equipId && p.remodelDepth > 0) 
             // remodelDepth > 0 means "I am an ancestor", not the final provider.
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
