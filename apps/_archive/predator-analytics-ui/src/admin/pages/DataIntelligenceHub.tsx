import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { Search, Activity, AlertTriangle, Database, Settings } from 'lucide-react';
import { useAdminApi } from '../hooks/useAdminApi';

export const DataIntelligenceHub: React.FC = () => {
  const { data: dataOps } = useAdminApi<any>('/api/v2/admin/dataops', 5000);
  const { data: telemetry } = useAdminApi<any>('/api/v2/admin/telemetry', 5000);
  const { data: logStream } = useAdminApi<any[]>('/api/v1/system/logs/stream?limit=20', 3000);

  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (logStream && logStream.length > 0) {
      setLogs(logStream.map(l => `[${l.level}] ${l.service}: ${l.message}`));
    }
  }, [logStream]);

  const sources = dataOps?.kafkaTopics || [];
  const isOnline = telemetry?.services?.some((s: any) => s.status === 'ok') ?? false;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Data Intelligence Hub</h1>
        <p className="admin-page-desc">Knowledge Ingestion & Domain Routing Control.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', background: 'var(--a-bg-card)', padding: '1rem', border: '1px solid var(--a-border)', borderRadius: '6px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--a-bg)', padding: '0.5rem 1rem', border: '1px solid var(--a-border)', borderRadius: '4px' }}>
          <Search size={16} color="var(--a-text-sec)" />
          <input 
            type="text" 
            placeholder="Search pipelines..." 
            style={{ background: 'transparent', border: 'none', color: 'var(--a-text)', outline: 'none', width: '100%' }} 
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color={isOnline ? "var(--a-green)" : "var(--a-red)"} /> 
            Status: {isOnline ? 'Online' : 'Degraded'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={16} color="var(--a-text-sec)" /> 
            Queue Latency: {telemetry?.services?.find((s:any) => s.name === "Kafka/Redpanda")?.latencyMs || 0}ms
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--a-red)' }}>
            <AlertTriangle size={16} /> 
            Alerts: {sources.filter((s:any) => s.status !== 'ok').length}
          </div>
        </div>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Live Ingestion Sources (Kafka Topics)</h3>
            <Button variant="cyber" className="admin-btn">Configure Routing</Button>
          </div>
          
          <table className="admin-table">
            <thead>
              <tr>
                <th>Source Topic</th>
                <th>Domain</th>
                <th>Partitions</th>
                <th>Lag</th>
                <th>Throughput</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src: any) => (
                <tr key={src.name}>
                  <td style={{ fontWeight: 500 }}>{src.name}</td>
                  <td><span className="admin-badge">General</span></td>
                  <td>{src.partitions}</td>
                  <td>{src.lag}</td>
                  <td>{src.throughput}</td>
                  <td>
                    <span className={`admin-badge ${src.status === 'ok' ? 'admin-badge-green' : 'admin-badge-red'}`}>
                      {src.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:'center', color:'var(--a-text-muted)'}}>No active pipelines found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Target Destinations</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--a-text-sec)' }}>Qdrant (Vector)</span>
              <span>Active</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--a-text-sec)' }}>Neo4j (Graph)</span>
              <span>Active</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--a-text-sec)' }}>PostgreSQL (Raw)</span>
              <span>Active</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--a-text-sec)' }}>ClickHouse (Analytics)</span>
              <span>Pending</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="admin-card" style={{ marginTop: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 className="admin-card-title">Event Bus Stream Logs</h3>
          <Settings size={14} color="var(--a-text-muted)" style={{cursor:'pointer'}} />
        </div>
        <div style={{ 
          background: 'var(--a-bg)', 
          border: '1px solid var(--a-border)', 
          borderRadius: '4px',
          padding: '0.75rem',
          flex: 1,
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ color: log.includes('WARN') || log.includes('ERROR') ? 'var(--a-red)' : 'var(--a-text-sec)' }}>
              {log}
            </div>
          ))}
          {logs.length === 0 && <span style={{color: 'var(--a-text-muted)'}}>Waiting for log stream...</span>}
        </div>
      </div>
    </div>
  );
};
