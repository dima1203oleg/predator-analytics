import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, MessageSquare, Activity, Shield,
  Database, Play, Plus, Trash2, Search,
  RefreshCw, Terminal, CheckCircle2, AlertCircle,
  Clock, Zap, Globe
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { api } from '../../services/api';

// --- TYPES ---
interface TelegramChannel {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'syncing' | 'error' | 'idle';
  itemsCount: number;
  lastSync: string;
  description?: string;
}

export const TelegramIntelligencePanel: React.FC = () => {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [logs, setLogs] = useState<{ts: string, msg: string, type: 'info' | 'success' | 'warn'}[]>([]);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setLogs(prev => [{ ts: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
  };

  const loadChannels = async () => {
    try {
      // In v45, we use the ingestion connectors API
      const data = await api.getConnectors();
      if (Array.isArray(data)) {
        const tgChannels = data
          .filter((c: any) => c.type === 'telegram' || c.source_type === 'telegram')
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            url: c.description || c.config?.url || '',
            status: c.status || 'active',
            itemsCount: c.itemsCount || 0,
            lastSync: c.lastSync || new Date().toISOString(),
            description: c.description
          }));
        setChannels(tgChannels);
      }
    } catch (e) {
      console.error("Failed to load Telegram channels", e);
      addLog("Failed to sync with backend registry", 'warn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
    const interval = setInterval(loadChannels, 5000);

    // Initial logs
    addLog("Predator Telegram Ingestion Kernel v4.2 initialized", 'info');
    addLog("Scanning global namespace for active listeners...", 'info');

    return () => clearInterval(interval);
  }, []);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setIsAdding(true);
    addLog(`Initiating connection to target: ${newUrl}`, 'info');

    try {
      const res = await api.ingestion.startJob({
        source_type: 'telegram',
        url: newUrl,
        config: { name: newUrl.split('/').pop() }
      });

      addLog(`Handshake successful. Job ID: ${res.job_id}`, 'success');
      setNewUrl('');
      await loadChannels();
    } catch (e: any) {
      addLog(`Connection failed: ${e.message}`, 'warn');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    addLog(`Dismantling listener ${id}...`, 'info');
    // Implement delete logic if API supports it
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/50 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-3xl relative group">
      <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Send size={24} className="icon-3d" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              Telegram Parsing Intelligence
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-[8px] text-blue-400 font-bold border border-blue-500/20 animate-pulse">V45_PRO</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">Neural Channel Ingestion & Signal Extraction</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {loading ? <RefreshCw className="animate-spin text-slate-500 w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{channels.length} ACTIVE_CHANNELS</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">

        {/* Left: Controls & Stats */}
        <div className="w-full lg:w-96 border-r border-white/5 p-8 space-y-8 bg-black/10">

          {/* Add Form */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Plus size={12} className="text-blue-400" />
              Target Acquisition
            </h4>
            <form onSubmit={handleAddChannel} className="space-y-4">
              <div className="relative group/input">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-blue-400 transition-colors" size={16} />
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="t.me/channel_name"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all text-sm font-mono"
                />
              </div>
              <button
                disabled={isAdding || !newUrl}
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isAdding ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} className="fill-current" />}
                {isAdding ? "Establishing Link..." : "Initialize Parser"}
              </button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
               <div className="text-[8px] text-slate-500 font-black uppercase mb-1">Total Signals</div>
               <div className="text-lg font-black text-white">{channels.reduce((acc, c) => acc + c.itemsCount, 0).toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
               <div className="text-[8px] text-slate-500 font-black uppercase mb-1">Queue Size</div>
               <div className="text-lg font-black text-blue-400">0</div>
            </div>
          </div>

          {/* Miniature Log Viewer */}
          <div className="rounded-2xl bg-black/60 border border-white/5 p-6 font-mono text-[9px] flex-1 overflow-hidden min-h-[200px] flex flex-col">
             <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-white/5 pb-2">
                <Terminal size={12} />
                <span className="font-black uppercase tracking-widest">INGESTION_LOGS</span>
             </div>
             <div className="space-y-2 overflow-y-auto scrollbar-hide flex-1">
                {logs.map((log, i) => (
                  <div key={i} className={cn(
                    "leading-relaxed transition-opacity",
                    i > 5 ? "opacity-40" : "opacity-100",
                    log.type === 'success' ? "text-emerald-400" : log.type === 'warn' ? "text-rose-400" : "text-slate-400"
                  )}>
                    <span className="opacity-30 mr-2">[{log.ts}]</span>
                    {log.msg}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                   <span className="opacity-30 mr-2">{'>'}</span> Listening for neural activity...
                </div>
             </div>
          </div>
        </div>

        {/* Right: Targets List */}
        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center mb-6">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={12} className="text-blue-400" />
                Active Monitoring Targets
             </h4>
             <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-white/5 text-[8px] text-slate-500 border border-white/5 uppercase">Global Registry</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {channels.length === 0 ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] text-slate-600">
                    <Activity size={48} className="opacity-20 mb-4" />
                    <p className="text-xs font-mono uppercase tracking-widest">No active parsing targets</p>
                    <p className="text-[10px] opacity-50 mt-2">Use the side panel to add a Telegram source</p>
                </div>
              ) : (
                channels.map((channel, i) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-6 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group/card relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
                       <button
                        onClick={() => handleDelete(channel.id)}
                        className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition-all"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                       <div className={cn(
                         "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                         channel.status === 'active' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-slate-800 border-slate-700 text-slate-500"
                       )}>
                          <Globe size={20} className={cn(channel.status === 'active' && "animate-pulse")} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h5 className="text-white font-black text-sm truncate uppercase tracking-tight">{channel.name || channel.url.split('/').pop()}</h5>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{channel.url}</p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex flex-col">
                           <span className="text-[8px] text-slate-600 font-black uppercase mb-1 tracking-widest">Статус</span>
                           <div className="flex items-center gap-1.5">
                              <div className={cn("w-1.5 h-1.5 rounded-full", channel.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                              <span className={cn("text-[9px] font-black uppercase", channel.status === 'active' ? "text-emerald-400" : "text-slate-500")}>
                                 {channel.status}
                              </span>
                           </div>
                        </div>

                        <div className="text-right">
                           <span className="text-[8px] text-slate-600 font-black uppercase mb-1 tracking-widest">Injected Objects</span>
                           <div className="text-xs font-mono text-white font-bold">{channel.itemsCount.toLocaleString()}</div>
                        </div>

                        <div className="text-right">
                           <span className="text-[8px] text-slate-600 font-black uppercase mb-1 tracking-widest">Last Activity</span>
                           <div className="text-xs font-mono text-blue-400 uppercase tracking-tighter">
                              {new Date(channel.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-500/5 text-center border-t border-blue-500/10 flex items-center justify-center gap-4">
         <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Temporal-Backbone Sync: Active</span>
         <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-blue-400/30 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
         </div>
      </div>
    </div>
  );
};
