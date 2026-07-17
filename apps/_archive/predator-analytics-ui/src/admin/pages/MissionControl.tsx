import React from 'react';
import { Activity, Database, Network, HardDrive, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import { useAdminApi } from '../hooks/useAdminApi';
import { useTranslation } from 'react-i18next';

export const MissionControl: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: telemetry } = useAdminApi<any>('/api/v2/admin/telemetry', 5000);
  const { data: agentsData } = useAdminApi<any>('/api/v2/admin/agents', 5000);

  const services = telemetry?.services || [];
  const nodes = telemetry?.nodes || [];
  const agents = agentsData?.list || [];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t('mission_control.title')}</h1>
        <p className="admin-page-desc">{t('mission_control.desc')}</p>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        
        {/* Hardware Nodes */}
        <div className="admin-card" style={{ gridColumn: 'span 4' }}>
          <h3 className="admin-card-title">{t('mission_control.nodes_title')}</h3>
          <table className="admin-table" style={{ marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th>{t('mission_control.node_name')}</th>
                <th>{t('mission_control.ip')}</th>
                <th>{t('mission_control.role')}</th>
                <th>{t('mission_control.uptime')}</th>
                <th>{t('mission_control.cpu')}</th>
                <th>{t('mission_control.ram')}</th>
                <th>{t('mission_control.vram')}</th>
                <th>{t('mission_control.network')}</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node: any) => (
                <tr key={node.id}>
                  <td style={{ fontWeight: 600 }}>{node.node}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--a-text-sec)' }}>{node.ip}</td>
                  <td><span className="admin-badge">{node.role}</span></td>
                  <td>{node.uptime}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--a-border)', borderRadius: '2px' }}>
                        <div style={{ width: `${node.cpu}%`, height: '100%', background: node.cpu > 80 ? 'var(--a-red)' : 'var(--a-blue)', borderRadius: '2px' }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', minWidth: '30px' }}>{node.cpu}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--a-border)', borderRadius: '2px' }}>
                        <div style={{ width: `${node.ram}%`, height: '100%', background: node.ram > 80 ? 'var(--a-red)' : 'var(--a-green)', borderRadius: '2px' }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', minWidth: '30px' }}>{node.ram}%</span>
                    </div>
                  </td>
                  <td>{node.vram !== null ? `${node.vram}% (${node.vramGb}GB)` : 'N/A'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{node.net}</td>
                </tr>
              ))}
              {nodes.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--a-text-muted)' }}>{t('mission_control.waiting_nodes')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Database Health */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="admin-card-title">{t('mission_control.storage_title')}</h3>
          <table className="admin-table" style={{ marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th>{t('mission_control.service_name')}</th>
                <th>{t('mission_control.version')}</th>
                <th>{t('mission_control.latency')}</th>
                <th>{t('mission_control.status')}</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc: any) => (
                <tr key={svc.name}>
                  <td style={{ fontWeight: 500 }}>{svc.name}</td>
                  <td style={{ color: 'var(--a-text-sec)' }}>{svc.version}</td>
                  <td style={{ fontFamily: 'monospace' }}>{svc.latencyMs} ms</td>
                  <td>
                    {svc.status === 'ok' ? (
                      <span className="admin-badge admin-badge-green"><ShieldCheck size={12} style={{marginRight: '0.2rem'}}/> {t('mission_control.status_active')}</span>
                    ) : svc.status === 'warn' ? (
                      <span className="admin-badge admin-badge-orange"><AlertTriangle size={12} style={{marginRight: '0.2rem'}}/> {t('mission_control.status_warn')}</span>
                    ) : (
                      <span className="admin-badge admin-badge-red"><AlertTriangle size={12} style={{marginRight: '0.2rem'}}/> {t('mission_control.status_offline')}</span>
                    )}
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--a-text-muted)' }}>{t('mission_control.waiting_services')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Active Agents */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="admin-card-title">{t('mission_control.agents_title')}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--a-text-sec)' }}>{t('mission_control.agents_total')}: {agentsData?.stats?.total || 0}</span>
          </div>
          <table className="admin-table" style={{ marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th>{t('mission_control.agent_id')}</th>
                <th>{t('mission_control.domain_role')}</th>
                <th>{t('mission_control.status')}</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent: any) => (
                <tr key={agent.id}>
                  <td style={{ fontFamily: 'monospace' }}>{agent.name}</td>
                  <td>{agent.role}</td>
                  <td>
                    {agent.is_busy ? (
                      <span className="admin-badge admin-badge-blue">{t('mission_control.agent_running')}</span>
                    ) : agent.is_alive ? (
                      <span className="admin-badge admin-badge-green">{t('mission_control.agent_waiting')}</span>
                    ) : (
                      <span className="admin-badge admin-badge-red">{t('mission_control.status_offline')}</span>
                    )}
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--a-text-muted)' }}>{t('mission_control.no_agents')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
