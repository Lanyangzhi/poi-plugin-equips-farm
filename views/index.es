import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Tab, Tabs } from '@blueprintjs/core'
import { addTarget, removeTarget } from '../redux/actions'
import { targetsSelector, masterShipsSelector, masterEquipmentsSelector, masterShipTypesSelector, masterEquipTypesSelector, wctfDataSelector, userEquipsSelector, userShipsSelector, constSelector } from '../redux/selectors'
import { getFarmingMap } from '../lib/data-processor'
import { prepareFarmingData } from '../lib/utils' // Old utils, likely replace with data-processor usage

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
    
    // DEBUG: Master Data Availability
    console.log('FarmingAssistant Render State:', { 
        targetsCount: Object.keys(targets).length,
        shipsCount: Object.keys($ships || {}).length, 
        equipCount: Object.keys($equipments || {}).length,
        constKeys: Object.keys(this.props.const || {}), // Log top level keys
        wctfReady: !!wctf && !!wctf.ships
    })

    // 1. Generate Farming Map from WCTF (Dynamic)
    // If wctf is empty (loading), farmingMap will be empty.
    const farmingMap = getFarmingMap(wctf)
    
    // 2. Convert Map to List for UI (Need a helper for this)
    // We can reuse the logic from `utils.prepareFarmingData` but adapted for the WCTF structure.
    
    // Generating equipmentList from farmingMap
    const equipmentMap = {}

    // Iterate all ships in farming map
    Object.keys(farmingMap).forEach(shipIdStr => {
        const shipId = parseInt(shipIdStr)
        const info = farmingMap[shipIdStr]
        const masterShip = $ships[shipId] || $ships[shipIdStr] || {}
        
        // Debug: Log if masterShip name is missing but ID is valid
        if (Object.keys(masterShip).length === 0 && shipId > 0) {
             console.warn(`FarmingAssistant: Ship ${shipId} not found in $ships`, { keys: Object.keys($ships).slice(0, 5) })
        }
        
        const shipTypeName = ($shipTypes[masterShip.api_stype] || {}).api_name || '??'

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

             equipmentMap[equipId].ships.push({
                 shipId: parseInt(shipId),
                 shipName: info.name,
                 shipType: shipTypeName,
                 level: p.level,
                 remodel: p.remodelDepth > 0 // If depth > 0, it means it needs remodel
             })
        })
    })

    const equipmentList = Object.values(equipmentMap)

     return (
      <div className="farming-assistant" style={{ padding: '0 15px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <style>{`
            .farming-assistant .bp3-tabs {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            .farming-assistant .bp3-tab-list {
                flex-shrink: 0;
            }
            .farming-assistant .bp3-tab-panel {
                flex: 1;
                overflow: hidden; /* Let child scroll */
                margin-top: 10px;
            }
        `}</style>
        <Tabs id="farming-tabs" onChange={this.handleTabChange} selectedTabId={this.state.activeTab} animate={true}>
            <Tab id="equipment" title="Equipments" panel={
                <EquipmentList 
                    equipments={equipmentList} 
                    targets={targets} 
                    onAdd={addTarget} 
                    onRemove={removeTarget}
                    userEquips={userEquips}
                    userShips={userShips}
                    farmingMap={farmingMap}
                />
            } />
            <Tab id="ships" title="Ships" panel={
                <ShipList 
                    equipmentList={equipmentList} 
                    targets={targets} 
                />
            } />
        </Tabs>
      </div>
    )
  }
}

export const reactClass = connect(
  (state) => ({
    const: constSelector(state), // For Debug
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
