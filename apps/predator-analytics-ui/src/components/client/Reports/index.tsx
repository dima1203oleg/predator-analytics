import React from 'react';
import { FileText, Download, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const reports = [
  { id: 101, name: 'Щомісячний звіт експорту (Грудень 2025)', size: '2.4 MB', date: '02.01.2026', type: 'PDF' },
  { id: 102, name: 'Аналіз ризиків постачання (Q4 2025)', size: '1.1 MB', date: '28.12.2025', type: 'DOCX' },
  { id: 103, name: 'Огляд митних тарифів 2026', size: '5.8 MB', date: '15.12.2025', type: 'PDF' },
  { id: 104, name: 'Зведення по конкурентах (Агро)', size: '0.9 MB', date: '10.12.2025', type: 'XLSX' },
];

export const Reports: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Аналітичні Звіти</h1>
          <p className="text-slate-300 text-sm">Архів доступних документів та довідок.</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
             <Filter size={16} /> Фільтри
           </button>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl ">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-300 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Назва документу</th>
                <th className="p-4 font-medium">Тип</th>
                <th className="p-4 font-medium">Дата</th>
                <th className="p-4 font-medium">� озмір</th>
                <th className="p-4 font-medium text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reports.map((report, idx) => (
                <motion.tr
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded text-blue-400 group-hover:text-blue-300 group-hover:bg-slate-700 transition-colors">
                        <FileText size={18} />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                        {report.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded text-slate-300">
                      {report.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 text-sm">{report.date}</td>
                  <td className="p-4 text-slate-300 text-sm font-mono">{report.size}</td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all" title="Завантажити">
                      <Download size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
