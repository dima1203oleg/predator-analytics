import React from 'react';
export const PerformanceCenter: React.FC = () => (
  <div className="admin-content flex flex-col gap-6">
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">Центр Продуктивності</h1>
        <p className="admin-page-desc">Детальні графіки затримок AI, FPS, трафіку та продуктивності ETL</p>
      </div>
    </div>
    <div className="admin-card"><div className="admin-table-empty">Дані телеметрії збираються...</div></div>
  </div>
);
