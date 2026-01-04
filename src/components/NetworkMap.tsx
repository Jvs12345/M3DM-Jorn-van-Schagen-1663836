import React from 'react';
import { HUBS } from '../logic/data';
import type { ReturnItem } from '../logic/types';

interface NetworkProps {
    items: ReturnItem[];
}

const NetworkMap: React.FC<NetworkProps> = ({ items }) => {
    // Calculate simple metrics per hub
    const getHubStats = (hubId: string) => {
        const hubItems = items.filter(i => i.hubId === hubId);
        const backlog = hubItems.length;
        const avgSlaRisk = hubItems.reduce((acc, i) => acc + i.pickupFailureRisk, 0) / (backlog || 1);
        const congestion = backlog > 50 ? 'High' : backlog > 20 ? 'Medium' : 'Low';
        return { backlog, avgSlaRisk: (avgSlaRisk * 100).toFixed(0), congestion };
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {HUBS.map(hub => {
                const stats = getHubStats(hub.id);
                const isHighRisk = stats.congestion === 'High' || parseInt(stats.avgSlaRisk) > 50;
                // Professional color mapping
                const statusColor = stats.congestion === 'High' ? '#ef4444' : stats.congestion === 'Medium' ? '#f59e0b' : '#10b981';

                return (
                    <div key={hub.id} className="card" style={{
                        borderLeft: `4px solid ${statusColor}`,
                        marginBottom: '0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{hub.name}</h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{hub.id}</span>
                            </div>
                            <div style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                background: `rgba(${stats.congestion === 'High' ? '239, 68, 68' : stats.congestion === 'Medium' ? '245, 158, 11' : '16, 185, 129'}, 0.1)`,
                                color: statusColor,
                                fontWeight: 600,
                                border: `1px solid ${statusColor}44`
                            }}>
                                {stats.congestion.toUpperCase()} LOAD
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Location</div>
                                <div style={{ color: 'var(--text-main)' }}>{hub.location}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Capacity</div>
                                <div style={{ color: 'var(--text-main)' }}>{hub.capacity} units</div>
                            </div>

                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Backlog</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{stats.backlog}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Risk Factor</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: parseInt(stats.avgSlaRisk) > 50 ? '#ef4444' : 'var(--text-main)' }}>{stats.avgSlaRisk}%</div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default NetworkMap;
