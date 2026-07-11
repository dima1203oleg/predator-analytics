import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Database, Upload, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/api/config';

export const SyntheticDataStudio: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [syntheticRatio, setSyntheticRatio] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleTrain = async () => {
    if (!file) {
      setError('Оберіть CSV файл для навчання.');
      return;
    }
    if (!targetColumn.trim()) {
      setError('Введіть назву цільової колонки (target column).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_column', targetColumn);
      formData.append('synthetic_ratio', syntheticRatio.toString());

      const res = await apiClient.post('/synthetic/train/hybrid', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Сталася помилка під час навчання.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="p-3 bg-red-900/30 rounded-lg text-red-500">
            <Brain size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white">Synthetic Data Studio</h1>
            <p className="text-slate-400 mt-1">Оркестрація генерації синтетичних даних та навчання ML-моделей (Hybrid Pipeline)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Settings Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm"
          >
            <h2 className="text-xl font-medium text-white mb-6 flex items-center">
              <Database className="mr-2 text-blue-400" size={20} />
              Налаштування Тренування
            </h2>

            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Базовий датасет (CSV)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800/80 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-400">
                        <span className="font-semibold">Натисніть для завантаження</span> або перетягніть
                      </p>
                      <p className="text-xs text-slate-500">{file ? file.name : "Лише .csv файли"}</p>
                    </div>
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {/* Target Column */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Цільова колонка (Target)</label>
                <input 
                  type="text" 
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  placeholder="напр., risk_score"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              {/* Synthetic Ratio */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Частка синтетики (Ratio): {syntheticRatio.toFixed(1)}x
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="5.0" 
                  step="0.1" 
                  value={syntheticRatio}
                  onChange={(e) => setSyntheticRatio(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10%</span>
                  <span>100% (1.0x)</span>
                  <span>500%</span>
                </div>
              </div>

              <Button variant="cyber"
                onClick={handleTrain}
                disabled={isLoading}
                className="w-full mt-4 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                <span>{isLoading ? 'Тренування в процесі...' : 'Запустити Hybrid Pipeline'}</span>
              </Button>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-900 rounded-lg flex items-start space-x-2 text-red-400 text-sm mt-4">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm flex flex-col"
          >
            <h2 className="text-xl font-medium text-white mb-6 flex items-center">
              <CheckCircle2 className="mr-2 text-emerald-400" size={20} />
              Результати Моделювання
            </h2>

            {!result && !isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <Brain size={48} className="mb-4 opacity-20" />
                <p>Запустіть тренування для отримання результатів</p>
              </div>
            )}

            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-red-500/80">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="animate-pulse">Тренування моделі та генерація даних...</p>
                <p className="text-xs text-slate-500 mt-2">Це може зайняти декілька хвилин</p>
              </div>
            )}

            {result && !isLoading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="p-4 bg-slate-950 rounded-lg border border-emerald-900/30">
                  <div className="text-sm text-slate-400 mb-1">Статус</div>
                  <div className="text-lg font-medium text-emerald-400 capitalize">{result.status || 'Успішно'}</div>
                </div>

                {result.metrics && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Метрики Моделі (AutoTrainer)</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(result.metrics).map(([key, value]) => (
                        <div key={key} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="text-xs text-slate-500 uppercase">{key}</div>
                          <div className="text-xl font-light text-white mt-1">
                            {typeof value === 'number' ? value.toFixed(3) : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.generation_result && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Якість Синтетики (SDV)</h3>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">Генератор</span>
                        <span className="text-sm font-medium text-white">{result.generation_result.generator_used}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Quality Score</span>
                        <span className="text-sm font-medium text-emerald-400">
                          {result.generation_result.quality_score ? `${result.generation_result.quality_score.toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {result.model_card_path && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Model Card Path</h3>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono break-all">
                      {result.model_card_path}
                    </div>
                  </div>
                )}

              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};
