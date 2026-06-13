import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Play, Download, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
      // fallback to null
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const runValidation = async (chaosMode = false) => {
    setLoading(true);
    setError(null);
    try {
      // UTOS v61.0-ELITE endpoint
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

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "pass": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "fail":
      case "error":
      case "CRITICAL": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "HEALTHY": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return <span className="text-gray-400">-</span>;
    }
  };

  const isReady = data?.status === "HEALTHY" || data?.status === "WARNING";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Deployment Command Center</h1>
          <p className="text-gray-400">Автономний моніторинг готовності платформи PREDATOR Analytics v61.0-ELITE</p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => runValidation(false)} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Запустити UTOS Аудит
          </Button>
          <Button onClick={() => runValidation(true)} disabled={loading} variant="destructive">
            Chaos Mode (В розробці)
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Помилка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && data.status !== "no_data" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-200">UTOS Score (Readiness)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-center">
                  <span className={data.utos_score! >= 95 ? "text-green-500" : (data.utos_score! >= 70 ? "text-amber-500" : "text-red-500")}>
                    {data.utos_score}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-gray-200">Статус системи UTOS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  {isReady ? (
                    <div className="p-3 bg-green-500/20 text-green-500 rounded-full">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                  ) : (
                    <div className="p-3 bg-red-500/20 text-red-500 rounded-full">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <h2 className={`text-2xl font-bold ${isReady ? "text-green-400" : "text-red-400"}`}>
                      {data.status}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Перевірок: {data.total_checks} | Провалено: {data.failed_checks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.layers && Object.entries(data.layers).map(([layerName, info]: [string, any]) => (
              <Card key={layerName} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-gray-200 capitalize">Layer: {layerName}</CardTitle>
                    {getStatusIcon(info.status)}
                  </div>
                  <CardDescription className="text-gray-400">{info.description || info.name}</CardDescription>
                  <div className="text-xs text-gray-500 mt-2">
                    Score: {(info.layer_score * 100).toFixed(0)}% | Вага: {info.weight}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="flex space-x-4 pt-4">
            <Button variant="outline" onClick={() => downloadReport("pdf")} className="text-gray-300 border-gray-700 hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" /> PDF Звіт
            </Button>
            <Button variant="outline" onClick={() => downloadReport("xlsx")} className="text-gray-300 border-gray-700 hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" /> Excel Звіт
            </Button>
            <Button variant="outline" onClick={() => downloadReport("json")} className="text-gray-300 border-gray-700 hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" /> JSON Звіт
            </Button>
          </div>
        </>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center text-gray-500">
            Немає даних про останню валідацію. Натисніть "Запустити аудит".
          </CardContent>
        </Card>
      )}
    </div>
  );
}
