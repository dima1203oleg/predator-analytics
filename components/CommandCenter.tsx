
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, ChevronRight, RefreshCw, Sparkles, ShieldAlert, Activity, Search, Code, Zap } from 'lucide-react';
import { CommandLog } from '../types';

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onLock?: () => void;
  onLogout?: () => void;
  onReboot?: () => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ isOpen, onClose, onLock, onLogout, onReboot }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<CommandLog[]>([
    { 
      id: 'init', 
      command: 'system info', 
      output: <span className="text-slate-400">Predator Analytics v18.6 [Truth-Only Edition]<br/>Kernel: Linux 5.15.0-generic (x86_64)<br/>Node: k3s-master-01 [ONLINE]<br/>Locale: uk_UA.UTF-8</span>, 
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
      if (!matrixMode || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

      const fontSize = 14;
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
      };

      const interval = setInterval(draw, 33);

      return () => clearInterval(interval);
  }, [matrixMode, isOpen]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim(); 
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
            output: <span className="text-green-500 font-bold">The Matrix has you...</span>,
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
    if (cmd.startsWith('scan')) {
        return <div className="text-blue-400">Initiating Deep Scan... [====================] 100%<br/>No critical threats found.</div>;
    }
    switch (cmd) {
      case 'help': return <span className="text-primary-400">Available: status, scan, agents, matrix, clear, lock, reboot</span>;
      case 'clear': setLogs([]); return null;
      case 'status': return <span className="text-success-500">ALL SYSTEMS OPERATIONAL. G-01 PROTOCOL ACTIVE.</span>;
      case 'lock': onLock && onLock(); onClose(); return "Locking...";
      case 'reboot': onReboot && onReboot(); onClose(); return "Rebooting...";
      default: return <span className="text-red-500">Command not found: {cmd}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-safe pb-safe" 
        onClick={onClose}
    >
      <div 
          className={`w-full h-[100dvh] md:h-auto md:max-w-4xl border rounded-xl shadow-2xl overflow-hidden flex flex-col md:max-h-[700px] mt-0 md:mt-16 transition-all duration-300 panel-3d ${matrixMode ? 'bg-black border-green-500/50 shadow-[0_0_50px_rgba(0,255,0,0.2)]' : 'bg-slate-950 border-slate-700'}`}
          onClick={e => e.stopPropagation()}
      >
        {/* Matrix Canvas Background */}
        {matrixMode && <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-30" />}

        {/* Header */}
        <div className={`p-3 flex items-center justify-between border-b shrink-0 select-none relative z-10 ${matrixMode ? 'bg-black border-green-900 text-green-500' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-3 px-2">
            <div className={`p-1.5 rounded ${matrixMode ? 'bg-green-900/20 text-green-500' : 'bg-slate-800 text-slate-400 icon-3d'}`}>
                <Terminal size={16} />
            </div>
            <span className={`text-xs font-mono font-bold ${matrixMode ? 'text-green-500' : 'text-slate-200'}`}>
                root@predator-core:~ {matrixMode ? '[MATRIX_MODE]' : ''}
            </span>
          </div>
          <div className="flex gap-2">
              <button onClick={() => setMatrixMode(!matrixMode)} className={`p-1.5 rounded hover:bg-white/10 transition-colors btn-3d ${matrixMode ? 'text-green-500' : 'text-slate-400'}`} title="Toggle Matrix">
                  <Code size={16} />
              </button>
              <button onClick={onClose} className={`p-1.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors btn-3d ${matrixMode ? 'text-green-500' : 'text-slate-400'}`}>
                  <X size={16} />
              </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
            className="flex-1 p-4 overflow-y-auto font-mono text-sm custom-scrollbar relative z-10"
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
            placeholder={matrixMode ? "Follow the white rabbit..." : "Введіть команду..."}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
};

export default CommandCenter;
