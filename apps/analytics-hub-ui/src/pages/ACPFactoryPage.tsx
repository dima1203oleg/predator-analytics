import React, { useState } from 'react';
import { Loader2, Plus, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api';

export default function ACPFactoryPage() {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!url) {
      alert('URL is required');
      return;
    }
    
    setIsGenerating(true);
    setResult(null);
    
    try {
      const response = await apiFetch('/api/v1/acp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, description })
      });
      
      const data = await response.json();
      setResult(data);
      alert('Колектор успішно згенеровано!');
    } catch (err) {
      alert('Помилка генерації колектора');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Autonomous Connector Platform (ACP)</h1>
          <p className="text-slate-400 mt-2">
            Завантажте URL джерела або документацію, і AI Coder автоматично створить інтеграцію.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-indigo-500/20 shadow-lg bg-[#0a1128]/80 backdrop-blur-md rounded-xl">
          <div className="p-4 border-b border-indigo-500/20">
            <h2 className="text-xl flex items-center gap-2 font-bold text-white">
              <Plus className="w-5 h-5 text-indigo-400" />
              Створити новий колектор
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Target URL (API / Website)</label>
              <input 
                type="text"
                placeholder="https://api.example.com/v1/docs" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#050c18] border border-indigo-500/30 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Опис та Інструкції (Опціонально)</label>
              <textarea 
                placeholder="Опишіть, які дані потрібно дістати (наприклад, 'Витягнути всі таблиці з компаніями')..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 bg-[#050c18] border border-indigo-500/30 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50"
              onClick={handleGenerate}
              disabled={isGenerating || !url}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI аналізує та генерує код...
                </>
              ) : (
                'Згенерувати колектор'
              )}
            </button>
          </div>
        </div>

        <div className="border border-slate-700 shadow-lg bg-black text-green-500 font-mono text-sm overflow-hidden flex flex-col rounded-xl">
          <div className="p-4 border-b border-white/10 bg-black">
            <h2 className="text-white text-base flex items-center gap-2 font-bold">
              <Terminal className="w-4 h-4" />
              Sandboxed Execution Terminal
            </h2>
          </div>
          <div className="p-4 overflow-y-auto flex-1 max-h-[500px]">
            {!isGenerating && !result && (
              <div className="text-gray-500">В очікуванні завдання...</div>
            )}
            
            {isGenerating && (
              <div className="space-y-2 animate-pulse">
                <div>[SYSTEM] Initializing E2B Sandbox Environment...</div>
                <div>[SYSTEM] Launching headless browser...</div>
                <div>[SYSTEM] Downloading OpenAPI specs...</div>
                <div>[LLM] Agent Coder is analyzing endpoints...</div>
              </div>
            )}
            
            {result && (
              <div className="space-y-4">
                <div className="space-y-1">
                  {result.logs?.map((log: string, idx: number) => (
                    <div key={idx} className={log.includes('SUCCESS') ? 'text-green-400' : 'text-gray-300'}>
                      {log}
                    </div>
                  ))}
                </div>
                
                {result.code && (
                  <div className="mt-4 border border-white/20 rounded-md bg-gray-900 p-4 overflow-x-auto text-gray-300">
                    <pre><code>{result.code}</code></pre>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-green-400 mt-4 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  HOT RELOAD COMPLETED. Collector {result.connector_name} is active.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
