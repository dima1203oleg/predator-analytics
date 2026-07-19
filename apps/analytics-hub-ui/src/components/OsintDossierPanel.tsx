import React, { useState } from 'react';
import { 
  User, Users, Wallet, Brain, Stethoscope, AlertCircle, 
  AlertTriangle, ShieldAlert, DollarSign, Truck, 
  Briefcase, Landmark, Hash, Globe, Server, Shield
} from 'lucide-react';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';

export const OsintDossierPanel: React.FC<{
  activeEntity: OsintEntity;
  userRole: string;
  onSelectEntityForInspector: (entity: OsintEntity) => void;
}> = ({ activeEntity, userRole, onSelectEntityForInspector }) => {
  const [activePersonTab, setActivePersonTab] = useState<'general' | 'family' | 'assets' | 'psychology' | 'medical' | 'compromat' | 'cyber' | 'interpol' | 'leaks'>('general');

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

  return (
        <div className="xl:col-span-4 space-y-6" id="osint-dossier-panel">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
            
            {/* Dossier Header */}
            <div className="p-5 border-b border-slate-900 bg-slate-950/60 relative">
              <div className="absolute right-4 top-4 flex items-center gap-2">
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
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
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
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
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
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
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

                </div>
              )}

              {activeEntity.type === 'person' && activePersonTab === 'family' && activeEntity.familyTies && (
                    <div className="space-y-2 animate-fade-in">
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Близьке оточення / Родина</span>
                      <div className="grid gap-2">
                        {activeEntity.familyTies.map((member, idx) => (
                          <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex flex-col gap-1">
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
                          <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex flex-col justify-between">
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

            </div>
          </div>
        </div>

        
  );
};
