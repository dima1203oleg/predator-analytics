import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Brain, Layers, GitMerge, FileCheck2, AlertCircle, Database } from 'lucide-react';

export const AiControlCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pipeline');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Лабораторія Моделей (Model Laboratory)</h1>
        <p className="admin-page-desc">Централізований інтерфейс для життєвого циклу AI моделей, fine-tuning та розгортання.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'pipeline', label: 'Пайплайни Навчання' },
          { id: 'datasets', label: 'Версіонування Датасетів' },
          { id: 'lora', label: 'LoRA / Fine-tuning' },
          { id: 'abtesting', label: 'A/B Тестування' },
          { id: 'deployment', label: 'Розгортання та Відкат' }
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

      {activeTab === 'pipeline' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Управління Пайплайнами Навчання</h3>
          <table className="admin-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>ID Завдання</th>
                <th>Архітектура Моделі</th>
                <th>Доменний Фокус</th>
                <th>Прогрес</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'monospace' }}>TRN-8192A</td>
                <td>Llama-3 (8B)</td>
                <td>Customs & Tariffs</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '4px', background: 'var(--a-border)', borderRadius: '2px' }}>
                      <div style={{ width: '68%', height: '100%', background: 'var(--a-blue)', borderRadius: '2px' }}></div>
                    </div>
                    <span style={{ fontSize: '0.75rem' }}>68%</span>
                  </div>
                </td>
                <td><span className="admin-badge admin-badge-blue">Навчання</span></td>
                <td><Button variant="cyber" className="admin-btn">Скасувати</Button></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace' }}>TRN-8191B</td>
                <td>Mistral-v0.2</td>
                <td>Banking Fraud</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '4px', background: 'var(--a-border)', borderRadius: '2px' }}>
                      <div style={{ width: '100%', height: '100%', background: 'var(--a-green)', borderRadius: '2px' }}></div>
                    </div>
                    <span style={{ fontSize: '0.75rem' }}>100%</span>
                  </div>
                </td>
                <td><span className="admin-badge admin-badge-green">Завершено</span></td>
                <td><Button variant="cyber" className="admin-btn">Оцінити</Button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'datasets' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Монітор Автозгенерованих Датасетів</h3>
            <Button variant="cyber" className="admin-btn admin-btn-primary">Згенерувати Синтетичні Дані</Button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Назва Датасету</th>
                <th>Версія</th>
                <th>Записів</th>
                <th>Оцінка Якості</th>
                <th>Джерело</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>banking_fraud_v2.1</td>
                <td><span className="admin-badge">v2.1</span></td>
                <td>2.4M</td>
                <td style={{ color: 'var(--a-green)' }}>0.98</td>
                <td>Автозгенеровано (GAN)</td>
              </tr>
              <tr>
                <td>customs_declarations_q1</td>
                <td><span className="admin-badge">v1.0</span></td>
                <td>845K</td>
                <td style={{ color: 'var(--a-blue)' }}>0.91</td>
                <td>ETL Пайплайн (Neo4j)</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'lora' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Управління LoRA / Fine-tuning</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--a-text-sec)', fontSize: '0.85rem' }}>
            Керування Low-Rank Adapters для специфічних доменів без перенавчання базової моделі.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--a-border)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>LoRA: Banking Policy</span>
                <span className="admin-badge admin-badge-green">Активно</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--a-text-sec)', marginTop: '0.5rem' }}>База: Llama-3 (8B)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--a-text-sec)' }}>Rank: 16 | Alpha: 32</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--a-border)', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>LoRA: OSINT DarkNet</span>
                <span className="admin-badge">Готово</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--a-text-sec)', marginTop: '0.5rem' }}>База: Mistral-v0.2</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--a-text-sec)' }}>Rank: 32 | Alpha: 64</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'abtesting' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Модель A (v8.1) — Контрольна</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem', color: 'var(--a-text-sec)', lineHeight: '1.8' }}>
              <li>Точність: 98.2%</li>
              <li>F1-Score: 0.96</li>
              <li>Сер. Затримка: 120мс</li>
              <li>Розподіл Трафіку: 90%</li>
            </ul>
          </div>
          <div className="admin-card">
            <h3 className="admin-card-title">Модель B (v8.2-rc) — Тестова</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem', color: 'var(--a-text-sec)', lineHeight: '1.8' }}>
              <li>Точність: 98.5% <span style={{ color: 'var(--a-green)' }}>(+0.3%)</span></li>
              <li>F1-Score: 0.97</li>
              <li>Сер. Затримка: 145мс <span style={{ color: 'var(--a-red)' }}>(+25мс)</span></li>
              <li>Розподіл Трафіку: 10%</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'deployment' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Система Безпечного Розгортання та Відкату</h3>
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--a-border)', borderRadius: '6px', background: 'var(--a-bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Активне Canary Розгортання: v8.2-rc</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--a-text-sec)', marginTop: '0.25rem' }}>10% глобального трафіку спрямовується на нову модель. Аномалій не виявлено.</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="cyber" className="admin-btn admin-btn-primary">Підвищити до 25%</Button>
                <Button variant="cyber" className="admin-btn admin-btn-danger">Примусовий Відкат</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
