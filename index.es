import { syncConfig } from './redux/actions'
import { targetsSelector, wctfDataSelector, userEquipsSelector, userShipsSelector, masterShipsSelector, masterEquipmentsSelector } from './redux/selectors'
import { getFarmingMap, checkQuota } from './lib/data-processor'

// Export Redux Reducer
export { reducer } from './redux'

// Export UI
export { reactClass } from './views'

const EXTENSION_KEY = 'poi-plugin-equips-farm'

// Config Observer
let unsubscribeObserver = null
const configPath = `${EXTENSION_KEY}.targets`

// Event Handler for Game Response
const handleGameResponse = (e) => {
  const { path, body } = e.detail
  
  let gotShipId = -1

  if (path === '/kcsapi/api_req_sortie/battleresult') {
      if (body.api_get_ship) {
          gotShipId = body.api_get_ship.api_ship_id
      }
  } else if (path === '/kcsapi/api_req_kousyou/getship') {
      gotShipId = body.api_ship_id 
  }

  if (gotShipId > 0 && window.store) {
      const state = window.store.getState()
      const targets = targetsSelector(state)
      const wctf = wctfDataSelector(state)
      const userEquips = userEquipsSelector(state)
      const userShips = userShipsSelector(state)
      const $ships = masterShipsSelector(state)
      const $equipments = masterEquipmentsSelector(state)

      const farmingMap = getFarmingMap(wctf)
      const shipInfo = farmingMap[gotShipId]

      if (shipInfo && shipInfo.provides) {
          const hits = []
          
          shipInfo.provides.forEach(p => {
              const targetCount = targets[p.equipId] || 0
              if (targetCount > 0) {
                  const quota = checkQuota(targetCount, p.equipId, userEquips, userShips, farmingMap)
                  
                  if (!quota.isSatisfied) {
                       const equipMaster = $equipments[p.equipId]
                       const eqName = equipMaster ? equipMaster.api_name : `#${p.equipId}`
                       hits.push(`${eqName} (Lv.${p.level})`)
                  }
              }
          })

          if (hits.length > 0) {
              // Get ship name
              const shipMaster = $ships[gotShipId]
              const shipName = shipMaster ? shipMaster.api_name : `Ship#${gotShipId}`
              
              // Format: 🔒{ship}可获得{equip}⚙️
              const equipList = hits.join('、')
              window.toast(`🔒${shipName}可获得${equipList}⚙️`, { type: 'success' })
          }
      }
  }
}

export function pluginDidLoad() {
  const savedTargets = window.config.get(configPath, {})
  
  if (window.store) {
      // Initialize state with saved config
      window.store.dispatch(syncConfig(savedTargets))

      // Use store.subscribe for persistence with proper comparison
      let currentTargetsJson = JSON.stringify(savedTargets)
      
      unsubscribeObserver = window.store.subscribe(() => {
          try {
              const state = window.store.getState()
              const newTargets = targetsSelector(state)
              const newTargetsJson = JSON.stringify(newTargets)
              
              // Only save if targets actually changed (deep comparison via JSON)
              if (newTargetsJson !== currentTargetsJson) {
                  window.config.set(configPath, newTargets)
                  currentTargetsJson = newTargetsJson
              }
          } catch (error) {
              console.error('[Farming Assistant] Error in store subscription:', error)
          }
      })
  }

  window.addEventListener('game.response', handleGameResponse)
}

export function pluginWillUnload() {
  if (unsubscribeObserver) {
    unsubscribeObserver()
  }
  window.removeEventListener('game.response', handleGameResponse)
}
