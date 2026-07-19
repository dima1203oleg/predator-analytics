import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Update state type
content = content.replace("useState<'general' | 'family' | 'assets' | 'psychology' | 'compromat'>('general')", "useState<'general' | 'family' | 'assets' | 'psychology' | 'compromat' | 'medical'>('general')")

# Add lucide import (Stethoscope)
if "Stethoscope" not in content:
    content = content.replace("from 'lucide-react';", "  Stethoscope,\n} from 'lucide-react';")

# Add button
button_old = """                    <button 
                      onClick={() => setActivePersonTab('compromat')}"""

button_new = """                    <button 
                      onClick={() => setActivePersonTab('medical')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-colors flex items-center gap-1.5 ${activePersonTab === 'medical' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-900 text-slate-400 border border-transparent hover:bg-slate-800'}`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" /> МЕДИЧНИЙ
                    </button>
                    <button 
                      onClick={() => setActivePersonTab('compromat')}"""

content = content.replace(button_old, button_new)

# Add tab content
tab_content = """              {activeEntity.type === 'person' && activePersonTab === 'medical' && activeEntity.medicalProfile && (
                    <div className="space-y-2 animate-fade-in">
                      <span className="text-[9px] text-sky-500/70 font-mono font-bold uppercase tracking-widest block flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5"/> БІОМЕТРИЧНИЙ ТА МЕДИЧНИЙ ПРОФІЛЬ</span>
                      <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-2 border-b border-slate-900 pb-2">
                          <div>
                            <span className="text-slate-400 text-[10px] font-mono block">Клінічний висновок (Копрограма)</span>
                            <span className="text-slate-200 text-[11px] font-bold">{activeEntity.medicalProfile.coprogram}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-[10px] font-mono block">Кількість яєць глистів</span>
                            <span className="text-emerald-400 text-[14px] font-bold font-mono">{activeEntity.medicalProfile.wormEggsCount}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{activeEntity.medicalProfile.summary}</p>
                        <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between bg-slate-900/50 p-1.5 rounded mt-2">
                          <span>Останній медогляд: {activeEntity.medicalProfile.lastCheckup}</span>
                        </div>
                      </div>
                    </div>
              )}"""

if "activePersonTab === 'medical'" not in content:
    content = content.replace("              {activeEntity.type === 'person' && activePersonTab === 'compromat'", tab_content + "\n\n              {activeEntity.type === 'person' && activePersonTab === 'compromat'")

with open(filepath, 'w') as f:
    f.write(content)

print("Medical UI tab added")
