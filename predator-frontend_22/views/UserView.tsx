import React, { useState } from 'react';
import { ChatWithAvatar } from '../components/user/ChatWithAvatar';
import { InsightsPanel } from '../components/user/InsightsPanel';
import { DailyGazette } from '../components/user/DailyGazette';
import { Zap, TrendingUp, DollarSign, LogOut, ShieldAlert, MessageSquare, X, Maximize2, Minimize2, Radio } from 'lucide-react';

const UserView: React.FC = () => {
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);

  // Mock handler for Gazette asking AI
  const handleGazetteQuery = (text: string) => {
      console.log("Gazette Query:", text);
      setIsMobileChatOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden relative pb-safe transition-all duration-700">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#020617_80%)] pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none z-0 animate-pulse-slow"></div>
      
      {/* Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[100px] pointer-events-none rounded-full"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] pointer-events-none rounded-full"></div>

      {/* Top Executive Bar (Hidden in Cinema Mode) */}
      <div className={`sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 py-3 md:py-4 border-b border-slate-800/50 bg-[#0D0F12]/80 backdrop-blur-xl transition-all duration-500 ${cinemaMode ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent flex items-center justify-center text-amber-500 font-bold font-display shadow-[0_0_15px_rgba(245,158,11,0.2)]">P</div>
              <div>
                  <h1 className="text-base md:text-lg font-display font-bold text-white tracking-widest leading-none flex items-center gap-2">
                      PREDATOR <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">EXEC</span>
                  </h1>
                  <span className="text-[9px] text-amber-500/80 font-mono tracking-[0.3em] uppercase flex items-center gap-2">
                      <Radio size={8} className="animate-pulse" /> Secure Channel
                  </span>
              </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
              {/* Cinema Mode Toggle */}
              <button 
                onClick={() => setCinemaMode(!cinemaMode)}
                className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white border border-slate-800 hover:border-amber-500/50 px-3 py-1.5 rounded-lg bg-slate-900/50 transition-all active:scale-95"
              >
                  {cinemaMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  {cinemaMode ? 'EXIT FOCUS' : 'FOCUS MODE'}
              </button>

              <button 
                onClick={() => setIsMobileChatOpen(true)}
                className="lg:hidden p-2 text-amber-400 hover:text-white border border-amber-500/30 rounded bg-amber-900/10 active:scale-95 transition-all"
              >
                  <MessageSquare size={18} />
              </button>

              <div className="hidden md:block h-6 w-[1px] bg-slate-800"></div>
              
              <div className="text-[10px] md:text-xs font-bold text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-lg bg-amber-900/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                  VIP ACCESS
              </div>
          </div>
      </div>

      {/* Main Content Flow */}
      <div className={`relative z-10 flex flex-col lg:grid lg:grid-cols-12 gap-6 p-4 md:p-6 w-full max-w-[1920px] mx-auto transition-all duration-500 ${cinemaMode ? 'h-screen p-0' : ''}`}>
        
        {/* LEFT: Executive Chat (Expandable) */}
        <div className={`
            transition-all duration-500 ease-in-out
            ${cinemaMode ? 'lg:col-span-12 lg:h-screen lg:fixed lg:inset-0 lg:z-[60]' : 'lg:col-span-4 lg:h-[calc(100vh-120px)] lg:sticky lg:top-24'}
            fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none
            ${!cinemaMode && (isMobileChatOpen ? 'translate-x-0 pt-safe' : '-translate-x-full lg:translate-x-0')}
            lg:block
        `}>
            {/* Mobile Header for Chat */}
            <div className="flex lg:hidden justify-between items-center p-4 border-b border-slate-800">
                <span className="text-sm font-bold text-amber-500 font-display uppercase tracking-widest">Виконавчий Канал</span>
                <button onClick={() => setIsMobileChatOpen(false)} className="p-2 text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Cinema Exit Button */}
            {cinemaMode && (
                <button 
                    onClick={() => setCinemaMode(false)}
                    className="absolute top-6 right-6 z-[70] p-3 bg-black/50 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-700 rounded-full backdrop-blur-md transition-all"
                >
                    <Minimize2 size={24} />
                </button>
            )}

            <div className="h-full flex flex-col p-4 lg:p-0">
                <ChatWithAvatar />
            </div>
        </div>

        {/* CENTER: Director Hub (Hidden in Cinema Mode) */}
        {!cinemaMode && (
            <div className="lg:col-span-8 flex flex-col gap-6 w-full animate-in slide-in-from-right-4 duration-500">
                
                {/* Top: KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col panel-3d hover:border-green-500/30 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Чистий Дохід</span>
                            <div className="p-1.5 bg-green-500/10 rounded text-green-500 group-hover:scale-110 transition-transform"><TrendingUp size={14} /></div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="text-2xl font-mono font-bold text-white group-hover:text-green-400 transition-colors">+12%</div>
                            <div className="text-[10px] text-green-600 mb-1">за тиждень</div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col panel-3d hover:border-amber-500/30 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Витрати</span>
                            <div className="p-1.5 bg-amber-500/10 rounded text-amber-500 group-hover:scale-110 transition-transform"><DollarSign size={14} /></div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="text-2xl font-mono font-bold text-white group-hover:text-amber-400 transition-colors">$42k</div>
                            <div className="text-[10px] text-slate-500 mb-1">прогноз</div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col panel-3d hover:border-red-500/30 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Загрози</span>
                            <div className="p-1.5 bg-red-500/10 rounded text-red-500 group-hover:scale-110 transition-transform animate-pulse"><ShieldAlert size={14} /></div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="text-2xl font-mono font-bold text-white group-hover:text-red-400 transition-colors">3</div>
                            <div className="text-[10px] text-red-500 mb-1">активні</div>
                        </div>
                    </div>
                </div>

                {/* Daily Gazette */}
                <div className="w-full bg-[#0D0F12]/60 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg relative overflow-hidden min-h-[400px] panel-3d group">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 group-hover:h-1 transition-all duration-300"></div>
                    <div className="p-1 h-full">
                        <DailyGazette onAskAI={handleGazetteQuery} />
                    </div>
                </div>

                {/* Bottom: Insights Engine */}
                <div className="flex-1">
                    <InsightsPanel />
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default UserView;