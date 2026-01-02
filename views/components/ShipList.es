import React, { Component } from 'react'
import { Card, Button, InputGroup, Tag, Collapse, Divider } from '@blueprintjs/core'
import { getShipIconUrl } from '../../lib/utils' // Keep for backup?
import { Avatar } from 'views/components/etc/avatar'

const FilterBtn = ({ active, label, onClick }) => (
    <Button 
        active={active} 
        minimal={!active} 
        intent={active ? "primary" : "none"} 
        onClick={onClick} 
        small={true}
        style={{ marginRight: 5, marginBottom: 5 }}
    >
        {label}
    </Button>
)

export default class ShipList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            shipTypeFilter: 'All', // All, DD, CL, etc. (Need to extract available types)
            statusFilter: 'All', // All, Marked (Active), Unmarked
            search: '',
        }
    }

    render() {
        // Need to reverse the Equipment-centric view to Ship-centric view
        // But simpler: The props passed in could be "All Ships that are in farming list"
        // Let's assume parent passes a processed ship list or we process it here.
        // Actually, `views/index.es` should probably prepare a "Ship List" from the "Equipment List" or we do it here.
        // Let's do it here to keep index clean.
        
        const { equipmentList, targets } = this.props
        const { shipTypeFilter, statusFilter, search } = this.state

        // 1. Flatten to Ship Map: ShipId -> { name, type, farming: [ {equip, level, isTarget} ] }
        const shipMap = {}
        const availableTypes = new Set(['All'])

        equipmentList.forEach(eq => {
            const targetCount = targets[eq.id] || 0
            const isTarget = targetCount > 0
            
            eq.ships.forEach(s => {
                if (!shipMap[s.shipId]) {
                    shipMap[s.shipId] = {
                        id: s.shipId,
                        name: s.shipName,
                        type: s.shipType,
                        items: [],
                        hasActiveTarget: false
                    }
                    availableTypes.add(s.shipType)
                }
                shipMap[s.shipId].items.push({
                    equipName: eq.name,
                    equipId: eq.id,
                    level: s.level,
                    isTarget: isTarget,
                    quota: targetCount // Optional: show quota in tag?
                })
                if (isTarget) {
                    shipMap[s.shipId].hasActiveTarget = true
                }
            })
        })

        let ships = Object.values(shipMap)

        // 2. Filter
        ships = ships.filter(s => {
            // Search
            if (search && !s.name.includes(search)) return false
            
            // Type
            if (shipTypeFilter !== 'All' && s.type !== shipTypeFilter) return false

            // Status
            if (statusFilter === 'Marked' && !s.hasActiveTarget) return false
            if (statusFilter === 'Unmarked' && s.hasActiveTarget) return false

            return true
        })
        
        // Sort by ID is usually fine, or Type
        ships.sort((a,b) => a.id - b.id)

        // Generate Type Buttons
        const typeButtons = Array.from(availableTypes).sort().map(t => (
            <FilterBtn key={t} active={shipTypeFilter === t} label={t} onClick={() => this.setState({ shipTypeFilter: t })} />
        ))

        return (
            <div className="ship-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="filters" style={{ marginBottom: 10, flexShrink: 0 }}>
                     <InputGroup 
                        leftIcon="search" 
                        placeholder="Search ship..." 
                        value={search}
                        onChange={(e) => this.setState({ search: e.target.value })}
                        style={{ marginBottom: 10 }}
                    />
                    <div style={{ marginBottom: 5 }}>
                        <span style={{ marginRight: 10, fontWeight: 'bold' }}>Status:</span>
                        <FilterBtn active={statusFilter === 'All'} label="All" onClick={() => this.setState({ statusFilter: 'All' })} />
                        <FilterBtn active={statusFilter === 'Marked'} label="Marked" onClick={() => this.setState({ statusFilter: 'Marked' })} />
                        <FilterBtn active={statusFilter === 'Unmarked'} label="Unmarked" onClick={() => this.setState({ statusFilter: 'Unmarked' })} />
                    </div>
                    <div>
                         <span style={{ marginRight: 10, fontWeight: 'bold' }}>Type:</span>
                         {typeButtons}
                    </div>
                </div>

                <div className="list-content" style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }}>
                    {ships.map(ship => (
                        <Card key={ship.id} elevation={1} style={{ marginBottom: 8, padding: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar mstId={ship.id} height={30} style={{ marginRight: 10, minWidth: 120 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>{ship.name} <small className="bp3-text-muted">({ship.type})</small></div>
                                    <div style={{ marginTop: 5 }}>
                                        {ship.items.map((item, idx) => (
                                            <Tag 
                                                key={idx} 
                                                intent={item.isTarget ? "success" : "none"} 
                                                minimal={!item.isTarget}
                                                style={{ marginRight: 5, marginBottom: 2 }}
                                            >
                                                {item.equipName} (Lv.{item.level})
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {ships.length === 0 && <div className="bp3-text-muted" style={{ textAlign: 'center', marginTop: 20 }}>No ships found.</div>}
                </div>
            </div>
        )
    }
}
