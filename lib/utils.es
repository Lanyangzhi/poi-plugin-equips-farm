import shipsData from '../assets/ships.json'

// --- Icon URLs ---
const SHIP_ICON_BASE = 'http://74.120.174.162/static/image/common/ship_card'
const EQUIP_ICON_BASE = 'http://74.120.174.162/static/image/common/slotitem'

export const getShipIconUrl = (id) => `${SHIP_ICON_BASE}/${id}.png`
export const getEquipIconUrl = (id) => `${EQUIP_ICON_BASE}/${id}.png`

// --- Data Merging ---

// Returns a Map of Equipment ID -> { id, name, iconId, typeName, ships: [] }
// This needs Master Data ($ships, $equipments, $shipTypes, $equipTypes) to be passed in, 
// because we shouldn't access store directly in pure utils if possible (or we use selectors in component).
export function prepareFarmingData($ships, $equipments, $shipTypes, $equipTypes) {
  const equipmentMap = {}
  
  // 1. Iterate over local farming config (ships.json)
  shipsData.forEach(entry => {
      const shipId = entry.shipId
      const masterShip = $ships ? $ships[shipId] : null
      const shipName = masterShip ? masterShip.api_name : `Ship#${shipId}`
      const shipTypeId = masterShip ? masterShip.api_stype : 0
      const shipTypeName = ($shipTypes && $shipTypes[shipTypeId]) ? $shipTypes[shipTypeId].api_name : '??'

      entry.farming.forEach(farmItem => {
          const equipId = farmItem.equipId
          const masterEquip = $equipments ? $equipments[equipId] : null
          
          // Fallback if master equip is missing
          const equipName = masterEquip ? masterEquip.api_name : `Equip#${equipId}`
          // Safe access to api_type
          const typeId = (masterEquip && masterEquip.api_type) ? masterEquip.api_type[2] : 0
          const iconId = (masterEquip && masterEquip.api_type) ? masterEquip.api_type[3] : 0
          
          const typeName = ($equipTypes && $equipTypes[typeId]) ? $equipTypes[typeId].api_name : '??'

          if (!equipmentMap[equipId]) {
              equipmentMap[equipId] = {
                  id: equipId,
                  name: equipName,
                  iconId: iconId, 
                  typeName: typeName,
                  typeId: typeId,
                  ships: []
              }
          }

          // Add provider ship to this equipment
          equipmentMap[equipId].ships.push({
              shipId: shipId,
              shipName: shipName,
              shipType: shipTypeName,
              shipTypeId: shipTypeId,
              level: farmItem.level,
              remodel: farmItem.remodel
          })
      })
  })

  // Convert map to array
  const equipmentList = Object.values(equipmentMap)

  return { equipmentList }
}

// Logic for Drop Check
export function checkShipDrop(shipId, targetEquipIds) {
    // This logic needs to access ships.json directly to be fast and independent of Master Data if possible,
    // BUT since we minimized ships.json, we still have the IDs.
    // So current ships.json structure is enough: [{shipId, farming: [{equipId}]}]
    
    // We can assume drop check is simple: Does this ship provide anything?
    // Note: ships.json contains remodeling forms (e.g. Isuzu Kai Ni is 12). 
    // If Isuzu (110) drops, we actually want to know if "Isuzu (110)" OR "Isuzu Kai Ni (12)" provides something?
    // NO. If Isuzu drops, you have Isuzu. You need to level her.
    // So if Isuzu (110) is in list, we match.
    // If Isuzu Kai Ni (12) is in list, does dropping Isuzu count?
    // Technically YES, because you can evolve it.
    // BUT we need a "Base Ship -> Evolution" map to know that 110 becomes 12.
    // POI's $ships[id].api_aftershipid tells you the next form.
    // Implementing full evolution tree check is complex. 
    // Updated Logic: Strict match for now. If you farm Isuzu Kai Ni equipment, you probably added Isuzu Base to the list too?
    // Or users expect to add "Type 21 Radar" and be told "Isuzu dropped, she gives it at Lv 50".
    
    // Let's iterate ships.json.
    const matches = []
    
    // We need to match the Dropped Ship ID.
    // AND we also strictly speaking need to know if the Dropped Ship *evolves* into a provider.
    // For MVP, we'll check if the dropped ship ID exists in ships.json directly.
    
    const shipEntry = shipsData.find(s => s.shipId === shipId)
    if (shipEntry) {
        shipEntry.farming.forEach(item => {
            if (targetEquipIds.includes(item.equipId)) {
                matches.push({
                    equipId: item.equipId,
                    level: item.level,
                    remodel: item.remodel
                })
            }
        })
    }
    return matches
}
