import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Tab, Tabs } from '@blueprintjs/core'
import { addTarget, removeTarget } from '../redux/actions'
import { targetsSelector, masterShipsSelector, masterEquipmentsSelector, masterShipTypesSelector, masterEquipTypesSelector, wctfDataSelector, userEquipsSelector, userShipsSelector, constSelector } from '../redux/selectors'
import { getFarmingMap } from '../lib/data-processor'

import EquipmentList from './components/EquipmentList'
import ShipList from './components/ShipList'

// Main UI
class FarmingAssistant extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeTab: 'equipment',
    }
  }

  handleTabChange = (newTabId) => {
      this.setState({ activeTab: newTabId })
  }

  render() {
    const { 
        targets, 
        addTarget, 
        removeTarget,
        $ships,
        $equipments, 
        $shipTypes,
        $equipTypes,
        wctf,
        userEquips,
        userShips
    } = this.props
    
    // 1. Generate Farming Map from WCTF (Consolidated by Base ID)
    const farmingMap = getFarmingMap(wctf)
    
    // 2. Convert Map to List for UI
    const equipmentMap = {}

    Object.keys(farmingMap).forEach(baseShipIdStr => {
        const baseShipId = parseInt(baseShipIdStr)
        const info = farmingMap[baseShipIdStr]
        
        // Name Fix: Lookup Base Ship Name
        const baseShipMaster = $ships[baseShipId] || {}
        const baseShipName = baseShipMaster.api_name || `Ship#${baseShipId}`

        info.provides.forEach(p => {
             const equipId = p.equipId
             
             if (!equipmentMap[equipId]) {
                 const masterEquip = $equipments[equipId] || {}
                 const typeId = (masterEquip.api_type && masterEquip.api_type[2]) || 0
                 
                 equipmentMap[equipId] = {
                     id: equipId,
                     name: masterEquip.api_name || `Equip#${equipId}`,
                     iconId: (masterEquip.api_type && masterEquip.api_type[3]) || 0,
                     typeName: ($equipTypes[typeId] || {}).api_name || 'Unknown',
                     typeId: typeId,
                     ships: []
                 }
             }
             
             // Get Provider (Evolution) Name
             const providerMaster = $ships[p.providerId] || {}
             const providerName = providerMaster.api_name || `Form#${p.providerId}`

             equipmentMap[equipId].ships.push({
                 shipId: baseShipId, // Use BASE ID for grouping
                 shipName: baseShipName,
                 providerId: p.providerId,
                 providerName: providerName,
                 level: p.level, 
                 remodel: true
             })
        })
    })

    const equipmentList = Object.values(equipmentMap)

    return (
      <div className="farming-assistant-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 10px' }}>
         {/* Native Flex Layout for Scrolling */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Tabs id="farming-tabs" onChange={this.handleTabChange} selectedTabId={this.state.activeTab} animate={true} renderActiveTabPanelOnly={true} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Tab id="equipment" title="Equipments" className="bp3-tab-panel-scrollable" panel={
                    <div style={{ height: '100%' }}>
                        <EquipmentList 
                            equipments={equipmentList} 
                            targets={targets} 
                            onAdd={addTarget} 
                            onRemove={removeTarget}
                            userEquips={userEquips}
                            userShips={userShips}
                            farmingMap={farmingMap}
                            $equipTypes={$equipTypes}
                            $ships={$ships}
                        />
                    </div>
                } />
                <Tab id="ships" title="Ships" className="bp3-tab-panel-scrollable" panel={
                     <div style={{ height: '100%' }}>
                        <ShipList 
                            equipmentList={equipmentList} 
                            targets={targets} 
                            $ships={$ships}
                        />
                    </div>
                } />
            </Tabs>
        </div>
      </div>
    )
  }
}

export const reactClass = connect(
  (state) => ({
    const: constSelector(state), 
    targets: targetsSelector(state),
    $ships: masterShipsSelector(state),
    $equipments: masterEquipmentsSelector(state),
    $shipTypes: masterShipTypesSelector(state),
    $equipTypes: masterEquipTypesSelector(state),
    wctf: wctfDataSelector(state),
    userEquips: userEquipsSelector(state),
    userShips: userShipsSelector(state),
  }),
  { addTarget, removeTarget }
)(FarmingAssistant)
