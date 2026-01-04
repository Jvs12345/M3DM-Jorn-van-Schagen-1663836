import React, { useMemo, useState } from 'react';
import type { ReturnItem, Decision } from '../logic/types';
import { analyzeReturn } from '../logic/analysis';
import { RuleBasedDisposition, WeightedScoringDisposition, FeedbackDisposition } from '../logic/strategies';
import VisualInspectionCard from './VisualInspectionCard';
import type { SimpleClassifier } from '../ml/SimpleModel';

// --- INLINE MODAL DEFINITION TO PREVENT IMPORT ERRORS ---
interface CalculationStep {
    label: string;
    value: string | number;
    description: string;
    operator?: string;
    highlight?: boolean;
}

const InlineExplainerModal: React.FC<{ title: string, finalValue: string | number, steps: CalculationStep[], onClose: () => void }> = ({ title, finalValue, steps, onClose }) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', zIndex: 9999,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
        <div style={{ width: '500px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'white' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '24px', height: '24px', background: s.operator === '=' ? '#3b82f6' : 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {s.operator || '•'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: s.highlight ? '#3b82f6' : '#e2e8f0', fontWeight: s.highlight ? 600 : 400 }}>{s.label}</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.value}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{s.description}</div>
                        </div>
                    </div>
                ))}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Total Result</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>{finalValue}</span>
                </div>
            </div>
        </div>
    </div>
);
// -----------------------------------------------------------

interface DecisionProps {
    item: ReturnItem;
    strategyName: string;
    onAction: (item: ReturnItem, action: string) => void;
    model: SimpleClassifier | null;
}

const DispositionCard: React.FC<DecisionProps> = ({ item, strategyName, onAction, model }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [explainerData, setExplainerData] = useState<{ title: string, finalValue: string | number, steps: CalculationStep[] } | null>(null);

    // Evaluate Strategy
    const decision: Decision = useMemo(() => {
        let metrics = analyzeReturn(item);

        if (model) {
            const pred = model.predict(item);
            metrics = {
                ...metrics,
                aiGrade: pred.grade,
                aiConfidence: pred.confidence
            };
        }

        let strategy;
        if (strategyName === 'Feedback') strategy = new FeedbackDisposition();
        else if (strategyName === 'Weighted') strategy = new WeightedScoringDisposition();
        else strategy = new RuleBasedDisposition();

        return strategy.evaluate(item, metrics);
    }, [item, strategyName, model]);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'RESTOCK': return '#10b981';
            case 'REFURBISH': return '#3b82f6';
            case 'OUTLET': return '#f59e0b';
            case 'RECYCLE': return '#f97316';
            case 'DISPOSE': return '#ef4444';
            case 'DESTROY': return '#dc2626';
            default: return '#64748b';
        }
    };

    const actionColor = getActionColor(decision.action);

    // --- Explainer Logic (Safe Wrappers) ---
    const explainSLA = () => {
        try {
            const steps: CalculationStep[] = [
                { label: 'Base Risk', value: 10, description: 'Default baseline', operator: 'Start' }
            ];
            let currentRisk = 10;

            if (item.weatherSeverity > 80) {
                steps.push({ label: 'Severe Weather', value: '+25', description: `Severity: ${item.weatherSeverity}`, operator: '+' });
                currentRisk += 25;
            } else if (item.weatherSeverity > 50) {
                steps.push({ label: 'Bad Weather', value: '+10', description: `Severity: ${item.weatherSeverity}`, operator: '+' });
                currentRisk += 10;
            }

            if (item.trafficIndex > 75) {
                steps.push({ label: 'High Traffic', value: '+15', description: `Traffic: ${item.trafficIndex}`, operator: '+' });
                currentRisk += 15;
            }

            if (['AMS', 'UTR'].includes(item.hubId)) {
                steps.push({ label: 'Hub Congestion', value: '+10', description: `${item.hubId} High Volume`, operator: '+' });
                currentRisk += 10;
            }

            if (item.category === 'Electronics') {
                steps.push({ label: 'Complexity', value: '+20', description: 'Electronics check', operator: '+' });
                currentRisk += 20;
            }

            const final = Math.min(100, currentRisk);
            if (currentRisk > 100) steps.push({ label: 'Max Cap', value: '=100', description: 'Capped at 100%', operator: '=' });

            setExplainerData({ title: 'SLA Risk Calculation', finalValue: `${Math.floor(final)}%`, steps });
        } catch (e) {
            console.error("Explain SLA Error", e);
        }
    };

    const explainROI = () => {
        try {
            const logisticsCost = 5 + (item.emptyKmProxy * 0.2);
            const netValue = item.estimatedResaleValue - item.estimatedRefurbCost - logisticsCost;
            const roi = Math.max(0, netValue / item.price);

            setExplainerData({
                title: 'ROI Potential Analysis',
                finalValue: `${(roi * 100).toFixed(0)}%`,
                steps: [
                    { label: 'Est. Resale', value: `€${item.estimatedResaleValue}`, description: 'Market Value', operator: 'Start' },
                    { label: 'Refurb Cost', value: `- €${item.estimatedRefurbCost}`, description: 'Labor/Parts', operator: '-' },
                    { label: 'Logistics', value: `- €${logisticsCost.toFixed(2)}`, description: `Transport (€${item.emptyKmProxy}*0.2 + 5)`, operator: '-' },
                    { label: 'Net Value', value: `= €${netValue.toFixed(2)}`, description: 'Profit', operator: '=' },
                    { label: 'ROI', value: `${(roi * 100).toFixed(0)}%`, description: '% of Orig. Price', operator: '=', highlight: true }
                ]
            });
        } catch (e) { console.error("Explain ROI Error", e); }
    };

    const explainWaste = () => {
        try {
            const steps: CalculationStep[] = [];
            const transportScore = (item.emptyKmProxy / 50) * 30;
            steps.push({ label: 'Transport', value: `+${transportScore.toFixed(0)}`, description: `${item.emptyKmProxy}km empty`, operator: 'Start' });

            const defectsScore = item.conditionScore < 3 ? 40 : 10;
            steps.push({ label: 'Defects', value: `+${defectsScore}`, description: `Cond: ${item.conditionScore}`, operator: '+' });

            const waiting = decision.contextSnapshot.slaRiskScore > 60 ? 30 : 0;
            if (waiting > 0) steps.push({ label: 'Waiting', value: '+30', description: 'High SLA Risk', operator: '+' });

            const total = Math.min(100, Math.floor(transportScore + defectsScore + waiting));
            setExplainerData({ title: 'Lean Waste Score', finalValue: `${total}/100`, steps });
        } catch (e) { console.error("Explain Waste Error", e); }
    };

    return (
        <div className="card" style={{ borderTop: `4px solid ${actionColor}` }}>
            {explainerData && (
                <InlineExplainerModal
                    title={explainerData.title}
                    finalValue={explainerData.finalValue}
                    steps={explainerData.steps}
                    onClose={() => setExplainerData(null)}
                />
            )}

            {/* Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Item #{item.id}
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{item.category}</span>
                    </h2>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Return Reason: <span style={{ color: 'var(--text-main)' }}>{item.reason}</span></div>
                    {/* AI Tag */}
                    {model && decision.contextSnapshot.aiGrade && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>🤖</span> AI Grade: <strong>{decision.contextSnapshot.aiGrade}</strong>
                        </div>
                    )}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>€{item.price}</div>
                    <div style={{ fontSize: '0.8rem', color: item.conditionScore < 3 ? '#ef4444' : '#10b981' }}>Condition: {item.conditionScore}/5</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* Left: Action & Reason */}
                <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Action</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: actionColor }}>{decision.action}</div>
                    </div>
                    <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                        {decision.rationaleBullets.map((r, i) => (
                            <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem', alignItems: 'baseline' }}>
                                <span style={{ color: actionColor }}>•</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{r}</span>
                            </li>
                        ))}
                    </ul>
                    {item.visualSignals && (
                        <div style={{ marginTop: '2rem' }}>
                            <VisualInspectionCard signals={item.visualSignals} />
                        </div>
                    )}
                </div>

                {/* Right: Calculated Metrics (Interactive) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <h4 style={{ marginTop: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Logistics Analysis</h4>

                        {/* Interactive Rows */}
                        <div
                            onClick={explainROI}
                            style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>ROI Potential <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>?</span></span>
                            <span style={{ fontWeight: 600 }}>{(decision.contextSnapshot.recoveryPotential * 100).toFixed(0)}%</span>
                        </div>

                        <div
                            onClick={explainSLA}
                            style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>SLA Risk <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>?</span></span>
                            <span style={{ fontWeight: 600, color: decision.contextSnapshot.slaRiskScore > 50 ? '#ef4444' : 'inherit' }}>{decision.contextSnapshot.slaRiskScore.toFixed(0)}%</span>
                        </div>

                        <div
                            onClick={explainWaste}
                            style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>Lean Waste <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>?</span></span>
                            <span style={{ fontWeight: 600 }}>{decision.contextSnapshot.leanWasteScore.toFixed(0)}/100</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #10b981', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>Lean Outcome</strong>
                        {decision.contextSnapshot.overprocessingRisk ? 'Avoided negative margin work.' :
                            decision.contextSnapshot.safetyRiskFlag ? 'Safety hazard prevented.' :
                                'Value stream optimized.'}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                    onClick={() => onAction(item, decision.action)}
                    style={{ flex: 1, background: actionColor, color: 'white', border: 'none', padding: '0.75rem', borderRadius: '6px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
                >
                    Confirm {decision.action}
                </button>
                <button
                    onClick={() => onAction(item, 'HOLD')}
                    style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                    Manual Review
                </button>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button onClick={() => setShowDetails(!showDetails)} style={{ background: 'transparent', border: 'none', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showDetails ? 'Hide' : 'View'} Raw Item Data
                </button>
                {showDetails && (
                    <div className="fade-in" style={{ marginTop: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '6px', textAlign: 'left', overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{JSON.stringify(item, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DispositionCard;
