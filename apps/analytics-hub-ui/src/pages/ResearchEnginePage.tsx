import React, { useState, useEffect } from 'react';
import { Loader2, Search, Zap, ExternalLink, GitBranch, BookOpen } from 'lucide-react';
import { apiFetch } from '../api';

export default function ResearchEnginePage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await apiFetch('/api/v1/acp/research/insights');
        const data = await response.json();
        if (data.status === 'success') {
          setInsights(data.insights);
        }
      } catch (error) {
        console.error("Failed to fetch research insights:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInsights();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">AI Research Engine</h1>
          <p className="text-slate-400 mt-2">
            Автономний фоновий моніторинг GitHub, HuggingFace та ArXiv на наявність нових OSINT-інструментів та наукових проривів.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-medium transition-colors">
          <Search className="w-4 h-4" />
          Примусове сканування
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {insights.map((insight) => (
            <div key={insight.id} className="border border-indigo-500/20 shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all bg-[#0a1128]/80 backdrop-blur-md rounded-xl flex flex-col">
              <div className="p-4 flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    {insight.source === 'GitHub' ? <GitBranch className="w-4 h-4 text-blue-400" /> : <BookOpen className="w-4 h-4 text-orange-400" />}
                    {insight.source} • Знайдено: {new Date(insight.date_discovered).toLocaleString('uk-UA')}
                  </div>
                  <h2 className="text-xl pt-2 font-bold text-white">{insight.title}</h2>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-2xl font-bold text-green-400 flex items-center gap-1">
                    <Zap className="w-5 h-5 fill-current" />
                    {Math.round(insight.confidence_score * 100)}%
                  </div>
                  <span className="text-xs text-slate-500">Confidence</span>
                </div>
              </div>
              <div className="p-4 pt-0 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  {insight.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {insight.tags.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-[#050c18]/50 border-t border-indigo-500/10 p-4 rounded-b-xl flex justify-between items-center mt-auto">
                <div className="text-sm font-medium flex items-center gap-2">
                  <span className="text-slate-400">Рекомендація AI:</span> 
                  <span className="text-blue-400">{insight.action_recommended}</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                    Ігнорувати
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    Схвалити дію
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {insights.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Не знайдено нових релевантних інструментів за останні 24 години.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
