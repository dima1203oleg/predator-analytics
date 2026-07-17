import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Play, Download, Loader2, AlertTriangle, ShieldAlert, Cpu } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationResult {
  status: string;
  utos_score?: number;
  layers?: Record<string, any>;
  message?: string;
  total_checks?: number;
  failed_checks?: number;
}

export default function DeploymentCommandCenter() {
  const [data, setData] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = async () => {
    try {
      const res = await fetch("http://localhost:8003/api/v1/utos/reports/latest");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const runValidation = async (chaosMode = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8003/api/v1/utos/run`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Помилка запуску валідації UTOS");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (format: string) => {
    window.open(`http://localhost:8003/api/v1/utos/reports/download/${format}`, "_blank");
  };

  const getStatusIcon = (status: string, className = "w-5 h-5") => {
    switch(status) {
      case "pass": return <CheckCircle2 className={`${className} text-emerald-500`} />;
      case "warning": return <AlertTriangle className={`${className} text-amber-500`} />;
      case "fail":
      case "error":
      case "CRITICAL": return <AlertCircle className={`${className} text-red-500`} />;
      case "HEALTHY": return <CheckCircle2 className={`${className} text-emerald-500`} />;
      default: return <Cpu className={`${className} text-slate-400`} />;
    }
  };

  const isReady = data?.status === "HEALTHY" || data?.status === "WARNING";
  const scoreColor = (data?.utos_score ?? 0) >= 95 ? "text-emerald-600" : 
                     ((data?.utos_score ?? 0) >= 70 ? "text-amber-500" : 
                     "text-red-500");

  return (
    <div className="min-h-screen p-8 bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-end border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-blue-600" />
              ПАНЕЛЬ УПРАВЛІННЯ
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Система моніторингу готовності платформи PREDATOR v66.0-ELITE
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              onClick={() => runValidation(false)} 
              disabled={loading} 
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Запустити Аудит
            </Button>
            <Button 
              onClick={() => runValidation(true)} 
              disabled={loading} 
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Chaos Mode
            </Button>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              type="error"
              title="Системна помилка"
              message={error}
              className="bg-red-50 border-red-200 text-red-900"
            />
          </motion.div>
        )}

        {data && data.status !== "no_data" ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={data.utos_score}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Main Score Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Рівень готовності (UTOS Score)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center py-6">
                    <div className={`text-6xl font-bold ${scoreColor}`}>
                      {data.utos_score}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 md:col-span-2 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Статус системи</CardTitle>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="flex items-center space-x-6">
                      <div className={`p-4 rounded-xl border ${isReady ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        {getStatusIcon(data.status, "w-10 h-10")}
                      </div>
                      <div>
                        <h2 className={`text-3xl font-bold uppercase ${isReady ? "text-emerald-600" : "text-red-600"}`}>
                          {data.status}
                        </h2>
                        <div className="flex gap-6 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            Всього перевірок: <span className="font-medium text-slate-900">{data.total_checks}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            Провалено: <span className="font-medium text-red-600">{data.failed_checks}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subsystems Breakdown */}
              <div>
                <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-slate-500" />
                  Діагностика підсистем
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.layers && Object.entries(data.layers).map(([layerName, info]: [string, any], i) => (
                    <motion.div
                      key={layerName}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-white border-slate-200 hover:border-slate-300 transition-colors shadow-sm h-full">
                        <CardHeader className="pb-3 pt-5">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-semibold text-slate-800 capitalize">{layerName}</CardTitle>
                            {getStatusIcon(info.status)}
                          </div>
                          <CardDescription className="text-slate-500 mt-1 text-sm">{info.description || info.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-5">
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${info.layer_score * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className={`h-full ${info.layer_score >= 0.9 ? 'bg-emerald-500' : info.layer_score >= 0.7 ? 'bg-amber-400' : 'bg-red-500'}`} 
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">
                              {(info.layer_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex space-x-4 pt-6 mt-8 border-t border-slate-200">
                <Button variant="outline" onClick={() => downloadReport("pdf")} className="text-slate-600">
                  <Download className="w-4 h-4 mr-2" /> Експорт .PDF
                </Button>
                <Button variant="outline" onClick={() => downloadReport("xlsx")} className="text-slate-600">
                  <Download className="w-4 h-4 mr-2" /> Експорт .XLSX
                </Button>
                <Button variant="outline" onClick={() => downloadReport("json")} className="text-slate-600">
                  <Download className="w-4 h-4 mr-2" /> Експорт .JSON
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <Card className="bg-white border-slate-200 shadow-sm mt-10">
            <CardContent className="py-24 text-center text-slate-500 flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 mb-4 text-slate-300" />
              <div className="text-lg font-medium text-slate-700">Очікування даних телеметрії</div>
              <div className="text-sm mt-1">Ініціюйте аудит для завантаження поточного статусу системи</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
