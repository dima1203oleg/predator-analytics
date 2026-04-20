import React, { useState } from 'react';
import { Radio, ArrowRightLeft, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useFailoverStatus, useToggleFailover } from '@/hooks/useAdminApi';
import { Loader2 } from 'lucide-react';

// ─── Типи ─────────────────────────────────────────────────────────────────────

type BackendNode = 'local-k3s' | 'nvidia-server' | 'colab-mirror';
type RouteMode  = 'SOVEREIGN' | 'HYBRID' | 'CLOUD';

interface FailoverEvent {
  id: string;
  ts: string;
  from: BackendNode;
  to:   BackendNode;
  reason: string;
  user: string;
  duration: string;
}

const MODES: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  SOVEREIGN: { label: 'SOVEREIGN', desc: '100% Local K3s + Ollama',        color: 'text-red-400',     bg: 'bg-red-500/10 border-red-400/25' },
  HYBRID:    { label: 'HYBRID',    desc: 'Баланс: Local + Groq/Gemini',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/25' },
  CLOUD:     { label: 'CLOUD',     desc: 'Gemini Pro, GLM-5.1, Azure',     color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-400/25' },
};

// ─── Колонки таблиці ──────────────────────────────────────────────────────────

const eventCols: VirtualColumn<FailoverEvent>[] = [
  { key: 'ts',       label: 'Час',          width: '140px', mono: true },
  { key: 'from',     label: 'З',            width: '120px', mono: true, render: (v) => <span className="text-amber-400/70">{String(v)}</span> },
  { key: 'to',       label: 'На',           width: '120px', mono: true, render: (v) => <span className="text-emerald-400/70">{String(v)}</span> },
  { key: 'reason',   label: 'Причина',                                  },
  { key: 'user',     label: 'Ініціатор',    width: '120px', mono: true },
  { key: 'duration', label: 'Тривалість',   width: '80px',  mono: true, align: 'right' },
];

const getEventStatus = (row: FailoverEvent): RowStatus =>
  row.user === 'auto-sentinel' ? 'warning' : 'neutral';

// ─── Компонент ───────────────────────────────────────────────────────────────

// ─── Компонент ───────────────────────────────────────────────────────────────

// ─── Компонент ───────────────────────────────────────────────────────────────

export const FailoverRoutingTab: React.FC = () => {
  const { data, isLoading, isError } = useFailoverStatus();
  const toggleMutation = useToggleFailover();
  const [confirming, setConfirming] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-white/40 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400/50" />
        <div className="text-[10px] font-mono uppercase tracking-widest">Завантаження статусу failover...</div>
      </div>
    );
  }

  if (isError || !data) {
    return <div>Помилка завантаження даних Failover</div>;
  }

  const activeMode = data.activeMode;
  const activeNode = data.activeNode;
  const nodes = data.nodes || {};
  const history = data.history || [];

  const handleSwitch = (node: string) => {
    if (node === activeNode) return;
    setConfirming(node);
  };

  const confirmSwitch = async () => {
    if (confirming) {
      await toggleMutation.mutateAsync(confirming);
      setConfirming(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/6">
        <Radio className="w-4 h-4 text-emerald-400" />
        <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
          Failover & Маршрутизація
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tri-State режими */}
        <div>
          <div className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em] mb-2">
            Режим маршрутизації
          </div>
          <div className="space-y-2">
            {(Object.keys(MODES) as RouteMode[]).map((mode) => {
              const m = MODES[mode];
              const active = activeMode === mode;
              return (
                <button
                  key={mode}
                  disabled={toggleMutation.isPending}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border text-left transition-all duration-150',
                    active ? m.bg : 'bg-[#1a2620] border-white/8 hover:border-white/15',
                    toggleMutation.isPending && 'opacity-50 cursor-wait'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full', active ? m.color.replace('text-', 'bg-') : 'bg-white/15')} />
                  <div>
                    <div className={cn('text-[11px] font-mono font-bold', active ? m.color : 'text-white/45')}>
                      {m.label}
                    </div>
                    <div className="text-[9px] text-white/30">{m.desc}</div>
                  </div>
                  {active && (
                    <CheckCircle className={cn('w-3.5 h-3.5 ml-auto', m.color)} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Матриця вузлів */}
        <div>
          <div className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em] mb-2">
            Активний вузол
          </div>
          <div className="space-y-2">
            {Object.keys(nodes).map((nodeKey) => {
              const node = nodes[nodeKey];
              const isActive = activeNode === nodeKey;
              const isOffline = node.status === 'offline';
              return (
                <div
                  key={nodeKey}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-sm border',
                    isActive          ? 'bg-emerald-500/8 border-emerald-400/20 shadow-[0_0_15px_-5px_rgba(52,211,153,0.2)]' :
                    isOffline         ? 'bg-[#1a2620] border-red-400/15 opacity-50' :
                                        'bg-[#1a2620] border-white/8',
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    isActive  ? 'bg-emerald-400 animate-pulse' :
                    isOffline ? 'bg-red-400' :
                                'bg-white/20',
                  )} />
                  <div className="flex-1">
                    <div className="text-[11px] font-mono text-white/65">{node.label}</div>
                    <div className="text-[9px] font-mono text-white/30">{node.ip}</div>
                  </div>
                  {!isActive && !isOffline && (
                    <button
                      onClick={() => handleSwitch(nodeKey)}
                      disabled={toggleMutation.isPending}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-400/20 transition-colors"
                    >
                      <ArrowRightLeft className="w-2.5 h-2.5 text-white/40" />
                      <span className="text-[9px] text-white/40">Перемкнути</span>
                    </button>
                  )}
                  {isActive && (
                    <span className="text-[8px] font-mono font-bold text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm border border-emerald-400/20">
                      ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Діалог підтвердження */}
      {confirming && (
        <div className="p-3 bg-amber-500/8 border border-amber-400/25 rounded-sm flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <div className="text-[11px] text-amber-300 font-semibold">
              Підтвердіть перемикання на {nodes[confirming]?.label || confirming}
            </div>
            <div className="text-[9px] text-white/40 mt-0.5">
              Активні запити будуть перероутовані. Можливе короткочасне переривання.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmSwitch}
              disabled={toggleMutation.isPending}
              className="text-[10px] px-3 py-1 bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 rounded-sm hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
            >
              {toggleMutation.isPending ? 'Перемикання...' : 'Підтвердити'}
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="text-[10px] px-3 py-1 bg-white/5 border border-white/10 text-white/40 rounded-sm hover:bg-white/8 transition-colors"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}

      {/* Лог переключень */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="w-3 h-3 text-white/25" />
          <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">
            Журнал переключень (WORM)
          </span>
        </div>
        <VirtualTable
          rows={history}
          columns={eventCols}
          rowHeight={28}
          maxHeight={320}
          getRowStatus={getEventStatus}
        />
      </div>
    </div>
  );
};


export default FailoverRoutingTab;
