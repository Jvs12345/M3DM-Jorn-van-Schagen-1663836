import React, { useMemo, useState } from 'react';
import type { Region, ReturnItem } from '../logic/types';

interface MapProps {
    items: ReturnItem[];
}

// Reuse the high-fidelity paths for a nice background map
const PROVINCE_PATHS: Record<string, string> = {
    Groningen: "M 570 60 L 620 50 L 660 60 L 680 90 L 680 130 L 640 140 L 610 130 L 580 140 L 560 110 L 570 60 Z",
    Friesland: "M 450 60 L 510 50 L 560 90 L 560 140 L 520 180 L 460 160 L 430 110 L 440 80 Z M 480 30 L 500 30 L 510 40 L 490 40 Z",
    Drenthe: "M 570 140 L 640 140 L 650 200 L 610 240 L 560 210 L 560 180 Z",
    Overijssel: "M 500 220 L 560 210 L 610 240 L 620 300 L 580 330 L 520 310 L 500 270 Z",
    Flevoland: "M 420 220 L 480 230 L 490 280 L 440 290 L 410 260 Z",
    Gelderland: "M 460 300 L 520 290 L 580 330 L 570 390 L 500 400 L 440 370 L 420 330 Z",
    Utrecht: "M 380 300 L 440 300 L 450 340 L 410 360 L 370 330 Z",
    NoordHolland: "M 350 120 L 390 140 L 390 240 L 360 290 L 310 280 L 300 180 L 320 140 Z M 350 50 L 380 60 L 370 80 L 340 70 Z",
    ZuidHolland: "M 290 300 L 360 310 L 370 360 L 320 400 L 260 370 L 270 320 Z",
    Zeeland: "M 180 400 L 260 410 L 280 450 L 220 480 L 160 440 Z M 200 380 L 240 380 L 230 400 L 190 400 Z",
    NoordBrabant: "M 300 420 L 400 410 L 500 420 L 480 480 L 380 490 L 300 470 Z",
    Limburg: "M 480 480 L 530 480 L 540 580 L 520 650 L 480 620 L 500 540 Z"
};

const NetherlandsMap: React.FC<MapProps> = ({ items }) => {
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

    // 1. Calculate Intensity per Region
    const regionCounts = useMemo(() => items.reduce((acc, item) => {
        acc[item.region] = (acc[item.region] || 0) + 1;
        return acc;
    }, {} as Record<Region, number>), [items]);

    // Define center points for the squares in each region
    const regionCenters: Record<Region, { x: number, y: number }> = {
        'Randstad': { x: 340, y: 260 }, // Centered around AMS/UTR
        'North': { x: 550, y: 120 },    // Centered around Groningen/Drenthe
        'South': { x: 420, y: 450 },    // Centered around Brabant/Limburg
        'East': { x: 540, y: 300 }      // Centered around Gelderland/Overijssel
    };

    const regionItems = useMemo(() => {
        if (!selectedRegion) return [];
        return items.filter(i => i.region === selectedRegion);
    }, [items, selectedRegion]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '500px', background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden' }}>
            <svg
                viewBox="0 0 800 800"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.4))' }}
                onClick={() => setSelectedRegion(null)} // Click background to deselect
            >
                <defs>
                    <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2c3e50" />
                        <stop offset="100%" stopColor="#34495e" />
                    </linearGradient>
                </defs>

                {/* Neutral Background Map */}
                {Object.entries(PROVINCE_PATHS).map(([name, path]) => (
                    <g key={name} className="province-group">
                        <path
                            d={path}
                            fill="#1e293b" // Neutral dark color
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                            style={{ transition: 'all 0.3s ease' }}
                        />
                    </g>
                ))}

                {/* Squares Scaled by Volume */}
                {(Object.keys(regionCenters) as Region[]).map((region) => {
                    const count = regionCounts[region] || 0;
                    if (count === 0) return null;

                    // Scale size: Base 20px + count * 1.5
                    const size = 20 + (count * 2.5);
                    const { x, y } = regionCenters[region];

                    // Center the square
                    const rectX = x - (size / 2);
                    const rectY = y - (size / 2);
                    const isSelected = selectedRegion === region;

                    return (
                        <g
                            key={region}
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRegion(region); // Show list panel
                            }}
                        >
                            {/* The Square */}
                            <rect
                                x={rectX}
                                y={rectY}
                                width={size}
                                height={size}
                                fill={isSelected ? "rgba(16, 185, 129, 0.8)" : "rgba(59, 130, 246, 0.6)"}
                                stroke={isSelected ? "#10b981" : "#3b82f6"}
                                strokeWidth="2"
                                rx="4"
                                style={{
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    transformOrigin: `${x}px ${y}px`,
                                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                }}
                            >
                                <title>{region}: {count} packages (Click to view)</title>
                            </rect>

                            {/* Label inside the square */}
                            <text
                                x={x}
                                y={y}
                                dy=".35em"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                fontWeight="bold"
                                style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                            >
                                {count}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            {!selectedRegion && (
                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(15, 23, 42, 0.9)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Legend</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '20px', height: '20px', background: 'rgba(59, 130, 246, 0.6)', border: '1px solid #3b82f6', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click squares to view items</span>
                    </div>
                </div>
            )}

            {/* Region Details Panel (Overlay/Sidebar) */}
            {selectedRegion && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '320px',
                    background: 'rgba(15, 23, 42, 0.95)', // Nearly opaque, glassmorphism
                    backdropFilter: 'blur(12px)',
                    borderLeft: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 20,
                    boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
                    animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{selectedRegion} Region</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>{regionItems.length} returns pending</span>
                        </div>
                        <button
                            onClick={() => setSelectedRegion(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0 0.5rem',
                                marginTop: '-4px'
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {regionItems.map(item => (
                            <div key={item.id} style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '0.85rem',
                                borderRadius: '6px',
                                marginBottom: '0.75rem',
                                border: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.85rem',
                                transition: 'background 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.category}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.id}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Reason: {item.reason}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                    <span style={{
                                        color: item.conditionScore < 3 ? '#ef4444' : '#10b981',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: item.conditionScore < 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        Cond: {item.conditionScore}/5
                                    </span>
                                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>€{item.price}</span>
                                </div>
                            </div>
                        ))}
                        {regionItems.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                                No active returns in this region.
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default NetherlandsMap;
