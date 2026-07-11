import React from 'react';
export const DatasetsCenter: React.FC = () => (
  <div className="admin-content flex flex-col gap-6">
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">Автогенерація Датасетів</h1>
        <p className="admin-page-desc">Створення шаблонів, балансування класів та валідація вибірок</p>
      </div>
    </div>
    <div className="admin-card"><div className="admin-table-empty">Датасети не знайдені.</div></div>
  </div>
);
