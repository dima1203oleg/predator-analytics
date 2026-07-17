import React from 'react';
export const ModulesCenter: React.FC = () => (
  <div className="admin-content flex flex-col gap-6">
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">Центр Модулів</h1>
        <p className="admin-page-desc">Управління мікросервісами, залежностями та версіями</p>
      </div>
    </div>
    <div className="admin-card"><div className="admin-table-empty">Немає доступних модулів.</div></div>
  </div>
);
