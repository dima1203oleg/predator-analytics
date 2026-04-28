
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, ChevronRight, RefreshCw, Sparkles, ShieldAlert, Activity, Search, Code, Zap, Globe, LayoutGrid, Server, Database, Trophy, Bot, Sword, Layers } from 'lucide-react';
import { CommandLog, TabView } from '../types';

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onLock?: () => void;
  onLogout?: () => void;
  onReboot?: () => void;
  onNavigate?: (tab: TabView) => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ isOpen, onClose, onLock, onLogout, onReboot, onNavigate }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'init',
      command: 'nexus --version',
      output: <span className="text-cyan-500 font-black tracking-widest uppercase">
        PREDATOR v58.2-WRAITH NEXUS | ЯД� О СТ� АТЕГІЧНОЇ АНАЛІТИКИ<br />
        <span className="text-white/40 text-[10px]">КЕ� НЕЛЬ: NEXUS-OS 1.0.4-PREDATOR (x86_64)</span><br />
        <span className="text-white/40 text-[10px]">ВУЗОЛ: NEXUS-PRIME-01 [ACTIVE]</span><br />
        <span className="text-white/40 text-[10px]">МОВА: uk_UA.UTF-8</span><br />
        <span className="text-cyan-400 mt-2 block italic">Введіть 'help' для переліку доступних команд.</span>
      </span>,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Command History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [matrixMode, setMatrixMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- MATRIX RAIN EFFECT ---
  useEffect(() => {
    if (!matrixMode || !isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    window.addEventListener('resize', resize);
    resize(); // Initial sizing

    const fontSize = 14;
    // Recalculate columns based on width
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);
    const chars = "0123456789ABCDEFｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";

    const draw = () => {
      // Translucent black background for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f0'; // Matrix Green
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    // Start animation loop
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [matrixMode, isOpen]);

  const handleCommand = (e: React.FormEvent | React.MouseEvent, overrideCmd?: string) => {
    e.preventDefault();
    const cmdToProcess = overrideCmd || input;

    if (!cmdToProcess.trim()) return;

    const cmd = cmdToProcess.trim();
    const cmdLower = cmd.toLowerCase();

    setHistory(prev => {
      const last = prev[prev.length - 1];
      if (last !== cmd) return [...prev, cmd];
      return prev;
    });
    setHistoryIndex(-1);

    // Special Matrix Toggle
    if (cmdLower === 'matrix') {
      setMatrixMode(!matrixMode);
      const newLog: CommandLog = {
        id: Date.now().toString(),
        command: cmd,
        output: <span className="text-green-500 font-bold">The Matrix has you... [Матриця за тобою стежить]</span>,
        timestamp: new Date().toLocaleTimeString()
      };
      setLogs(prev => [...prev, newLog]);
      setInput('');
      return;
    }

    const newLog: CommandLog = {
      id: Date.now().toString(),
      command: cmd,
      output: processCommand(cmdLower),
      timestamp: new Date().toLocaleTimeString()
    };

    setLogs(prev => [...prev, newLog]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  const processCommand = (cmd: string): React.ReactNode => {
    // Navigation Commands
    if (cmd.startsWith('go ') || cmd.startsWith('open ')) {
      const target = cmd.split(' ')[1];
      if (onNavigate) {
        switch (target) {
          case 'dashboard': onNavigate(TabView.DASHBOARD); return 'Перенаправлення на Панель...';
          case 'god': case 'super': onNavigate(TabView.SUPER_INTELLIGENCE); return 'Вхід у � ежим Бога...';
          case 'analytics': case 'scan': onNavigate(TabView.ANALYTICS); return 'Відкриття Глибинного Сканування...';
          case 'devops': case 'infra': onNavigate(TabView.DEVOPS); return 'Відкриття Інженерного Хабу...';
          case 'brain': case 'council': onNavigate(TabView.SYSTEM_BRAIN); return 'Виклик � ади...';
          case 'nas': onNavigate(TabView.NAS); return 'Відкриття NAS Арени...';
          case 'security': case 'defcon': onNavigate(TabView.SECURITY); return 'Відкриття Центру Безпеки...';
          case 'chat': case 'user': onNavigate(TabView.USER_PORTAL); return 'Перемикання на Виконавчий � ежим...';
          default: return <span className="text-yellow-500">Невідомий розділ. Спробуйте: dashboard, god, analytics, devops, brain</span>;
        }
      }
    }

    if (cmd.startsWith('scan')) {
      return <div className="text-blue-400">Ініціалізація Глибинного Сканування... [====================] 100%<br />Критичних загроз не виявлено.</div>;
    }

    switch (cmd) {
      case 'help': return <span className="text-cyan-500 font-bold uppercase tracking-widest text-[10px]">
        ДОСТУПНІ П� ОТОКОЛИ NEXUS:<br />
        - go [target]: СТ� АТЕГІЧНА НАВІГАЦІЯ (напр., 'go analytics')<br />
        - status: АУДИТ ЯД� А ТА СИСТЕМИ<br />
        - scan: ГЛИБИННЕ ПОШУКОВЕ СКАНУВАННЯ<br />
        - lock: МИТТЄВЕ БЛОКУВАННЯ ЯД� А<br />
        - clear: ОЧИЩЕННЯ БУФЕ� У ЛОГІВ
      </span>;
      case 'clear': setLogs([]); return null;
      case 'status': return <span className="text-cyan-400 font-black tracking-widest uppercase">БОЙОВА ГОТОВНІСТЬ 100%. ВСІ МОДУЛІ NEXUS ПІДКЛЮЧЕНО.</span>;
      case 'lock': onLock && onLock(); onClose(); return "Блокування...";
      case 'reboot': onReboot && onReboot(); onClose(); return "Перезавантаження...";
      default: return <span className="text-red-500 font-black uppercase tracking-widest">ПОМИЛКА: НЕВІДОМИЙ П� ОТОКОЛ {cmd}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-start justify-center pt-safe pb-safe"
      onClick={onClose}
    >
      <div
        className={`w-full h-[100dvh] md:h-auto md:max-w-4xl border rounded-2xl shadow-[0_0_100px_var(--op-glow)] flex flex-col md:max-h-[700px] mt-0 md:mt-16 transition-all duration-500 terminal-card overflow-hidden ${matrixMode ? 'bg-black border-[var(--op-primary)]' : 'bg-[var(--op-bg-panel)] border-[var(--op-border)]'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner-nexus hud-corner-tl" />
        <div className="hud-corner-nexus hud-corner-tr" />
        <div className="hud-corner-nexus hud-corner-bl" />
        <div className="hud-corner-nexus hud-corner-br" />
        {/* Matrix Canvas Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {matrixMode && <canvas ref={canvasRef} className="w-full h-full opacity-30" />}
        </div>

        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b shrink-0 select-none relative z-10 ${matrixMode ? 'bg-black border-cyan-900 text-cyan-500' : 'bg-[#020817] border-cyan-500/10'}`}>
          <div className="flex items-center gap-4 px-2">
            <div className={`p-2 rounded-lg ${matrixMode ? 'bg-cyan-900/20 text-cyan-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <Terminal size={18} />
            </div>
            <span className={`text-[11px] font-mono font-black uppercase tracking-widest ${matrixMode ? 'text-cyan-500' : 'text-slate-100'}`}>
              root@nexus-core:~ {matrixMode ? '[NEXUS_MATRIX]' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMatrixMode(!matrixMode)} className={`p-1.5 rounded hover:bg-white/10 transition-colors btn-3d ${matrixMode ? 'text-green-500' : 'text-slate-400'}`} title="Переключити Матрицю">
              <Code size={16} />
            </button>
            <button onClick={onClose} className={`p-1.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors btn-3d ${matrixMode ? 'text-green-500' : 'text-slate-400'}`}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          className="flex-1 p-4 overflow-y-auto font-mono text-sm relative z-10"
          onClick={() => inputRef.current?.focus()}
        >
          {logs.map((log) => (
            <div key={log.id} className="mb-2 break-words">
              <div className={`flex items-center gap-2 mb-0.5 text-[10px] ${matrixMode ? 'text-green-800' : 'text-slate-500'}`}>
                <span>{log.timestamp}</span>
                <ChevronRight size={10} />
              </div>
              <div className="flex gap-2 font-bold">
                <span className={matrixMode ? 'text-green-600' : 'text-primary-500'}>➜</span>
                <span className={matrixMode ? 'text-green-400' : 'text-slate-200'}>{log.command}</span>
              </div>
              {log.output && (
                <div className={`mt-1 pl-5 border-l-2 ${matrixMode ? 'text-green-300 border-green-900' : 'text-slate-300 border-slate-700'}`}>
                  {log.output}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Navigation Hints */}
        <div className={`p-2 border-t ${matrixMode ? 'border-green-900 bg-black' : 'border-slate-800 bg-slate-900'} relative z-10 overflow-x-auto`}>
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="text-slate-500 px-2">Швидка Навігація:</span>
            <button onClick={(e) => handleCommand(e, 'go god')} className="text-purple-400 hover:text-purple-300">go god</button>
            <button onClick={(e) => handleCommand(e, 'go brain')} className="text-blue-400 hover:text-blue-300">go brain</button>
            <button onClick={(e) => handleCommand(e, 'go nas')} className="text-yellow-400 hover:text-yellow-300">go nas</button>
            <button onClick={(e) => handleCommand(e, 'go devops')} className="text-orange-400 hover:text-orange-300">go devops</button>
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleCommand} className={`p-3 border-t flex items-center gap-2 shrink-0 relative z-10 ${matrixMode ? 'bg-black border-green-900' : 'bg-slate-900 border-slate-800'}`}>
          <span className={`font-bold pl-2 select-none animate-pulse ${matrixMode ? 'text-green-500' : 'text-primary-500'}`}>➜</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 bg-transparent border-none font-mono focus:ring-0 text-base md:text-sm ${matrixMode ? 'text-green-400 placeholder-green-900' : 'text-slate-200 placeholder-slate-600'}`}
            placeholder={matrixMode ? "Слідуйте за білим кроликом..." : "Введіть команду або 'go [view]'..."}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
};

export default CommandCenter;
