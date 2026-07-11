'use client';

import { useState, useEffect } from 'react';
import { usePredatorSounds } from '@/hooks/usePredatorSounds';

interface VideoIntroScreenProps {
  onComplete: () => void;
}

export function VideoIntroScreen({ onComplete }: VideoIntroScreenProps) {
  const { playClick, playScan, playAccessGranted } = usePredatorSounds();
  const [logs, setLogs] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [systemLoaded, setSystemLoaded] = useState(false);

  const logDatabase = [
    'ІНІЦІАЛІЗАЦІЯ ЯДРА PREDATOR COGNITIVE LAYER...',
    'ПЕРЕВІРКА ПАМ\'ЯТІ VRAM: 8.0 GB ЗНАЙДЕНО (VRAM GUARD АКТИВНИЙ)',
    'НАЛАШТУВАННЯ КАНАЛІВ КЕРУВАННЯ KAGGLE STANDBY...',
    'З\'ЄДНАННЯ З НЕЙРОМЕРЕЖЕЮ NEMOTRON MOE: OK',
    'ВСТАНОВЛЕННЯ ЗВ\'ЯЗКУ З КЛАССТЕРАМИ: POSTGRES & CLICKHOUSE...',
    'ОТРИМАННЯ OSINT МЕТАДАНИХ: МИТНИЙ МОНІТОРИНГ УКРАЇНИ...',
    'СИСТЕМА ГОТОВА ДО БІОМЕТРИЧНОЇ АУТЕНТИФІКАЦІЇ'
  ];

  // Поступове виведення логів завантаження
  useEffect(() => {
    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logDatabase.length) {
        setLogs(prev => [...prev, logDatabase[currentLogIndex]]);
        playClick();
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setSystemLoaded(true);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const handleStartScan = () => {
    if (!systemLoaded || scanning) return;
    setScanning(true);
    playScan();
  };

  useEffect(() => {
    if (scanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            playAccessGranted();
            setTimeout(() => {
              onComplete();
            }, 800);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [scanning]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-8 font-mono select-none overflow-hidden">
      {/* Декоративна кібер-сітка */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,5,5,0.4)_0%,rgba(0,0,0,1)_85%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none" />

      {/* Верхня панель HUD */}
      <div className="relative z-10 flex justify-between items-start border-b border-red-500/20 pb-4">
        <div>
          <div className="text-red-500 text-xs tracking-[0.25em] uppercase">МИТНА БЕЗПЕКА УКРАЇНИ</div>
          <div className="text-red-600 font-bold text-2xl tracking-[0.4em] mt-1">PREDATOR ELITE v56.5</div>
        </div>
        <div className="text-right">
          <div className="text-red-500 text-xs tracking-widest">АВТОНОМНИЙ РЕЖИМ</div>
          <div className="text-red-600 font-bold text-sm mt-1 animate-pulse">З\'ЄДНАННЯ З NVIDIA SERVER: АКТИВНЕ</div>
        </div>
      </div>

      {/* Центральна консоль аутентифікації */}
      <div className="relative z-10 flex flex-col items-center my-auto">
        {!scanning ? (
          <div className="flex flex-col items-center">
            {/* Анімований біометричний сканер */}
            <div 
              onClick={handleStartScan}
              className={`w-48 h-48 rounded-full border-2 ${
                systemLoaded 
                  ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] cursor-pointer hover:scale-105' 
                  : 'border-red-950 opacity-40 cursor-not-allowed'
              } flex flex-col items-center justify-center relative transition-all duration-500 group`}
            >
              {/* Кругові шкали, що обертаються */}
              {systemLoaded && (
                <>
                  <div className="absolute inset-2 border border-dashed border-red-500/40 rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-4 border border-red-500/20 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
                </>
              )}
              
              {/* Значок відбитка / Ока */}
              <div className="text-red-500 text-4xl animate-pulse">
                {systemLoaded ? '👁️' : '🔒'}
              </div>

              {systemLoaded && (
                <div className="absolute bottom-6 text-[9px] text-red-500/70 tracking-widest font-mono text-center px-4">
                  НАТИСНІТЬ ДЛЯ СКАНУВАННЯ БІО-ПРОФІЛЮ
                </div>
              )}
            </div>

            <div className="mt-8 text-center max-w-md h-12">
              {systemLoaded ? (
                <p className="text-red-400 text-sm tracking-widest animate-pulse font-bold">
                  ПОТРІБНА БІОМЕТРИЧНА ІДЕНТИФІКАЦІЯ
                </p>
              ) : (
                <p className="text-red-500/50 text-xs tracking-widest animate-pulse">
                  ЗАВАНТАЖЕННЯ СИСТЕМНИХ СЕРВІСІВ...
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-64">
            {/* Екран процесу сканування */}
            <div className="w-full bg-red-950/20 border border-red-500/40 p-4 rounded relative overflow-hidden backdrop-blur-md">
              {/* Бігуча лінія сканера */}
              <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-[bounce_2s_infinite]" />
              
              <div className="text-center font-mono text-xs text-red-500 mb-2">
                СКАНИРУВАННЯ СІТКІВКИ ОКА...
              </div>
              <div className="w-full bg-red-950/50 h-2 rounded overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all duration-100 shadow-[0_0_8px_#ef4444]" 
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <div className="text-right text-red-400 text-[10px] mt-1">
                {scanProgress}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Нижня консоль з логами */}
      <div className="relative z-10 w-full max-w-3xl mx-auto bg-black/60 border border-red-500/10 p-4 rounded h-40 overflow-y-auto backdrop-blur-sm shadow-[inset_0_0_10px_rgba(255,0,0,0.05)]">
        <div className="text-red-500/40 text-[10px] border-b border-red-500/10 pb-1 mb-2 tracking-wider">
          ЛОГ ЗАВАНТАЖЕННЯ СИСТЕМИ PREDATOR-ELITE
        </div>
        <div className="space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="text-red-500/90 text-xs flex items-center space-x-2">
              <span className="text-red-500 font-bold">[ OK ]</span>
              <span className="tracking-wide">{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Нижня інформаційна стрічка */}
      <div className="relative z-10 flex justify-between items-center border-t border-red-500/10 pt-4 text-[10px] text-red-500/50">
        <span>SECURITY PROTOCOL: v56.5-ELITE</span>
        <span>LOCATION: COMPUTE NODE SYSTEM</span>
        <span>DATE: {new Date().toLocaleDateString('uk-UA')}</span>
      </div>
    </div>
  );
}
