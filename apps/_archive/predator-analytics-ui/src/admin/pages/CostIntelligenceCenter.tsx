import React from 'react';
import { CreditCard, TrendingUp, Cpu, Server, HardDrive } from 'lucide-react';

export const CostIntelligenceCenter: React.FC = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Аналітика Витрат (Cost Intelligence)</h1>
        <p className="admin-page-desc">Аналітика витрат на інференс, навчання та використання ресурсів.</p>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="admin-card">
          <div className="admin-card-title">Витрати за місяць</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--a-text)', marginTop: '0.5rem' }}>$4,250</div>
          <div style={{ color: 'var(--a-red)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>+12% з минулого місяця</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-title">Вартість інференсу</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--a-text)', marginTop: '0.5rem' }}>$1,120</div>
          <div style={{ color: 'var(--a-green)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>-5% оптимізація</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-title">Вартість навчання</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--a-text)', marginTop: '0.5rem' }}>$2,500</div>
          <div style={{ color: 'var(--a-red)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>Активне донавчання</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-title">Зберігання даних</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--a-text)', marginTop: '0.5rem' }}>$630</div>
          <div style={{ color: 'var(--a-text-sec)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>Стабільно</div>
        </div>

        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="admin-card-title">Використання GPU</h3>
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--a-border)', borderRadius: '8px', marginTop: '1rem', color: 'var(--a-text-muted)' }}>
            Графік навантаження GPU
          </div>
        </div>

        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="admin-card-title">Оптимізація ресурсів</h3>
          <div className="admin-list" style={{ marginTop: '1rem' }}>
            <div className="admin-list-item">
              <Cpu size={16} color="var(--a-orange)" />
              <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                <div style={{ fontWeight: 500, color: 'var(--a-text)' }}>Зменшити розмір batch_size</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--a-text-sec)' }}>Може зекономити 15% VRAM під час RAG.</div>
              </div>
            </div>
            <div className="admin-list-item">
              <HardDrive size={16} color="var(--a-green)" />
              <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                <div style={{ fontWeight: 500, color: 'var(--a-text)' }}>Видалити старі індекси</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--a-text-sec)' }}>Звільнить 250 GB на Qdrant кластері.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
