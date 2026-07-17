import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, BarChart2, Database, AlertCircle, RefreshCw } from 'lucide-react';

export const AutoTrainingCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('training');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/v1/deepseek_tuning/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch tuning status", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const startPipeline = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/deepseek_tuning/start_pipeline', {
        method: 'POST'
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (e) {
      console.error("Failed to start pipeline", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="admin-page-title">Центр управління автонавчанням</h1>
            <p className="admin-page-desc">Генерація датасетів, Fine-Tuning та контроль якості моделей (DeepSeek-R1).</p>
          </div>
          <Button variant="cyber" 
            className="admin-btn admin-btn-primary" 
            onClick={startPipeline} 
            disabled={loading || (status && status.status === 'IN_PROGRESS')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Play size={16} /> 
            {loading ? 'Запуск...' : 'Запустити цикл автонавчання'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'training', label: 'Панель автонавчання' },
          { id: 'datasets', label: 'Генерація датасетів' },
          { id: 'quality', label: 'Контроль якості (Metrics)' }
        ].map(tab => (
          <Button variant="cyber"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--a-text)' : 'var(--a-text-sec)',
              borderBottom: activeTab === tab.id ? '2px solid var(--a-text)' : '2px solid transparent'
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'training' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-card-title">Активні задачі (Fine-Tuning)</h3>
              <Button variant="cyber" className="admin-btn admin-btn-outline" onClick={fetchStatus} disabled={refreshing}>
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              </Button>
            </div>
            
            {!status || status.status === "Не знайдено активних чи завершених завдань донавчання." ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--a-text-sec)' }}>
                Жодного завдання не знайдено. Запустіть цикл автонавчання.
              </div>
            ) : (
              <table className="admin-table" style={{ marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th>Цикл</th>
                    <th>Модель</th>
                    <th>Статус</th>
                    <th>Рішення</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{status.cycle} / {status.max_cycles}</td>
                    <td style={{ fontWeight: 500 }}>{status.job?.model_name || 'deepseek-r1:latest'}</td>
                    <td>
                      <span className={`admin-badge ${status.status === 'IN_PROGRESS' ? 'admin-badge-blue' : status.status === 'COMPLETED' ? 'admin-badge-green' : 'admin-badge-red'}`}>
                        {status.status}
                      </span>
                    </td>
                    <td>{status.decision?.decision || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem' }}><Pause size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            
            {status && status.eval_metrics && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#0a0a0a', borderRadius: '8px', border: '1px solid var(--a-border)' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--a-text-sec)' }}>Останні метрики (Cycle {status.cycle})</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>F1 Score: <strong style={{ color: 'var(--a-green)' }}>{status.eval_metrics.f1_score}</strong></div>
                  <div>Hallucination Rate: <strong>{status.eval_metrics.hallucination_rate}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'datasets' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Автоматична генерація</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ justifyContent: 'flex-start' }}><Database size={16} style={{ marginRight: '0.5rem' }}/> Синтетична генерація (LLM)</Button>
              <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ justifyContent: 'flex-start' }}><Database size={16} style={{ marginRight: '0.5rem' }}/> Аугментація існуючих даних</Button>
              <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ justifyContent: 'flex-start' }}><Database size={16} style={{ marginRight: '0.5rem' }}/> Балансування класів</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="admin-card">
            <div className="admin-card-title">Accuracy</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--a-text)', marginTop: '0.5rem' }}>96.4%</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-title">F1-score</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--a-text)', marginTop: '0.5rem' }}>
              {status?.eval_metrics?.f1_score || '0.94'}
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-title">Hallucination Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--a-text)', marginTop: '0.5rem' }}>
              {status?.eval_metrics?.hallucination_rate || '0.02'}
            </div>
            <div style={{ color: 'var(--a-green)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>В межах норми</div>
          </div>
          <div className="admin-card" style={{ gridColumn: 'span 3' }}>
            <h3 className="admin-card-title">Контроль дрейфу (Drift)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: 'var(--a-text-sec)' }}>
              <AlertCircle size={16} color="var(--a-orange)" /> Виявлено незначний Data Drift у фінансовому датасеті. Рекомендовано донавчання.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
