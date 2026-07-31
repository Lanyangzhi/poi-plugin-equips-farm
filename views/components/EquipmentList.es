import React, { Component, useState, useEffect } from 'react'
import { Card, Button, InputGroup, Tag, Collapse, Divider, NumericInput, Classes, ControlGroup } from '@blueprintjs/core'
import { Avatar } from 'views/components/etc/avatar' 
import { SlotitemIcon } from 'views/components/etc/icon'
import { checkQuota } from '../../lib/data-processor'
import { matchesSearch } from '../../lib/search-utils'
import { t } from '../i18n'

// Robust Control for Redux-bound Inputs
const TargetControl = ({ id, count, onUpdate }) => {
    const [val, setVal] = useState(String(count || 0))

    useEffect(() => {
        setVal(String(count || 0))
    }, [count])

    const handleConfirm = (newValStr) => {
        let finalVal = parseInt(newValStr)
        if (isNaN(finalVal) || finalVal < 0) finalVal = 0
        setVal(String(finalVal))
        onUpdate(id, finalVal)
    }

    return (
        <ControlGroup style={{ marginLeft: 10 }}>
            <Button 
                icon="minus" 
                onClick={() => handleConfirm(String((parseInt(val) || 0) - 1))} 
                disabled={(parseInt(val) || 0) <= 0}
            />
            <InputGroup 
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={(e) => handleConfirm(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm(e.currentTarget.value)
                }}
                style={{ width: 50, textAlign: 'center', zIndex: 0 }}
            />
            <Button 
                icon="plus" 
                onClick={() => handleConfirm(String((parseInt(val) || 0) + 1))} 
            />
        </ControlGroup>
    )
}

// Troubleshooting panel shown when the equipment list is empty because no
// data source is available. Each source state is derived from the stats of
// the last farming-map build (see lib/data-processor.es).
const DataSourceStatusPanel = ({ stats, onReload }) => {
    if (!stats) return null
    const sourceStatus = (countKey) => {
        const count = stats[countKey] || 0
        return count > 0 ? t('statusLoaded', { count }) : t('statusEmpty')
    }
    const row = (label, value) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span>{label}</span>
            <span className={String(value).indexOf('(') > 0 ? 'bp3-text-success' : 'bp3-text-muted'}>{value}</span>
        </div>
    )

    return (
        <div className="data-source-panel" style={{ marginTop: 20, padding: 16, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, maxWidth: 420 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{t('dataSource')}</div>
            {row(t('wctfLabel'), sourceStatus('wctfShips'))}
            {row(t('masterDataLabel'), sourceStatus('masterShips'))}
            {row(t('masterCacheLabel'), sourceStatus('cacheShips'))}
            {row(t('bundledDataLabel'), sourceStatus('initialEquipIds'))}
            <div className="bp3-text-muted" style={{ fontSize: '0.85em', marginTop: 10, lineHeight: 1.5 }}>
                {t('diagnosticHint')}
            </div>
            <Button intent="primary" onClick={onReload} style={{ marginTop: 12 }}>
                {t('retryButton')}
            </Button>
        </div>
    )
}

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

    clearAllFilters = () => {
        this.setState({ filterType: 'All', search: '', selectedTypeIds: new Set() })
    }

    render() {
        // Props contain full equip list + master data
        const { equipments, targets, onAdd, onRemove, userEquips, userShips, farmingMap, $equipTypes, $ships, stats, onReload } = this.props
        const { filterType, search, expandedId, selectedTypeIds } = this.state
        const quotaMap = {}

        Object.keys(targets).forEach(equipId => {
            const targetCount = targets[equipId] || 0
            if (targetCount > 0) {
                quotaMap[equipId] = checkQuota(targetCount, parseInt(equipId, 10), userEquips, userShips, farmingMap)
            }
        })

        // 1. Initial Filter (Search & Status)
        let filtered = equipments.filter(eq => {
            const isMarked = !!targets[eq.id]
            if (filterType === 'Marked' && !isMarked) return false
            if (filterType === 'Unmarked' && isMarked) return false
            // Enhanced multi-language search: supports Chinese, Japanese, Pinyin, Romaji
            if (search && !matchesSearch(search, eq)) return false
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
                    name: typeInfo ? typeInfo.api_name : t('typeOthers'),
                    iconId: eq.iconId 
                }
            }
        })
        const availableTypes = Object.values(availableTypesMap).sort((a,b) => a.id - b.id)

        // 3. Apply Type Filter
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

        // Empty-state distinction:
        //  - no equipment at all -> data sources not ready (show diagnostics)
        //  - equipment exists but filters match nothing -> show clear-filter action
        const noDataAtAll = equipments.length === 0
        const noMatchesAfterFilter = !noDataAtAll && sortedTypeIds.length === 0
        const hasActiveFilters = search !== '' || filterType !== 'All' || selectedTypeIds.size > 0

        return (
            <div className="equipment-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                {/* Top Controls */}
                <div className="filters" style={{ marginBottom: 10, flexShrink: 0, padding: 2 }}>
                    <div style={{ display: 'flex', marginBottom: 10 }}>
                        <InputGroup 
                            leftIcon="search" 
                            placeholder={t('searchEquipPlaceholder')}
                            value={search}
                            onChange={(e) => this.setState({ search: e.target.value })}
                            style={{ flex: 1, marginRight: 10 }}
                        />
                        <div className="bp3-button-group">
                            <Button active={filterType === 'All'} onClick={() => this.setState({ filterType: 'All' })} className="bp3-small">{t('filterAll')}</Button>
                            <Button active={filterType === 'Marked'} intent={filterType === 'Marked' ? "primary" : "none"} onClick={() => this.setState({ filterType: 'Marked' })} className="bp3-small">{t('filterMarked')}</Button>
                            <Button active={filterType === 'Unmarked'} onClick={() => this.setState({ filterType: 'Unmarked' })} className="bp3-small">{t('filterUnmarked')}</Button>
                        </div>
                    </div>

                    {/* Type Filter Grid */}
                    <div className="type-filter-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', // Increased min width for larger icons
                        gap: '8px',
                        padding: '10px 0', // Remove horizontal padding if bg is gone
                        // background: 'rgba(33, 33, 33, 0.3)', // Removed
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
                                        opacity: isSelected ? 1 : 0.6,
                                        justifyContent: 'flex-start' // Align left in grid cell
                                    }}
                                >
                                    {/* Custom Checkbox Look */}
                                    <div style={{
                                        width: '14px',
                                        height: '14px',
                                        border: '1px solid #888',
                                        background: isSelected ? '#2196F3' : 'transparent',
                                        marginRight: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '2px',
                                        flexShrink: 0
                                    }}>
                                        {isSelected && <div style={{ width: '8px', height: '8px', background: '#fff' }} />}
                                    </div>
                                    <div className="farming-icon-wrapper" style={{ width: 48, height: 48 }}>
                                        <SlotitemIcon slotitemId={t.iconId} />
                                    </div>
                                </div>
                            )
                        })}
                        {availableTypes.length === 0 && <span className="bp3-text-muted">{t('loadingTypes')}</span>}
                    </div>
                    {selectedTypeIds.size > 0 && (
                        <Button minimal small onClick={() => this.setState({ selectedTypeIds: new Set() })} style={{ marginBottom: 6 }}>
                            {t('clearTypeFiltersButton')}
                        </Button>
                    )}
                </div>

                {/* List Content */}
                <div className="list-content" style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }}>
                    <style>{`
                        .farming-icon-wrapper {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            overflow: hidden !important;
                        }
                        /* Target immediate child (SlotitemIcon container) */
                        .farming-icon-wrapper > span, 
                        .farming-icon-wrapper > div,
                        .farming-icon-wrapper > img,
                        .farming-icon-wrapper > svg {
                            width: 100% !important;
                            height: 100% !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                        }
                        /* Target the actual image/svg deeply */
                        .farming-icon-wrapper img, 
                        .farming-icon-wrapper svg {
                            width: 100% !important;
                            height: 100% !important;
                            max-width: 100% !important;
                            max-height: 100% !important;
                            object-fit: contain !important;
                        }
                    `}</style>

                    {sortedTypeIds.map(typeId => {
                        const groupItems = groups[typeId]
                        // const typeInfo = $equipTypes[typeId]
                        // const typeName = typeInfo ? typeInfo.api_name : 'Others'
                        
                        return (
                            <div key={typeId} className="type-group" style={{ marginBottom: 0 }}>
                                {/* Header Removed per user request */}
                                
                                {groupItems.map(eq => {
                                    const targetCount = targets[eq.id] || 0
                                    const isMarked = targetCount > 0
                                    const isExpanded = expandedId === eq.id
                                    const quota = quotaMap[eq.id] || { isSatisfied: true, current: 0 }

                                    return (
                                        <Card key={eq.id} elevation={0} style={{ marginBottom: 8, border: '1px solid #ddd', padding: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                                                 <div 
                                                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }} 
                                                    onClick={() => this.handleToggleExpand(eq.id)}
                                                >
                                                    <div className="farming-icon-wrapper" style={{ width: 60, height: 60, marginRight: 10 }}>
                                                        <SlotitemIcon slotitemId={eq.iconId} />
                                                    </div>
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
                                                     <TargetControl 
                                                        id={parseInt(eq.id)} 
                                                        count={targetCount}
                                                        onUpdate={(id, c) => {
                                                            if (c <= 0) onRemove(id)
                                                            else onAdd(id, c)
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <Collapse isOpen={isExpanded}>
                                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #eee' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {eq.ships.map((s, idx) => {
                                                            return (
                                                                <div key={idx} style={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    background: 'rgba(0, 0, 0, 0.2)', 
                                                                    padding: '4px 8px', 
                                                                    borderRadius: '4px',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                                                }}>
                                                                    <Avatar mstId={s.providerId} height={20} style={{ marginRight: 5 }} />
                                                                    <div style={{ fontSize: '0.9em' }}>
                                                                        <span>{s.providerName}</span>
                                                                        <Tag minimal={true} style={{ marginLeft: 5 }}>{t('levelPrefix')}{s.level}</Tag>
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

                    {noDataAtAll && (
                        <div className="bp3-text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
                            <div style={{ fontSize: '1.1em', marginBottom: 6 }}>{t('noDataTitle')}</div>
                            <div style={{ maxWidth: 480, margin: '0 auto', fontSize: '0.9em', lineHeight: 1.5 }}>{t('noDataDesc')}</div>
                            <DataSourceStatusPanel stats={stats} onReload={onReload} />
                        </div>
                    )}

                    {noMatchesAfterFilter && (
                        <div className="bp3-text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
                            <div style={{ fontSize: '1.1em', marginBottom: 6 }}>{t('noItemsMatchFilter')}</div>
                            <div style={{ maxWidth: 480, margin: '0 auto', fontSize: '0.9em', lineHeight: 1.5 }}>{t('noMatchDesc')}</div>
                            {hasActiveFilters && (
                                <Button intent="primary" onClick={this.clearAllFilters} style={{ marginTop: 12 }}>
                                    {t('clearFiltersButton')}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }
}
