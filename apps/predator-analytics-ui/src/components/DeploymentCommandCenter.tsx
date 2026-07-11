// DeploymentCommandCenter.tsx
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from "react";
import axios from "axios";

interface AuditReport {
  status: string;
  readinessIndex: number;
  timestamp: string;
  details: Record<string, any>;
}

const DeploymentCommandCenter: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ data: AuditReport }>("/api/v1/adv-dvs/report");
      setReport(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerValidation = async () => {
    setLoading(true);
    try {
      await axios.post("/api/v1/adv-dvs/run");
      await fetchReport();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">ADV‑DVS: Перевірка розгортання</h2>
      {loading && <div className="text-blue-600">Завантаження…</div>}
      {report && (
        <div className="space-y-2">
          <p>
            <strong>Статус:</strong> {report.status}
          </p>
          <p>
            <strong>Індекс готовності:</strong> {report.readinessIndex}%
          </p>
          <p>
            <strong>Остання перевірка:</strong> {new Date(report.timestamp).toLocaleString()}
          </p>
        </div>
      )}
      <Button variant="cyber"
        onClick={triggerValidation}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
      >
        Запустити перевірку
      </Button>
    </div>
  );
};

export default DeploymentCommandCenter;
