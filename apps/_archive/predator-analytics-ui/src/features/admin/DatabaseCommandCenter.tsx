import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Database, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  FileText,
  Search,
  Network,
  Hash,
  HardDrive,
  Globe,
  Brain,
  BarChart3
} from "lucide-react";

const DB_META: Record<string, { icon: any; color: string; port: number; name: string }> = {
  postgresql: { icon: Database, color: "bg-blue-500", port: 5432, name: "PostgreSQL" },
  clickhouse: { icon: BarChart3, color: "bg-yellow-500", port: 8123, name: "ClickHouse" },
  opensearch: { icon: Search, color: "bg-green-500", port: 9200, name: "OpenSearch" },
  qdrant: { icon: Brain, color: "bg-purple-500", port: 6333, name: "Qdrant" },
  neo4j: { icon: Network, color: "bg-orange-500", port: 7687, name: "Neo4j" },
  redis: { icon: Hash, color: "bg-red-500", port: 6379, name: "Redis" },
  minio: { icon: HardDrive, color: "bg-cyan-500", port: 9000, name: "MinIO" },
  kafka: { icon: Globe, color: "bg-indigo-500", port: 9092, name: "Kafka" },
};

const statusConfig = {
  healthy: { label: "Здорова", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  degraded: { label: "Деградована", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  unhealthy: { label: "Нездорова", color: "bg-red-100 text-red-800", icon: XCircle },
  unknown: { label: "Невідомо", color: "bg-gray-100 text-gray-800", icon: Activity },
};

interface HealthStatus {
  db: string;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  latency_ms?: number;
  error?: string;
  last_check: string;
}

interface ContractInfo {
  db: string;
  role: string;
  data_type: string;
  size_gb?: number;
}

interface RouterStats {
  total_queries: number;
  routed_queries: number;
  fallback_count: number;
  avg_latency_ms: number;
  last_hour: Record<string, number>;
}

interface ClassificationResult {
  intent: string;
  target_db: string;
  confidence: number;
  reasoning: string;
}

function DatabaseCommandCenter() {
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);
  const [contractInfo, setContractInfo] = useState<ContractInfo[]>([]);
  const [routerStats, setRouterStats] = useState<RouterStats | null>(null);
  const [testQuery, setTestQuery] = useState("");
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      const response = await fetch("/api/v1/db-admin/health");
      const data = await response.json();
      setHealthStatuses(data);
    } catch (error) {
      console.error("Помилка отримання статусу здоров'я:", error);
    }
  };

  const fetchContract = async () => {
    try {
      const response = await fetch("/api/v1/db-admin/contract");
      const data = await response.json();
      setContractInfo(data);
    } catch (error) {
      console.error("Помилка отримання контракту:", error);
    }
  };

  const fetchRouterStats = async () => {
    try {
      const response = await fetch("/api/v1/db-admin/router/stats");
      const data = await response.json();
      setRouterStats(data);
    } catch (error) {
      console.error("Помилка отримання статистики роутера:", error);
    }
  };

  const classifyQuery = async () => {
    if (!testQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/v1/db-admin/router/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery }),
      });
      const data = await response.json();
      setClassificationResult(data);
    } catch (error) {
      console.error("Помилка класифікації запиту:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchContract();
    fetchRouterStats();
    
    const interval = setInterval(() => {
      fetchHealth();
      fetchRouterStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const renderHealthCard = (health: HealthStatus) => {
    const meta = DB_META[health.db];
    const Icon = meta.icon;
    const status = statusConfig[health.status];
    const StatusIcon = status.icon;

    return (
      <Card key={health.db} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${meta.color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{meta.name}</CardTitle>
                <CardDescription>Порт: {meta.port}</CardDescription>
              </div>
            </div>
            <Badge className={status.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Латентність:</span>
              <span className="font-medium">
                {health.latency_ms !== undefined ? `${health.latency_ms}ms` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Остання перевірка:</span>
              <span className="font-medium">
                {new Date(health.last_check).toLocaleString("uk-UA")}
              </span>
            </div>
            {health.error && (
              <div className="text-red-600 text-xs mt-2">{health.error}</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContractCard = (contract: ContractInfo) => {
    const meta = DB_META[contract.db];
    const Icon = meta.icon;

    return (
      <Card key={contract.db} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${meta.color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{meta.name}</CardTitle>
              <CardDescription>{contract.role}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Тип даних:</span>
              <span className="font-medium">{contract.data_type}</span>
            </div>
            {contract.size_gb !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Розмір:</span>
                <span className="font-medium">{contract.size_gb} GB</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Центр керування базами даних</h1>
          <p className="text-gray-600 mt-1">
            Моніторинг та управління 8 базами даних згідно з System Memory Contract
          </p>
        </div>
        <Button onClick={fetchHealth} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Оновити
        </Button>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Статус здоров'я
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthStatuses.map(renderHealthCard)}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          System Memory Contract
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {contractInfo.map(renderContractCard)}
        </div>
      </section>

      {routerStats && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Статистика Smart Data Router
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Метрики маршрутизації</CardTitle>
              <CardDescription>Остання година активності</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {routerStats.total_queries}
                  </div>
                  <div className="text-sm text-gray-600">Всього запитів</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {routerStats.routed_queries}
                  </div>
                  <div className="text-sm text-gray-600">Маршрутизовано</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {routerStats.fallback_count}
                  </div>
                  <div className="text-sm text-gray-600">Fallback</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {routerStats.avg_latency_ms}ms
                  </div>
                  <div className="text-sm text-gray-600">Сер. латентність</div>
                </div>
              </div>
              
              <h3 className="font-semibold mb-3">Розподіл за базами даних</h3>
              <div className="space-y-2">
                {Object.entries(routerStats.last_hour).map(([db, count]) => {
                  const meta = DB_META[db];
                  return (
                    <div key={db} className="flex items-center gap-3">
                      <div className={`p-1 rounded ${meta.color}`}>
                        <meta.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{meta.name}</span>
                          <span className="font-medium">{count} запитів</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${meta.color} h-2 rounded-full`}
                            style={{
                              width: `${(count / routerStats.total_queries) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Search className="w-6 h-6" />
          Класифікатор запитів
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Тестування Smart Data Router</CardTitle>
            <CardDescription>
              Введіть запит, щоб побачити, до якої бази даних він буде маршрутизований
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Наприклад: знайти компанію за EDRPOU 12345678"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && classifyQuery()}
              />
              <Button onClick={classifyQuery} disabled={loading || !testQuery.trim()}>
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Класифікувати
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {classificationResult && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{classificationResult.intent}</Badge>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <Badge className={DB_META[classificationResult.target_db].color}>
                    {DB_META[classificationResult.target_db].name}
                  </Badge>
                  <Badge variant="secondary">
                    Впевненість: {Math.round(classificationResult.confidence * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{classificationResult.reasoning}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default DatabaseCommandCenter;
