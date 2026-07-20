import React, { useState } from 'react';
import { Loader2, Search, BrainCircuit, ShieldAlert, Cpu } from 'lucide-react';

interface NLIResponse {
  intent: string;
  parameters: Record<string, string>;
  thought_process: string[];
  narrative: string;
}

export function OracleWorkspace() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NLIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvestigate = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('predator_token') || localStorage.getItem('token');
      const res = await fetch('/api/v1/nli/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        throw new Error('Помилка сервера. Спробуйте ще раз.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Сталася помилка при зверненні до PREDATOR ORACLE.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-4 p-4 overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Ліва панель: Ввід */}
      <div className="flex flex-col w-1/3 h-full gap-4">
        <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl flex-1 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-800/50">
            <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
              <BrainCircuit className="h-6 w-6" />
              PREDATOR ORACLE
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Введіть ваш розслідувальний запит природною мовою.
            </p>
          </div>
          <div className="flex flex-col gap-4 p-4 flex-1">
            <div className="flex flex-col gap-2 h-full">
              <textarea 
                className="w-full h-48 p-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none transition-all"
                placeholder="Приклад: Знайди компанії пов'язані з ЄДРПОУ 31331322, які мають рівень ризику вище 80 і були зареєстровані минулого року."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInvestigate();
                  }
                }}
              />
              <button 
                onClick={handleInvestigate}
                disabled={loading || !query.trim()}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 h-12 rounded-lg transition-colors"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                Аналізувати Запит
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-950/50 border border-red-900/50 text-red-400 rounded-md text-sm flex items-start gap-2">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Права панель: Результати та Наратив */}
      <div className="flex flex-col w-2/3 h-full gap-4">
        <div className="bg-slate-900 border border-slate-800 shadow-xl rounded-xl h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800/50 flex flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-400" />
                Anomalous Narratives
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Результати інтент-класифікації та AI-пояснення
              </p>
            </div>
            {result && (
              <div className="px-3 py-1 bg-indigo-950 text-indigo-300 rounded-full text-xs font-mono uppercase tracking-wider border border-indigo-900">
                INTENT: {result.intent}
              </div>
            )}
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            <div className="h-full w-full p-6">
              {!result && !loading && (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-4 mt-20">
                  <BrainCircuit className="h-16 w-16 opacity-20" />
                  <p>Очікування вводу розслідувального запиту...</p>
                </div>
              )}

              {loading && (
                <div className="w-full flex flex-col items-center justify-center text-cyan-500 gap-4 mt-20">
                  <Loader2 className="h-12 w-12 animate-spin" />
                  <p className="animate-pulse">Оракул аналізує запит...</p>
                </div>
              )}

              {result && (
                <div className="flex flex-col gap-8">
                  {/* Thought Process */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4" /> Chain of Thought
                    </h3>
                    <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono text-sm space-y-3">
                      {result.thought_process?.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-indigo-300">
                          <span className="text-slate-500 shrink-0">[{idx + 1}]</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extracted Parameters */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Extracted Parameters</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.parameters && Object.keys(result.parameters).length > 0 ? (
                        Object.entries(result.parameters).map(([key, val]) => (
                          <div key={key} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm flex gap-2">
                            <span className="text-cyan-400 font-medium">{key}:</span>
                            <span className="text-slate-300">{val as string}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm">Параметрів не знайдено</span>
                      )}
                    </div>
                  </div>

                  {/* AI Narrative */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">AI Narrative</h3>
                    <div className="bg-cyan-950/20 p-6 rounded-lg border border-cyan-900/30 text-slate-200 leading-relaxed text-[15px]">
                      {result.narrative?.split('\n').map((line, idx) => (
                        <p key={idx} className="mb-3 last:mb-0">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
