import React, { useState, useRef, useEffect } from "react";
import { Terminal, Shield, Activity, Radio, Cpu } from "lucide-react";

interface Message {
  text: string;
  sender: "USER" | "AI";
  timestamp: string;
}

interface HUDProps {
  chatHistory: Message[];
  isProcessing: boolean;
  systemStatus: "HEALTHY" | "RISK";
  onSubmit: (text: string) => void;
}

export const HUD: React.FC<HUDProps> = ({ chatHistory, isProcessing, systemStatus, onSubmit }) => {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      onSubmit(input);
      setInput("");
    }
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none font-mono flex flex-col justify-between p-6 text-slate-200">
      
      {/* 1. ВЕРХНІЙ СТАТУС-БАР СУВЕРЕННОГО СЕРВЕРА */}
      <div className="w-full flex justify-between items-center bg-black/60 backdrop-blur-md border border-cyan-500/20 p-4 rounded-md pointer-events-auto shadow-[0_0_15px_rgba(0,245,255,0.05)]">
        <div className="flex items-center gap-3">
          <Shield className={`w-6 h-6 ${systemStatus === "RISK" ? "text-purple-500 animate-pulse" : "text-cyan-400"}`} />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest">Sovereign Matrix Core</div>
            <div className="text-sm font-bold tracking-wider">PREDATOR v66.0-ELITE</div>
          </div>
        </div>
        
        <div className="flex gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-cyan-400" /> GPU: <span className="text-white font-bold">78%</span></div>
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> INGEST: <span className="text-white font-bold">500 TB/s</span></div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-ping" /> 
            STATUS: <span className={systemStatus === "RISK" ? "text-purple-500 font-bold" : "text-emerald-400 font-bold"}>{systemStatus}</span>
          </div>
        </div>
      </div>

      {/* 2. ГОЛОВНИЙ ЦЕНТРАЛЬНИЙ КОНТУР: CHAT & ТАКТИЧНІ МІСІЇ */}
      <div className="w-full flex justify-between gap-6 h-[65vh] my-4 items-end">
        
        {/* ЛІВА ЧАТ-КОНСОЛЬ */}
        <div className="w-[380px] bg-black/80 border border-cyan-500/30 backdrop-blur-md rounded p-4 flex flex-col justify-between h-full pointer-events-auto shadow-[0_0_20px_rgba(0,245,255,0.05)]">
          <div className="text-xs uppercase text-cyan-400 tracking-widest border-b border-cyan-500/20 pb-2 mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> AI Когнітивна Панель
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs scrollbar-thin scrollbar-thumb-cyan-500/20">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"}`}>
                <div className={`p-2.5 rounded max-w-[85%] border ${
                  msg.sender === "USER" 
                    ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-200" 
                    : "bg-purple-950/40 border-purple-500/30 text-purple-200"
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isProcessing && (
              <div className="text-cyan-400 animate-pulse text-[10px] tracking-widest uppercase py-2">
                ⚡ Когнітивний аналіз матриці...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ПРАВА ПАНЕЛЬ ОПЕРАТИВНИХ КВЕСТІВ */}
        <div className="w-[320px] bg-black/80 border border-purple-500/20 backdrop-blur-md rounded p-4 h-full pointer-events-auto flex flex-col">
          <div className="text-xs uppercase text-purple-400 tracking-widest border-b border-purple-500/20 pb-2 mb-3">
            🎯 Тактичний Хаб Місій
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            <div className="border border-purple-500/30 bg-purple-950/20 p-3 rounded">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Операція: Офшорний Розрив</div>
              <div className="text-[11px] text-slate-400 mt-1">ТОВ "ЕНЕРДЖІ-ГРУП" — зафіксовано кругові рейси палива на $45.0 млн.</div>
              <div className="mt-2 bg-purple-500/20 h-1.5 w-full rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-3/4 animate-pulse"></div>
              </div>
            </div>
            <div className="border border-cyan-500/20 bg-cyan-950/10 p-3 rounded opacity-60">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Місія: Контрагент-Х</div>
              <div className="text-[11px] text-slate-400 mt-1">Сканування митних декларацій та ліній зв'язків РНБО.</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. НИЖНЯ КОНСОЛЬ КЕРУВАННЯ КОМАНДАМИ */}
      <div className="w-full bg-black/70 backdrop-blur-md border border-cyan-500/30 p-2.5 rounded pointer-events-auto flex items-center gap-3 shadow-[0_0_15px_rgba(0,245,255,0.1)]">
        <div className="text-xs text-cyan-400 font-bold uppercase px-3 tracking-widest border-r border-cyan-500/20">
          [Консоль]
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isProcessing}
          placeholder="Введіть команду до Суверенного Ядра (напр. 'Покажи зв'язки ТОВ Енерджі-Груп')..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-cyan-100 placeholder-cyan-700/50 font-mono disabled:opacity-50"
        />
        {isProcessing && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping mr-2" />}
      </div>
    </div>
  );
};
