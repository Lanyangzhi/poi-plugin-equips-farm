import React, { Component } from 'react'
import { Card, Button, InputGroup, Tag, Collapse, Divider, NumericInput, Classes } from '@blueprintjs/core'
import { Avatar } from 'views/components/etc/avatar' 
import { SlotitemIcon } from 'views/components/etc/icon'
import { checkQuota } from '../../lib/data-processor'

export default class EquipmentList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            filterType: 'All', // All, Marked, Unmarked
            search: '',
            expandedId: null,
            selectedTypeIds: new Set()
        }
    }

    handleToggleExpand = (id) => {
        this.setState(prev => ({ expandedId: prev.expandedId === id ? null : id }))
    }

    handleTypeToggle = (typeId) => {
        this.setState(prev => {
            const newSet = new Set(prev.selectedTypeIds)
            if (newSet.has(typeId)) {
                newSet.delete(typeId)
            } else {
                newSet.add(typeId)
            }
            return { selectedTypeIds: newSet }
        })
    }

    render() {
        // Props contain full equip list + master data
        const { equipments, targets, onAdd, onRemove, userEquips, userShips, farmingMap, $equipTypes, $ships } = this.props
        const { filterType, search, expandedId } = this.state

        // 1. Initial Filter (Search & Status)
        let filtered = equipments.filter(eq => {
            const isMarked = !!targets[eq.id]
            if (filterType === 'Marked' && !isMarked) return false
            if (filterType === 'Unmarked' && isMarked) return false
            if (search && !eq.name.includes(search)) return false
            return true
        })

        // 2. Prepare Types Data for Grid Filter (Dynamic based on available equipment)
        const availableTypesMap = {}
        equipments.forEach(eq => {
            const tId = eq.typeId || 999
            if (!availableTypesMap[tId]) {
                const typeInfo = $equipTypes[tId]
                availableTypesMap[tId] = {
                    id: tId,
                    name: typeInfo ? typeInfo.api_name : 'Others',
                    iconId: eq.iconId 
                }
            }
        })
        const availableTypes = Object.values(availableTypesMap).sort((a,b) => a.id - b.id)

        // 3. Apply Type Filter
        const { selectedTypeIds } = this.state
        if (selectedTypeIds.size > 0) {
            filtered = filtered.filter(eq => selectedTypeIds.has(eq.typeId || 999))
        }

        // 4. Group by Category
        const groups = {}
        filtered.forEach(eq => {
            const typeId = eq.typeId || 999
            if (!groups[typeId]) groups[typeId] = []
            groups[typeId].push(eq)
        })

        const sortedTypeIds = Object.keys(groups).sort((a,b) => parseInt(a) - parseInt(b))

        return (
            <div className="equipment-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                {/* Top Controls */}
                <div className="filters" style={{ marginBottom: 10, flexShrink: 0, padding: 2 }}>
                    <div style={{ display: 'flex', marginBottom: 10 }}>
                        <InputGroup 
                            leftIcon="search" 
                            placeholder="Search equipment..." 
                            value={search}
                            onChange={(e) => this.setState({ search: e.target.value })}
                            style={{ flex: 1, marginRight: 10 }}
                        />
                        <div className="bp3-button-group">
                            <Button active={filterType === 'All'} onClick={() => this.setState({ filterType: 'All' })} className="bp3-small">All</Button>
                            <Button active={filterType === 'Marked'} intent={filterType === 'Marked' ? "primary" : "none"} onClick={() => this.setState({ filterType: 'Marked' })} className="bp3-small">Marked</Button>
                            <Button active={filterType === 'Unmarked'} onClick={() => this.setState({ filterType: 'Unmarked' })} className="bp3-small">Unmarked</Button>
                        </div>
                    </div>

                    {/* Type Filter Grid */}
                    <div className="type-filter-grid" style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px',
                        padding: '10px', 
                        background: 'rgba(33, 33, 33, 0.3)', 
                        borderRadius: '4px',
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        marginBottom: '10px'
                    }}>
                        {availableTypes.map(t => {
                            const isSelected = selectedTypeIds.has(t.id)
                            return (
                                <div 
                                    key={t.id} 
                                    onClick={() => this.handleTypeToggle(t.id)}
                                    title={t.name}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        cursor: 'pointer',
                                        opacity: isSelected ? 1 : 0.7
                                    }}
                                >
                                    {/* Custom Checkbox Look */}
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '1px solid #aaa',
                                        background: isSelected ? '#2196F3' : 'transparent',
                                        marginRight: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '2px'
                                    }}>
                                        {isSelected && <div style={{ width: '8px', height: '8px', background: '#fff' }} />}
                                    </div>
                                    <SlotitemIcon slotitemId={t.iconId} style={{ width: 24, height: 24 }} />
                                </div>
                            )
                        })}
                        {availableTypes.length === 0 && <span className="bp3-text-muted">Loading types...</span>}
                    </div>
                </div>

                {/* List Content */}
                <div className="list-content" style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }}>
                    {sortedTypeIds.map(typeId => {
                        const groupItems = groups[typeId]
                        const typeInfo = $equipTypes[typeId]
                        const typeName = typeInfo ? typeInfo.api_name : 'Others'
                        const representativeIconId = groupItems[0] ? groupItems[0].iconId : 0

                        return (
                            <div key={typeId} className="type-group" style={{ marginBottom: 20 }}>
                                { /* Header - Only show if NO filter is active? Or always? User asked to "preserve layout". Let's keep headers. */ }
                                <div className="group-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 8, paddingBottom: 4, borderBottom: '2px solid #eee', color: '#5C7080' }}>
                                    <SlotitemIcon slotitemId={representativeIconId} style={{ width: 20, height: 20, marginRight: 8 }} />
                                    <h5 style={{ margin: 0, fontSize: '1.1em' }}>{typeName}</h5>
                                    <Tag round={true} minimal={true} style={{ marginLeft: 'auto' }}>{groupItems.length}</Tag>
                                </div>
                                
                                {groupItems.map(eq => {
                                    const targetCount = targets[eq.id] || 0
                                    const isMarked = targetCount > 0
                                    const isExpanded = expandedId === eq.id
                                    const quota = checkQuota(targetCount, eq.id, userEquips, userShips, farmingMap)

                                    return (
                                        <Card key={eq.id} elevation={0} style={{ marginBottom: 8, border: '1px solid #ddd', padding: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                 <div 
                                                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }} 
                                                    onClick={() => this.handleToggleExpand(eq.id)}
                                                >
                                                    <SlotitemIcon slotitemId={eq.iconId} style={{ marginRight: 10, width: 30, height: 30 }} />
                                                    <div style={{ lineHeight: '1.2' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{eq.name}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    {isMarked && (
                                                        <div style={{ marginRight: 10, textAlign: 'right', fontSize: '0.8em', lineHeight: 1.1 }}>
                                                            <div className={quota.isSatisfied ? "bp3-text-success" : "bp3-text-warning"}>
                                                                {quota.current}/{targetCount}
                                                            </div>
                                                        </div>
                                                    )}
                                                     <NumericInput 
                                                        min={0} 
                                                        max={99} 
                                                        value={targetCount} 
                                                        onValueChange={(val) => val <= 0 ? onRemove(eq.id) : onAdd(eq.id, val)}
                                                        style={{ width: 60 }}
                                                        buttonPosition="none"
                                                    />
                                                </div>
                                            </div>

                                            <Collapse isOpen={isExpanded}>
                                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #eee' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {eq.ships.map((s, idx) => {
                                                            return (
                                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f5f8fa', padding: '4px 8px', borderRadius: '4px' }}>
                                                                    <Avatar mstId={s.providerId} height={20} style={{ marginRight: 5 }} />
                                                                    <div style={{ fontSize: '0.9em' }}>
                                                                        <span>{s.providerName}</span>
                                                                        <Tag minimal={true} style={{ marginLeft: 5 }}>Lv.{s.level}</Tag>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </Collapse>
                                        </Card>
                                    )
                                })}
                            </div>
                        )
                    })}
                    {sortedTypeIds.length === 0 && <div className="bp3-text-muted" style={{ textAlign: 'center', marginTop: 20 }}>No items match filter.</div>}
                </div>
            </div>
        )
    }
}
