import React from 'react';
export const ForecastingCenter: React.FC = () => (
  <div className="admin-content flex flex-col gap-6">
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">Центр Прогнозування</h1>
        <p className="admin-page-desc">Управління прогнозними моделями та A/B-тестуванням</p>
      </div>
    </div>
    <div className="admin-card"><div className="admin-table-empty">Дані моделей відсутні.</div></div>
  </div>
);
