import React, { useState } from 'react';
import type { ReturnItem } from '../logic/types';
import type { SimpleClassifier } from '../ml/SimpleModel';
import type { QualityGrade } from '../ml/types';

interface FineTuneProps {
    model: SimpleClassifier;
    recentItems: ReturnItem[];
    onModelUpdate: () => void;
}

const FineTuningPanel: React.FC<FineTuneProps> = ({ model, recentItems, onModelUpdate }) => {
    const [labels, setLabels] = useState<Record<string, QualityGrade>>({});
    const [isTraining, setIsTraining] = useState(false);
    const [message, setMessage] = useState('');

    const handleLabelChange = (itemId: string, grade: QualityGrade) => {
        setLabels(prev => ({ ...prev, [itemId]: grade }));
    };

    const handleTrain = async () => {
        setIsTraining(true);
        setMessage('Training...');

        // Simulate a short delay for "Processing" feel
        setTimeout(() => {
            const examples = Object.entries(labels).map(([id, label]) => {
                const item = recentItems.find(i => i.id === id);
                if (!item) return null;
                return {
                    features: model.extractFeatures(item),
                    label
                };
            }).filter(Boolean) as any[];

            if (examples.length === 0) {
                setMessage('No labels provided.');
                setIsTraining(false);
                return;
            }

            model.train(examples);
            localStorage.setItem('returnflow_model_weights', model.serialize());

            setMessage(`Model updated with ${examples.length} examples!`);
            setIsTraining(false);
            onModelUpdate();

            // Clear labels after training
            setLabels({});
        }, 1000);
    };

    return (
        <div style={{
            padding: '1.5rem',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            marginTop: '2rem',
            border: '1px solid var(--border-subtle)'
        }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Model Fine-Tuning</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Human-in-the-Loop Feedback: Label recent items to improve the Quality Classification Model.
            </p>

            <table style={{ width: '100%', textAlign: 'left', fontSize: '0.9rem', marginBottom: '1.5rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>Item</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>Vision Score</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>Prediction</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>Correct Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {recentItems.slice(0, 5).map(item => {
                        const pred = model.predict(item);
                        return (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '12px 8px' }}>
                                    {item.category} <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>#{item.id}</span>
                                </td>
                                <td style={{ padding: '12px 8px' }}>
                                    {((1 - item.visualSignals.productDamageScore) * 100).toFixed(0)}%
                                    <span style={{ fontSize: '0.75rem', marginLeft: '6px', color: 'var(--text-secondary)' }}>
                                        (Conf: {(item.visualSignals.visionConfidence * 100).toFixed(0)}%)
                                    </span>
                                </td>
                                <td style={{ padding: '12px 8px' }}>
                                    <span style={{ color: 'var(--info)', fontWeight: 600 }}>{pred.grade}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '6px' }}>({(pred.confidence * 100).toFixed(0)}%)</span>
                                </td>
                                <td style={{ padding: '12px 8px' }}>
                                    <select
                                        style={{
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-main)',
                                            border: '1px solid var(--border-subtle)',
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                            width: '100%'
                                        }}
                                        value={labels[item.id] || ''}
                                        onChange={(e) => handleLabelChange(item.id, e.target.value as QualityGrade)}
                                    >
                                        <option value="">Select Correction...</option>
                                        <option value="A">Grade A (Like New)</option>
                                        <option value="B">Grade B (Good)</option>
                                        <option value="C">Grade C (Functional)</option>
                                        <option value="D">Grade D (Scrap)</option>
                                    </select>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={handleTrain}
                    disabled={isTraining || Object.keys(labels).length === 0}
                    className="primary"
                    style={{
                        opacity: isTraining || Object.keys(labels).length === 0 ? 0.5 : 1,
                        cursor: isTraining || Object.keys(labels).length === 0 ? 'not-allowed' : 'pointer',
                        background: isTraining ? 'var(--bg-input)' : 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '6px',
                        fontWeight: 600
                    }}
                >
                    {isTraining ? 'Training Model...' : 'Run Fine-Tuning'}
                </button>
                {message && <span style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>}
            </div>
        </div>
    );
};

export default FineTuningPanel;
