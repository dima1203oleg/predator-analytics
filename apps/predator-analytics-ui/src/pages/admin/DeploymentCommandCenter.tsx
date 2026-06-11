import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Play, Download, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationResult {
  status: string;
  deployment_readiness_index?: number;
  overall_status?: string;
  is_ready?: boolean;
  levels?: Record<string, any>;
  message?: string;
}

export default function DeploymentCommandCenter() {
  const [data, setData] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = async () => {
    try {
      // Припускаємо, що API доступне через Nginx/Proxy або напряму до ADV-DVS на 8003
      // Для цілей цього ТЗ, зробимо запит до локального бекенду ADV-DVS
      const res = await fetch("http://localhost:8003/api/v1/reports/latest");
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
      const res = await fetch(`http://localhost:8003/api/v1/validate/all?chaos_mode=${chaosMode}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Помилка запуску валідації");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (format: string) => {
    window.open(`http://localhost:8003/api/v1/reports/download/${format}`, "_blank");
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "pass": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "fail":
      case "error": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <span className="text-gray-400">-</span>;
    }
  };

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
            Запустити аудит
          </Button>
          <Button onClick={() => runValidation(true)} disabled={loading} variant="destructive">
            Chaos Mode
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
                <CardTitle className="text-gray-200">Readiness Index (DRI)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-center">
                  <span className={data.deployment_readiness_index! >= 95 ? "text-green-500" : "text-amber-500"}>
                    {data.deployment_readiness_index}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-gray-200">Статус системи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  {data.is_ready ? (
                    <div className="p-3 bg-green-500/20 text-green-500 rounded-full">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                  ) : (
                    <div className="p-3 bg-red-500/20 text-red-500 rounded-full">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <h2 className={`text-2xl font-bold ${data.is_ready ? "text-green-400" : "text-red-400"}`}>
                      {data.overall_status}
                    </h2>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.levels && Object.entries(data.levels).map(([level, info]: [string, any]) => (
              <Card key={level} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-gray-200">Рівень {level}</CardTitle>
                    {getStatusIcon(info.status)}
                  </div>
                  <CardDescription className="text-gray-400">{info.name}</CardDescription>
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
