import React from 'react';

export interface CalculationStep {
    label: string;
    value: string | number;
    description: string;
    operator?: '+' | '-' | '*' | '/' | '=' | 'Start';
    highlight?: boolean;
}

interface ExplainerModalProps {
    title: string;
    finalValue: string | number;
    steps: CalculationStep[];
    onClose: () => void;
}

const ExplainerModal: React.FC<ExplainerModalProps> = ({ title, finalValue, steps, onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div
                className="fade-in"
                style={{
                    width: '500px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden'
                }} onClick={e => e.stopPropagation()}>

                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '4px' }}>Algorithm Trace</div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{title}</h3>
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {steps.map((step, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                opacity: step.operator === '=' ? 1 : 0.9,
                                paddingBottom: step.operator === '=' ? 0 : '0.5rem',
                                borderBottom: step.operator === '=' ? 'none' : '1px dashed var(--border-subtle)'
                            }}>
                                <div style={{
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    background: step.operator === '=' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: step.operator === '=' ? 'white' : 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    flexShrink: 0
                                }}>
                                    {step.operator || (i === 0 ? 'In' : '•')}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <span style={{
                                            color: step.highlight ? 'var(--primary)' : 'var(--text-main)',
                                            fontWeight: step.highlight || step.operator === '=' ? 600 : 400
                                        }}>
                                            {step.label}
                                        </span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: step.operator === '=' ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                                            {step.value}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {step.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Computed Result</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {finalValue}
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ExplainerModal;
