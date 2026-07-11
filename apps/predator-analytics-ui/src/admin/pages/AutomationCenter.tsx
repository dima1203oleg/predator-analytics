import { Button } from '@/components/ui/button';
import React from 'react';
import { GitBranch, Play, Clock, CheckCircle } from 'lucide-react';

export const AutomationCenter: React.FC = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Студія Автоматизації (Workflow)</h1>
        <p className="admin-page-desc">Ланцюжки дій за подіями, конструктор процесів та планувальник.</p>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="admin-card-title">Активні сценарії</h3>
            <Button variant="cyber" className="admin-btn admin-btn-primary">+ Створити сценарій</Button>
          </div>
          
          <table className="admin-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Назва сценарію</th>
                <th>Тригер</th>
                <th>Останній запуск</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 500 }}>Нічне донавчання (Nightly Retrain)</td>
                <td><Clock size={14} style={{ display: 'inline', marginRight: '4px' }}/> Cron (0 3 * * *)</td>
                <td>Сьогодні 03:00</td>
                <td><CheckCircle size={14} color="var(--a-green)" /> Успішно</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 500 }}>Перебудова граф-індексів</td>
                <td><GitBranch size={14} style={{ display: 'inline', marginRight: '4px' }}/> On DB Import</td>
                <td>Вчора 14:20</td>
                <td><CheckCircle size={14} color="var(--a-green)" /> Успішно</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
