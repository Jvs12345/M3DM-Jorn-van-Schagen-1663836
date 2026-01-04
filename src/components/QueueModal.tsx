import React, { useMemo } from 'react';
import type { ReturnItem } from '../logic/types';
import { analyzeReturn } from '../logic/analysis';

interface QueueModalProps {
    items: ReturnItem[];
    onSelect: (item: ReturnItem) => void;
    onClose: () => void;
}

const QueueModal: React.FC<QueueModalProps> = ({ items, onSelect, onClose }) => {

    // Sort items by priority (Price or Risk) simply for the display
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => b.price - a.price);
    }, [items]);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div className="card fade-in" style={{
                width: '800px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '0',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Active Queue Manager</h2>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Select an item to prioritize immediate disposition
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {sortedItems.map(item => {
                            const risk = analyzeReturn(item).slaRiskScore;
                            return (
                                <div key={item.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(200px, 1fr) 1fr 1fr 120px',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: 'var(--bg-input)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    gap: '1rem'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.category}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {item.id}</div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reason</div>
                                        <div>{item.reason}</div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Value</div>
                                        <div style={{ fontWeight: 600 }}>€{item.price}</div>
                                    </div>

                                    <button
                                        onClick={() => onSelect(item)}
                                        style={{
                                            background: 'var(--primary)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        Prioritize
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>
                    {sortedItems.length} items pending
                </div>
            </div>
        </div>
    );
};

export default QueueModal;
