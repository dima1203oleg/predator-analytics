// @ts-nocheck

import React, { useState } from 'react';
import { 
  User, Users, Wallet, Brain, Stethoscope, AlertCircle, 
  AlertTriangle, ShieldAlert, DollarSign, Truck, 
  Briefcase, Landmark, Hash, Globe, Server, Shield, MessageSquare, Bitcoin, FileWarning, Download, Clock, Cpu, Database, Loader2, Mail
} from 'lucide-react';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';
import { useQuery } from '@tanstack/react-query';
import { fetchEntityTimeline } from '../api';

export const OsintDossierPanel: React.FC<{
  activeEntity: OsintEntity;
  userRole: string;
  onSelectEntityForInspector: (entity: OsintEntity) => void;
}> = ({ activeEntity, userRole, onSelectEntityForInspector }) => {
  const [activePersonTab, setActivePersonTab] = useState<'general' | 'family' | 'assets' | 'psychology' | 'medical' | 'compromat' | 'cyber' | 'interpol' | 'leaks' | 'timeline'>('general');

  const { data: timelineData, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['entityTimeline', activeEntity.id],
    queryFn: () => fetchEntityTimeline(activeEntity.id),
    refetchInterval: 10000,
    enabled: activePersonTab === 'timeline'
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ACTIVE</div>;
      case 'WANTED': return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">WANTED (INTERPOL)</div>;
      case 'LIQUIDATED': return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">LIQUIDATED</div>;
      case 'UNDER_INVESTIGATION': return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">INVESTIGATION</div>;
      default: return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">{status}</div>;
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 85) return "text-rose-500 border-rose-500 bg-rose-500/10";
    if (score > 60) return "text-amber-500 border-amber-500 bg-amber-500/10";
    return "text-emerald-500 border-emerald-500 bg-emerald-500/10";
  };

  const exportDossierToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeEntity, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `dossier_${activeEntity.code}_${activeEntity.id}.json`;
    a.click();
  };

  return (
        <div className="xl:col-span-4 space-y-6" id="osint-dossier-panel">
          <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
            
            {/* Dossier Header */}
            <div className="p-5 border-b border-slate-900 bg-slate-950/60 relative">
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <button
                  onClick={exportDossierToJson}
                  title="Експорт досьє у JSON"
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors text-slate-400 hover:text-indigo-400 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase font-bold hidden sm:inline">JSON</span>
                </button>
                {getStatusBadge(activeEntity.status)}
                <div className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${getRiskColor(activeEntity.riskScore)}`}>
                  RISK Score: {activeEntity.riskScore}
                </div>
              </div>

              <div className="flex items-start gap-3.5 pr-28">
                <div className={`p-3 rounded-xl shrink-0 bg-slate-950 border ${activeEntity.riskScore > 75 ? 'border-rose-500/30 text-rose-400' : 'border-slate-800 text-indigo-400'}`}>
                  {activeEntity.type === 'company' ? (
                    <Briefcase className="w-5 h-5" />
                  ) : activeEntity.type === 'cryptowallet' ? (
                    <Landmark className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{activeEntity.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-600" />
                      Код: <strong className="text-slate-200">{activeEntity.code}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-600" />
                      Регіон: <strong className="text-slate-200">UA (Львів/Київ)</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dossier Details Tablist */}
            <div className="p-5 space-y-5 text-xs">
              
              {/* Conditional: Person Tabs Navigation */}
              {activeEntity.type === 'person' && (
                  <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 mb-2">
                    <button 
                      onClick={() => setActivePersonTab('general')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'general' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <User className="w-3.5 h-3.5" /> ЗАГАЛЬНЕ
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('family')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'family' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <Users className="w-3.5 h-3.5" /> РОДИНА
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('assets')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'assets' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <Wallet className="w-3.5 h-3.5" /> АКТИВИ
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('psychology')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'psychology' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <Brain className="w-3.5 h-3.5" /> ПСИХОЛОГІЯ
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('medical')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'medical' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" /> МЕДИЧНИЙ
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('compromat')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'compromat' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> КОМПРОМАТ
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('cyber')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'cyber' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <Server className="w-3.5 h-3.5" /> КІБЕР
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('leaks')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'leaks' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <Hash className="w-3.5 h-3.5" /> ВИТОКИ
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('interpol')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'interpol' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> ІНТЕРПОЛ
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('timeline')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'timeline' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <Clock className="w-3.5 h-3.5" /> ХРОНОЛОГІЯ
                    </button>
                  </div>
              )}

              {(activeEntity.type !== 'person' || activePersonTab === 'general') && (
                <div className="space-y-5 animate-fade-in">
              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Аналітична замітка (Огляд)</span>
                <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-line bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                  {activeEntity.description}
                </p>
              </div>

              {/* Conditional: Company Details */}
              {activeEntity.type === 'company' && (
                <>
                  {/* Founders & Stakeholders */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Засновники та частки власності</span>
                    <div className="space-y-1.5">
                      {activeEntity.founders?.map((found, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            const foundPerson = OSINT_ENTITIES.find(e => e.name === found.name);
                            if (foundPerson) onSelectEntityForInspector(foundPerson);
                          }}
                          className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between hover:border-slate-800 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            <div>
                              <p className="font-semibold text-slate-200 text-[11px] group-hover:text-indigo-400 transition-colors">{found.name}</p>
                              <span className="text-[10px] text-slate-500 font-mono">{found.role}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2.5 text-right font-mono text-[10px]">
                            <div>
                              <span className="text-indigo-400 font-bold block">{found.share}</span>
                              <span className="text-[9px] text-slate-600 uppercase">ЧАСТКА</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold ${found.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                              {found.riskLevel} Risk
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Taxes and Customs Data (Section 13) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeEntity.taxes && (
                      <div className="glass-panel rounded-xl p-3.5 space-y-2">
                        <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Фінансовий стан
                        </span>
                        <div className="space-y-1 text-[11px] font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Рік подачі:</span>
                            <span>{activeEntity.taxes.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Сплачено ПДВ:</span>
                            <span className="text-emerald-400 font-bold">{activeEntity.taxes.paid}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Податковий борг:</span>
                            <span className={activeEntity.taxes.debt !== '0 UAH' ? 'text-red-400 font-bold' : 'text-slate-400'}>{activeEntity.taxes.debt}</span>
                          </div>
                          <p className="text-[9px] text-amber-500 font-semibold bg-amber-500/5 p-1 rounded text-center border border-amber-500/10 mt-1">
                            {activeEntity.taxes.status}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeEntity.customs && (
                      <div className="glass-panel rounded-xl p-3.5 space-y-2">
                        <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-500" /> Митна діяльність
                        </span>
                        <div className="space-y-1 text-[11px] font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Обсяг імпорту:</span>
                            <span className="text-indigo-400 font-bold">{activeEntity.customs.importVolume}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-500 font-sans">Партнери:</span>
                            <span className="truncate max-w-[120px]" title={activeEntity.customs.mainPartners.join(', ')}>
                              {activeEntity.customs.mainPartners[0]}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 bg-slate-950 p-1 rounded text-center border border-slate-900 truncate mt-1">
                            Вантаж: {activeEntity.customs.lastCargo}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Courts / Litigation history (Section 13) */}
              {activeEntity.courts && (
                <div className="glass-panel rounded-xl p-3.5 space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center justify-between">
                    <span>СУДОВИЙ РЕЄСТР</span>
                    <span className="text-red-400 font-bold font-mono text-[10px]">{activeEntity.courts.criminalCases} КРИМІНАЛ / {activeEntity.courts.totalCases} ВСЬОГО</span>
                  </span>
                  
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                    <p className="text-[10px] font-semibold text-slate-200 line-clamp-2 leading-relaxed">
                      {activeEntity.courts.lastCaseTitle}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-500 font-mono">
                      <span>Дата ухвали: {activeEntity.courts.lastCaseDate}</span>
                      <span className="text-indigo-400 hover:underline cursor-pointer">Переглянути справу →</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sanctions details */}
              {activeEntity.sanctions && (
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3.5 space-y-2">
                  <span className="text-[9px] text-red-400 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> ВІДОМОСТІ ПРО САНКЦІЇ
                  </span>
                  <div className="text-[11px] space-y-1">
                    <p className="text-slate-300 leading-relaxed font-semibold">
                      Реєстр: {activeEntity.sanctions.listName}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Причина: {activeEntity.sanctions.reason}
                    </p>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
                      <span>Додано: {activeEntity.sanctions.dateAdded}</span>
                      <span>Орган: {activeEntity.sanctions.authority}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Contact / address list */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Адреса та контакти реєстрації</span>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-900 text-[11px] text-slate-300 font-mono space-y-1">
                  <p className="flex justify-between">
                    <span className="text-slate-500 shrink-0 mr-3">Адреса:</span>
                    <span className="text-right leading-relaxed text-slate-200">{activeEntity.address}</span>
                  </p>
                  {activeEntity.phone && (
                    <p className="flex justify-between">
                      <span className="text-slate-500">Телефон:</span>
                      <span className="text-slate-200">
                        {userRole === 'predator' ? "🔒 +380 (XX) XXX-XX-XX" : activeEntity.phone}
                      </span>
                    </p>
                  )}
                  {activeEntity.email && (
                    <p className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-200 hover:text-indigo-400 cursor-pointer">
                        {userRole === 'predator' ? "🔒 xxxxxxx@xxxx.gov.ua" : activeEntity.email}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Social Media & Telegram Data */}
              {activeEntity.socialMediaProfiles && activeEntity.socialMediaProfiles.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] text-indigo-400/80 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5"/> Соціальні мережі
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeEntity.socialMediaProfiles.map((sm, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-indigo-900/30 text-[11px] font-mono space-y-1 hover:border-indigo-500/50 transition-colors">
                        <div className="flex justify-between items-center text-slate-300 font-bold">
                          <span>{sm.platform}</span>
                          <span className="text-[9px] text-slate-500">{sm.profileName}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{sm.note}</p>
                        <a href={sm.url} target="_blank" rel="noreferrer" className="text-[9px] text-indigo-400 hover:underline block pt-1 border-t border-slate-900 mt-1.5 truncate">
                          Відкрити: {sm.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeEntity.telegramData && activeEntity.telegramData.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] text-sky-400/80 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5"/> Telegram моніторинг
                  </span>
                  <div className="grid gap-2">
                    {activeEntity.telegramData.map((tg, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-3 rounded-lg border border-sky-900/30 text-[11px] font-mono hover:border-sky-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-900">
                          <span className="font-bold text-sky-300">@{tg.channelName}</span>
                          <span className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                            {tg.subscribers}
                          </span>
                        </div>
                        {tg.posts && tg.posts.length > 0 ? (
                          <ul className="space-y-2 mt-2">
                            {tg.posts.map((post, pIdx) => (
                              <li key={pIdx} className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed border-l-2 border-sky-500/30 pl-2">
                                {post}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[10px] text-slate-500">Немає доступних повідомлень (можливо приватна група)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeEntity.cryptoData && (
                <div className="space-y-1">
                  <span className="text-[9px] text-amber-400/80 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                    <Bitcoin className="w-3.5 h-3.5"/> Крипто-активи
                  </span>
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-amber-900/30 font-mono hover:border-amber-500/50 transition-colors">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-900">
                      <span className="text-[10px] text-slate-400 break-all">{activeEntity.cryptoData.address}</span>
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {activeEntity.cryptoData.balance_btc !== undefined ? `${activeEntity.cryptoData.balance_btc.toFixed(4)} BTC` : 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Отримано всього:</span>
                        <span className="font-bold">{activeEntity.cryptoData.total_received_btc !== undefined ? `${activeEntity.cryptoData.total_received_btc.toFixed(4)} BTC` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Транзакцій:</span>
                        <span className="font-bold">{activeEntity.cryptoData.n_tx !== undefined ? activeEntity.cryptoData.n_tx : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEntity.leakData && (
                <div className="space-y-1">
                  <span className="text-[9px] text-rose-500/80 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                    <FileWarning className="w-3.5 h-3.5"/> Реєстр витоків
                  </span>
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-rose-900/30 hover:border-rose-500/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold text-slate-200">Email: {activeEntity.leakData.email}</span>
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> Знайдено у {activeEntity.leakData.total_breaches} базах
                      </span>
                    </div>
                    {activeEntity.leakData.exposed_data_types && activeEntity.leakData.exposed_data_types.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[9px] text-slate-500 font-mono block mb-1">Скомпрометовані дані:</span>
                        <div className="flex flex-wrap gap-1">
                          {activeEntity.leakData.exposed_data_types.map((dt, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-900 text-rose-300/80 px-1.5 py-0.5 rounded border border-rose-900/50">
                              {dt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeEntity.leakData.records && activeEntity.leakData.records.length > 0 && (
                      <ul className="mt-3 space-y-2 border-t border-slate-900 pt-2">
                        {activeEntity.leakData.records.slice(0, 5).map((rec, idx) => (
                          <li key={idx} className="text-[10px] text-slate-400 font-mono">
                            <div className="truncate"><span className="text-rose-500/70 mr-1">•</span> {rec.title || rec.name || rec.breach_excerpt || "Невідоме джерело"}</div>
                            {(rec.password_hash || rec.ip_address) && (
                              <div className="flex flex-col gap-0.5 mt-1 ml-3 p-1.5 bg-slate-950/50 rounded border border-rose-900/20">
                                {rec.password_hash && <div className="text-rose-400/80 truncate font-bold text-[9px]">Hash: {rec.password_hash}</div>}
                                {rec.ip_address && <div className="text-blue-400/80 flex items-center gap-1 font-bold text-[9px]"><Server className="w-2.5 h-2.5"/> IP: {rec.ip_address}</div>}
                                {rec.breach_date && <div className="text-slate-500 text-[9px]">Date: {rec.breach_date}</div>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

                </div>
              )}

              {activeEntity.type === 'person' && activePersonTab === 'family' && activeEntity.familyTies && (
                    <div className="space-y-2 animate-fade-in">
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Близьке оточення / Родина</span>
                      <div className="grid gap-2">
                        {activeEntity.familyTies.map((member, idx) => (
                          <div key={idx} className="glass-panel rounded-xl p-3 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-200 font-bold text-[11px]">{member.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${member.risk === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : member.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>{member.risk} Risk</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                              <span><strong className="text-slate-500">Зв'язок:</strong> {member.relation}</span>
                              <span><strong className="text-slate-500">Статус:</strong> {member.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
              )}

              {activeEntity.type === 'person' && activePersonTab === 'assets' && activeEntity.assets && (
                    <div className="space-y-2 animate-fade-in">
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Капітал та Власність</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {activeEntity.assets.map((asset, idx) => (
                          <div key={idx} className="glass-panel rounded-xl p-3 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between">
                                <span className="text-indigo-400 font-bold text-[10px] uppercase font-mono">{asset.type}</span>
                                <span className="text-emerald-400 font-bold text-[10px] font-mono">{asset.estimatedValue}</span>
                              </div>
                              <p className="text-slate-300 text-[10px] mt-1.5 line-clamp-2">{asset.description}</p>
                            </div>
                            <div className="mt-2 text-[9px] text-slate-500 font-mono border-t border-slate-900 pt-1.5">
                              Власність: {asset.ownership}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
              )}

              {activeEntity.type === 'person' && activePersonTab === 'psychology' && activeEntity.psychologicalPortrait && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-emerald-900/30">
                        <span className="text-[9px] text-emerald-500/70 font-mono font-bold uppercase tracking-widest block mb-1.5">Резюме профілю</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{activeEntity.psychologicalPortrait.summary}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Ключові риси</span>
                          <ul className="list-disc list-inside text-[10px] text-slate-300 space-y-1 ml-1">
                            {activeEntity.psychologicalPortrait.characteristics.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Вразливості</span>
                          <ul className="list-disc list-inside text-[10px] text-rose-300/80 space-y-1 ml-1">
                            {activeEntity.psychologicalPortrait.vulnerabilities.map((v, i) => <li key={i}>{v}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
              )}

              {activeEntity.type === 'person' && activePersonTab === 'compromat' && activeEntity.compromat && (
                    <div className="space-y-2 animate-fade-in">
                      <span className="text-[9px] text-rose-500/70 font-mono font-bold uppercase tracking-widest block flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> РЕЄСТР ІНЦИДЕНТІВ</span>
                      <div className="space-y-3">
                        {activeEntity.compromat.map((comp, idx) => (
                          <div key={idx} className={`bg-slate-950/60 border rounded-xl p-3 ${comp.severity === 'CRITICAL' ? 'border-rose-500/40' : 'border-slate-800'}`}>
                            <div className="flex justify-between items-start mb-1.5">
                              <h4 className="text-[11px] font-bold text-slate-200">{comp.summary}</h4>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${comp.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {comp.severity}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{comp.details}</p>
                            <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5 bg-slate-900/50 p-1.5 rounded mt-2">
                              <ShieldAlert className="w-3 h-3 text-slate-600"/> Джерело: {comp.source}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
              )}
              
              {activeEntity.type === 'person' && activePersonTab === 'interpol' && (
                    <div className="space-y-3 animate-fade-in">
                      <span className="text-[9px] text-red-500/70 font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5"/> БАЗА ДАНИХ ІНТЕРПОЛУ
                      </span>
                      {activeEntity.interpol ? (
                        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-slate-200">Статус: <span className="text-red-400">{activeEntity.interpol.status}</span></span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-red-500/20 text-red-400">РІВЕНЬ: {activeEntity.interpol.riskLevel}</span>
                          </div>
                          <p className="text-[10px] text-slate-300 mb-2">{activeEntity.interpol.details}</p>
                          <div className="flex gap-2 mb-2">
                            {activeEntity.interpol.notices.map((notice: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-red-600/30 text-red-300 border border-red-500/50 rounded-sm text-[9px] font-bold">{notice} NOTICE</span>
                            ))}
                          </div>
                          <div className="text-[9px] text-slate-500 mt-2 font-mono">Остання фіксація: {activeEntity.interpol.lastSpotted}</div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Даних у базах Інтерполу не знайдено.</p>
                      )}
                    </div>
              )}

              {activeEntity.type === 'person' && activePersonTab === 'cyber' && (
                    <div className="space-y-3 animate-fade-in">
                      <span className="text-[9px] text-indigo-400/70 font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5"/> КІБЕРПРОФІЛЬ ТА ДАРКНЕТ
                      </span>
                      {activeEntity.cyber ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                            <h4 className="text-[10px] text-slate-400 font-bold mb-2">Зв'язані Email / Акаунти</h4>
                            <ul className="space-y-1">
                              {activeEntity.cyber.knownEmails?.map((email: string, i: number) => (
                                <li key={i} className="text-[10px] text-indigo-300 font-mono flex items-center gap-1.5"><Mail className="w-3 h-3"/> {email}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                            <h4 className="text-[10px] text-slate-400 font-bold mb-2">Активність у Даркнеті</h4>
                            <div className="text-[20px] font-bold text-rose-400 font-mono">{activeEntity.cyber.darkwebMentions} <span className="text-[10px] text-slate-500 uppercase">згадок</span></div>
                            <div className="text-[9px] text-slate-500 mt-2">Остання активність: {activeEntity.cyber.lastActive}</div>
                          </div>
                          <div className="col-span-1 md:col-span-2 bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                            <h4 className="text-[10px] text-slate-400 font-bold mb-2">Участь у витоках даних (Breaches)</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {activeEntity.cyber.breaches?.map((breach: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono border border-slate-700">{breach}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Кібер-активності не виявлено.</p>
                      )}
                    </div>
              )}

              {activeEntity.type === 'person' && activePersonTab === 'leaks' && (
                    <div className="space-y-3 animate-fade-in">
                      <span className="text-[9px] text-orange-400/70 font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                        <Database className="w-3.5 h-3.5"/> ВИТОКИ ДАНИХ (LEAKS)
                      </span>
                      {activeEntity.leaks && activeEntity.leaks.length > 0 ? (
                        <div className="space-y-2">
                          {activeEntity.leaks.map((leak: any, idx: number) => (
                            <div key={idx} className="bg-slate-950/50 border border-orange-900/30 rounded-xl p-3 hover:bg-slate-900/50 transition-colors">
                              <div className="flex justify-between items-start mb-1.5">
                                <h4 className="text-[11px] font-bold text-orange-300">{leak.title}</h4>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${leak.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : leak.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{leak.severity}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mb-2">{leak.description}</p>
                              <div className="text-[9px] text-slate-500 font-mono">Дата: {leak.date}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Відсутня інформація у відомих витоках даних.</p>
                      )}
                    </div>
              )}

              {activeEntity.type === 'person' && activePersonTab === 'timeline' && (
                    <div className="space-y-3 animate-fade-in">
                      <span className="text-[9px] text-cyan-400/70 font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5"/> ХРОНОЛОГІЧНА ШКАЛА ПОДІЙ
                        {isTimelineLoading && <Loader2 className="w-3 h-3 text-cyan-500 animate-spin" />}
                        {!isTimelineLoading && timelineData && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span></span>}
                      </span>
                      
                      {(() => {
                        const sourceEvents = timelineData?.timeline || activeEntity.timeline || [];
                        const events = [...sourceEvents].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        if (events.length === 0) return <p className="text-[10px] text-slate-500 italic">Немає хронологічних даних для цього об'єкта.</p>;
                        
                        const getSeverityStyle = (s: string) => {
                          switch(s) {
                            case 'CRITICAL': return { dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]', line: 'border-rose-500/40', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
                            case 'HIGH': return { dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', line: 'border-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
                            case 'MEDIUM': return { dot: 'bg-yellow-500', line: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
                            case 'LOW': return { dot: 'bg-slate-500', line: 'border-slate-600', text: 'text-slate-400', badge: 'bg-slate-800 text-slate-400 border-slate-700' };
                            default: return { dot: 'bg-cyan-500', line: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
                          }
                        };

                        return (
                          <div className="relative pl-6">
                            <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-cyan-500/40 via-slate-700/30 to-rose-500/40"></div>
                            
                            {events.map((evt, idx) => {
                              const style = getSeverityStyle(evt.severity);
                              return (
                                <div key={idx} className="relative mb-4 last:mb-0 group">
                                  <div className={`absolute -left-6 top-1 w-[20px] h-[20px] rounded-full border-2 border-slate-950 ${style.dot} z-10 flex items-center justify-center transition-transform group-hover:scale-125`}>
                                    <div className="w-1.5 h-1.5 bg-white/70 rounded-full"></div>
                                  </div>
                                  <div className={`bg-slate-950/70 border ${style.line} rounded-xl p-3 hover:bg-slate-900/50 transition-colors`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className={`text-[10px] font-bold font-mono ${style.text}`}>
                                        {new Date(evt.date).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
                                      </span>
                                      <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${style.badge}`}>
                                        {evt.severity}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-200 leading-relaxed">{evt.event}</p>
                                    <div className="mt-1.5 text-[9px] text-slate-500 font-mono flex items-center gap-1">
                                      <Database className="w-2.5 h-2.5"/> Джерело: {evt.source}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* AI Профілювання */}
                      <div className="mt-6 bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/20 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Cpu className="w-4 h-4 text-indigo-400"/>
                          <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest">AI Профілювання (Аналітичний висновок)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">{activeEntity.aiRecommendations}</p>
                        <div className="flex gap-2 mt-3 pt-2 border-t border-indigo-900/30">
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">AutoML Risk: {activeEntity.riskScore}</span>
                          <span className="text-[8px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">Модель: Predator DIE v57.0</span>
                        </div>
                      </div>
                    </div>
              )}

            </div>
          </div>
        </div>

        
  );
};
