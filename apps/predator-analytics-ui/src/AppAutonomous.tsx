import React, { useState, useEffect } from 'react';
import CustomsIntelligenceView from './views/CustomsIntelligenceView';

const AppAutonomous = () => {
    const [activeTab, setActiveTab] = useState('telegram');
    const [stats, setStats] = useState({ active: 0, parsed: 0 });

    // Mock Sidebar items
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'telegram', label: 'Telegram Intel', icon: '📱' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#0a0a0b',
            color: '#e4e4e7',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Sidebar */}
            <div style={{
                width: '260px',
                backgroundColor: '#121214',
                borderRight: '1px solid #27272a',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px'
            }}>
                <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)', borderRadius: '8px' }}></div>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>PREDATOR</span>
                </div>

                <nav style={{ flex: 1 }}>
                    {menuItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: activeTab === item.id ? '#27272a' : 'transparent',
                                color: activeTab === item.id ? '#ffffff' : '#a1a1aa',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div style={{ paddingTop: '20px', borderTop: '1px solid #27272a', fontSize: '12px', color: '#52525b' }}>
                    V31 - AUTONOMOUS MODE
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                {activeTab === 'telegram' ? (
                    <div style={{ padding: '40px' }}>
                        <CustomsIntelligenceView />
                    </div>
                ) : (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <div style={{ fontSize: '48px' }}>🚧</div>
                        <div style={{ fontSize: '24px', fontWeight: 'light', color: '#71717a' }}>
                            {activeTab.toUpperCase()} MODULE IN MAINTENANCE
                        </div>
                        <button
                            onClick={() => setActiveTab('telegram')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#ef4444',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Return to Telegram Intel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppAutonomous;
