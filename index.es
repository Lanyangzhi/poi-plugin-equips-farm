import { syncConfig } from './redux/actions'
import { targetsSelector, wctfDataSelector, userEquipsSelector, userShipsSelector } from './redux/selectors'
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
      const { $equipments } = state.const || {}

      const farmingMap = getFarmingMap(wctf)
      const shipInfo = farmingMap[gotShipId]

      if (shipInfo && shipInfo.provides) {
          const hits = []
          
          shipInfo.provides.forEach(p => {
              const targetCount = targets[p.equipId] || 0
              if (targetCount > 0) {
                  const quota = checkQuota(targetCount, p.equipId, userEquips, userShips, farmingMap)
                  
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
  console.log('[Plugin] Loading Farming Assistant...')
  console.log('[Plugin] window.store available:', !!window.store)
  console.log('[Plugin] window.config available:', !!window.config)
  
  const savedTargets = window.config.get(configPath, {})
  console.log('[Plugin] Loaded saved targets from config:', savedTargets)
  
  if (window.store) {
      // First, dispatch the saved config to initialize state
      window.store.dispatch(syncConfig(savedTargets))
      console.log('[Plugin] Dispatched syncConfig with saved targets')
      
      // Check initial state after dispatch
      setTimeout(() => {
          const initialState = window.store.getState()
          console.log('[Plugin] Full Redux state after init:', initialState)
          console.log('[Plugin] Extension state:', initialState.ext)
          console.log('[Plugin] Plugin state:', initialState.ext && initialState.ext[EXTENSION_KEY])
      }, 100)

      // Use store.subscribe for persistence with proper comparison
      let currentTargetsJson = JSON.stringify(savedTargets)
      
      unsubscribeObserver = window.store.subscribe(() => {
          try {
              const state = window.store.getState()
              const newTargets = targetsSelector(state)
              const newTargetsJson = JSON.stringify(newTargets)
              
              // Only save if targets actually changed (deep comparison via JSON)
              if (newTargetsJson !== currentTargetsJson) {
                  console.log('[Plugin] Targets changed from', currentTargetsJson, 'to', newTargetsJson)
                  window.config.set(configPath, newTargets)
                  currentTargetsJson = newTargetsJson
              }
          } catch (error) {
              console.error('[Plugin] Error in store subscription:', error)
          }
      })
      
      console.log('[Plugin] Config observer installed')
  } else {
      console.error('[Plugin] window.store not available!')
  }

  window.addEventListener('game.response', handleGameResponse)
  console.log('[Plugin] Farming Assistant loaded successfully')
}

export function pluginWillUnload() {
  if (unsubscribeObserver) {
    unsubscribeObserver()
  }
  window.removeEventListener('game.response', handleGameResponse)
}
