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
  const [scanLine, setScanLine] = useState(false);

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
    const interval = setInterval(() => setScanLine(s => !s), 3000);
    return () => clearInterval(interval);
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
      case "pass": return <CheckCircle2 className={`${className} text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]`} />;
      case "warning": return <AlertTriangle className={`${className} text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]`} />;
      case "fail":
      case "error":
      case "CRITICAL": return <AlertCircle className={`${className} text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]`} />;
      case "HEALTHY": return <CheckCircle2 className={`${className} text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]`} />;
      default: return <Cpu className={`${className} text-gray-500`} />;
    }
  };

  const isReady = data?.status === "HEALTHY" || data?.status === "WARNING";
  const scoreColor = (data?.utos_score ?? 0) >= 95 ? "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" : 
                     ((data?.utos_score ?? 0) >= 70 ? "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" : 
                     "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]");

  return (
    <div className="min-h-screen p-8 bg-[#030000] matrix-grid text-white relative overflow-hidden font-sans">
      
      {/* CRT Scanline Effect */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDAgNE0yIDBMMiA0IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] bg-repeat" />
        <motion.div 
          animate={{ top: ["-10%", "110%"] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-red-500/10 to-transparent" 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-end border-b border-red-900/40 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-widest text-white/90 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-3">
              <ShieldAlert className="w-10 h-10 text-red-500" />
              DEPLOYMENT COMMAND CENTER
            </h1>
            <p className="text-red-500/70 font-mono text-sm tracking-widest mt-2 uppercase">Автономний моніторинг готовності платформи PREDATOR v66.0-ELITE</p>
          </div>
          <div className="flex space-x-4">
            <Button 
              onClick={() => runValidation(false)} 
              disabled={loading} 
              className="bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-400 transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] font-mono"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              ІНІЦІЮВАТИ АУДИТ
            </Button>
            <Button 
              onClick={() => runValidation(true)} 
              disabled={loading} 
              className="bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-400 transition-all font-mono"
            >
              CHAOS MODE
            </Button>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-lg border p-4 bg-red-950/50 border-red-500/50 text-red-200 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <div className="ml-2 font-mono">СИСТЕМНА ПОМИЛКА: {error}</div>
            </div>
          </motion.div>
        )}

        {data && data.status !== "no_data" ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={data.utos_score}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Main Score Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-[#0a0000]/80 glass-wraith backdrop-blur-md border border-red-900/40 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <CardHeader className="border-b border-red-900/20 pb-4">
                    <CardTitle className="text-red-500/80 font-mono text-sm tracking-widest">РІВЕНЬ ГОТОВНОСТІ (UTOS SCORE)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 pb-8 flex justify-center items-center">
                    <div className={`text-7xl font-black font-mono tracking-tighter ${scoreColor}`}>
                      {data.utos_score}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0a0000]/80 glass-wraith backdrop-blur-md border border-red-900/40 md:col-span-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <CardHeader className="border-b border-red-900/20 pb-4">
                    <CardTitle className="text-red-500/80 font-mono text-sm tracking-widest">СТАТУС СИСТЕМИ</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 pb-8">
                    <div className="flex items-center space-x-6">
                      <div className={`p-5 rounded-xl border ${isReady ? 'bg-red-500/10 border-red-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        {getStatusIcon(data.status, "w-12 h-12")}
                      </div>
                      <div>
                        <h2 className={`text-4xl font-black tracking-widest uppercase ${isReady ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"}`}>
                          {data.status}
                        </h2>
                        <div className="flex gap-6 mt-3 text-sm font-mono text-gray-400">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500/50" />Всього перевірок: <span className="text-white">{data.total_checks}</span></span>
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500/50" />Провалено: <span className="text-red-400">{data.failed_checks}</span></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subsystems Breakdown */}
              <div>
                <h3 className="text-red-500/80 font-mono text-sm tracking-widest mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  ДІАГНОСТИКА ПІДСИСТЕМ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.layers && Object.entries(data.layers).map(([layerName, info]: [string, any], i) => (
                    <motion.div
                      key={layerName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="bg-[#0a0000]/60 glass-wraith backdrop-blur-md border border-red-900/20 hover:border-red-500/30 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-red-500/80 transition-colors" />
                        <CardHeader className="pb-3 pt-5 pl-6">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl text-gray-100 capitalize font-mono tracking-wide">{layerName}</CardTitle>
                            {getStatusIcon(info.status)}
                          </div>
                          <CardDescription className="text-gray-400/80 mt-2 text-sm leading-relaxed">{info.description || info.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-6 pb-5">
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${info.layer_score * 100}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full ${info.layer_score >= 0.9 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : info.layer_score >= 0.7 ? 'bg-amber-400' : 'bg-red-500'}`} 
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-gray-300">
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
              <div className="flex space-x-4 pt-6 border-t border-red-900/40">
                <Button variant="outline" onClick={() => downloadReport("pdf")} className="bg-transparent text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 font-mono">
                  <Download className="w-4 h-4 mr-2" /> ЕКСПОРТ .PDF
                </Button>
                <Button variant="outline" onClick={() => downloadReport("xlsx")} className="bg-transparent text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 font-mono">
                  <Download className="w-4 h-4 mr-2" /> ЕКСПОРТ .XLSX
                </Button>
                <Button variant="outline" onClick={() => downloadReport("json")} className="bg-transparent text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 font-mono">
                  <Download className="w-4 h-4 mr-2" /> ЕКСПОРТ .JSON
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <Card className="bg-[#0a0000]/80 glass-wraith backdrop-blur-md border border-red-900/40 shadow-[0_0_30px_rgba(0,0,0,0.5)] mt-10">
            <CardContent className="py-24 text-center text-red-500/50 flex flex-col items-center">
              <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
              <div className="font-mono tracking-widest text-lg uppercase">Очікування даних телеметрії</div>
              <div className="text-sm mt-2 text-gray-500 font-mono">Ініціюйте аудит для завантаження поточного статусу системи</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
