/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, AlertTriangle, TrendingUp, Zap, Radio, Bell, BellOff,
  ChevronLeft, ChevronRight, Pause, Play, Filter, Info, Eye, ArrowUpRight
} from 'lucide-react';
import { OsintEntity } from '../osintData';

interface RiskAlertTickerProps {
  entities: OsintEntity[];
  onSelectEntity: (id: string) => void;
  onSelectTab?: (tabId: string) => void;
}

export interface RiskAlert {
  id: string;
  entityId?: string;
  title: string;
  type: 'SPIKE' | 'NEW_ENTITY' | 'TRANSACTION' | 'SANCTION_MATCH';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  timestamp: Date;
  text: string;
  oldScore?: number;
  newScore?: number;
}

export default function RiskAlertTicker({ entities, onSelectEntity, onSelectTab }: RiskAlertTickerProps) {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState<string>('');
  const [showToast, setShowToast] = useState<RiskAlert | null>(null);

  // Initialize with deterministic historical alerts
  useEffect(() => {
    const initialAlerts: RiskAlert[] = [
      {
        id: 'init-1',
        entityId: 'comp-1',
        title: "ТОВ 'СпецТехПостач' — Критичний сплеск ризику",
        type: 'SPIKE',
        severity: 'CRITICAL',
        timestamp: new Date(Date.now() - 3 * 60000), // 3 min ago
        text: "Індекс загрози зріс з 82% до 94% після верифікації транзакцій з офшором Belize.",
        oldScore: 82,
        newScore: 94
      },
      {
        id: 'init-2',
        entityId: 'wallet-1',
        title: "BTC Wallet (0x38ac...d831) — Підозрілий транзит",
        type: 'TRANSACTION',
        severity: 'CRITICAL',
        timestamp: new Date(Date.now() - 15 * 60000), // 15 min ago
        text: "Зафіксовано виведення 5.1 BTC на транзитну адресу міксера Garantex.",
        newScore: 89
      },
      {
        id: 'init-3',
        entityId: 'person-1',
        title: "Коваленко Ігор Вікторович — Оголошено підозру",
        type: 'SANCTION_MATCH',
        severity: 'CRITICAL',
        timestamp: new Date(Date.now() - 45 * 60000), // 45 min ago
        text: "СБУ офіційно оголосила підозру за ст. 110-2 ККУ (Державна зрада / фінансування агресії).",
        newScore: 82
      },
      {
        id: 'init-4',
        entityId: 'comp-2',
        title: "ТОВ 'Арсенал Сек'юріті' — Ризик збільшено до 45%",
        type: 'SPIKE',
        severity: 'HIGH',
        timestamp: new Date(Date.now() - 120 * 60000), // 2 hours ago
        text: "Виявлено новий прямий зв'язок з підсанкційним директором Коваленком І.В.",
        oldScore: 38,
        newScore: 45
      },
      {
        id: 'init-5',
        entityId: 'comp-1',
        title: "Новий партнер 'SinoTech Trading (HK)'",
        type: 'NEW_ENTITY',
        severity: 'HIGH',
        timestamp: new Date(Date.now() - 240 * 60000), // 4 hours ago
        text: "Знайдено в ланцюжках постачання підсанкційних датчиків тиску ТОВ 'СпецТехПостач'."
      }
    ];

    setAlerts(initialAlerts);
    setLastAlertTime(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (selectedSeverityFilter === 'ALL') return true;
      return a.severity === selectedSeverityFilter;
    });
  }, [alerts, selectedSeverityFilter]);

  // Handle current index safely when filters change
  useEffect(() => {
    if (currentIndex >= filteredAlerts.length) {
      setCurrentIndex(0);
    }
  }, [filteredAlerts, currentIndex]);

  // Auto-play cycling mechanism
  useEffect(() => {
    if (!isPlaying || filteredAlerts.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredAlerts.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPlaying, filteredAlerts.length]);

  // Periodically simulate/inject new high-risk alerts or score spikes every 25 seconds
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      const types: RiskAlert['type'][] = ['SPIKE', 'TRANSACTION', 'NEW_ENTITY', 'SANCTION_MATCH'];
      const severities: RiskAlert['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM'];
      
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomSeverity = severities[Math.floor(Math.random() * (severities.length - 1))]; // mostly High/Critical
      
      let newAlert: RiskAlert;
      const now = new Date();

      if (randomType === 'SPIKE') {
        // Pick random entity from OSINT list
        const entitiesWithSc = entities.filter(e => e.riskScore > 30);
        const target = entitiesWithSc[Math.floor(Math.random() * entitiesWithSc.length)] || entities[0];
        const oldSc = Math.max(10, target.riskScore - Math.floor(Math.random() * 15 + 5));
        
        newAlert = {
          id: `sim-${Date.now()}`,
          entityId: target.id,
          title: `${target.name} — Раптове підвищення ризику`,
          type: 'SPIKE',
          severity: randomSeverity,
          timestamp: now,
          text: `Автоматичні комплаєнс-алгоритми зафіксували зростання індексу загрози з ${oldSc}% до ${target.riskScore}%.`,
          oldScore: oldSc,
          newScore: target.riskScore
        };
      } else if (randomType === 'TRANSACTION') {
        const wallet = entities.find(e => e.type === 'cryptowallet') || { id: 'wallet-1', name: 'BTC Wallet (0x38ac...)' };
        const amount = (Math.random() * 8 + 0.5).toFixed(2);
        newAlert = {
          id: `sim-${Date.now()}`,
          entityId: wallet.id,
          title: `Транзакція на суму ${amount} BTC з високим Exposure`,
          type: 'TRANSACTION',
          severity: 'CRITICAL',
          timestamp: now,
          text: `Адреса ${wallet.name} провела транскордонну транзакцію, пов'язану з підсанкційними сервісами РФ.`,
          newScore: 92
        };
      } else if (randomType === 'SANCTION_MATCH') {
        newAlert = {
          id: `sim-${Date.now()}`,
          title: "Синхронізація OpenSanctions — Виявлено збіг",
          type: 'SANCTION_MATCH',
          severity: 'HIGH',
          timestamp: now,
          text: "Генеральний директор пов'язаної логістичної структури отримав блокуюче розпорядження в юрисдикції ЄС."
        };
      } else {
        const companyNames = ["ТОВ 'Вектор Трейд'", "ТОВ 'ПромІмпорт'", "ТОВ 'Електрон-Захід'"];
        const chosenName = companyNames[Math.floor(Math.random() * companyNames.length)];
        newAlert = {
          id: `sim-${Date.now()}`,
          title: `Виявлено новий об'єкт ризику: ${chosenName}`,
          type: 'NEW_ENTITY',
          severity: 'HIGH',
          timestamp: now,
          text: "Зареєстровано нову офшорну структуру зі спільним бенефіціаром підсанкційної особи."
        };
      }

      setAlerts(prev => [newAlert, ...prev].slice(0, 20)); // Limit to 20 alerts
      setLastAlertTime(now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      // Trigger temporary floating toast to draw attention
      setShowToast(newAlert);
      setTimeout(() => setShowToast(null), 5000);

      // Play audio notification if enabled
      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.type = 'sine';
          // Critical gets a dual pulse, high gets a single beep
          oscillator.frequency.setValueAtTime(newAlert.severity === 'CRITICAL' ? 880 : 587.33, audioCtx.currentTime); 
          
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.4);
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.4);
        } catch (e) {
          console.log('Audio feedback error:', e);
        }
      }
    }, 20000);

    return () => clearInterval(simulationInterval);
  }, [entities, soundEnabled]);

  const activeAlert = filteredAlerts[currentIndex];

  const getSeverityBadgeClass = (severity: RiskAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-slate-800';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-slate-800';
      default:
        return 'bg-blue-500/10 text-blue-400 border-slate-800';
    }
  };

  const getTypeLabel = (type: RiskAlert['type']) => {
    switch (type) {
      case 'SPIKE': return 'РИЗИК-СПЛЕСК';
      case 'TRANSACTION': return 'ПЕРЕКАЗ';
      case 'NEW_ENTITY': return 'НОВИЙ СУБ\'ЄКТ';
      case 'SANCTION_MATCH': return 'СПИСКИ САНКЦІЙ';
    }
  };

  const handleNext = () => {
    if (filteredAlerts.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % filteredAlerts.length);
  };

  const handlePrev = () => {
    if (filteredAlerts.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + filteredAlerts.length) % filteredAlerts.length);
  };

  return (
    <div className="glass-panel-premium border-red-500/20 rounded-2xl p-2 space-y-3 relative overflow-hidden" id="risk-alert-ticker-container">
      {/* Visual pulse glow on left edge */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500/60 animate-pulse" />
      
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-2 w-2 rounded-full bg-red-500 opacity-75 animate-ping" />
            <Radio className="w-4 h-4 text-rose-500 relative z-10 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black uppercase text-slate-200 tracking-widest font-mono flex items-center gap-1.5">
              Live Стрічка Ризик-Сигналів
              <span className="text-xs bg-red-500/10 text-red-400 px-1 rounded uppercase font-bold tracking-normal animate-pulse border border-red-500/20">
                Оновлюється
              </span>
            </span>
            <p className="text-xs text-slate-500 font-mono">
              Останній сигнал: {lastAlertTime} · Моніторинг комплаєнсу 24/7
            </p>
          </div>
        </div>

        {/* Action Controls and Filters */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Severity filter tabs */}
          <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-2xl border border-slate-800/60">
            <button
              onClick={() => setSelectedSeverityFilter('ALL')}
              className={`px-2 py-1 text-xs font-mono font-bold rounded uppercase cursor-pointer transition-colors ${
                selectedSeverityFilter === 'ALL' 
                  ? 'bg-blue-600/20 text-blue-400 border border-slate-800' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Всі
            </button>
            <button
              onClick={() => setSelectedSeverityFilter('CRITICAL')}
              className={`px-2 py-1 text-xs font-mono font-bold rounded uppercase cursor-pointer transition-colors ${
                selectedSeverityFilter === 'CRITICAL' 
                  ? 'bg-rose-600/20 text-rose-400 border border-slate-800' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Критичні
            </button>
            <button
              onClick={() => setSelectedSeverityFilter('HIGH')}
              className={`px-2 py-1 text-xs font-mono font-bold rounded uppercase cursor-pointer transition-colors ${
                selectedSeverityFilter === 'HIGH' 
                  ? 'bg-amber-600/20 text-amber-400 border border-slate-800' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Високі
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-2xl border transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-rose-500/10 text-rose-400 border-slate-800' 
                : 'bg-slate-950/80 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={soundEnabled ? "Вимкнути звук сповіщень" : "Увімкнути звук сповіщень"}
          >
            {soundEnabled ? <Bell className="w-3.5 h-3.5 animate-bounce" /> : <BellOff className="w-3.5 h-3.5" />}
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-2xl border transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-blue-500/10 text-blue-400 border-slate-800' 
                : 'bg-slate-950/80 text-slate-500 border-slate-800'
            }`}
            title={isPlaying ? "Пауза трансляції" : "Продовжити трансляцію"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 animate-pulse" />}
          </button>

          {/* Nav chevrons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={filteredAlerts.length <= 1}
              className="p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-400 px-1">
              {filteredAlerts.length > 0 ? `${currentIndex + 1}/${filteredAlerts.length}` : '0/0'}
            </span>
            <button
              onClick={handleNext}
              disabled={filteredAlerts.length <= 1}
              className="p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Ticker Area with interactive item */}
      <div className="bg-black/30 rounded-2xl p-2 border border-slate-800 min-h-[76px] flex items-center justify-between gap-2">
        {filteredAlerts.length === 0 ? (
          <div className="flex items-center justify-center w-full py-2 text-slate-500 font-mono text-xs">
            <Info className="w-4 h-4 mr-1.5 text-slate-600" />
            Немає сигналів, що відповідають фільтру
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAlert.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityBadgeClass(activeAlert.severity)}`}>
                    {activeAlert.severity}
                  </span>
                  <span className="text-xs font-mono bg-slate-900/40 backdrop-blur-md border border-slate-800/60 text-slate-400 px-1 py-0.5 rounded font-bold">
                    {getTypeLabel(activeAlert.type)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(activeAlert.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  {activeAlert.title}
                  {activeAlert.newScore && (
                    <span className="text-rose-400 text-xs font-black font-mono">
                      ({activeAlert.newScore}%)
                    </span>
                  )}
                </h4>
                
                <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-1">
                  {activeAlert.text}
                </p>
              </div>

              {/* Action trigger for the active alert */}
              {activeAlert.entityId && (
                <div className="shrink-0 flex items-center gap-2 self-end md:self-auto">
                  {activeAlert.oldScore && activeAlert.newScore && (
                    <div className="flex items-center gap-1 font-mono text-xs bg-red-950/10 border border-red-500/20 px-2 py-1 rounded-2xl">
                      <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-slate-400">{activeAlert.oldScore}%</span>
                      <span className="text-slate-500">&rarr;</span>
                      <span className="text-red-400 font-black">{activeAlert.newScore}%</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (activeAlert.entityId) {
                        onSelectEntity(activeAlert.entityId);
                        if (onSelectTab) onSelectTab('volumes'); // switch to details or appropriate view
                      }
                    }}
                    className="flex items-center gap-1 text-xs font-mono font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-slate-800 px-2.5 py-1.5 rounded-2xl transition-all cursor-pointer"
                  >
                    Дослідити
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating alert toast simulation for new events */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-4 right-4 left-4 bg-rose-950/95 border border-red-500/30 rounded-2xl p-2 shadow-2xl flex items-center gap-2 z-50 backdrop-blur-md"
          >
            <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-400 animate-pulse shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs bg-red-600 text-white font-bold px-1 rounded uppercase tracking-wider animate-ping">НАЖИВО</span>
                <span className="text-xs font-bold text-red-400 font-mono">ШІ СИГНАЛ ТРИВОГИ</span>
              </div>
              <h5 className="text-xs font-bold text-white truncate">{showToast.title}</h5>
              <p className="text-xs text-slate-300 line-clamp-1">{showToast.text}</p>
            </div>
            <button
              onClick={() => {
                if (showToast.entityId) {
                  onSelectEntity(showToast.entityId);
                  if (onSelectTab) onSelectTab('volumes');
                }
                setShowToast(null);
              }}
              className="shrink-0 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase px-2.5 py-1.5 rounded-2xl transition-all cursor-pointer font-mono"
            >
              Переглянути
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
