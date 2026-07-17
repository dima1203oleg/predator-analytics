import React from 'react';
import CompanyCERSDashboard from '../../CompanyCERSDashboard';

export const CERSTab: React.FC = () => {
  return (
    <div className="h-full bg-slate-950 overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      <CompanyCERSDashboard isTab={true} />
    </div>
  );
};

export default CERSTab;
