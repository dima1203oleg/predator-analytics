import React, { useState } from 'react';
import { Shield, Search, Server, AlertTriangle, CheckCircle, Database, Globe, Network, Activity, ChevronRight, XCircle } from 'lucide-react';

interface DossierCompilerProps {
  onDossierComplete?: (dossierData: any) => void;
}

export const DossierCompiler: React.FC<DossierCompilerProps> = ({ onDossierComplete }) => {
  const [identifier, setIdentifier] = useState('');
  const [entityType, setEntityType] = useState('person');
  const [levels, setLevels] = useState({
    WHITE: true,
    GREY: true,
    BLACK: false
  });
  
  const [status, setStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startCompilation = async () => {
    if (!identifier) return;
    
    setStatus('compiling');
    setProgress(10);
    setLogs([]);
    addLog('Ініціалізація Deep Intelligence Engine...');
    addLog(`Ціль: ${identifier} (${entityType})`);
    
    const activeLevels = Object.entries(levels)
      .filter(([_, active]) => active)
      .map(([level]) => level);
      
    addLog(`Рівні доступу: ${activeLevels.join(', ')}`);

    try {
      // Симуляція прогресу поки йде запит
      const progressInterval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 5 : p));
      }, 500);

      // Виклик API
      const response = await fetch('/api/v1/dossier/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Додаємо токен якщо є автентифікація
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          entity_type: entityType,
          identifier: identifier,
          name: identifier, // Для спрощення передаємо як ім'я
          classification_levels: activeLevels
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Помилка API: ${response.status}`);
      }

      const data = await response.json();
      
      setProgress(100);
      setStatus('success');
      setResult(data);
      addLog(`✅ Компіляцію завершено. Знайдено ${data.total_records_found || 0} записів.`);
      addLog(`Рівень ризику: ${data.risk_assessment?.risk_level || 'UNKNOWN'}`);
      
      if (onDossierComplete) {
        onDossierComplete(data);
      }
    } catch (err: any) {
      setStatus('error');
      addLog(`❌ Помилка: ${err.message}`);
    }
  };

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 shadow-2xl text-white">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
        <div className="bg-red-500/20 p-2 rounded-lg">
          <Shield className="text-red-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-wider">DEEP INTELLIGENCE ENGINE</h2>
          <p className="text-gray-400 text-sm">Мультивекторна компіляція досьє</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Панель керування */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Тип цілі</label>
              <select 
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-700 rounded p-2 text-white focus:border-red-500 focus:outline-none transition-colors"
                disabled={status === 'compiling'}
              >
                <option value="person">Фізична особа</option>
                <option value="company">Юридична особа</option>
                <option value="crypto_wallet">Крипто-гаманець</option>
                <option value="phone">Телефон</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Ідентифікатор (ПІБ, ЄДРПОУ, ІПН...)</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Введіть дані для пошуку..."
                className="w-full bg-[#1A1A1A] border border-gray-700 rounded p-2 text-white focus:border-red-500 focus:outline-none transition-colors"
                disabled={status === 'compiling'}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Рівні сканування</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 bg-[#1A1A1A] border border-gray-800 rounded cursor-pointer hover:border-gray-600 transition-colors">
                  <input type="checkbox" checked={levels.WHITE} onChange={(e) => setLevels({...levels, WHITE: e.target.checked})} disabled={status === 'compiling'} className="accent-blue-500" />
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>WHITE (Публічні реєстри)</span>
                </label>
                <label className="flex items-center gap-3 p-2 bg-[#1A1A1A] border border-gray-800 rounded cursor-pointer hover:border-gray-600 transition-colors">
                  <input type="checkbox" checked={levels.GREY} onChange={(e) => setLevels({...levels, GREY: e.target.checked})} disabled={status === 'compiling'} className="accent-yellow-500" />
                  <Globe className="w-4 h-4 text-yellow-400" />
                  <span>GREY (OSINT / ЗМІ / Соцмережі)</span>
                </label>
                <label className="flex items-center gap-3 p-2 bg-[#1A1A1A] border border-gray-800 rounded cursor-pointer hover:border-gray-600 transition-colors">
                  <input type="checkbox" checked={levels.BLACK} onChange={(e) => setLevels({...levels, BLACK: e.target.checked})} disabled={status === 'compiling'} className="accent-red-500" />
                  <Network className="w-4 h-4 text-red-400" />
                  <span>BLACK (Даркнет / Витоки / Інтерпол)</span>
                </label>
              </div>
            </div>

            <button
              onClick={startCompilation}
              disabled={!identifier || status === 'compiling'}
              className={`w-full py-3 rounded font-medium flex items-center justify-center gap-2 transition-all ${
                status === 'compiling' 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]'
              }`}
            >
              {status === 'compiling' ? (
                <><Activity className="w-5 h-5 animate-pulse" /> КОМПІЛЯЦІЯ...</>
              ) : (
                <><Search className="w-5 h-5" /> ЗАПУСТИТИ DIE</>
              )}
            </button>
          </div>
        </div>

        {/* Консоль / Результати */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-[400px]">
          <div className="bg-black border border-gray-800 rounded-t p-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono flex items-center gap-2">
              <Server className="w-3 h-3" /> ORCHESTRATOR TERMINAL
            </span>
            {status === 'compiling' && (
              <span className="text-xs text-red-500 animate-pulse flex items-center gap-1">
                <Activity className="w-3 h-3" /> ACTIVE
              </span>
            )}
          </div>
          <div className="bg-[#0A0A0A] border-x border-b border-gray-800 rounded-b p-4 font-mono text-sm flex-1 overflow-y-auto max-h-[500px]">
            {logs.length === 0 ? (
              <div className="text-gray-600 h-full flex items-center justify-center italic">
                Очікування параметрів запуску...
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={`
                    ${log.includes('✅') ? 'text-green-400' : ''}
                    ${log.includes('❌') ? 'text-red-500' : ''}
                    ${log.includes('Рівень ризику: CRITICAL') ? 'text-red-500 font-bold bg-red-950/50 p-1' : ''}
                    ${!log.includes('✅') && !log.includes('❌') && !log.includes('CRITICAL') ? 'text-gray-300' : ''}
                  `}>
                    {log}
                  </div>
                ))}
                {status === 'compiling' && (
                  <div className="text-gray-500 animate-pulse mt-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" /> Обробка потоків даних...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Прогрес бар */}
          {(status === 'compiling' || status === 'success') && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Прогрес виконання</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${status === 'success' ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)]'}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Короткий підсумок якщо успіх */}
          {status === 'success' && result && (
            <div className="mt-4 p-4 border border-green-900/50 bg-green-950/20 rounded-lg flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-green-400 font-bold mb-1">Досьє успішно скомпільовано</h4>
                <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <div><strong>ID:</strong> <span className="font-mono text-xs">{result.dossier_id}</span></div>
                  <div><strong>Збирачів:</strong> {result.collectors_succeeded} / {result.collectors_used}</div>
                  <div><strong>Записів знайдено:</strong> {result.total_records_found}</div>
                  <div><strong>Вузлів у графі:</strong> {result.graph?.total_nodes || 0}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Помилка */}
          {status === 'error' && (
            <div className="mt-4 p-4 border border-red-900/50 bg-red-950/20 rounded-lg flex items-start gap-4">
              <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-red-400 font-bold mb-1">Помилка компіляції</h4>
                <p className="text-sm text-gray-300">Перевірте з'єднання з сервером або параметри запиту.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
