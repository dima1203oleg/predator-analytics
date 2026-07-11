import React from 'react';
import { useTranslation } from 'react-i18next';

const DOC_TYPES = [
  { key: 'doc_customs', color: 'bg-cyan-400', count: '42.1M' },
  { key: 'doc_contracts', color: 'bg-blue-400', count: '12.7M' },
  { key: 'doc_courts', color: 'bg-purple-400', count: '3.6M' },
  { key: 'doc_payments', color: 'bg-pink-400', count: '33.2M' },
  { key: 'doc_other', color: 'bg-gray-400', count: '78.4M' },
];

export const LivingArchives = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col font-mono text-xs w-[320px] h-full border border-cyan-tactical/20 bg-obsidian/60 p-4">
      <h3 className="text-cyan-tactical uppercase tracking-widest mb-1">{t('hud.living_archives')}</h3>
      <div className="text-[10px] text-cyan-tactical/50 mb-4">{t('hud.living_archives_desc')}</div>
      
      {/* Decorative Server Racks Visual */}
      <div className="flex-1 flex items-end justify-between gap-1 mb-4 border-b border-cyan-tactical/20 pb-2 h-24">
        {[40, 60, 30, 80, 50, 90, 70, 45, 85, 30, 60, 70, 20].map((h, i) => (
          <div key={i} className="w-full bg-cyan-tactical/20 hover:bg-cyan-tactical/50 transition-colors flex flex-col-reverse justify-start overflow-hidden border border-cyan-tactical/30" style={{ height: `${h}%` }}>
            <div className="w-full h-[1px] bg-cyan-tactical/50 mb-[2px]" />
            <div className="w-full h-[1px] bg-cyan-tactical/50 mb-[2px]" />
            <div className="w-full h-[1px] bg-cyan-tactical/50 mb-[2px]" />
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-[9px] text-cyan-tactical/40 mb-4 px-1">
        <span>2018</span><span>2019</span><span>2020</span><span>2021</span><span>2022</span><span className="text-cyan-tactical">2023</span><span>2024</span>
      </div>

      <div className="text-[10px] text-cyan-tactical/60 uppercase mb-2 border-b border-cyan-tactical/20 pb-1">{t('hud.document_types')}</div>
      
      <div className="flex flex-col gap-2">
        {DOC_TYPES.map((doc, idx) => (
          <div key={idx} className="flex justify-between items-center text-[10px]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-sm ${doc.color}`} />
              <span className="text-cyan-tactical/80">{t(`hud.${doc.key}`)}</span>
            </div>
            <div className="text-cyan-tactical relative w-full mx-2 border-b border-dashed border-cyan-tactical/20" />
            <span className="text-cyan-tactical font-bold">{doc.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
