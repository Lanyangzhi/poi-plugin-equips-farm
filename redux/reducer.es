import { ADD_TARGET, REMOVE_TARGET, SYNC_CONFIG } from './actions'

const initialState = {
  active: true,
  targets: {}, // Changed from Array to Object: { [equipId]: quota }
}

export function reducer(state = initialState, action) {
  const { type, equipmentId, quota, targets } = action
  switch (type) {
    case ADD_TARGET:
      // If adding existing, update quota
      // Default quota 1 if not specified
      const newTargets = {
          ...state.targets,
          [equipmentId]: quota || (state.targets[equipmentId] ? state.targets[equipmentId] + 1 : 1)
      }
      return {
        ...state,
        targets: newTargets
      }
    case REMOVE_TARGET:
      const updatedTargets = { ...state.targets }
      delete updatedTargets[equipmentId]
      return {
        ...state,
        targets: updatedTargets,
      }
    case SYNC_CONFIG:
        // Migration logic: If array (old config), convert to object
        let migratedTargets = targets || {}
        if (Array.isArray(targets)) {
            migratedTargets = {}
            targets.forEach(id => {
                migratedTargets[id] = 1 // Default quota 1 for legacy array
            })
        }
        return {
            ...state,
            targets: migratedTargets
        }
    default:
      return state
  }
}
