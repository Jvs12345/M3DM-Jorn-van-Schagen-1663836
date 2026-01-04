import React, { useState, useEffect } from 'react';
import { generateReturns } from './logic/data';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NetworkMap from './components/NetworkMap';
import NetherlandsMap from './components/NetherlandsMap';
import DispositionCard from './components/DispositionCard';
import type { ReturnItem } from './logic/types';
import { SimpleClassifier } from './ml/SimpleModel';
import { bootstrapModel } from './ml/bootstrap';
import FineTuningPanel from './components/FineTuningPanel';
import QueueModal from './components/QueueModal';

type ViewState = 'overview' | 'network' | 'disposition';

const App: React.FC = () => {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReturnItem | null>(null);
  const [view, setView] = useState<ViewState>('overview');
  const [strategyName, setStrategyName] = useState('RuleBased');

  // ML State
  const [model, setModel] = useState<SimpleClassifier | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [recentItems, setRecentItems] = useState<ReturnItem[]>([]);

  // Track processed items to exclude them from the queue
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [showQueueModal, setShowQueueModal] = useState(false);

  useEffect(() => {
    // 1. Load Data
    const data = generateReturns(777, 50);
    setItems(data);
    setRecentItems(data.slice(0, 10)); // Initial recent items

    // 2. Bootstrap Model
    const loadedModel = bootstrapModel();
    setModel(loadedModel);
  }, []);

  const handleAction = (item: ReturnItem, action: string) => {
    console.log(`Action ${action} for item ${item.id}`);

    // Mark as processed
    const newProcessed = new Set(processedIds);
    newProcessed.add(item.id);
    setProcessedIds(newProcessed);

    // Update Recent Items Logic
    setRecentItems(prev => [item, ...prev].slice(0, 10));

    // Auto-advance logic:
    // We do NOT navigate back to overview. We just let the UI re-render.
    // The `currentItem` logic below will automatically pick the next available item.
    setSelectedItem(null);
  };

  // Filter out processed items
  const queueItems = items.filter(i => !processedIds.has(i.id));

  // Determine current item to show in Disposition Workbench
  // If user selected one specifically, use that. Otherwise, pick first from queue.
  const currentItem = selectedItem || queueItems.find(i => i.conditionScore < 6);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>

      {/* Queue Selection Modal */}
      {showQueueModal && (
        <QueueModal
          items={queueItems}
          onClose={() => setShowQueueModal(false)}
          onSelect={(item) => {
            setSelectedItem(item);
            setView('disposition');
            setShowQueueModal(false);
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10
      }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em', color: 'white' }}>
            <span style={{ color: 'var(--primary)' }}>◆</span> ReturnFlow <span style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', opacity: 0.8 }}>PRO</span>
          </h1>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Intelligent Logistics Platform
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', paddingLeft: '12px', letterSpacing: '0.05em' }}>
            Menu
          </div>

          <div
            onClick={() => setView('overview')}
            style={{
              padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
              background: view === 'overview' ? 'var(--primary)' : 'transparent',
              color: view === 'overview' ? 'white' : 'var(--text-secondary)',
              fontWeight: view === 'overview' ? 600 : 400,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span>Dashboard</span>
          </div>
          <div
            onClick={() => setView('network')}
            style={{
              padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
              background: view === 'network' ? 'var(--primary)' : 'transparent',
              color: view === 'network' ? 'white' : 'var(--text-secondary)',
              fontWeight: view === 'network' ? 600 : 400,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span>Network Map</span>
          </div>
          <div
            onClick={() => setView('disposition')}
            style={{
              padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
              background: view === 'disposition' ? 'var(--primary)' : 'transparent',
              color: view === 'disposition' ? 'white' : 'var(--text-secondary)',
              fontWeight: view === 'disposition' ? 600 : 400,
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span>Disposition Workbench</span>
            {queueItems.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation(); // prevent Nav click
                  setShowQueueModal(true);
                }}
                style={{
                  marginLeft: 'auto',
                  background: 'var(--bg-input)',
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {queueItems.length}
              </span>
            )}
          </div>
        </nav>

        {/* Strategy Section */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Decision Strategy</label>
          <select
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="RuleBased">Rule-Based (Standard)</option>
            <option value="Weighted">Weighted Scoring</option>
            <option value="Feedback">Feedback (Adaptive)</option>
          </select>
        </div>

        {/* Demo Mode Toggle */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            Training Mode
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>

        {view === 'overview' && (
          <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Overview</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time logistics performance metrics</div>
            </div>
            <AnalyticsDashboard items={queueItems} />
          </div>
        )}

        {view === 'network' && (
          <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Network Topology</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active nodes and transit heatmap</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
              {/* Hub Cards */}
              <NetworkMap items={queueItems} />

              {/* Map Visualization */}
              <div className="card" style={{ position: 'sticky', top: '2rem', padding: '0' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Regional Heatmap (NL)</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Return volume intensity</span>
                </div>
                <div style={{ padding: '1rem' }}>
                  <NetherlandsMap items={queueItems} />
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'disposition' && currentItem ? (
          <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Disposition Workbench</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review and action pending returns</div>
              </div>
              <div
                onClick={() => setShowQueueModal(true)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Queue: <strong style={{ color: 'var(--text-main)' }}>{queueItems.length}</strong> items <span style={{ fontSize: '0.7em', paddingLeft: '8px' }}>▼</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              <DispositionCard
                key={currentItem.id} // Force re-render on new item
                item={currentItem}
                strategyName={strategyName}
                onAction={handleAction}
                model={model}
              />
            </div>

            {/* Fine Tuning Panel */}
            {demoMode && model && (
              <div style={{ marginTop: '2rem' }}>
                <FineTuningPanel
                  model={model}
                  recentItems={recentItems}
                  onModelUpdate={() => setModel(bootstrapModel())} // Reload weights
                />
              </div>
            )}
          </div>
        ) : (
          view === 'disposition' && (
            <div className="fade-in" style={{ textAlign: 'center', marginTop: '6rem', color: 'var(--text-muted)' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>All Caught Up</h3>
              <p>No pending items in the disposition queue.</p>
              <button
                onClick={() => setProcessedIds(new Set())}
                style={{
                  marginTop: '1rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reset Queue (Simulation)
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default App;
