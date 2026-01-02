import React, { Component } from 'react'
import { Card, Button, InputGroup, Tag, Collapse, Divider, NumericInput, Classes } from '@blueprintjs/core'
import { getEquipIconUrl, getShipIconUrl } from '../../lib/utils'
import { checkQuota } from '../../lib/data-processor'
import { SlotitemIcon } from 'views/components/etc/icon'

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

export default class EquipmentList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            filterType: 'All', // All, Marked, Unmarked
            search: '',
            expandedId: null
        }
    }

    handleToggleExpand = (id) => {
        this.setState(prev => ({ expandedId: prev.expandedId === id ? null : id }))
    }

    render() {
        const { equipments, targets, onAdd, onRemove, userEquips, userShips, farmingMap } = this.props
        const { filterType, search, expandedId } = this.state

        // Filtering
        const filtered = equipments.filter(eq => {
            const isMarked = !!targets[eq.id] // Check if exist in object
            
            if (filterType === 'Marked' && !isMarked) return false
            if (filterType === 'Unmarked' && isMarked) return false
            if (search && !eq.name.includes(search)) return false

            return true
        })
        
        // Sort: Marked first, then ID
        filtered.sort((a, b) => {
            const aMarked = !!targets[a.id]
            const bMarked = !!targets[b.id]
            if (aMarked !== bMarked) return bMarked ? 1 : -1
            return a.id - b.id
        })

        return (
            <div className="equipment-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="filters" style={{ marginBottom: 10, flexShrink: 0 }}>
                    <InputGroup 
                        leftIcon="search" 
                        placeholder="Search equipment..." 
                        value={search}
                        onChange={(e) => this.setState({ search: e.target.value })}
                        style={{ marginBottom: 10 }}
                    />
                    <div>
                        <FilterBtn active={filterType === 'All'} label="All" onClick={() => this.setState({ filterType: 'All' })} />
                        <FilterBtn active={filterType === 'Marked'} label="Marked" onClick={() => this.setState({ filterType: 'Marked' })} />
                        <FilterBtn active={filterType === 'Unmarked'} label="Unmarked" onClick={() => this.setState({ filterType: 'Unmarked' })} />
                    </div>
                </div>

                <div className="list-content" style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }}>
                    {filtered.map(eq => {
                        const targetCount = targets[eq.id] || 0
                        const isMarked = targetCount > 0
                        const isExpanded = expandedId === eq.id
                        
                        // Calculate Quota Stats
                        const quota = checkQuota(targetCount, eq.id, userEquips, userShips, farmingMap)

                        return (
                            <Card key={eq.id} elevation={1} style={{ marginBottom: 8, padding: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div 
                                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }} 
                                        onClick={() => this.handleToggleExpand(eq.id)}
                                    >
                                        <SlotitemIcon slotitemId={eq.iconId} style={{ marginRight: 10, width: 30, height: 30 }} />
                                        <div style={{ lineHeight: '1.2' }}>
                                            <div style={{ fontWeight: 'bold' }}>{eq.name}</div>
                                            <div className="bp3-text-muted" style={{ fontSize: '0.8em' }}>{eq.typeName}</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {isMarked && (
                                            <div style={{ marginRight: 15, textAlign: 'right', fontSize: '0.85em' }}>
                                                <div className={quota.isSatisfied ? "bp3-text-success" : "bp3-text-warning"}>
                                                    {quota.current} / {targetCount}
                                                </div>
                                                <div className="bp3-text-muted" style={{ fontSize: '0.8em' }}>
                                                   (Inv: {quota.holding}, Pot: {quota.potential})
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div style={{ width: 70 }}>
                                            <NumericInput 
                                                min={0} 
                                                max={99} 
                                                value={targetCount} 
                                                onValueChange={(val) => {
                                                    if (val <= 0) onRemove(eq.id)
                                                    else onAdd(eq.id, val)
                                                }}
                                                fill={true}
                                                buttonPosition="none" // Compact
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <Collapse isOpen={isExpanded}>
                                    <Divider style={{ margin: '10px 0' }} />
                                    <div className="providers">
                                        <h6 className="bp3-heading">Providers:</h6>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {eq.ships.map((s, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f5f8fa', padding: '4px 8px', borderRadius: '4px', border: '1px solid #dcdcdc' }}>
                                                    <img src={getShipIconUrl(s.shipId)} style={{ height: 20, marginRight: 5 }} onError={(e) => e.target.style.display = 'none'} />
                                                    <span>{s.shipName}</span>
                                                    <Tag minimal={true} style={{ marginLeft: 5 }}>Lv.{s.level}</Tag>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Collapse>
                            </Card>
                        )
                    })}
                    {filtered.length === 0 && <div className="bp3-text-muted" style={{ textAlign: 'center', marginTop: 20 }}>No items.</div>}
                </div>
            </div>
        )
    }
}
