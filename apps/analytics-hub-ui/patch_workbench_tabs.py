import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx'
with open(filepath, 'r') as f:
    content = f.read()

target1 = "              {/* Description */}"
replacement1 = """              {/* Conditional: Person Tabs Navigation */}
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
                      onClick={() => setActivePersonTab('compromat')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'compromat' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> КОМПРОМАТ
                    </button>
                  </div>
              )}

              {(activeEntity.type !== 'person' || activePersonTab === 'general') && (
                <div className="space-y-5 animate-fade-in">
              {/* Description */}"""

content = content.replace(target1, replacement1)


target2 = """            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Link Graph & Cargo Routes Visualizers (Section 14 & 15) */}"""

replacement2 = """                </div>
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

        {/* Right Column: Dynamic Link Graph & Cargo Routes Visualizers (Section 14 & 15) */}"""

content = content.replace(target2, replacement2)

with open(filepath, 'w') as f:
    f.write(content)
print("Updated UI using string replace.")
