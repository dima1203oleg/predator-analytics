import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { usePredatorStore } from '../stores/usePredatorStore';
import { useMoodStore } from '../stores/useMoodStore';
import { useUIStore, type CameraMode } from '../stores/useUIStore';
import { eventBus } from '../core/EventBus';
import { CommandPalette } from '../ui/CommandPalette';

export const HUD: React.FC = () => {
  const { systemLoad, nodes, edges, selectedNodeId } = usePredatorStore();
  const weather = useMoodStore((state) => state.weather);
  const { cameraMode, notifications, isExplainabilityOpen, riskThreshold, connectionStatus } = useUIStore();
  
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    const calculateFps = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(calculateFps);
    };
    calculateFps();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none text-slate-200 font-sans z-50">
      {/* 1. ВЕРХНЯ ПАНЕЛЬ (Toolbar) */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 backdrop-blur-md bg-black/40 border-b border-white/10 pointer-events-auto shadow-lg">
        
        {/* Логотип та Статус з'єднання */}
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-bold tracking-[0.2em] uppercase text-sm">
            PREDATOR <span className="text-slate-500 font-light">//</span> OBSERVATORY
          </div>
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded border border-white/10 bg-black/30 text-[9px] font-mono tracking-widest uppercase transition-all duration-300">
            {connectionStatus === 'connected' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                <span className="text-green-400">ONLINE</span>
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]"></span>
                <span className="text-amber-400">CONNECTING</span>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                <span className="text-red-400">OFFLINE</span>
              </>
            )}
          </div>
        </div>

        {/* Command Palette (Візуальний тригер) */}
        <div className="flex-1 max-w-md mx-8">
          <div 
            className="relative flex items-center w-full h-8 bg-black/50 border border-white/10 rounded px-3 text-xs text-slate-400 font-mono cursor-pointer hover:border-white/30 transition-colors"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          >
            <span className="opacity-50 mr-2">⌘K</span> Пошук по графу...
          </div>
        </div>

        {/* Телеметрія */}
        <div className="flex gap-6 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          <div className="flex flex-col">
            <span className="opacity-50">FPS</span>
            <span className={fps >= 50 ? 'text-green-400' : 'text-amber-400'}>{fps}</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50">Вузли</span>
            <span className="text-cyan-300">{nodes.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50">Зв'язки</span>
            <span className="text-cyan-300">{edges.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-50">Навантаження Ядра</span>
            <span className={systemLoad > 0.8 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}>
              {(systemLoad * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. ЛІВА ПАНЕЛЬ (Фільтри та Навігація) */}
      <div className="absolute left-4 top-20 bottom-20 w-16 flex flex-col gap-4 pointer-events-auto">
        <div className="backdrop-blur-md bg-black/30 border border-white/10 p-2 rounded-lg flex flex-col gap-2 items-center shadow-lg">
          <div className="text-[10px] font-mono text-slate-500 mb-2">ПОГОДА</div>
          <Button variant="cyber" 
            onClick={() => eventBus.emit('SET_WEATHER', 'calm')}
            className={`w-10 h-10 rounded border transition-all ${weather === 'calm' ? 'bg-cyan-500/30 border-cyan-400' : 'border-white/10 hover:border-white/30'}`}
            title="Спокійний режим (CALM)"
          >
            <span className="text-cyan-400">🌊</span>
          </Button>
          <Button variant="cyber" 
            onClick={() => eventBus.emit('SET_WEATHER', 'storm')}
            className={`w-10 h-10 rounded border transition-all ${weather === 'storm' ? 'bg-amber-500/30 border-amber-400' : 'border-white/10 hover:border-white/30'}`}
            title="Шторм (STORM)"
          >
            <span className="text-amber-400">⚡</span>
          </Button>
          <Button variant="cyber" 
            onClick={() => eventBus.emit('SET_WEATHER', 'insight')}
            className={`w-10 h-10 rounded border transition-all ${weather === 'insight' ? 'bg-white/30 border-white' : 'border-white/10 hover:border-white/30'}`}
            title="Інсайт (INSIGHT)"
          >
            <span className="text-white">👁</span>
          </Button>
          <Button variant="cyber" 
            onClick={() => eventBus.emit('SET_WEATHER', 'overload')}
            className={`w-10 h-10 rounded border transition-all ${weather === 'overload' ? 'bg-red-500/30 border-red-400' : 'border-white/10 hover:border-white/30'}`}
            title="Перевантаження (OVERLOAD)"
          >
            <span className="text-red-400">⚠</span>
          </Button>
        </div>

        {/* Шкала Ризику */}
        <div className="backdrop-blur-md bg-black/30 border border-white/10 p-4 rounded-lg flex flex-col gap-2 items-center shadow-lg mt-auto mb-4 w-16">
          <div className="text-[10px] font-mono text-slate-500 mb-2 whitespace-nowrap -rotate-90 origin-center translate-y-8">ФІЛЬТР РИЗИКУ</div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={riskThreshold}
            onChange={(e) => eventBus.emit('SET_RISK_THRESHOLD', parseFloat(e.target.value))}
            className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer -rotate-90 my-12"
            style={{ 
              accentColor: '#ef4444', 
              background: `linear-gradient(to right, #22d3ee ${riskThreshold * 100}%, #1e293b ${riskThreshold * 100}%)` 
            }}
          />
          <div className="text-xs font-mono text-cyan-400">{(riskThreshold * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* 3. ПРАВА ПАНЕЛЬ (Інспектор та Explainability) */}
      <div className="absolute right-4 top-20 bottom-20 w-80 flex flex-col gap-4 pointer-events-auto">
        {selectedNodeId ? (
          <div className="backdrop-blur-md bg-black/40 border border-white/10 p-5 rounded-lg shadow-2xl animate-fade-in flex-shrink-0">
            <h2 className="text-cyan-400 font-bold uppercase tracking-wider text-sm mb-4">Детальне Досьє</h2>
            <div className="font-mono text-xs space-y-3">
              <div>
                <span className="text-slate-500">ID:</span>
                <span className="text-slate-300 ml-2">{selectedNodeId}</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                <div className="bg-cyan-500 h-full" style={{ width: '85%' }}></div>
              </div>
              <div className="text-slate-500">Довіра до джерела: <span className="text-cyan-400">85%</span></div>
            </div>
            <Button variant="cyber" 
              className="mt-6 w-full py-2 bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-widest transition-colors"
              onClick={() => eventBus.emit('SELECT_NODE', null)}
            >
              ЗАКРИТИ
            </Button>
          </div>
        ) : (
          <div className="backdrop-blur-md bg-black/20 border border-white/5 p-4 rounded-lg text-center font-mono text-[10px] text-slate-500 tracking-widest flex-shrink-0">
            ОБЕРІТЬ ВУЗОЛ
          </div>
        )}

        {/* Журнал Explainability */}
        <div className={`flex-1 backdrop-blur-md bg-black/40 border border-white/10 p-5 rounded-lg shadow-2xl flex flex-col overflow-hidden transition-transform duration-500 ${isExplainabilityOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <h2 className="text-cyan-400 font-bold uppercase tracking-wider text-sm">Журнал Рішень AI</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-xs scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {/* Mock Log Items */}
            <div className="border-l-2 border-amber-500 pl-3">
              <span className="text-amber-500">[ANOMALY]</span>
              <p className="mt-1 text-slate-300 leading-relaxed">Виявлено прихований зв'язок через офшорну компанію X (Кіпр). Патерн нагадує схему ухилення від митних платежів.</p>
            </div>
            <div className="border-l-2 border-cyan-500 pl-3">
              <span className="text-cyan-500">[OSINT]</span>
              <p className="mt-1 text-slate-300 leading-relaxed">Збір даних з відкритих реєстрів завершено. Додано 42 нових вузли.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. НИЖНЯ ПАНЕЛЬ (Статус та Режисура камери) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 backdrop-blur-md bg-black/40 border border-white/10 px-6 py-3 rounded-full pointer-events-auto shadow-2xl">
        <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mr-4">
          Режисура Камери:
        </div>
        {(['observer', 'analyst', 'investigation'] as CameraMode[]).map((mode) => (
          <Button variant="cyber"
            key={mode}
            onClick={() => eventBus.emit('SET_CAMERA_MODE', mode)}
            className={`text-xs uppercase tracking-widest font-mono transition-all duration-300 ${
              cameraMode === mode 
              ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(74,144,217,0.8)]' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {mode}
          </Button>
        ))}
      </div>

      {/* 5. ДИНАМІЧНІ СПОВІЩЕННЯ */}
      <div className="absolute bottom-24 left-6 flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className="animate-fade-in-up px-4 py-2 bg-black/60 border border-cyan-500/30 text-cyan-100 rounded backdrop-blur-md font-mono text-xs flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            {n.message}
          </div>
        ))}
      </div>

      {/* Глобальний Компонент */}
      <CommandPalette />
    </div>
  );
};
