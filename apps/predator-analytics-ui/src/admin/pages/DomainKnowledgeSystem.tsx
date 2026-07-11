import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Layers, Database, Lock, FolderTree, ArrowRight } from 'lucide-react';

export const DomainKnowledgeSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('domains');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Система Доменних Знань</h1>
        <p className="admin-page-desc">Логічна ізоляція, семантичне розбиття та управління мульти-тенантними доменами.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'domains', label: 'Доменні Простори' },
          { id: 'taxonomies', label: 'Таксономії та Онтології' },
          { id: 'cross', label: 'Крос-доменні Зв\'язки' }
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

      {activeTab === 'domains' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { id: 'D-01', name: 'Митниця та Торгівля', records: '14.2M', status: 'Активний', color: 'var(--a-blue)' },
            { id: 'D-02', name: 'OSINT та Даркнет', records: '8.4M', status: 'Активний', color: 'var(--a-orange)' },
            { id: 'D-03', name: 'Фінансове Шахрайство', records: '2.1M', status: 'Індексація', color: 'var(--a-green)' },
            { id: 'D-04', name: 'Корпоративна Розвідка', records: '450K', status: 'Очікування', color: 'var(--a-text-muted)' }
          ].map(domain => (
            <div key={domain.id} className="admin-card" style={{ borderTop: `3px solid ${domain.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className="admin-card-title">{domain.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--a-text-sec)', fontFamily: 'monospace' }}>{domain.id}</span>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Database size={14} color="var(--a-text-sec)" />
                <span>{domain.records} записів</span>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Lock size={14} color="var(--a-text-sec)" />
                <span>Ізольований Векторний Простір</span>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`admin-badge ${domain.status === 'Активний' ? 'admin-badge-green' : domain.status === 'Індексація' ? 'admin-badge-blue' : ''}`}>{domain.status}</span>
                <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Управління</Button>
              </div>
            </div>
          ))}
          
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', cursor: 'pointer', opacity: 0.7 }}>
            <FolderTree size={24} style={{ marginBottom: '0.5rem', color: 'var(--a-text-sec)' }} />
            <div style={{ fontWeight: 500 }}>Створити Новий Домен</div>
          </div>
        </div>
      )}

      {activeTab === 'taxonomies' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Спільні Онтології</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--a-text-sec)', fontSize: '0.85rem' }}>
            Управління ієрархічними словниками, які визначають сутності між доменами (наприклад: "Людина", "Компанія", "Транзакція").
          </p>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#000', borderRadius: '6px', border: '1px solid var(--a-border)' }}>
            <pre style={{ fontSize: '0.8rem', color: 'var(--a-green)', margin: 0 }}>
{`{
  "Entity": {
    "LegalPerson": ["Company", "NGO", "Government"],
    "NaturalPerson": ["Citizen", "PEP", "Suspect"],
    "Asset": ["RealEstate", "Vehicle", "CryptoWallet"]
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'cross' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Крос-доменні Зв'язки</h3>
            <Button variant="cyber" className="admin-btn admin-btn-primary">Додати Правило</Button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Домен Джерело</th>
                <th>Домен Призначення</th>
                <th>Умова Зв'язку</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Митниця та Торгівля</td>
                <td>Фінансове Шахрайство</td>
                <td><code style={{ fontSize: '0.8rem', background: '#111', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>match(source.CompanyName == target.EntityName)</code></td>
                <td><span className="admin-badge admin-badge-green">Активно</span></td>
              </tr>
              <tr>
                <td>OSINT та Даркнет</td>
                <td>Фінансове Шахрайство</td>
                <td><code style={{ fontSize: '0.8rem', background: '#111', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>match(source.CryptoAddress == target.WalletID)</code></td>
                <td><span className="admin-badge admin-badge-green">Активно</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
