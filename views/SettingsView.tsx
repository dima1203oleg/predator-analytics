
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { 
  Settings, Shield, Server, Save, RefreshCw, 
  ToggleLeft, ToggleRight, CheckCircle2, Cpu, HardDrive, 
  Zap, DollarSign, Lock, AlertOctagon, 
  Thermometer, Brain, Layers, Database, ScrollText, Cloud, 
  ShieldAlert, Bot, Globe, Languages, UploadCloud, Trash2,
  Calculator, Stethoscope, Check, XCircle, Activity, Scale,
  Satellite, Radio, FileCheck, Clock, Mic, Play, Volume2, ShieldCheck, Key, Palette, Image, LayoutTemplate,
  Gauge, Eye, EyeOff, Building2, Briefcase, Microscope, MessageSquare, Info, Terminal, CreditCard, PieChart,
  Newspaper, Mail, Send, Users, UserPlus, Fingerprint, History, Network, Shuffle
} from 'lucide-react';
import { AgentConfig, IntegrationSecret, AdvancedLLMProvider, AgentModelMapping } from '../types';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, Pie as RechartsPie, PieChart as RechartsPieChart, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';

type SettingsTab = 'SYSTEM' | 'HARDWARE' | 'AGENTS' | 'UPDATES' | 'SPECS' | 'LOCALIZATION' | 'BUDGET' | 'DIAGNOSTICS' | 'COMPLIANCE' | 'VOICE' | 'BRANDING' | 'GAZETTE' | 'USERS' | 'LLM_ROUTER';

const MOCK_USERS = [
    { id: 1, name: 'Дмитро Кізима', email: 'root@predator.system', role: 'OWNER', status: 'ACTIVE', mfa: true, lastLogin: 'Just now', ip: '192.168.1.5' },
    { id: 2, name: 'Олексій Аналітик', email: 'alex@predator.system', role: 'ANALYST', status: 'ACTIVE', mfa: true, lastLogin: '2h ago', ip: '10.42.0.88' },
    { id: 3, name: 'Клієнт "АгроХолдинг"', email: 'client@agro.com', role: 'VIEWER', status: 'ACTIVE', mfa: false, lastLogin: '1d ago', ip: '45.22.11.9' },
    { id: 4, name: 'Guest Demo', email: 'guest@predator.system', role: 'VIEWER', status: 'LOCKED', mfa: false, lastLogin: '14d ago', ip: '88.12.44.1' },
];

// --- MOCK DATA FOR ROUTER ---
const INITIAL_PROVIDERS: AdvancedLLMProvider[] = [
    { 
        id: 'google', name: 'Google Vertex AI', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-3-ultra'], 
        strategy: 'ROUND_ROBIN', 
        accounts: [
            { id: 'acc1', name: 'Project Alpha', maskedKey: 'AIzaSy...7d9', status: 'ACTIVE', usage: 45 },
            { id: 'acc2', name: 'Project Beta', maskedKey: 'AIzaSy...9a2', status: 'ACTIVE', usage: 12 },
            { id: 'acc3', name: 'Backup Key', maskedKey: 'AIzaSy...x11', status: 'RATE_LIMITED', usage: 98 }
        ]
    },
    { 
        id: 'openai', name: 'OpenAI Platform', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'], 
        strategy: 'LEAST_USED', 
        accounts: [
            { id: 'oa1', name: 'Main Org', maskedKey: 'sk-proj...992', status: 'ACTIVE', usage: 60 }
        ]
    },
    { 
        id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet'], 
        strategy: 'PRIORITY', 
        accounts: [
            { id: 'ant1', name: 'Primary', maskedKey: 'sk-ant...551', status: 'ACTIVE', usage: 30 }
        ]
    }
];

const INITIAL_AGENT_MAPPING: AgentModelMapping[] = [
    { agentId: 'AG-LAW', agentName: 'Юридичний Аналітик', mode: 'MANUAL', selectedModel: 'claude-3-opus' },
    { agentId: 'AG-CODE', agentName: 'DevOps Кодер', mode: 'AUTO' },
    { agentId: 'AG-FAST', agentName: 'Швидкий Пошук', mode: 'MANUAL', selectedModel: 'gemini-1.5-flash' },
];

const SettingsView: React.FC = () => {
  const metrics = useSystemMetrics();
  const [activeTab, setActiveTab] = useState<SettingsTab>('SYSTEM');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  
  // Router State
  const [providers, setProviders] = useState<AdvancedLLMProvider[]>(INITIAL_PROVIDERS);
  const [agentMapping, setAgentMapping] = useState<AgentModelMapping[]>(INITIAL_AGENT_MAPPING);
  const [newKey, setNewKey] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // ... (Existing States)
  
  // Hardware State
  const [etlEngine, setEtlEngine] = useState<'PANDAS' | 'POLARS'>('POLARS');
  const [coreUsage, setCoreUsage] = useState<number[]>(Array(20).fill(0)); 

  // Branding State
  const [brandName, setBrandName] = useState('Predator Analytics');
  const [brandColor, setBrandColor] = useState('#f59e0b');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // ... (Other states)

  // Handlers for Router
  const addAccount = (providerId: string) => {
      if(!newKey) return;
      setProviders(prev => prev.map(p => {
          if (p.id === providerId) {
              return {
                  ...p,
                  accounts: [...p.accounts, {
                      id: `acc-${Date.now()}`,
                      name: `Account ${p.accounts.length + 1}`,
                      maskedKey: newKey.substring(0, 6) + '...' + newKey.substring(newKey.length - 4),
                      status: 'ACTIVE',
                      usage: 0
                  }]
              };
          }
          return p;
      }));
      setNewKey('');
      setSelectedProviderId(null);
  };

  const removeAccount = (providerId: string, accountId: string) => {
      setProviders(prev => prev.map(p => {
          if (p.id === providerId) {
              return { ...p, accounts: p.accounts.filter(a => a.id !== accountId) };
          }
          return p;
      }));
  };

  const updateStrategy = (providerId: string, strategy: AdvancedLLMProvider['strategy']) => {
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, strategy } : p));
  };

  const updateAgentMapping = (agentId: string, updates: Partial<AgentModelMapping>) => {
      setAgentMapping(prev => prev.map(m => m.agentId === agentId ? { ...m, ...updates } : m));
  };

  const renderLLMRouter = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          {/* PROVIDERS CONFIG */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {providers.map(provider => (
                  <TacticalCard key={provider.id} title={`${provider.name} Configuration`} className="panel-3d">
                      <div className="space-y-4">
                          <div className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800">
                              <span className="text-xs text-slate-400 font-bold uppercase">Стратегія Ротації:</span>
                              <select 
                                value={provider.strategy}
                                onChange={(e) => updateStrategy(provider.id, e.target.value as any)}
                                className="bg-slate-950 border border-slate-700 rounded text-xs text-white p-1"
                              >
                                  <option value="ROUND_ROBIN">Round Robin (Рівномірно)</option>
                                  <option value="LEAST_USED">Least Used (Баланс)</option>
                                  <option value="PRIORITY">Priority (По порядку)</option>
                              </select>
                          </div>

                          <div className="space-y-2">
                              {provider.accounts.map(acc => (
                                  <div key={acc.id} className="flex justify-between items-center p-2 rounded bg-slate-950/50 border border-slate-800 hover:border-slate-600 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${acc.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                          <div>
                                              <div className="text-xs font-bold text-slate-200">{acc.name}</div>
                                              <div className="text-[10px] text-slate-500 font-mono">{acc.maskedKey}</div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <div className="flex flex-col items-end">
                                              <span className="text-[9px] text-slate-500">Usage</span>
                                              <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                                  <div className={`h-full ${acc.usage > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${acc.usage}%`}}></div>
                                              </div>
                                          </div>
                                          <button onClick={() => removeAccount(provider.id, acc.id)} className="text-slate-600 hover:text-red-400">
                                              <Trash2 size={14}/>
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          {selectedProviderId === provider.id ? (
                              <div className="flex gap-2 animate-in slide-in-from-top-2">
                                  <input 
                                    type="text" 
                                    placeholder="sk-..." 
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white outline-none focus:border-primary-500"
                                  />
                                  <button onClick={() => addAccount(provider.id)} className="px-3 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-500">Add</button>
                                  <button onClick={() => setSelectedProviderId(null)} className="px-3 bg-slate-800 text-slate-400 rounded text-xs hover:text-white">Cancel</button>
                              </div>
                          ) : (
                              <button 
                                onClick={() => setSelectedProviderId(provider.id)}
                                className="w-full py-2 border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 rounded text-xs font-bold transition-all"
                              >
                                  + Додати API Ключ
                              </button>
                          )}
                      </div>
                  </TacticalCard>
              ))}
          </div>

          {/* AGENT MAPPING */}
          <TacticalCard title="Матриця Призначення Моделей (Agent Assignment)" className="panel-3d">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-800 bg-slate-900/50">
                              <th className="p-3">Агент</th>
                              <th className="p-3">Режим</th>
                              <th className="p-3">Модель (Пріоритет)</th>
                              <th className="p-3">Статус</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs">
                          {agentMapping.map(map => (
                              <tr key={map.agentId} className="hover:bg-slate-900/50">
                                  <td className="p-3 font-bold text-slate-200">{map.agentName} <span className="text-slate-500 font-mono font-normal">({map.agentId})</span></td>
                                  <td className="p-3">
                                      <div className="flex bg-slate-950 rounded p-1 border border-slate-800 w-fit">
                                          <button 
                                            onClick={() => updateAgentMapping(map.agentId, { mode: 'AUTO' })}
                                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${map.mode === 'AUTO' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                          >
                                              AUTO
                                          </button>
                                          <button 
                                            onClick={() => updateAgentMapping(map.agentId, { mode: 'MANUAL' })}
                                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${map.mode === 'MANUAL' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                          >
                                              MANUAL
                                          </button>
                                      </div>
                                  </td>
                                  <td className="p-3">
                                      {map.mode === 'MANUAL' ? (
                                          <select 
                                            value={map.selectedModel}
                                            onChange={(e) => updateAgentMapping(map.agentId, { selectedModel: e.target.value })}
                                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none"
                                          >
                                              {providers.flatMap(p => p.models).map(m => <option key={m} value={m}>{m}</option>)}
                                          </select>
                                      ) : (
                                          <span className="text-purple-400 italic flex items-center gap-1"><Shuffle size={12}/> Динамічний вибір Арбітром</span>
                                      )}
                                  </td>
                                  <td className="p-3">
                                      <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> Ready</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </TacticalCard>
      </div>
  );

  // ... (Existing render functions: renderHardware, renderBranding, renderSpecs, renderDiagnostics, renderVoice, renderAgents, renderBudget, renderLocalization, renderGazette, renderUsers)

  const handleSave = () => {
      if (saveStatus === 'SAVING') return;
      setSaveStatus('SAVING');
      // Simulate API Save
      setTimeout(() => {
          setSaveStatus('SAVED');
          setTimeout(() => setSaveStatus('IDLE'), 2000);
      }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-1 mb-6 overflow-x-auto scrollbar-hide">
          {[
              { id: 'SYSTEM', icon: <Settings size={14}/>, label: 'Система' },
              { id: 'LLM_ROUTER', icon: <Network size={14}/>, label: 'LLM Роутер' }, // NEW TAB
              { id: 'USERS', icon: <Users size={14}/>, label: 'Користувачі' },
              { id: 'AGENTS', icon: <Bot size={14}/>, label: 'Агенти' },
              // ... other tabs ...
          ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`px-4 py-2 rounded-t-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap btn-3d ${
                    activeTab === tab.id 
                    ? 'bg-slate-800 text-white border-t border-x border-slate-700 shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border-transparent'
                }`}
              >
                  {tab.icon} {tab.label}
              </button>
          ))}
      </div>

      {activeTab === 'SYSTEM' && (<div>System Settings Placeholder (Use existing renderSpecs)</div>)} 
      {activeTab === 'LLM_ROUTER' && renderLLMRouter()}
      {/* ... other tab renders ... */}

      {/* Save Button */}
      <div className="fixed bottom-6 right-6 z-40 mb-safe mr-safe">
          <button 
            onClick={handleSave}
            className={`
                px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 transition-all border border-white/10 backdrop-blur-md btn-3d
                ${saveStatus === 'IDLE' ? 'bg-primary-600 hover:bg-primary-500 text-white hover:scale-105 btn-3d-blue' : ''}
                ${saveStatus === 'SAVING' ? 'bg-yellow-500 text-slate-900 cursor-wait btn-3d-amber' : ''}
                ${saveStatus === 'SAVED' ? 'bg-green-500 text-white btn-3d-green' : ''}
            `}
          >
              {saveStatus === 'IDLE' && <><Save size={20} /> ЗБЕРЕГТИ ЗМІНИ</>}
              {saveStatus === 'SAVING' && <><RefreshCw size={20} className="animate-spin" /> ЗБЕРЕЖЕННЯ...</>}
              {saveStatus === 'SAVED' && <><CheckCircle2 size={20} /> УСПІШНО!</>}
          </button>
      </div>
    </div>
  );
};

export default SettingsView;
