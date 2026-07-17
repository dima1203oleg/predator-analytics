import React, { useState, useEffect } from 'react';

// Моковий тип даних для ADV DVS Report
interface AdvDvsReport {
  timestamp: string;
  version: string;
  validation_level: string;
  status: 'GO' | 'NO-GO';
  details: {
    component: string;
    status: 'passed' | 'fail';
    message: string;
  }[];
  recommendations: string[];
}

export const AdvDvsDashboard: React.FC = () => {
  const [report, setReport] = useState<AdvDvsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        // Уникаємо дублювання /api/v1
        const endpoint = baseUrl.endsWith('/api/v1') 
          ? `${baseUrl}/adv-dvs/run` 
          : `${baseUrl}/api/v1/adv-dvs/run`;
        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error("Failed to fetch ADV DVS report:", error);
        // Fallback or error state
        setReport({
          timestamp: new Date().toISOString(),
          version: '61.0-ELITE',
          validation_level: 'ERROR',
          status: 'NO-GO',
          details: [
            { component: 'api', status: 'fail', message: `Помилка підключення: ${error}` }
          ],
          recommendations: ['Перевірте чи працює Core API (FastAPI) та чи доступний порт.']
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-xl animate-pulse text-blue-400">Завантаження ADV DVS Звіту...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-950 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-red-500 tracking-wider border-b border-red-900 pb-4">
        СУВЕРЕННИЙ КОМАНДНИЙ ЦЕНТР: ADV DVS
      </h1>
      
      {report && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full md:col-span-1 bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-xl">
             <h2 className="text-xl font-semibold mb-4 text-gray-300">Статус Готовності</h2>
             <div className={`text-5xl font-black ${report.status === 'GO' ? 'text-green-500' : 'text-red-600'}`}>
               {report.status}
             </div>
             <p className="mt-4 text-gray-400 text-sm">Версія: {report.version}</p>
             <p className="text-gray-400 text-sm">Останнє оновлення: {new Date(report.timestamp).toLocaleString()}</p>
          </div>

          <div className="col-span-full md:col-span-2 bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Деталі Інфраструктури (Level 1)</h2>
            <div className="space-y-4">
              {report.details.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-800 rounded border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${detail.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-mono text-lg uppercase tracking-wide">{detail.component}</span>
                  </div>
                  <span className="text-gray-400">{detail.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-full bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-xl mt-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Рекомендації Системи</h2>
            <ul className="list-disc pl-6 space-y-2 text-blue-300 font-medium">
              {report.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
