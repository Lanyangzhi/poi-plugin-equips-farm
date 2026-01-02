import { createSelector } from 'reselect'
import { extensionSelectorFactory } from 'views/utils/selectors'
import { wctfSelector } from 'views/utils/selectors' // POI provides this if available, otherwise we use state.wctf

const EXTENSION_KEY = 'poi-plugin-farming-assistant'

// Plugin State
export const farmingStateSelector = createSelector(
  extensionSelectorFactory(EXTENSION_KEY),
  (state) => state || {}
)

// Targets is now an Object: { [equipId]: quotaCount }
// We assume migration happens in reducer/middleware or we handle it here.
export const targetsSelector = createSelector(
  farmingStateSelector,
  (state) => state.targets || {} 
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
