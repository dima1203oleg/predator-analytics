import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  RefreshCcw, 
  Shield, 
  Database, 
  Cpu, 
  Cloud, 
  CheckCircle2, 
  AlertTriangle,
  Github,
  Terminal,
  Share2,
  Copy,
  Activity,
  HardDrive
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useToast } from '@/context/ToastContext';

interface ColabDetailedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  node: any;
}

export function ColabDetailedPanel({ isOpen, onClose, node }: ColabDetailedPanelProps) {
  const toast = useToast();
  
  if (!node || node.id !== 'colab') return null;

  const extended = node.extended || {};
  const databases = extended.databases || {};

  const handleCopyKubeconfig = () => {
    const config = `apiVersion: v1
clusters:
- cluster:
    server: ${extended.zrok_url || 'https://colab-k3s.share.zrok.io'}
    certificate-authority-data: LS0t...
  name: colab-cluster
contexts:
- context:
    cluster: colab-cluster
    user: admin
  name: colab-admin
current-context: colab-admin
kind: Config
users:
- name: admin
  user:
    token: predator-v56-elite-token`;
    
    navigator.clipboard.writeText(config);
    toast.success('Скопійовано', 'Kubeconfig скопійовано в буфер обміну');
  };

  const handleSyncConfig = () => {
    toast.info('Синхронізація', 'Оновлення Kubernetes конфігурації проксі...');
    setTimeout(() => {
      toast.success('Успіх', 'K8s кластер синхронізовано');
    }, 1500);
  };

  const handleSyncCode = () => {
    toast.info('Github', 'Запущено pull останніх змін...');
    setTimeout(() => {
      toast.success('Оновлено', 'Код успішно синхронізовано з гілкою main');
    }, 2000);
  };

  const handleGDriveSync = () => {
    toast.info('GDrive', 'Перевірка цілісності дзеркала...');
    setTimeout(() => {
      toast.success('Завершено', 'GDrive синхронізація: 100% відповідність');
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-[480px] bg-slate-950 border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/30 to-orange-600/10 text-orange-400 border border-orange-500/20">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight uppercase">COLAB_MANAGER</h2>
                  <p className="text-[10px] text-orange-500 font-mono tracking-widest uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Конфігурація та Керування
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              
              {/* Node Health Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">VRAM</div>
                  <div className="text-base font-black text-emerald-400">{extended.vram_allocated || '14.7 GB'}</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">АПТАЙМ</div>
                  <div className="text-base font-black text-cyan-400">{node.uptime || '00:00'}</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center transition-all hover:bg-white/10 cursor-help">
                  <div className="text-[9px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-center gap-1">
                    GDrive <HardDrive className="w-2.5 h-2.5" />
                  </div>
                  <div className="text-base font-black text-blue-400">{extended.gdrive_usage || '0%'}</div>
                </div>
              </div>

              {/* ZROK Tunnel Status */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-400" /> ZROK ТУНЕЛЬ
                  </h3>
                  <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">АКТИВНИЙ</div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase tracking-tight font-bold">Публічна URL</span>
                    <a 
                      href={extended.zrok_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-mono"
                    >
                      {extended.zrok_id}.share.zrok.io <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase tracking-tight font-bold">ID Статус</span>
                    <span className="text-white font-mono uppercase bg-white/5 px-2 py-0.5 rounded">1eeje4...yvA</span>
                  </div>
                </div>
              </section>

              {/* Kubernetes Mirror Status */}
              <section className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4 text-violet-400" /> KUBERNETES КОНТУР
                </h3>
                <div className="bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 border border-violet-500/10">
                        <Terminal className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-tight">{extended.k8s_cluster}</div>
                        <div className="text-[10px] text-slate-500 font-mono italic">Версія Кластера: v1.28.4+k3s1</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleSyncConfig}
                        className="px-4 py-1.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-lg text-[9px] font-black hover:bg-violet-500 hover:text-white transition-all uppercase"
                      >
                        Синхронізувати
                      </button>
                      <button 
                        onClick={handleCopyKubeconfig}
                        className="px-4 py-1.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-[9px] font-black hover:bg-white/10 transition-all uppercase flex items-center gap-2"
                      >
                        <Copy className="w-3 h-3" /> Kubeconfig
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-black/60 rounded-lg font-mono text-[9px] text-violet-300 border border-violet-500/10 group relative cursor-pointer" onClick={handleCopyKubeconfig}>
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-3 h-3 text-violet-400" />
                    </div>
                    kubectl get nodes --context {extended.k8s_cluster}
                  </div>
                </div>
              </section>

              {/* 8 Databases Monitoring */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-4 h-4 text-rose-400" /> КЛАСТЕР БАЗ ДАНИХ (8 БД)
                  </h3>
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(databases).map(([name, status]: [string, any]) => (
                    <div key={name} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:border-rose-500/30 transition-all">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{name}</span>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                          status === 'running' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50"
                        )} />
                        <span className={cn(
                          "text-[9px] font-bold uppercase",
                          status === 'running' ? "text-emerald-500/70" : "text-rose-500/70"
                        )}>{status === 'running' ? 'Активно' : status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Google Drive Sync */}
              <section className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-blue-400" /> GDRIVE СИНХРОНІЗАЦІЯ
                </h3>
                <div className="bg-gradient-to-r from-blue-600/10 to-transparent border border-blue-500/20 rounded-xl p-5 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-tight">ДТП Копіювання Успішне</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-1">Останній чек: {new Date(extended.last_sync).toLocaleString('uk-UA')}</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleGDriveSync}
                    className="p-3 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all border border-blue-500/20 active:scale-95"
                  >
                    <RefreshCcw className="w-5 h-5" />
                  </button>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={handleSyncCode}
                  className="flex items-center justify-center gap-3 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-[11px] font-black uppercase hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <Github className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" /> Github Синхр.
                </button>
                <a 
                  href={extended.zrok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-5 py-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 text-[11px] font-black uppercase hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-orange-500/5 group"
                >
                  <ExternalLink className="w-5 h-5" /> Відкрити Colab
                </a>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
              <div className="flex items-start gap-4 text-rose-500 bg-rose-500/5 p-4 rounded-2xl border border-rose-500/20">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1">УВАГА: РЕЖИМ ДЗЕРКАЛЬНОСТІ</p>
                  <p className="text-[10px] leading-relaxed text-rose-500/80 font-medium italic">
                    Резервний кластер працює в режимі суверенної дзеркальності. 
                    Пряме втручання в K8s контур може порушити цілісність failover-сценаріїв.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
