import React, { Component } from 'react'
import { Card, Button, InputGroup, Tag, Collapse } from '@blueprintjs/core'
import { Avatar } from 'views/components/etc/avatar'

export default class ShipList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            search: '',
            filterMarked: false
        }
    }

    render() {
        // Consolidated Data passed from index.es (via equipmentList construction)
        // Or we reconstruct it here?
        // Let's rely on logic similar to index.es: 
        // equipmentList contains: { ships: [ { shipId (Base), providerId, providerName, level, ... } ] }
        
        const { equipmentList, targets, $ships } = this.props
        const { search, filterMarked } = this.state

        const shipMap = {}
        
        equipmentList.forEach(eq => {
            const targetCount = targets[eq.id] || 0
            const isTarget = targetCount > 0
            
            eq.ships.forEach(s => {
                // s.shipId is BASE ID
                if (!shipMap[s.shipId]) {
                    // Ideally shipName is already passed, but we can lookup
                    shipMap[s.shipId] = {
                        baseId: s.shipId,
                        name: s.shipName,
                        items: [],
                        hasActiveTarget: false
                    }
                }

                shipMap[s.shipId].items.push({
                    equipName: eq.name,
                    equipId: eq.id,
                    level: s.level, 
                    isTarget: isTarget,
                    providerName: s.providerName,
                    providerId: s.providerId
                })

                if (isTarget) shipMap[s.shipId].hasActiveTarget = true
            })
        })

        let ships = Object.values(shipMap)

        ships = ships.filter(s => {
            if (search && !s.name.includes(search)) return false
            if (filterMarked && !s.hasActiveTarget) return false
            return true
        })

        ships.sort((a,b) => a.baseId - b.baseId)

        return (
            <div className="ship-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                 <div className="filters" style={{ marginBottom: 10, display: 'flex', gap: 10, flexShrink: 0, padding: 2 }}>
                     <InputGroup 
                        leftIcon="search" 
                        placeholder="Search ship..." 
                        value={search}
                        onChange={(e) => this.setState({ search: e.target.value })}
                        fill={true}
                    />
                     <Button 
                        active={filterMarked} 
                        intent={filterMarked ? "primary" : "none"}
                        onClick={() => this.setState({ filterMarked: !filterMarked })}
                    >
                        Marked Only
                    </Button>
                </div>

                <div className="list-content" style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }}>
                    {ships.map(ship => (
                        <Card key={ship.baseId} elevation={1} style={{ marginBottom: 8, padding: 10 }}>
                             <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 15, width: 130 }}>
                                    <Avatar mstId={ship.baseId} height={30} />
                                    <div style={{ fontWeight: 'bold', marginTop: 5, textAlign: 'center', fontSize: '1.1em' }}>{ship.name}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    {ship.items.map((item, idx) => (
                                        <div key={idx} style={{ 
                                            marginBottom: 4, 
                                            padding: '4px 8px', 
                                            background: item.isTarget ? 'rgba(16, 107, 163, 0.25)' : 'rgba(0, 0, 0, 0.15)',
                                            borderRadius: 4,
                                            borderLeft: item.isTarget ? '3px solid #106ba3' : '3px solid transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '600' }}>{item.equipName}</span>
                                                <span className="bp3-text-muted" style={{ fontSize: '0.85em' }}>
                                                     via {item.providerName}
                                                </span>
                                            </div>
                                            <Tag minimal={true} className={item.isTarget ? "bp3-intent-primary" : ""}>Lv.{item.level}</Tag>
                                        </div>
                                    ))}
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
