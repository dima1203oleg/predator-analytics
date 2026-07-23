// @ts-nocheck

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  ShieldAlert,
  Activity,
  TrendingUp,
  Compass,
  Globe,
  Server,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Zap,
  RefreshCw,
  Eye,
  Briefcase,
  User,
  Terminal,
  Calendar,
  AlertTriangle,
  FileText,
  Sparkles,
  Award,
  Bot,
  Download,
  Network,
} from "lucide-react";
import { motion } from "motion/react";
import GeospatialHeatmap from "./GeospatialHeatmap";
import D3RiskHeatmapWidget from "./D3RiskHeatmapWidget";
import D3HistoricalRiskTrendsWidget from "./D3HistoricalRiskTrendsWidget";
import RiskAlertTicker from "./RiskAlertTicker";
import { OSINT_ENTITIES } from "../osintData";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface DashboardViewProps {
  onSelectTab: (tabId: string) => void;
  onSelectEntity: (entityId: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-2xl shadow-xl backdrop-blur-sm">
        <p className="text-xs font-mono text-slate-300 mb-2 border-b border-slate-800 pb-1">
          Дата: {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300">{entry.name}:</span>
              </div>
              <span
                className="font-mono font-bold"
                style={{ color: entry.color }}
              >
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardView({
  onSelectTab,
  onSelectEntity,
}: DashboardViewProps) {
  const [radarStatus, setRadarStatus] = React.useState<
    "IDLE" | "SCANNING" | "FINISHED"
  >("IDLE");
  const [syncStatus, setSyncStatus] = React.useState<
    "IDLE" | "SYNCING" | "DONE"
  >("IDLE");
  const [threatCategory, setThreatCategory] = React.useState<
    "ALL" | "CRITICAL" | "HIGH" | "LOW"
  >("ALL");

  const threatDynamicsData = React.useMemo(
    () => [
      { date: "07-09", critical: 12, high: 24, low: 45 },
      { date: "07-10", critical: 15, high: 22, low: 48 },
      { date: "07-11", critical: 18, high: 28, low: 42 },
      { date: "07-12", critical: 14, high: 30, low: 50 },
      { date: "07-13", critical: 20, high: 35, low: 55 },
      { date: "07-14", critical: 25, high: 32, low: 60 },
      { date: "07-15", critical: 22, high: 38, low: 65 },
    ],
    [],
  );

  const [syncProgress, setSyncProgress] = React.useState(0);
  const [screeningResult, setScreeningResult] = React.useState<string | null>(
    null,
  );

  // 2D Risk-Distribution Heatmap State
  const [heatmapFilter, setHeatmapFilter] = React.useState<
    "all" | "company" | "person" | "cryptowallet"
  >("all");
  const [visibleHeatmapCategories, setVisibleHeatmapCategories] =
    React.useState<string[]>([
      "Sanction Risk",
      "Operational Risk",
      "Financial Risk",
    ]);

  const toggleHeatmapCategory = (cat: string) => {
    setVisibleHeatmapCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };
  const [showGlow, setShowGlow] = React.useState(true);
  const [showD3Hotspots, setShowD3Hotspots] = React.useState(true);
  const [activeHoverId, setActiveHoverId] = React.useState<string | null>(null);

  const initialChartData = [
    { date: "06-18", operations: 12, critical: 2 },
    { date: "06-21", operations: 19, critical: 5 },
    { date: "06-24", operations: 15, critical: 1 },
    { date: "06-27", operations: 22, critical: 8 },
    { date: "06-30", operations: 30, critical: 12 },
    { date: "07-03", operations: 28, critical: 9 },
    { date: "07-06", operations: 35, critical: 15 },
    { date: "07-09", operations: 42, critical: 18 },
    { date: "07-12", operations: 38, critical: 11 },
    { date: "07-15", operations: 45, critical: 22 },
  ];

  const [chartData, setChartData] = React.useState(initialChartData);
  const [isChartUpdating, setIsChartUpdating] = React.useState(false);
  const [isDbInitialized, setIsDbInitialized] = React.useState(false);

  React.useEffect(() => {
    const dashboardDoc = doc(db, "dashboard", "risk_metrics");
    const unsubscribe = onSnapshot(
      dashboardDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          setChartData(snapshot.data().metrics);
          setIsDbInitialized(true);
        } else {
          // Initialize if it doesn't exist
          setDoc(dashboardDoc, {
            metrics: initialChartData,
            updatedAt: serverTimestamp(),
          }).catch((err) => {
            console.error("Error initializing dashboard data:", err);
            handleFirestoreError(
              err,
              OperationType.WRITE,
              "dashboard/risk_metrics",
            );
          });
        }
      },
      (error) => {
        console.error("Firestore Error: ", error);
        handleFirestoreError(
          error,
          OperationType.LIST,
          "dashboard/risk_metrics",
        );
      },
    );

    return () => unsubscribe();
  }, []);

  const [refAreaLeft, setRefAreaLeft] = React.useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = React.useState<string | null>(null);

  const heatmapPoints = React.useMemo(
    () => [
      {
        id: "1",
        name: "Східний логістичний вузол",
        coordinates: [114.0579, 22.5431] as [number, number],
        intensity: 94,
        type: "CRITICAL" as const,
        category: "Sanction Risk",
      }, // Shenzhen
      {
        id: "2",
        name: "Транзитний хаб",
        coordinates: [28.9784, 41.0082] as [number, number],
        intensity: 68,
        type: "HIGH" as const,
        category: "Operational Risk",
      }, // Istanbul
      {
        id: "3",
        name: "Західний склад",
        coordinates: [12.3713, 51.3396] as [number, number],
        intensity: 10,
        type: "LOW" as const,
        category: "Financial Risk",
      }, // Leipzig
      {
        id: "4",
        name: "Офшорна зона",
        coordinates: [-77.3963, 25.0343] as [number, number],
        intensity: 85,
        type: "CRITICAL" as const,
        category: "Financial Risk",
      }, // Bahamas
      {
        id: "5",
        name: "Східноєвропейський кордон",
        coordinates: [24.0297, 49.8397] as [number, number],
        intensity: 45,
        type: "LOW" as const,
        category: "Operational Risk",
      }, // Lviv
      {
        id: "6",
        name: "Центральний офіс",
        coordinates: [30.5238, 50.4501] as [number, number],
        intensity: 75,
        type: "CRITICAL" as const,
        category: "Sanction Risk",
      }, // Kyiv
      {
        id: "7",
        name: "Крипто-міксер вузол",
        coordinates: [4.8951, 52.3702] as [number, number],
        intensity: 80,
        type: "CRITICAL" as const,
        category: "Financial Risk",
      }, // Amsterdam
    ],
    [],
  );

  const filteredHeatmapPoints = heatmapPoints.filter((p) =>
    visibleHeatmapCategories.includes(p.category),
  );

  const [zoomIndices, setZoomIndices] = React.useState<[number, number] | null>(
    null,
  );

  const [showForecast, setShowForecast] = React.useState(false);

  const chartDataWithForecast = React.useMemo(() => {
    if (!showForecast) return chartData;

    // Simple linear regression to project next 7 days
    const n = chartData.length;
    let sumX = 0,
      sumYOp = 0,
      sumYCr = 0,
      sumXYOp = 0,
      sumXYCr = 0,
      sumX2 = 0;

    chartData.forEach((d, i) => {
      sumX += i;
      sumYOp += d.operations;
      sumYCr += d.critical;
      sumXYOp += i * d.operations;
      sumXYCr += i * d.critical;
      sumX2 += i * i;
    });

    const slopeOp = (n * sumXYOp - sumX * sumYOp) / (n * sumX2 - sumX * sumX);
    const interceptOp = (sumYOp - slopeOp * sumX) / n;

    const slopeCr = (n * sumXYCr - sumX * sumYCr) / (n * sumX2 - sumX * sumX);
    const interceptCr = (sumYCr - slopeCr * sumX) / n;

    const forecastData = [];
    const lastDate = chartData[chartData.length - 1].date;
    const [lastMonth, lastDay] = lastDate.split("-").map(Number);
    let currentDate = new Date(2024, lastMonth - 1, lastDay);

    // Connect the lines by adding forecast keys to the last actual point
    const enhancedChartData = [...chartData];
    enhancedChartData[enhancedChartData.length - 1] = {
      ...enhancedChartData[enhancedChartData.length - 1],
      operationsForecast:
        enhancedChartData[enhancedChartData.length - 1].operations,
      criticalForecast:
        enhancedChartData[enhancedChartData.length - 1].critical,
    };

    for (let i = 1; i <= 7; i++) {
      currentDate.setDate(currentDate.getDate() + 1);
      const nextMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
      const nextDay = String(currentDate.getDate()).padStart(2, "0");

      const projectedOp = Math.max(
        0,
        Math.round(slopeOp * (n - 1 + i) + interceptOp),
      );
      const projectedCr = Math.max(
        0,
        Math.round(slopeCr * (n - 1 + i) + interceptCr),
      );

      forecastData.push({
        date: `${nextMonth}-${nextDay}`,
        operationsForecast: projectedOp,
        criticalForecast: projectedCr,
        isForecast: true,
      });
    }

    return [...enhancedChartData, ...forecastData];
  }, [chartData, showForecast]);

  const currentChartData = zoomIndices
    ? chartDataWithForecast.slice(zoomIndices[0], zoomIndices[1] + 1)
    : chartDataWithForecast;

  const zoom = () => {
    if (refAreaLeft === refAreaRight || !refAreaLeft || !refAreaRight) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    let leftIndex = chartDataWithForecast.findIndex(
      (d) => d.date === refAreaLeft,
    );
    let rightIndex = chartDataWithForecast.findIndex(
      (d) => d.date === refAreaRight,
    );

    if (leftIndex > rightIndex) {
      [leftIndex, rightIndex] = [rightIndex, leftIndex];
    }

    setZoomIndices([leftIndex, rightIndex]);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const zoomOut = () => {
    setZoomIndices(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  // Trigger simulated radar sweep
  const triggerRadarScan = () => {
    setRadarStatus("SCANNING");
    setTimeout(() => {
      setRadarStatus("FINISHED");
    }, 2500);
  };

  // Trigger simulated database indexing sync

  const triggerDatabaseSync = () => {
    if (syncStatus === "SYNCING") return;
    setSyncStatus("SYNCING");
    setSyncProgress(0);
    setIsChartUpdating(true); // Start pulse effect
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncStatus("DONE");

          // Simulate updated data by writing to Firestore
          const dashboardDoc = doc(db, "dashboard", "risk_metrics");
          setChartData((prevData) => {
            const newData = [...prevData];
            newData[newData.length - 1] = {
              ...newData[newData.length - 1],
              operations:
                newData[newData.length - 1].operations +
                Math.floor(Math.random() * 5),
              critical:
                newData[newData.length - 1].critical +
                Math.floor(Math.random() * 2),
            };

            // Only update Firestore if it was initialized, to avoid race conditions
            if (isDbInitialized) {
              setDoc(dashboardDoc, {
                metrics: newData,
                updatedAt: serverTimestamp(),
              }).catch((err) => {
                console.error("Error updating dashboard data:", err);
                handleFirestoreError(
                  err,
                  OperationType.WRITE,
                  "dashboard/risk_metrics",
                );
              });
            }
            return newData;
          });

          // Stop pulse after a short delay
          setTimeout(() => setIsChartUpdating(false), 800);

          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  // Trigger immediate AI security compliance screening notice

  const downloadChartCSV = () => {
    const headers = ["Дата", "Загалом операцій", "Критичні ризики"];
    const csvContent = [
      headers.join(","),
      ...chartData.map(
        (row) => `${row.date},${row.operations},${row.critical}`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "risk_dynamics_metrics.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const triggerComplianceScreening = () => {
    setScreeningResult(
      "ШІ: Виявлено 4 транскордонні підозрілі транзакції на суму $120,000 через Беліз. Об'єкт ТОВ 'СпецТехПостач' помічено як КРИТИЧНИЙ РИЗИК.",
    );
  };

  const stats = [
    {
      label: "Інтегровані Джерела",
      value: "84 API",
      change: "+3 автоматично за 24г",
      icon: Network,
      color: "text-blue-400 bg-blue-500/10 border-slate-800",
    },
    {
      label: "Автоматичні Тести",
      value: "99.9%",
      change: "Contract & Chaos Tests",
      icon: ShieldAlert,
      color: "text-emerald-400 bg-emerald-500/10 border-slate-800",
    },
    {
      label: "Вузлів у Графі Знань",
      value: "148.2M",
      change: "+1.2M за годину",
      icon: Sparkles,
      color: "text-amber-400 bg-amber-500/10 border-slate-800",
    },
    {
      label: "Згенеровано Коду",
      value: "4.2M LOC",
      change: "100% без людини",
      icon: Terminal,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

  const recentSearches = [
    {
      text: "ТОВ 'СпецТехПостач'",
      type: "Company",
      risk: 94,
      code: "38294012",
    },
    {
      text: "Коваленко Ігор Вікторович",
      type: "Person",
      risk: 82,
      code: "2938401923",
    },
    {
      text: "BTC Wallet (0x38ac...d831)",
      type: "Wallet",
      risk: 89,
      code: "bc1qxy2kg...",
    },
  ];

  const criticalRisks = [
    {
      title: "Транзит коштів через офшори Belize у ТОВ 'СпецТехПостач'",
      level: "КРИТИЧНО",
      date: "Сьогодні, 02:40",
      source: "AML Моніторинг",
    },
    {
      title:
        "Зміна засновника у підсанкційному Львівському оборонному постачальнику",
      level: "ВИСОКИЙ",
      date: "Вчора, 18:15",
      source: "ЄДР моніторинг",
    },
    {
      title: "Збіг санкційного списку ЄС щодо директора ТОВ 'Харків-Логістик'",
      level: "ВИСОКИЙ",
      date: "15 липня, 11:30",
      source: "OpenSanctions",
    },
  ];

  // Filter and process OSINT_ENTITIES for the 2D Risk Heatmap
  const filteredEntities = OSINT_ENTITIES.filter((ent) => {
    if (heatmapFilter === "all") return true;
    return ent.type === heatmapFilter;
  });

  const getEntityCoords = (ent: (typeof OSINT_ENTITIES)[0]) => {
    // Y: Risk Score (inverted, scaled to 12% to 88% to stay inside the plot area safely)
    const y = 88 - (ent.riskScore / 100) * 76;

    // X: Based on relationships count, with spread offsets to avoid overlap
    let x = 50;
    const relCount = ent.relationships?.length || 0;

    if (relCount >= 3) {
      // High connectivity: 72% to 85% range
      x = ent.id === "comp-1" ? 82 : 72;
    } else if (relCount === 2) {
      // Moderate connectivity: 42% to 58% range
      x = ent.id === "wallet-1" ? 56 : 42;
    } else {
      // Low connectivity: 18% to 32% range
      x = 22;
    }

    return { x, y };
  };

  const avgRiskScore = Math.round(
    filteredEntities.reduce((acc, ent) => acc + ent.riskScore, 0) /
      (filteredEntities.length || 1),
  );

  const criticalCount = filteredEntities.filter(
    (ent) => ent.riskScore >= 75,
  ).length;

  return (
    <div className="space-y-6" id="dashboard-view-root">
      {/* Real-time Risk Alert Ticker */}
      <RiskAlertTicker
        entities={OSINT_ENTITIES}
        onSelectEntity={onSelectEntity}
        onSelectTab={onSelectTab}
      />

      {/* Dynamic HUD Quick stats row */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
        id="hud-stats-grid"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-panel-premium rounded-2xl hover:border-slate-800 transition-all duration-300 p-2 flex items-center justify-between shadow-xl backdrop-blur-sm relative overflow-hidden group cursor-pointer"
          >
            {/* Ambient hover glow spot */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="relative z-10">
              <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-widest block">
                {stat.label}
              </span>
              <span className="text-2xl font-black text-white tracking-tight block mt-1.5 font-sans">
                {stat.value}
              </span>
              <span className="text-xs text-blue-400 font-mono font-bold block mt-1">
                {stat.change}
              </span>
            </div>
            <div
              className={`p-2 rounded-2xl border relative z-10 transition-transform duration-300 group-hover:scale-110 ${stat.color}`}
            >
              <stat.icon className="w-5.5 h-5.5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Executive Summary Panel */}
      <div className="bg-gradient-to-r from-blue-950/40 to-[#02050a]/80 glass-panel-premium border border-slate-800 rounded-2xl shadow-xl p-2 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
          <Bot className="w-24 h-24 text-blue-500" />
        </div>
        <div className="flex items-start gap-2 relative z-10">
          <div className="p-2 bg-blue-500/10 border border-slate-800 rounded-2xl shrink-0">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Autonomous Factory Summary
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs font-mono border border-slate-800">
                AGENT MODE
              </span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium max-w-4xl">
              За останні 24 години{" "}
              <strong className="text-emerald-400 font-bold">
                Discovery Engine виявив 3 нових API.
              </strong>
              Codegen Engine автоматично згенерував ETL-клієнти, створив SQL DDL
              міграції та Qdrant Embedding Loaders без помилок статичного
              аналізу. Система{" "}
              <strong className="text-blue-400">
                успішно пройшла GitOps пайплайн
              </strong>{" "}
              та задеплоєна в Production.
            </p>
            <div className="flex gap-2 pt-2">
              <button className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer">
                Генерувати ADR звіт{" "}
                <span className="text-base leading-none">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Main Dashboard widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
        {/* Left column: Analytics, Map & News */}
        <div className="xl:col-span-8 space-y-6">
          {/* Map & Link-Graph Widget combination */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-teal-400" />
                <span className="text-xs font-bold uppercase text-slate-200 tracking-widest">
                  Глобальна Ситуаційна Карта Загроз
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-slate-800 uppercase">
                АКТИВНИЙ МОНІТОРИНГ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-8 h-[240px] bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
                <GeospatialHeatmap
                  points={filteredHeatmapPoints}
                  width={800}
                  height={400}
                  showD3Hotspots={showD3Hotspots}
                />

                <div className="absolute top-2 left-3 flex flex-wrap gap-2 z-10">
                  <div className="bg-slate-950/80 border border-slate-800 px-2 py-1 rounded text-xs text-slate-500 font-mono pointer-events-none">
                    GEOSPATIAL HEATMAP LAYER
                  </div>

                  <button
                    onClick={() => setShowD3Hotspots(!showD3Hotspots)}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      showD3Hotspots
                        ? "bg-rose-500/20 text-rose-300 border-slate-800 shadow-2xl shadow-black/40 shadow-rose-500/10"
                        : "bg-slate-950/80 text-slate-500 border-slate-800/60"
                    }`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full ${showD3Hotspots ? "bg-rose-500 animate-ping" : "bg-slate-600"}`}
                    ></span>
                    D3 HEATMAP: {showD3Hotspots ? "ON" : "OFF"}
                  </button>

                  {/* Category Controls */}
                  <div className="flex bg-slate-950/90 border border-slate-800/60 rounded p-0.5 gap-0.5">
                    {[
                      "Sanction Risk",
                      "Operational Risk",
                      "Financial Risk",
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => toggleHeatmapCategory(cat)}
                        className={`px-2 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                          visibleHeatmapCategories.includes(cat)
                            ? "bg-blue-600/30 text-blue-300 border border-slate-800"
                            : "bg-transparent text-slate-500 hover:text-slate-300 border border-transparent"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 text-left z-10 pointer-events-none bg-slate-950/70 p-2 rounded backdrop-blur-sm border border-slate-800/60">
                  <p className="text-xs text-slate-300 font-mono font-bold">
                    ГЛОБАЛЬНА ІНТЕНСИВНІСТЬ РИЗИКІВ
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    Візуалізація концентрації аномальних транзакцій
                  </p>
                </div>

                <div className="absolute bottom-3 right-3 z-10">
                  <button
                    onClick={() => onSelectTab("maps")}
                    className="bg-blue-600/90 backdrop-blur border border-slate-800 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer shadow-2xl shadow-black/40"
                  >
                    Детальна карта
                  </button>
                </div>
              </div>

              {/* Sidebar metric inside the Situational map block */}
              <div className="md:col-span-4 bg-black/40 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">
                  АКТИВНІ КАНАЛИ
                </span>

                <div className="space-y-2 mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Шеньчжень → Київ</span>
                    <span className="text-red-400 font-bold font-mono">
                      94% Ризик
                    </span>
                  </div>
                  <div className="w-full bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] rounded-full h-1">
                    <div
                      className="bg-red-500 h-1 rounded-full"
                      style={{ width: "94%" }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Лейпциг → Львів</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      10% Безпечно
                    </span>
                  </div>
                  <div className="w-full bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] rounded-full h-1">
                    <div
                      className="bg-emerald-500 h-1 rounded-full"
                      style={{ width: "10%" }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Гонконг → Стамбул</span>
                    <span className="text-amber-400 font-bold font-mono">
                      68% Скринінг
                    </span>
                  </div>
                  <div className="w-full bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] rounded-full h-1">
                    <div
                      className="bg-amber-500 h-1 rounded-full"
                      style={{ width: "68%" }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono border-t border-slate-800 pt-2 mt-2">
                  Дані митниці оновлюються автоматично згідно з 16 томами ТЗ.
                </div>
              </div>
            </div>
          </div>

          {/* 2D Risk-Distribution Heatmap Widget */}
          <div
            className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-[0_4px_40px_rgba(30,58,138,0.15)] backdrop-blur-md p-2 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-sm"
            id="risk-distribution-heatmap-widget"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-rose-500" />
                <div>
                  <span className="text-xs font-bold uppercase text-slate-200 tracking-widest block font-mono">
                    2D Теплокарта Розподілу Ризиків (Risk Intensity Matrix)
                  </span>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Кореляція рівня загрози (Risk Score) та кількості зв'язків
                    об'єктів
                  </p>
                </div>
              </div>

              {/* Filter controls inside the heatmap widget */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/60">
                <button
                  onClick={() => setHeatmapFilter("all")}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    heatmapFilter === "all"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-slate-200"
                  }`}
                >
                  Всі
                </button>
                <button
                  onClick={() => setHeatmapFilter("company")}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    heatmapFilter === "company"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-slate-200"
                  }`}
                >
                  Юрособи
                </button>
                <button
                  onClick={() => setHeatmapFilter("person")}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    heatmapFilter === "person"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-slate-200"
                  }`}
                >
                  Особи
                </button>
                <button
                  onClick={() => setHeatmapFilter("cryptowallet")}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    heatmapFilter === "cryptowallet"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-slate-200"
                  }`}
                >
                  Крипто
                </button>
              </div>
            </div>

            {/* Grid for heatmap container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 relative z-10">
              {/* Heatmap main canvas */}
              <div className="lg:col-span-8 relative h-[300px] bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden p-2 flex flex-col justify-between">
                {/* 2D Plane Grid Background */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Grid Lines */}
                  <svg
                    className="w-full h-full opacity-10"
                    stroke="#475569"
                    strokeWidth="0.5"
                  >
                    {/* Horizontal grid lines */}
                    <line
                      x1="0"
                      y1="20%"
                      x2="100%"
                      y2="20%"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1="40%"
                      x2="100%"
                      y2="40%"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1="60%"
                      x2="100%"
                      y2="60%"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1="80%"
                      x2="100%"
                      y2="80%"
                      strokeDasharray="3 3"
                    />

                    {/* Vertical grid lines */}
                    <line
                      x1="20%"
                      y1="0"
                      x2="20%"
                      y2="100%"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="40%"
                      y1="0"
                      x2="40%"
                      y2="100%"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="60%"
                      y1="0"
                      x2="60%"
                      y2="100%"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="80%"
                      y1="0"
                      x2="80%"
                      y2="100%"
                      strokeDasharray="3 3"
                    />
                  </svg>

                  {/* Subtle diagonal risk division line */}
                  <svg className="w-full h-full absolute inset-0 opacity-15 pointer-events-none">
                    <line
                      x1="0"
                      y1="100%"
                      x2="100%"
                      y2="0"
                      stroke="#f43f5e"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="70%"
                      y="30%"
                      fill="#f43f5e"
                      fontSize="8"
                      fontFamily="monospace"
                      transform="rotate(-21, 280, 80)"
                    >
                      ЗОНА АНОМАЛІЇ
                    </text>
                  </svg>
                </div>

                {/* Heatmap Gradients Blur Background to simulate density */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {filteredEntities.map((ent) => {
                    const coords = getEntityCoords(ent);
                    const isHigh = ent.riskScore >= 75;
                    const glowColor = isHigh
                      ? "rgba(244, 63, 94, 0.25)"
                      : ent.riskScore >= 50
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(16, 185, 129, 0.1)";
                    if (!showGlow) return null;
                    return (
                      <div
                        key={`glow-${ent.id}`}
                        className="absolute rounded-full blur-[45px] transition-all duration-1000"
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          width: `${ent.riskScore * 1.5}px`,
                          height: `${ent.riskScore * 1.5}px`,
                          backgroundColor: glowColor,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    );
                  })}
                </div>

                {/* Chart Y-Axis Labels */}
                <div className="absolute left-3 top-2 bottom-12 flex flex-col justify-between text-xs font-mono text-slate-500 pointer-events-none z-10 select-none">
                  <span>100% — КРИТИЧНИЙ</span>
                  <span>75% — ВИСОКИЙ</span>
                  <span>50% — СЕРЕДНІЙ</span>
                  <span>25% — НИЗЬКИЙ</span>
                  <span>0%</span>
                </div>

                {/* Main Interactive Plot Area */}
                <div className="relative w-full h-full mt-4 mb-4 ml-14 mr-4">
                  {/* Plotted nodes */}
                  {filteredEntities.map((ent) => {
                    const coords = getEntityCoords(ent);
                    const isSelected = activeHoverId === ent.id;
                    const riskColor =
                      ent.riskScore >= 75
                        ? "bg-rose-500 border-rose-400 text-rose-500"
                        : ent.riskScore >= 50
                          ? "bg-amber-500 border-amber-400 text-amber-500"
                          : "bg-emerald-500 border-emerald-400 text-emerald-500";
                    const riskText =
                      ent.riskScore >= 75
                        ? "text-rose-400"
                        : ent.riskScore >= 50
                          ? "text-amber-400"
                          : "text-emerald-400";
                    const Icon =
                      ent.type === "company"
                        ? Briefcase
                        : ent.type === "person"
                          ? User
                          : Terminal;

                    return (
                      <div
                        key={ent.id}
                        className="absolute cursor-pointer group z-20"
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        onMouseEnter={() => setActiveHoverId(ent.id)}
                        onMouseLeave={() => setActiveHoverId(null)}
                        onClick={() => {
                          onSelectEntity(ent.id);
                          onSelectTab("volumes");
                        }}
                      >
                        {/* Ping radar effect for high risk */}
                        {ent.riskScore >= 75 && (
                          <span className="absolute inline-flex h-12 w-12 rounded-full bg-rose-500/20 animate-ping -left-3 -top-2 pointer-events-none" />
                        )}

                        {/* Interactive Circle Pin */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 border-slate-950 bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] flex items-center justify-center shadow-2xl shadow-black/40 shadow-black/80 group-hover:scale-125 group-hover:border-blue-400 transition-all duration-300 relative`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${riskText}`} />

                          {/* Risk Score Pill directly attached */}
                          <span className="absolute -top-2.5 -right-3 px-1 rounded bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 text-xs font-mono font-bold text-slate-300 scale-90 group-hover:scale-100 transition-transform">
                            {ent.riskScore}%
                          </span>
                        </div>

                        {/* Floating quick mini-label */}
                        <span className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 border border-slate-800/60 px-2 py-1 rounded text-[8.5px] font-mono font-bold text-slate-300 group-hover:text-white transition-colors">
                          {ent.name.replace(/ТОВ |"|'/g, "")}
                        </span>

                        {/* Custom hover detail panel */}
                        {isSelected && (
                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[240px] bg-slate-950/95 border border-slate-800 p-2 rounded-2xl shadow-2xl z-30 pointer-events-none space-y-1 text-left backdrop-blur-md">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-slate-200 truncate pr-2">
                                {ent.name}
                              </span>
                              <span
                                className={`text-xs font-mono font-black ${riskText}`}
                              >
                                {ent.riskScore}%
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                              {ent.type === "company"
                                ? "Юридична особа"
                                : ent.type === "person"
                                  ? "Фізична особа"
                                  : "Крипто-гаманець"}
                            </p>
                            <div className="border-t border-slate-800 my-1.5"></div>
                            <div className="text-[8.5px] text-slate-300 font-mono space-y-1">
                              <div>
                                Код/Адреса:{" "}
                                <span className="text-slate-200 block truncate">
                                  {ent.code}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>
                                  Зв'язків:{" "}
                                  <strong className="text-slate-200">
                                    {ent.relationships?.length || 0}
                                  </strong>
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-[7.5px] font-bold uppercase bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] ${riskText}`}
                                >
                                  {ent.status}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-slate-800/60 pt-1 mt-1 flex items-center justify-between">
                              <span className="text-[7.5px] text-blue-400 font-mono animate-pulse">
                                Клікніть для повного аналізу зв'язків
                              </span>
                              <ArrowRight className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Chart X-Axis Labels */}
                <div className="flex justify-between text-xs font-mono text-slate-500 border-t border-slate-800 pt-2 ml-14 mr-4 select-none">
                  <span>Низький рівень зв'язків (1-2)</span>
                  <span>Середній ступінь залученості</span>
                  <span>Критичні транскордонні зв'язки (3+)</span>
                </div>
              </div>

              {/* Right panel: Heatmap key stats / legend */}
              <div className="lg:col-span-4 bg-black/40 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block border-b border-slate-800 pb-1.5">
                    Показники ризик-матриці
                  </span>

                  {/* Analytics metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 text-center">
                      <span className="text-xs text-slate-500 font-mono block">
                        СЕРЕДНІЙ РИЗИК
                      </span>
                      <span className="text-base font-black text-blue-400 font-mono">
                        {avgRiskScore}%
                      </span>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 text-center">
                      <span className="text-xs text-slate-500 font-mono block">
                        КРИТИЧНІ ОБ'ЄКТИ
                      </span>
                      <span className="text-base font-black text-rose-500 font-mono">
                        {criticalCount}
                      </span>
                    </div>
                  </div>

                  {/* Settings toggle */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-2 space-y-2">
                    <span className="text-xs text-slate-300 font-mono font-bold block uppercase tracking-wider">
                      Візуальні параметри
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">
                        Градієнтні теплові ареоли
                      </span>
                      <button
                        onClick={() => setShowGlow(!showGlow)}
                        className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${showGlow ? "bg-blue-600" : "bg-slate-800"}`}
                      >
                        <div
                          className={`bg-white w-3.5 h-3.5 rounded-full shadow transition-transform ${showGlow ? "translate-x-3.5" : "translate-x-0"}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Distribution Legend */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-slate-500 font-mono font-bold block uppercase tracking-wider">
                      Легенда інтенсивності
                    </span>
                    <div className="flex flex-col gap-1 text-xs text-slate-300 bg-black/40 p-2 rounded border border-slate-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Критичний рівень (&gt;75%)</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-rose-400">
                          КАТ: А
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Високий рівень (50-75%)</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-400">
                          КАТ: B
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Низький рівень (&lt;50%)</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          КАТ: C
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono leading-relaxed border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Виявлено аномальну концентрацію:</span>
                  </div>
                  <span>
                    Один мажоритарний власник пов'язаний з декількома високими
                    ризиками. Спільний фокус на ТОВ 'СпецТехПостач' та BTC
                    Wallet створює потенційне джерело обходу санкцій.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* D3.js based risk heatmap widget representing real-time threat clusters */}
          <D3RiskHeatmapWidget
            entities={OSINT_ENTITIES}
            onSelectEntity={onSelectEntity}
            onSelectTab={onSelectTab}
          />

          {/* D3.js line chart showing 'Historical Risk Trends' for the active entities over the past 30 days to complement the heatmap */}
          <D3HistoricalRiskTrendsWidget
            entities={OSINT_ENTITIES}
            onSelectEntity={onSelectEntity}
            onSelectTab={onSelectTab}
          />
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-[0_4px_40px_rgba(30,58,138,0.15)] backdrop-blur-md p-2 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-blue-400" />
                <div>
                  <span className="text-xs font-bold uppercase text-slate-200 tracking-widest block font-mono">
                    Динаміка виявлених загроз
                  </span>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Щоденний аналіз аномалій та ризик-факторів
                  </p>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/60">
                <button
                  onClick={() => setThreatCategory("ALL")}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    threatCategory === "ALL"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-slate-200"
                  }`}
                >
                  Всі
                </button>
                <button
                  onClick={() => setThreatCategory("CRITICAL")}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    threatCategory === "CRITICAL"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-slate-200"
                  }`}
                >
                  Критичні
                </button>
                <button
                  onClick={() => setThreatCategory("HIGH")}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    threatCategory === "HIGH"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-slate-200"
                  }`}
                >
                  Високі
                </button>
                <button
                  onClick={() => setThreatCategory("LOW")}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    threatCategory === "LOW"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-300 hover:text-slate-200"
                  }`}
                >
                  Низькі
                </button>
              </div>
            </div>

            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={threatDynamicsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    vertical={false}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#475569"
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "rgba(59, 130, 246, 0.2)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ fontFamily: "monospace" }}
                    labelStyle={{
                      color: "#cbd5e1",
                      marginBottom: "4px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                  />

                  {(threatCategory === "ALL" ||
                    threatCategory === "CRITICAL") && (
                    <Line
                      type="monotone"
                      dataKey="critical"
                      name="Критичні"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
                      activeDot={{ r: 6, stroke: "#fda4af", strokeWidth: 2 }}
                    />
                  )}
                  {(threatCategory === "ALL" || threatCategory === "HIGH") && (
                    <Line
                      type="monotone"
                      dataKey="high"
                      name="Високі"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                      activeDot={{ r: 5, stroke: "#fcd34d", strokeWidth: 2 }}
                    />
                  )}
                  {(threatCategory === "ALL" || threatCategory === "LOW") && (
                    <Line
                      type="monotone"
                      dataKey="low"
                      name="Низькі"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{ r: 5, stroke: "#6ee7b7", strokeWidth: 2 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CORPORATE INTERACTIVE CONTROL PANEL */}
          <div
            className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-2 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-sm"
            id="tactical-interactive-panel"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                <span className="text-xs font-bold uppercase text-slate-200 tracking-widest font-mono">
                  ⚡ Інтерактивний командний пульт NEXUS
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono font-bold tracking-wider uppercase">
                ОПЕРАЦІЇ В РЕАЛЬНОМУ ЧАСІ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 relative z-10">
              {/* Operation 1: Radar scan */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between space-y-4 hover:border-slate-800 transition-all group">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                    📡 ГЛОБАЛЬНИЙ РАДАР
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-1 leading-relaxed">
                    Сканування гео-каналів та обходу митниць у реальному часі.
                  </p>
                </div>
                <div>
                  {radarStatus === "SCANNING" && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-mono mb-2 font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Сканування вузлів...</span>
                    </div>
                  )}
                  {radarStatus === "FINISHED" && (
                    <div className="text-xs text-emerald-400 font-mono mb-2 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ЗНАЙДЕНО: 42 об'єкти</span>
                    </div>
                  )}
                  {radarStatus === "IDLE" && (
                    <div className="text-xs text-slate-500 font-mono mb-2 font-semibold">
                      Стан: Очікування запуску
                    </div>
                  )}
                  <button
                    onClick={triggerRadarScan}
                    disabled={radarStatus === "SCANNING"}
                    className={`w-full py-2 px-3 text-xs font-black uppercase rounded-2xl tracking-wider font-mono cursor-pointer transition-all ${radarStatus === "SCANNING" ? "bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] text-slate-500" : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-black/20 shadow-blue-500/10"}`}
                  >
                    {radarStatus === "SCANNING"
                      ? "Сканування..."
                      : "Запустити Скринінг"}
                  </button>
                </div>
              </div>

              {/* Operation 2: Sync DB */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between space-y-4 hover:border-slate-800 transition-all group">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                    🔄 СИНХРОНІЗАЦІЯ БАЗИ
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-1 leading-relaxed">
                    Звірка реєстру РНБО з міжнародними санкційними списками.
                  </p>
                </div>
                <div>
                  {syncStatus === "SYNCING" && (
                    <div className="space-y-1.5 mb-2.5">
                      <div className="flex justify-between text-xs font-mono text-amber-400 font-bold">
                        <span>Синхронізація реєстрів...</span>
                        <span>{syncProgress}%</span>
                      </div>
                      <div className="w-full bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${syncProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {syncStatus === "DONE" && (
                    <div className="text-xs text-emerald-400 font-mono mb-2.5 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>РЕЄСТРИ СИНХРОНІЗОВАНО</span>
                    </div>
                  )}
                  {syncStatus === "IDLE" && (
                    <div className="text-xs text-slate-500 font-mono mb-2.5 font-semibold">
                      Остання синхронізація: 2 хв тому
                    </div>
                  )}
                  <button
                    onClick={triggerDatabaseSync}
                    disabled={syncStatus === "SYNCING"}
                    className={`w-full py-2 px-3 text-xs font-black uppercase rounded-2xl tracking-wider font-mono cursor-pointer transition-all ${syncStatus === "SYNCING" ? "bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] text-slate-500" : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-black/20 shadow-blue-500/10"}`}
                  >
                    {syncStatus === "SYNCING" ? "Оновлюємо..." : "Звірити бази"}
                  </button>
                </div>
              </div>

              {/* Operation 3: AI Screening */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between space-y-4 hover:border-slate-800 transition-all group">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                    🧪 ШІ AML СКРИНІНГ
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-1 leading-relaxed">
                    Глибока перевірка транскордонних переказів через Gemini 3.5.
                  </p>
                </div>
                <div>
                  {screeningResult ? (
                    <div className="text-xs text-rose-400 font-mono bg-rose-950/20 border border-rose-900/30 rounded-2xl p-2 leading-relaxed mb-2.5 max-h-[56px] overflow-y-auto">
                      {screeningResult}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 font-mono mb-2.5 font-semibold">
                      Стан: Потрібен запуск аналізу
                    </div>
                  )}
                  <button
                    onClick={triggerComplianceScreening}
                    className="w-full py-2 px-3 text-xs font-black uppercase rounded-2xl tracking-wider font-mono bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all shadow-xl shadow-black/20 shadow-blue-500/10"
                  >
                    Запустити AML ШІ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Dynamics Chart */}
          <div
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/40 relative overflow-hidden"
            id="risk-dynamics-chart"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase text-slate-200 tracking-widest font-mono">
                  Динаміка виявлених ризикових операцій (30 днів)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowForecast(!showForecast)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider border transition-colors ${showForecast ? "bg-sky-500/20 text-sky-400 border-slate-800" : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 border-slate-800"}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Прогноз</span>
                </button>
                {zoomIndices && (
                  <button
                    onClick={zoomOut}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider border border-slate-800 transition-colors"
                  >
                    <span>Зменшити масштаб</span>
                  </button>
                )}
                <button
                  onClick={downloadChartCSV}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider border border-slate-800 transition-colors"
                  title="Завантажити CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Завантажити CSV</span>
                </button>
              </div>
            </div>
            <div
              className={`h-[220px] w-full ${isChartUpdating ? "animate-data-pulse" : ""}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                  onMouseMove={(e: any) =>
                    refAreaLeft && e && setRefAreaRight(e.activeLabel)
                  }
                  onMouseUp={zoom}
                >
                  <defs>
                    <linearGradient
                      id="colorOperations"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCritical"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="operations"
                    name="Загалом операцій"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOperations)"
                  />
                  <Area
                    type="monotone"
                    dataKey="operationsForecast"
                    name="Прогноз операцій"
                    stroke="#e879f9"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={0}
                  />

                  <Area
                    type="monotone"
                    dataKey="critical"
                    name="Критичні ризики"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCritical)"
                  />
                  <Area
                    type="monotone"
                    dataKey="criticalForecast"
                    name="Прогноз ризиків"
                    stroke="#fb7185"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={0}
                  />

                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights & Summary Section (Section 11) */}
          <div
            className="bg-indigo-950/10 border border-indigo-900/30 rounded-2xl p-2 relative overflow-hidden"
            id="ai-insights-block"
          >
            <div className="absolute right-4 top-2 text-blue-500/20">
              <Sparkles className="w-16 h-12" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase text-blue-400 tracking-widest font-mono">
                AI SUMMARY & РЕКОМЕНДАЦІЇ ШІ
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
              За результатами аналізу зв'язків у нашому графі, зафіксовано
              сплеск реєстрації компаній-посередників у Туреччині та Белізі, які
              пов'язані з українськими бенефіціарами через ланцюжки
              міноритарного володіння. Рекомендується провести примусову
              перевірку всіх контрагентів за кодом ЄДРПОУ, використовуючи
              вкладку{" "}
              <strong className="text-indigo-300">
                "Пошук & OSINT-Аналіз"
              </strong>
              , для виявлення прихованих зв'язків з особами під санкціями РНБО
              України.
            </p>
          </div>
        </div>

        {/* Right column: Recent searches & Risks feeds */}
        <div className="xl:col-span-4 space-y-6">
          {/* Critical Threat Alerts Panel */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-2 shadow-[0_4px_30px_rgba(225,29,72,0.05)] space-y-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full pointer-events-none"></div>
            <span className="text-xs text-rose-500 font-mono font-bold uppercase tracking-widest flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL THREAT ALERTS
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-slate-500">НАЖИВО</span>
                <span className="animate-pulse w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              </span>
            </span>
            <div
              className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#334155 transparent",
              }}
            >
              {OSINT_ENTITIES.filter((e) => e.riskScore >= 75).map((entity) => (
                <div
                  key={entity.id}
                  onClick={() => {
                    onSelectEntity(entity.id);
                    onSelectTab("volumes");
                  }}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2 flex flex-col gap-2 transition-all duration-300 ease-out cursor-pointer group hover:bg-slate-900/80 hover:border-rose-400/50 hover:-translate-y-[1px] relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-rose-500/50 group-hover:bg-rose-400 transition-colors"></div>
                  <div className="flex justify-between items-start pl-1">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-2xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors border border-slate-800">
                        {entity.type === "company" ? (
                          <Briefcase className="w-3.5 h-3.5" />
                        ) : entity.type === "person" ? (
                          <User className="w-3.5 h-3.5" />
                        ) : (
                          <Terminal className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200 group-hover:text-rose-400 transition-colors line-clamp-1">
                          {entity.name}
                        </p>
                        <span className="text-xs text-slate-500 font-mono">
                          {entity.type.toUpperCase()} • {entity.code}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-slate-800 shrink-0">
                      {entity.riskScore}% RISK
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2 pl-1 italic">
                    {entity.aiRecommendations ||
                      entity.description ||
                      "Detected anomalous behavior patterns requiring immediate operational review."}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Last Searches / Autocomplete AI reference (Section 11 & 12) */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/40 space-y-3.5">
            <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center justify-between">
              <span>ОСТАННІ АНАЛІЗОВАНИЙ ОБ'ЄКТИ</span>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
            </span>

            <div className="space-y-2.5">
              {recentSearches.map((search, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const found = OSINT_ENTITIES.find((e) =>
                      e.name
                        .toLowerCase()
                        .includes(search.text.toLowerCase().slice(0, 10)),
                    );
                    if (found) {
                      onSelectEntity(found.id);
                      onSelectTab("volumes"); // Navigate to workbench
                    }
                  }}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2 flex items-center justify-between transition-all duration-300 ease-out cursor-pointer group hover:bg-slate-900/60 hover:border-blue-400/40 hover:-translate-y-[1px] hover:shadow-[0_4px_15px_rgba(99,102,241,0.1)]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-2xl bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 text-slate-300 group-hover:text-blue-400 transition-colors">
                      {search.type === "Company" ? (
                        <Briefcase className="w-3.5 h-3.5" />
                      ) : search.type === "Person" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Terminal className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {search.text}
                      </p>
                      <span className="text-xs text-slate-500 font-mono">
                        {search.type} • {search.code}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-1 rounded border ${search.risk > 75 ? "text-red-400 bg-red-500/5 border-red-500/20" : "text-emerald-400 bg-emerald-500/5 border-slate-800"}`}
                  >
                    {search.risk}% Risk
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Risks list widget (Section 11) */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/40 space-y-3.5">
            <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>ДЖЕРЕЛО РИЗИКІВ (РЕАЛЬНИЙ ЧАС)</span>
            </span>

            <div className="space-y-3">
              {criticalRisks.map((risk, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] p-2 rounded-2xl border border-slate-800 space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-500">{risk.source}</span>
                    <span
                      className={`font-bold px-2 py-1 rounded ${risk.level === "КРИТИЧНО" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}
                    >
                      {risk.level}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-300 leading-normal">
                    {risk.title}
                  </p>
                  <span className="text-xs text-slate-600 block text-right font-mono">
                    {risk.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
