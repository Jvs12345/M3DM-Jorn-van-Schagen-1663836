import React from 'react';
import type { VisualSignals } from '../logic/types';

interface VisualCardProps {
    signals: VisualSignals;
}

const VisualInspectionCard: React.FC<VisualCardProps> = ({ signals }) => {
    // Helper to get color scale for confidence
    const getConfidenceColor = (conf: number) => {
        if (conf > 0.8) return '#10b981'; // Success/Green
        if (conf > 0.5) return '#f59e0b'; // Warning/Amber
        return '#ef4444'; // Danger/Red
    };

    return (
        <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '1rem',
            marginTop: '1rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Visual Analysis
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Confidence: <strong style={{ color: getConfidenceColor(signals.visionConfidence) }}>{(signals.visionConfidence * 100).toFixed(0)}%</strong>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Product Damage */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        <span>Product Damage</span>
                        <span>{(signals.productDamageScore * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${signals.productDamageScore * 100}%`,
                            background: signals.productDamageScore > 0.5 ? '#ef4444' : 'var(--primary)',
                            height: '100%',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>

                {/* Packaging Damage */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        <span>Pkg. Damage</span>
                        <span>{(signals.packagingDamageScore * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${signals.packagingDamageScore * 100}%`,
                            background: signals.packagingDamageScore > 0.5 ? '#ef4444' : 'var(--primary)',
                            height: '100%',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>Type</div>
                    <div style={{ fontWeight: 500, fontSize: '0.8rem', textTransform: 'capitalize' }}>{signals.packagingType}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>Seal</div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: signals.sealIntact ? '#10b981' : '#ef4444' }}>
                        {signals.sealIntact ? 'Intact' : 'Broken'}
                    </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>Label</div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: signals.labelReadability === 'good' ? '#10b981' : '#f59e0b' }}>
                        {signals.labelReadability === 'good' ? 'Clear' : 'Blurry'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualInspectionCard;
