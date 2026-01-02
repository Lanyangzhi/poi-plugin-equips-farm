import { createSelector } from 'reselect'
import { extensionSelectorFactory } from 'views/utils/selectors'
import { wctfSelector } from 'views/utils/selectors' // POI provides this if available, otherwise we use state.wctf

const EXTENSION_KEY = 'poi-plugin-equips-farm'

// Plugin State - Direct access with POI's _ wrapper
export const farmingStateSelector = (state) => {
  const extState = (state.ext && state.ext[EXTENSION_KEY]) || {}
  // POI wraps reducer state in a '_' key
  const pluginState = extState._ || extState || {}
  console.log('[Selector] farmingStateSelector - ext state:', extState)
  console.log('[Selector] farmingStateSelector - plugin state:', pluginState)
  return pluginState
}

// Targets is now an Object: { [equipId]: quotaCount }
export const targetsSelector = createSelector(
  farmingStateSelector,
  (state) => {
    const targets = state.targets || {}
    console.log('[Selector] targetsSelector - farming state:', state, 'targets:', targets)
    return targets
  }
)

// POI Master Data Selectors (Const)
export const constSelector = (state) => state.const || {}

export const masterShipsSelector = createSelector(
  constSelector,
  (state) => state.$ships || {}
)

export const masterEquipmentsSelector = createSelector(
  constSelector,
  (state) => state.$equips || state.$equipments || state.$slotitems || {}
)

export const masterShipTypesSelector = createSelector(
  constSelector,
  (state) => state.$shipTypes || {}
)

export const masterEquipTypesSelector = createSelector(
  constSelector,
  (state) => state.$equipTypes || {}
)

// WCTF Data (WhoCallsTheFleet)
// state.wctf contains { ships, items }
export const wctfDataSelector = (state) => state.wctf || {}

// User Inventory Selectors (Info)
export const infoSelector = (state) => state.info || {}

export const userShipsSelector = createSelector(
    infoSelector,
    (info) => info.ships || {}
)

export const userEquipsSelector = createSelector(
    infoSelector,
    (info) => info.equips || {}
)
