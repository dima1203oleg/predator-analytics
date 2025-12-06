
import React, { useEffect, useState, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { ViewHeader } from "../components/ViewHeader";
import { TacticalCard } from "../components/TacticalCard";
import { 
  LayoutGrid, Activity, Database, RefreshCw, 
  Search, Check, X, ThumbsUp, ThumbsDown,
  Server, Shield, Filter
} from "lucide-react";

type TabKey = "usage" | "training";

interface ApiUsageEvent {
  id: number;
  tenant_id: string;
  user_id: string;
  service: string;
  endpoint: string;
  status_code: number;
  request_units: number;
  created_at: string;
}

interface TrainingSample {
  id: number;
  tenant_id: string;
  user_id: string;
  source: string;
  query_text: string;
  response_text: string;
  label: string; // "unreviewed" | "positive" | "negative"
  exported: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

type TrainingLabelFilter = "all" | "unreviewed" | "positive" | "negative";

// Mock Data Generators for UI development (since backend might not be reachable)
const MOCK_USAGE: ApiUsageEvent[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  tenant_id: `tenant-${Math.floor(i / 5)}`,
  user_id: `user-${i}`,
  service: i % 2 === 0 ? "predator-brain" : "ua-sources",
  endpoint: i % 2 === 0 ? "/council/run" : "/etl/upload",
  status_code: Math.random() > 0.9 ? 429 : 200,
  request_units: Math.floor(Math.random() * 50),
  created_at: new Date(Date.now() - i * 1000 * 60).toISOString(),
}));

const MOCK_SAMPLES: TrainingSample[] = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  tenant_id: "default",
  user_id: "admin",
  source: "council",
  query_text: `Test query regarding entity #${i}`,
  response_text: `Analysis for entity #${i} indicates high risk due to offshore connections...`,
  label: i % 3 === 0 ? "positive" : i % 3 === 1 ? "negative" : "unreviewed",
  exported: false,
  created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  metadata: {},
}));

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("usage");
  const toast = useToast();

  // --- USAGE STATE ---
  const [usageData, setUsageData] = useState<ApiUsageEvent[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  // --- TRAINING STATE ---
  const [trainingData, setTrainingData] = useState<TrainingSample[]>([]);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [labelFilter, setLabelFilter] = useState<TrainingLabelFilter>("all");

  // --- LOADERS ---
  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    // In a real app, fetch from /api/v1/admin/api-usage
    setTimeout(() => {
      setUsageData(MOCK_USAGE);
      setUsageLoading(false);
    }, 600);
  }, []);

  const fetchTraining = useCallback(async () => {
    setTrainingLoading(true);
    // In a real app, fetch from /api/v1/admin/training-samples
    setTimeout(() => {
      setTrainingData(MOCK_SAMPLES);
      setTrainingLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
    if (activeTab === "usage") fetchUsage();
    else fetchTraining();
  }, [activeTab, fetchUsage, fetchTraining]);

  // --- HANDLERS ---
  const handleFeedback = (id: number, label: string) => {
    // Optimistic update
    setTrainingData(prev => prev.map(item => 
      item.id === id ? { ...item, label } : item
    ));
    toast.success("Feedback Updated", `Sample marked as ${label}`);
  };

  const filteredTrainingData = trainingData.filter(item => {
    if (labelFilter === 'all') return true;
    return item.label === labelFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto">
      <ViewHeader 
        title="Admin Dashboard"
        icon={<LayoutGrid size={20} className="icon-3d-blue"/>}
        breadcrumbs={['SYSTEM', 'ADMINISTRATION', activeTab.toUpperCase()]}
        stats={[
            { label: 'API Calls (24h)', value: '14.2k', icon: <Activity size={14}/>, color: 'primary' },
            { label: 'Training Samples', value: String(trainingData.length), icon: <Database size={14}/>, color: 'purple' },
        ]}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/30 rounded-t overflow-x-auto scrollbar-hide">
        <button 
            onClick={() => setActiveTab('usage')}
            className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'usage' ? 'border-blue-500 text-blue-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
        >
            <Activity size={16} /> API Usage & Billing
        </button>
        <button 
            onClick={() => setActiveTab('training')}
            className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'training' ? 'border-purple-500 text-purple-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
        >
            <Database size={16} /> Self-Learning Loop
        </button>
      </div>

      <div className="min-h-[400px]">
        {/* USAGE TAB */}
        {activeTab === 'usage' && (
          <TacticalCard title="API Traffic Log" className="panel-3d" action={<button onClick={fetchUsage}><RefreshCw size={14} className={usageLoading ? "animate-spin" : ""}/></button>}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Tenant / User</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Units</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-800">
                  {usageData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{new Date(row.created_at).toLocaleTimeString()}</td>
                      <td className="p-3">
                        <div className="text-slate-200 font-bold">{row.tenant_id}</div>
                        <div className="text-[10px] text-slate-500">{row.user_id}</div>
                      </td>
                      <td className="p-3 text-slate-300">{row.service}</td>
                      <td className="p-3 font-mono text-blue-400">{row.endpoint}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.status_code === 200 ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>
                          {row.status_code}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">{row.request_units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TacticalCard>
        )}

        {/* TRAINING TAB */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {(['all', 'unreviewed', 'positive', 'negative'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setLabelFilter(f)}
                  className={`px-3 py-1.5 rounded text-xs font-bold border capitalize ${labelFilter === f ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredTrainingData.map(sample => (
                <div key={sample.id} className="bg-slate-900 border border-slate-800 rounded p-4 panel-3d flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">#{sample.id}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            sample.label === 'positive' ? 'text-green-500 bg-green-900/20' :
                            sample.label === 'negative' ? 'text-red-500 bg-red-900/20' :
                            'text-yellow-500 bg-yellow-900/20'
                        }`}>{sample.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{new Date(sample.created_at).toLocaleString()}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/30 p-3 rounded border border-slate-800/50">
                        <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Query</div>
                        <p className="text-xs text-slate-300 font-mono">{sample.query_text}</p>
                    </div>
                    <div className="bg-black/30 p-3 rounded border border-slate-800/50">
                        <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Response</div>
                        <p className="text-xs text-slate-300 font-mono line-clamp-3">{sample.response_text}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/50">
                      <button 
                        onClick={() => handleFeedback(sample.id, 'positive')}
                        className={`p-2 rounded hover:bg-green-900/20 transition-colors ${sample.label === 'positive' ? 'text-green-500' : 'text-slate-500'}`}
                      >
                          <ThumbsUp size={16} />
                      </button>
                      <button 
                        onClick={() => handleFeedback(sample.id, 'negative')}
                        className={`p-2 rounded hover:bg-red-900/20 transition-colors ${sample.label === 'negative' ? 'text-red-500' : 'text-slate-500'}`}
                      >
                          <ThumbsDown size={16} />
                      </button>
                  </div>
                </div>
              ))}
              {filteredTrainingData.length === 0 && (
                  <div className="text-center p-8 text-slate-500 italic">No samples found for filter "{labelFilter}"</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
    