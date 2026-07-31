// views/i18n.es
// Translation helper for poi's plugin i18n system.
//
// poi loads translation resources from `assets/i18n/<locale>.json` (keyed by
// plugin package name) and exposes them through window.i18n[namespace].__().
// On older poi versions, or when the resources are not registered yet,
// we fall back to the bundled English dictionary below.

const NS = 'poi-plugin-equips-farm'

const FALLBACK = {
  tabEquipments: 'Equipments',
  tabShips: 'Ships',
  searchEquipPlaceholder: 'Search equipment...',
  searchShipPlaceholder: 'Search ship...',
  filterAll: 'All',
  filterMarked: 'Marked',
  filterUnmarked: 'Unmarked',
  markedOnly: 'Marked Only',
  loadingTypes: 'Loading types...',
  noItemsMatchFilter: 'No items match filter.',
  noShipsFound: 'No ships found.',
  typeOthers: 'Others',
  levelPrefix: 'Lv.',
  initialLabel: 'Initial',
  viaProvider: 'via {{name}}',
  initTag: 'Init',
  noDataTitle: 'No equipment data detected',
  noDataDesc: 'The list is empty, probably because data sources are not ready. Check the source status below, retry, or see the README for troubleshooting.',
  dataSource: 'Data source status',
  wctfLabel: 'WCTF Database',
  masterDataLabel: 'Game master data',
  masterCacheLabel: 'Local cache',
  bundledDataLabel: 'Bundled data',
  statusLoaded: 'Loaded ({{count}})',
  statusEmpty: 'Not loaded',
  statusCorrupt: 'Corrupted (removed)',
  statusNotExist: 'Missing',
  statusError: 'Error: {{error}}',
  retryButton: 'Reload',
  clearFiltersButton: 'Clear filters',
  clearTypeFiltersButton: 'Clear types',
  diagnosticHint: 'Hint: if the WCTF database is empty, open poi Settings -> About -> Update and click the update button for the WCTF database. If game master data is empty, make sure you are logged in with game data loaded.',
  noMatchDesc: 'No equipment matches the current filters. Clear filters or adjust your search.',
  loadingText: 'Loading data...',
  toastGotShip: '🔒{{shipName}} can provide {{equipList}}⚙️'
}

const interpolate = (template, args) => {
  if (!args || args.length === 0) return template
  const params = (typeof args[0] === 'object' && args[0] !== null) ? args[0] : {}
  return template.replace(/\{\{(\w+)\}\}/g, (m, name) =>
    params[name] !== undefined ? params[name] : m)
}

// Translate a key. Falls back to English when poi's i18n is unavailable.
export function t(key, ...args) {
  try {
    const ns = window.i18n && (window.i18n[NS] || window.i18n.default)
    if (ns && typeof ns.__ === 'function') {
      const translated = ns.__(key)
      if (translated && translated !== key) {
        return interpolate(translated, args)
      }
    }
  } catch (e) {
    // fall through to bundled dictionary
  }
  return interpolate(FALLBACK[key] || key, args)
}
