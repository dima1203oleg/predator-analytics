import React from 'react';
import { Printer, X, RefreshCw, FileDown, AlertTriangle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OsintEntity } from '../osintData';

export interface OsintExportPanelProps {
  showReportModal: boolean;
  setShowReportModal: (v: boolean) => void;
  showPreviewModal: boolean;
  setShowPreviewModal: (v: boolean) => void;
  showLargeExportConfirmation: boolean;
  setShowLargeExportConfirmation: (v: boolean) => void;
  pendingExportType: 'csv' | 'pdf' | null;
  setPendingExportType: (v: 'csv' | 'pdf' | null) => void;
  selectedEntitiesForExport: OsintEntity[];
  activeFilter: string;
  categoryFilter: string;
  riskLevelFilter: string;
  searchQuery: string;
  filteredEntities: OsintEntity[];
  exportFormat: 'csv' | 'pdf';
  setExportFormat: (v: 'csv' | 'pdf') => void;
  isExporting: boolean;
  downloadPDF: () => void;
  handleCSVExport: () => void;
  handlePDFExport: () => void;
  confirmAndExecuteExport: () => void;
}

export default function OsintExportPanel({
  showReportModal, setShowReportModal,
  showPreviewModal, setShowPreviewModal,
  showLargeExportConfirmation, setShowLargeExportConfirmation,
  pendingExportType, setPendingExportType,
  selectedEntitiesForExport,
  activeFilter, categoryFilter, riskLevelFilter, searchQuery, filteredEntities,
  exportFormat, setExportFormat,
  isExporting, downloadPDF, handleCSVExport, handlePDFExport, confirmAndExecuteExport
}: OsintExportPanelProps) {
  return (
    <>
      {/* Report Modal Preview (Framer Motion Overlay) */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="report-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4.5 h-4.5 text-rose-400" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Генератор звітів OSINT</h3>
                    <p className="text-[9px] text-slate-500 font-mono">Попередній перегляд та друк звіту</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 custom-scrollbar flex justify-center">
                
                {/* Paper page mimic */}
                <div id="pdf-report-content" className="w-full max-w-3xl bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-xl border border-slate-200 my-4 select-text">
                  
                  {/* Internal Report representation */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
                    <div>
                      <div className="text-[9px] font-bold text-red-600 tracking-wider uppercase font-mono">ЦЛКОМ ТАЄМНО / CLASSIFIED SECURITY</div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1 uppercase">ОФІЦІЙНИЙ АНАЛІТИЧНИЙ ЗВІТ OSINT</h1>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">PREDATOR SECURITY INTELLIGENCE MATRIX</div>
                    </div>
                    <div className="text-right font-mono text-[9px] text-slate-600 space-y-0.5 border-l border-slate-200 pl-4">
                      <div>ДАТА: {new Date().toLocaleDateString('uk-UA')}</div>
                      <div>КОРИСТУВАЧ: vkizima534@gmail.com</div>
                      <div>СИСТЕМА: PREDATOR V4.2</div>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/80 mb-6 text-xs text-slate-700">
                    <div>
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Критерії пошуку:</div>
                      <div className="mt-1 space-y-0.5 font-mono">
                        <div>База: {activeFilter === 'all' ? 'Всі реєстри' : activeFilter === 'company' ? 'Юридичні особи (ЄДР)' : activeFilter === 'person' ? 'Фізичні особи' : 'Криптоактиви'}</div>
                        <div>Категорія: {categoryFilter === 'all' ? 'Всі статуси' : categoryFilter === 'sanctioned' ? 'Під санкціями' : categoryFilter === 'active' ? 'Активні' : 'Високий ризик'}</div>
                        <div>Ризик: {riskLevelFilter === 'all' ? 'Всі рівні' : riskLevelFilter === 'high' ? 'High' : riskLevelFilter === 'medium' ? 'Medium' : 'Low'}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Статистичні показники:</div>
                      <div className="mt-1 space-y-0.5 font-mono">
                        <div>Всього об'єктів: <span className="font-bold">{selectedEntitiesForExport.length}</span></div>
                        <div>Високий ризик (High): <span className="text-red-600 font-bold">{selectedEntitiesForExport.filter(e => e.riskScore >= 80).length}</span></div>
                        <div>Середній ризик (Med): <span className="text-amber-600 font-bold">{selectedEntitiesForExport.filter(e => e.riskScore >= 50 && e.riskScore < 80).length}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Data Table preview */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                          <th className="p-2 font-bold font-mono">Код / ID</th>
                          <th className="p-2 font-bold">Назва / Ім'я об'єкта</th>
                          <th className="p-2 font-bold">Тип реєстру</th>
                          <th className="p-2 font-bold">Ризик %</th>
                          <th className="p-2 font-bold">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedEntitiesForExport.map(e => {
                          const isHigh = e.riskScore >= 80;
                          const isMedium = e.riskScore >= 50 && e.riskScore < 80;
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50">
                              <td className="p-2 font-mono font-bold text-slate-800">{e.code}</td>
                              <td className="p-2 text-slate-900">
                                <div className="font-bold">{e.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{e.description}</div>
                              </td>
                              <td className="p-2 text-slate-600 font-mono text-[11px]">
                                {e.type === 'company' ? 'Юридична особа' : e.type === 'cryptowallet' ? 'Криптогаманець' : 'Фізична особа'}
                              </td>
                              <td className="p-2 font-mono font-bold text-slate-950">{e.riskScore}%</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isHigh 
                                    ? 'bg-red-50 text-red-600 border border-red-200' 
                                    : isMedium 
                                      ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                }`}>
                                  {isHigh ? 'High' : isMedium ? 'Medium' : 'Low'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {selectedEntitiesForExport.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 font-mono">
                              Жодних збігів за обраними фільтрами не знайдено.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-slate-700 block">Predator Intelligence Security</span>
                      <span>Документ згенеровано автоматично в захищеному сеансі користувача.</span>
                    </div>
                    <div className="text-right font-mono text-indigo-600 text-[9px]">
                      vkizima534@gmail.com
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Загалом записів у звіті: <strong className="text-slate-300 font-bold">{selectedEntitiesForExport.length}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={() => {
                      downloadPDF();
                    }}
                    disabled={isExporting}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-lg shadow-indigo-950/20 cursor-pointer transition-colors ${
                      isExporting ? 'bg-indigo-500/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    <span>{isExporting ? 'Формування PDF...' : 'Зберегти як PDF'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive OSINT Entity Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="osint-preview-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[80vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                    <Eye className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Генератор звітів: Попередній перегляд даних</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Перевірка записів перед остаточним експортуванням</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Filtering metadata info banner */}
              <div className="px-6 py-3 bg-slate-950/20 border-b border-slate-800/60 flex flex-wrap gap-4 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-600 uppercase">Фільтр:</span>{' '}
                  <span className="text-slate-200 font-bold">
                    {activeFilter === 'all' ? 'Всі реєстри' : activeFilter === 'company' ? 'Юридичні особи' : activeFilter === 'person' ? 'Фізичні особи' : 'Криптоактиви'}
                  </span>
                </div>
                <div className="w-px h-3 bg-slate-800 self-center" />
                <div>
                  <span className="text-slate-600 uppercase">Категорія:</span>{' '}
                  <span className="text-slate-200 font-bold">
                    {categoryFilter === 'all' ? 'Всі статуси' : categoryFilter === 'sanctioned' ? 'Під санкціями' : categoryFilter === 'active' ? 'Активні' : 'Високий ризик'}
                  </span>
                </div>
                <div className="w-px h-3 bg-slate-800 self-center" />
                <div>
                  <span className="text-slate-600 uppercase">Рівень ризику:</span>{' '}
                  <span className="text-slate-200 font-bold">
                    {riskLevelFilter === 'all' ? 'Всі рівні' : riskLevelFilter === 'high' ? 'High Risk' : riskLevelFilter === 'medium' ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </div>
                {searchQuery.trim() && (
                  <>
                    <div className="w-px h-3 bg-slate-800 self-center" />
                    <div>
                      <span className="text-slate-600 uppercase">Пошук:</span>{' '}
                      <span className="text-indigo-400 font-bold">"{searchQuery}"</span>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Body - Data Table */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40 custom-scrollbar">
                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                        <th className="p-3 font-semibold">Код / ID</th>
                        <th className="p-3 font-semibold">Назва / Ім'я об'єкта</th>
                        <th className="p-3 font-semibold">Реєстр / Тип</th>
                        <th className="p-3 font-semibold text-center">Ризик %</th>
                        <th className="p-3 font-semibold">Опис об'єкта</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {selectedEntitiesForExport.map(e => {
                        const isHigh = e.riskScore >= 80;
                        const isMedium = e.riskScore >= 50 && e.riskScore < 80;
                        return (
                          <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-bold text-slate-400 whitespace-nowrap">{e.code}</td>
                            <td className="p-3">
                              <span className="font-sans font-bold text-slate-100">{e.name}</span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] font-sans">
                              {e.type === 'company' ? 'Юридична особа' : e.type === 'cryptowallet' ? 'Криптогаманець' : 'Фізична особа'}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isHigh 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                  : isMedium 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {e.riskScore}%
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] font-sans max-w-xs truncate" title={e.description}>
                              {e.description}
                            </td>
                          </tr>
                        );
                      })}
                      {selectedEntitiesForExport.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-[11px]">
                            Жодних об'єктів за обраними критеріями фільтрації не знайдено.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-mono">
                  Загалом записів у таблиці: <strong className="text-slate-300 font-bold">{selectedEntitiesForExport.length}</strong>
                </span>
                
                <div className="flex items-center gap-3">
                  {/* Format quick switcher in the footer */}
                  <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-900/40 relative text-[10px] select-none shrink-0">
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                        exportFormat === 'csv'
                          ? 'text-indigo-400'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                        exportFormat === 'pdf'
                          ? 'text-rose-400'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <span>PDF</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Закрити
                  </button>
                  
                  {exportFormat === 'csv' ? (
                    <button
                      onClick={() => {
                        setShowPreviewModal(false);
                        handleCSVExport();
                      }}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/20 cursor-pointer transition-colors"
                    >
                      {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-4 h-4" />}
                      <span>Експортувати CSV</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowPreviewModal(false);
                        handlePDFExport();
                      }}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/20 cursor-pointer transition-colors"
                    >
                      {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-4 h-4" />}
                      <span>Згенерувати PDF</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Large Export Confirmation Modal */}
      <AnimatePresence>
        {showLargeExportConfirmation && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" id="osint-large-export-confirmation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Alert Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">⚠️ Попередження: Великий обсяг даних</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Операція потребує додаткового підтвердження</p>
                </div>
              </div>

              {/* Warning Content */}
              <div className="p-6 space-y-4 text-xs text-slate-300">
                <p className="leading-relaxed">
                  Ви ініціювали експорт великого набору даних, який налічує <strong className="text-rose-400 font-bold">{selectedEntitiesForExport.length}</strong> записів. 
                </p>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-[11px] leading-relaxed">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider font-mono">Можливі наслідки:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Формування звіту у форматі <span className="text-slate-200 font-bold font-mono uppercase">{pendingExportType}</span> може зайняти більше часу</li>
                    <li>Тимчасове підвищення навантаження на систему дешифрування зв'язків</li>
                    <li>Значний розмір фінального файлу вивантаження</li>
                  </ul>
                </div>

                <p className="text-[11px] text-slate-400">
                  Рекомендується застосувати точніші фільтри за типом реєстру або датою активності, щоб зменшити розмір вибірки. Бажаєте продовжити експорт у повному обсязі?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowLargeExportConfirmation(false);
                    setPendingExportType(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={confirmAndExecuteExport}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/20 cursor-pointer transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Так, продовжити експорт</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
