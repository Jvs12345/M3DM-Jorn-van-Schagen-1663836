import React, { useState, useMemo } from 'react';
import type { ReturnItem } from '../logic/types';
import { analyzeReturn } from '../logic/analysis';

interface DashboardProps {
    items: ReturnItem[];
}

// Inline Simple Modal to avoid import risks
const DashboardModal: React.FC<{ title: string, onClose: () => void, children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', zIndex: 10000,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        backdropFilter: 'blur(5px)'
    }} onClick={onClose}>
        <div className="card" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-highlight)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            {children}
        </div>
    </div>
);

const AnalyticsDashboard: React.FC<DashboardProps> = ({ items }) => {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    // Calculate metrics on the fly
    const analysis = useMemo(() => {
        if (items.length === 0) return null;

        const analyzedItems = items.map(i => ({
            item: i,
            metrics: analyzeReturn(i)
        }));

        const totalValue = analyzedItems.reduce((acc, { metrics, item }) => acc + (metrics.recoveryPotential * item.price), 0);
        const totalOriginalPrice = items.reduce((acc, i) => acc + i.price, 0);

        const avgSlaRisk = analyzedItems.reduce((acc, { metrics }) => acc + metrics.slaRiskScore, 0) / items.length;
        const avgRecovery = analyzedItems.reduce((acc, { metrics }) => acc + metrics.recoveryPotential, 0) / items.length;
        const avgWaste = analyzedItems.reduce((acc, { metrics }) => acc + metrics.leanWasteScore, 0) / items.length;

        // Distributions for drill-downs
        const slaDistribution = { low: 0, med: 0, high: 0 };
        analyzedItems.forEach(({ metrics }) => {
            if (metrics.slaRiskScore < 40) slaDistribution.low++;
            else if (metrics.slaRiskScore < 70) slaDistribution.med++;
            else slaDistribution.high++;
        });

        // Top Value items
        const topValueItems = [...analyzedItems]
            .sort((a, b) => (b.metrics.recoveryPotential * b.item.price) - (a.metrics.recoveryPotential * a.item.price))
            .slice(0, 5);

        return {
            avgSlaRisk,
            avgRecovery,
            avgWaste,
            totalValue,
            totalOriginalPrice,
            slaDistribution,
            topValueItems,
            count: items.length
        };
    }, [items]);

    if (!analysis) return <div>Loading...</div>;

    const renderModalContent = () => {
        switch (selectedMetric) {
            case 'sla':
                return (
                    <div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Breakdown of SLA (Service Level Agreement) risk across the active queue of <strong>{analysis.count} items</strong>.
                            Risk is calculated based on hub congestion, weather severity, and item complexity.
                        </p>
                        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'flex-end', height: '150px', gap: '2rem' }}>
                            {[
                                { label: 'Low Risk', count: analysis.slaDistribution.low, color: '#10b981' },
                                { label: 'Medium', count: analysis.slaDistribution.med, color: '#f59e0b' },
                                { label: 'Critical', count: analysis.slaDistribution.high, color: '#ef4444' }
                            ].map(d => (
                                <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: '8px' }}>
                                    <div style={{ background: d.color, opacity: 0.8, borderRadius: '4px', width: '100%', height: `${(d.count / analysis.count) * 100}%`, minHeight: '4px', transition: 'height 0.5s' }} />
                                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{d.count}</div>
                                        {d.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'recovery':
                return (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Original Value</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>€{(analysis.totalOriginalPrice / 1000).toFixed(1)}k</div>
                            </div>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                                <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Recoverable Value</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#60a5fa' }}>€{(analysis.totalValue / 1000).toFixed(1)}k</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            The system estimates a <strong>{(analysis.avgRecovery * 100).toFixed(1)}% recovery rate</strong>.
                            This is the projected net profit after deducting predicted refurbishment costs and logistics/transport fees from the resale value.
                        </p>
                    </div>
                );
            case 'waste':
                return (
                    <div>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            The Lean Waste Score (Muda) aggregates inefficiencies. Lower is better.
                        </p>
                        <ul style={{ marginTop: '1rem', paddingLeft: '1rem', color: 'var(--text-secondary)', lineHeight: '2' }}>
                            <li><strong style={{ color: '#ef4444' }}>Transport Waste:</strong> Empty KM driven by collection trucks.</li>
                            <li><strong style={{ color: '#f59e0b' }}>Waiting Waste:</strong> Items sitting in congested hubs over 24 hours.</li>
                            <li><strong style={{ color: '#3b82f6' }}>Defect Waste:</strong> Processing cost for unrepairable items.</li>
                        </ul>
                    </div>
                );
            case 'value':
                return (
                    <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>Highest Potential Assets</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {analysis.topValueItems.map((curr, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{curr.item.category} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({curr.item.id})</span></div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Orig: €{curr.item.price}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#10b981', fontWeight: 700 }}>€{(curr.metrics.recoveryPotential * curr.item.price).toFixed(0)}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Est. Profit</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'throughput':
                return (
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Processing velocity over the last 7 days. This metric tracks items fully dispositioned (Restock, Refurbish, Recycle).
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Weekly Average</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>71.2</div>
                                <div style={{ fontSize: '0.75rem', color: '#10b981' }}>+5% vs last week</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Peak Day</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>Friday (92)</div>
                            </div>
                        </div>
                        <h4 style={{ margin: '1.5rem 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Efficiency Breakdown</h4>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Automated (AI)</span>
                                <span style={{ fontWeight: 600 }}>65%</span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px' }}>
                                <div style={{ width: '65%', background: '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '4px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Manual Review</span>
                                <span style={{ fontWeight: 600 }}>35%</span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px' }}>
                                <div style={{ width: '35%', background: '#f59e0b', height: '100%', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {selectedMetric && (
                <DashboardModal
                    title={
                        selectedMetric === 'sla' ? 'SLA Risk Analysis' :
                            selectedMetric === 'recovery' ? 'Financial Recovery Projection' :
                                selectedMetric === 'waste' ? 'Lean Waste (Muda) Breakdown' :
                                    selectedMetric === 'throughput' ? 'Weekly Processing Volume' :
                                        'High Value Opportunities'
                    }
                    onClose={() => setSelectedMetric(null)}
                >
                    {renderModalContent()}
                </DashboardModal>
            )}

            {/* Top KPIs - CLICKABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <div onClick={() => setSelectedMetric('sla')}
                    className="card hover-card"
                    style={{ textAlign: 'center', borderColor: analysis.avgSlaRisk > 40 ? '#ef4444' : 'var(--border-subtle)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Avg SLA Risk</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: analysis.avgSlaRisk > 40 ? '#ef4444' : 'var(--text-main)' }}>
                        {analysis.avgSlaRisk.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Click for breakdown</div>
                </div>

                <div onClick={() => setSelectedMetric('recovery')}
                    className="card hover-card"
                    style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Recovery Rate</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{(analysis.avgRecovery * 100).toFixed(1)}%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>View financials</div>
                </div>

                <div onClick={() => setSelectedMetric('waste')}
                    className="card hover-card"
                    style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Lean Waste Score</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{analysis.avgWaste.toFixed(0)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span></div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Identify sources</div>
                </div>

                <div onClick={() => setSelectedMetric('value')}
                    className="card hover-card"
                    style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Potential Value</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>€{(analysis.totalValue / 1000).toFixed(1)}k</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Top assets</div>
                </div>
            </div>

            {/* Waste Spotlight */}
            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Lean Waste Spotlight (Muda)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                    <div onClick={() => setSelectedMetric('sla')} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.9rem' }}>Waiting (Backlog)</strong>
                            <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>{Math.min(100, analysis.avgSlaRisk).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '8px' }}>
                            <div style={{ width: `${Math.min(100, analysis.avgSlaRisk)}%`, background: '#f59e0b', height: '100%', borderRadius: '3px' }}></div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>High risk of delays in Northern hubs.</div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.9rem' }}>Transport (Empty KM)</strong>
                            <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>45%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '8px' }}>
                            <div style={{ width: '45%', background: '#ef4444', height: '100%', borderRadius: '3px' }}></div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inefficient routing in East region.</div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.9rem' }}>Defects (Damage)</strong>
                            <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>25%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '8px' }}>
                            <div style={{ width: '25%', background: '#3b82f6', height: '100%', borderRadius: '3px' }}></div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Electronics damage rate stable.</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Operational Alerts</h3>
                    <ul style={{ paddingLeft: '0', listStyle: 'none', margin: 0 }}>
                        <li style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', borderRadius: '4px', marginBottom: '0.75rem', color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#f59e0b' }}>⚠️</span> Severe Weather warning in Randstad (Impact: +24h TAT)
                        </li>
                        <li style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', borderRadius: '4px', marginBottom: '0.75rem', color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#ef4444' }}>🛑</span> Amsterdam Hub approaching 95% congestion capacity.
                        </li>
                        <li style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981', borderRadius: '4px', marginBottom: '0.75rem', color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#10b981' }}>✅</span> Eindhoven refurbishment line operating at peak efficiency.
                        </li>
                    </ul>
                </div>

                {/* Recent Throughput - CLICKABLE */}
                <div onClick={() => setSelectedMetric('throughput')}
                    className="card hover-card"
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: '1.1rem' }}>Recent Throughput</h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '4px' }}>Click to analyze</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                        {[65, 78, 45, 89, 92, 56, 74].map((h, i) => (
                            <div key={i} style={{
                                flex: 1,
                                background: 'linear-gradient(to top, var(--primary) 0%, #60a5fa 100%)',
                                height: `${h}%`,
                                borderRadius: '4px 4px 0 0',
                                opacity: 0.9,
                                position: 'relative',
                                transition: 'height 0.3s ease'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    width: '100%',
                                    textAlign: 'center',
                                    fontSize: '0.7rem',
                                    color: 'var(--text-secondary)'
                                }}>{h}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                    </div>
                </div>
            </div>
            <style>{`
                .hover-card:hover {
                    background: var(--bg-card-hover) !important;
                    transform: translateY(-2px);
                    border-color: var(--primary) !important;
                }
            `}</style>
        </div>
    );
};

export default AnalyticsDashboard;
