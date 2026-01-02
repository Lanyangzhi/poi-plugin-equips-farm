export const ADD_TARGET = '@@poi-plugin-farming-assistant/ADD_TARGET'
export const REMOVE_TARGET = '@@poi-plugin-farming-assistant/REMOVE_TARGET'
export const SYNC_CONFIG = '@@poi-plugin-farming-assistant/SYNC_CONFIG'

export function addTarget(equipmentId, quota = 1) {
  return {
    type: ADD_TARGET,
    equipmentId,
    quota,
  }
}

export function removeTarget(equipmentId) {
  return {
    type: REMOVE_TARGET,
    equipmentId,
  }
}

export function syncConfig(targets) {
  return {
      type: SYNC_CONFIG,
      targets, // Can be Array (legacy) or Object
  }
}
