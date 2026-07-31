import { syncConfig } from './redux/actions'
import { targetsSelector, wctfDataSelector, userEquipsSelector, userShipsSelector, masterShipsSelector, masterEquipmentsSelector } from './redux/selectors'
import { getFarmingMap, checkQuota } from './lib/data-processor'
import { t } from './views/i18n'

// Export Redux Reducer
export { reducer } from './redux'

// Export UI
export { reactClass } from './views'

const EXTENSION_KEY = 'poi-plugin-equips-farm'
const MAX_MASTER_SHIPS = 5000
const MAX_MASTER_SHIPGRAPH = 5000

// Config Observer
let unsubscribeObserver = null
const configPath = `${EXTENSION_KEY}.targets`

const isValidMasterCachePayload = (body) => {
  if (!body) return false

  const { api_mst_ship, api_mst_shipgraph } = body
  if (!Array.isArray(api_mst_ship) || !Array.isArray(api_mst_shipgraph)) return false
  if (api_mst_ship.length === 0 || api_mst_shipgraph.length === 0) return false
  if (api_mst_ship.length > MAX_MASTER_SHIPS || api_mst_shipgraph.length > MAX_MASTER_SHIPGRAPH) return false

  return api_mst_ship.every(s => s && Number.isInteger(s.api_id)) &&
    api_mst_shipgraph.every(g => g && Number.isInteger(g.api_id))
}

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
  } else if (path === '/kcsapi/api_start2/getData') {
      // Block 2: Save Master Data Cache
      if (isValidMasterCachePayload(body)) {
          try {
              const { saveMasterCache } = require('./lib/master-cache')
              saveMasterCache(body).catch((error) => {
                  console.error('[Farming Plugin] Error saving master cache', error)
              })
          } catch (error) {
              console.error('[Farming Plugin] Failed to initialize master cache', error)
          }
      }
  }

  if (gotShipId > 0 && window.store) {
      try {
          const state = window.store.getState()
          const targets = targetsSelector(state)
          const wctf = wctfDataSelector(state)
          const userEquips = userEquipsSelector(state)
          const userShips = userShipsSelector(state)
          const $ships = masterShipsSelector(state)
          const $equipments = masterEquipmentsSelector(state)
          const farmingMap = getFarmingMap(wctf, $ships)
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
                           hits.push(`${eqName} (${t('levelPrefix')}${p.level})`)
                      }
                  }
              })

              if (hits.length > 0) {
                  // Get ship name
                  const shipMaster = $ships[gotShipId]
                  const shipName = shipMaster ? shipMaster.api_name : `Ship#${gotShipId}`
                  
                  // Format: 🔒{ship}可获得{equip}⚙️
                  const equipList = hits.join('、')
                  if (typeof window.toast === 'function') {
                      window.toast(t('toastGotShip', { shipName, equipList }), { type: 'success' })
                  }
              }
          }
      } catch (error) {
          console.error('[Farming Plugin] Error handling game response:', error)
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
