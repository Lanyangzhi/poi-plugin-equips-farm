import { observe, observer } from 'redux-observers'
import { store } from 'views/create-store'
import { syncConfig } from './redux/actions'
import { targetsSelector, wctfDataSelector, userEquipsSelector, userShipsSelector } from './redux/selectors' // Needed for logic
import { getFarmingMap, checkQuota } from './lib/data-processor'

// Export Redux Reducer
export { reducer } from './redux'

// Export UI
export { reactClass } from './views'

const EXTENSION_KEY = 'poi-plugin-farming-assistant'

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

  if (gotShipId > 0) {
      const state = store.getState()
      const targets = targetsSelector(state) // Object { [id]: count }
      const wctf = wctfDataSelector(state)
      const userEquips = userEquipsSelector(state)
      const userShips = userShipsSelector(state)
      const { $equipments } = state.const || {} // For Names

      // 1. Get Farming Map (WCTF)
      const farmingMap = getFarmingMap(wctf)
      const shipInfo = farmingMap[gotShipId]

      if (shipInfo && shipInfo.provides) {
          const hits = []
          
          shipInfo.provides.forEach(p => {
              const targetCount = targets[p.equipId] || 0
              if (targetCount > 0) {
                  // Check Quota
                  const quota = checkQuota(targetCount, p.equipId, userEquips, userShips, farmingMap)
                  
                  // Trigger if NOT satisfied yet. 
                  // Wait, "checkQuota" calculates CURRENT status (including existing inventory).
                  // If current < target, we NEED more. So this drop is useful.
                  // If current >= target, we don't need more?
                  // NOTE: "current" calculation in checkQuota INCLUDES potential from existing ships in fleet.
                  // It does NOT include THIS newly dropped ship (because it's just dropped, maybe not synced to info.ships yet).
                  // So if (current < target), then THIS drop is vital.
                  // If (current >= target), then we have enough.
                  
                  if (!quota.isSatisfied) {
                       const eqName = ($equipments && $equipments[p.equipId]) ? $equipments[p.equipId].api_name : '#' + p.equipId
                       hits.push(`${eqName} (Lv.${p.level})`)
                  }
              }
          })

          if (hits.length > 0) {
              window.toast(`⚓ Farming Assistant: Useful Drop! Provides: [${hits.join(', ')}]`, { type: 'success' })
          }
      }
  }
}

export function pluginDidLoad() {
  const savedTargets = window.config.get(configPath, {})
  store.dispatch(syncConfig(savedTargets))

  unsubscribeObserver = observe(store, [
    observer(
      (state) => targetsSelector(state),
      (dispatch, current) => {
        window.config.set(configPath, current)
      }
    ),
  ])

  window.addEventListener('game.response', handleGameResponse)
}

export function pluginWillUnload() {
  if (unsubscribeObserver) {
    unsubscribeObserver()
  }
  window.removeEventListener('game.response', handleGameResponse)
}
