import { Button } from '@/components/ui/button';
import React from 'react';
import { Mic, MicOff, Volume2, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useWebSocketAudio } from '../../../hooks/useWebSocketAudio';

export const VoiceControls: React.FC = () => {
  const { 
    isStreaming, 
    wsStatus, 
    startStreaming, 
    stopStreaming 
  } = useWebSocketAudio();

  const toggleStreaming = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-full px-4 py-2 pointer-events-auto">
      <Button variant="cyber"
        onClick={toggleStreaming}
        disabled={wsStatus === 'CONNECTING'}
        className={`flex items-center justify-center p-2 rounded-full transition-all ${
          isStreaming 
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
        }`}
        title={isStreaming ? "Вимкнути стрімінг" : "Увімкнути стрімінг голосу"}
      >
        {isStreaming ? <MicOff size={20} /> : <Mic size={20} />}
      </Button>

      <div className="flex flex-col">
        <span className="text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1">
          Голосовий Модуль
          {wsStatus === 'CONNECTED' && <Wifi size={10} className="text-emerald-400" />}
          {wsStatus === 'DISCONNECTED' && <WifiOff size={10} className="text-slate-500" />}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {wsStatus === 'CONNECTING' ? 'ПІДКЛЮЧЕННЯ...' : isStreaming ? 'ПОТІК АКТИВНИЙ (VAD)' : 'ВІДКЛЮЧЕНО'}
        </span>
      </div>

      {wsStatus === 'CONNECTING' && (
        <Loader2 size={16} className="text-emerald-400 animate-spin ml-2" />
      )}
      {!isStreaming && wsStatus !== 'CONNECTING' && (
        <Volume2 size={16} className="text-slate-500 ml-2" />
      )}
    </div>
  );
};
