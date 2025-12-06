
import React, { useState, useEffect, useRef } from 'react';
import { AvatarShell } from '../avatar/AvatarShell';
import { useCouncilChat } from '../../hooks/useCouncilChat';
import { Send, Mic, MicOff, Bot, Activity, BrainCircuit } from 'lucide-react';
import { useVoiceControl } from '../../hooks/useVoiceControl';

// Chat message type for local UI state
interface ChatMsg {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

export const ChatWithAvatar: React.FC = () => {
    const { 
        status: councilStatus, 
        avatarEmotion, 
        lastResult, 
        audioUrl, 
        sendMessage, 
        handleSpeechEnd,
        setAvatarEmotion
    } = useCouncilChat();

    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: 'init', role: 'ai', text: 'Council Online. I am listening, Director.' }
    ]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Voice Input Integration
    const [voiceStatus, setVoiceStatus] = useState<any>('IDLE');
    const { startListening, stopListening, speak } = useVoiceControl(
        voiceStatus,
        setVoiceStatus,
        (text) => {
            setInput(text);
            handleSend(text);
        }
    );

    // --- STATE SYNCHRONIZATION ---

    // 1. Sync Voice Input Status with Avatar
    useEffect(() => {
        if (voiceStatus === 'LISTENING') {
            setAvatarEmotion('listening');
        } else if (councilStatus === 'IDLE' && voiceStatus === 'IDLE' && avatarEmotion === 'listening') {
            setAvatarEmotion('idle');
        }
    }, [voiceStatus, councilStatus, avatarEmotion, setAvatarEmotion]);

    // 2. Handle New Council Result & TTS Fallback
    useEffect(() => {
        if (lastResult) {
            // Add text message
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'ai', 
                text: lastResult.final_answer 
            }]);

            // Audio Logic:
            // If backend provided audioUrl, AvatarShell handles it via props.
            // If NO audioUrl, we use browser TTS (speak) and manually toggle Avatar state.
            if (!audioUrl && lastResult.final_answer) {
                setAvatarEmotion('speaking');
                // Use a slight delay to ensure state updates
                setTimeout(() => {
                    speak(lastResult.final_answer, true);
                }, 100);
            }
        }
    }, [lastResult, audioUrl, setAvatarEmotion, speak]);

    // 3. Monitor Browser TTS to Reset Avatar
    // useVoiceControl sets voiceStatus to 'SPEAKING' then 'IDLE'. 
    // We watch this to reset Avatar if we are using browser TTS.
    useEffect(() => {
        if (!audioUrl) { // Only if NOT using backend audio
            if (voiceStatus === 'SPEAKING') {
                setAvatarEmotion('speaking');
            } else if (voiceStatus === 'IDLE' && avatarEmotion === 'speaking') {
                setAvatarEmotion('idle');
            }
        }
    }, [voiceStatus, audioUrl, avatarEmotion, setAvatarEmotion]);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }]);
        sendMessage(text);
        setInput('');
    };

    const toggleVoice = () => {
        if (voiceStatus === 'LISTENING') stopListening();
        else startListening();
    };

    return (
        <div className="flex flex-col h-full bg-[#0D0F12] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative panel-3d">
            {/* AVATAR STAGE */}
            <div className="h-[400px] relative bg-gradient-to-b from-slate-900 to-black border-b border-slate-800">
                <AvatarShell 
                    className="w-full h-full"
                    emotion={avatarEmotion}
                    currentUtterance={lastResult?.final_answer}
                    audioSource={audioUrl}
                    onSpeechEnd={handleSpeechEnd}
                />
                
                {/* Overlay Stats */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {lastResult?.ranking?.map((rank, i) => (
                        <div key={i} className="bg-black/50 backdrop-blur-sm border border-slate-700 px-3 py-1 rounded-full text-[10px] text-slate-300 flex items-center gap-2">
                            <BrainCircuit size={12} className="text-purple-400" />
                            {rank.model}: {rank.score}%
                        </div>
                    ))}
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#020617]/50">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[80%] p-3 rounded-xl text-sm leading-relaxed shadow-lg
                                ${msg.role === 'user'
                                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50 rounded-br-sm'
                                    : 'bg-slate-800/40 border border-slate-700/50 text-slate-200 rounded-bl-sm'
                                }
                            `}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {councilStatus === 'PROCESSING' && (
                        <div className="flex items-center gap-2 text-xs text-purple-400 p-2 animate-pulse">
                            <Activity size={14} /> The Council is deliberating...
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* INPUT */}
                <div className="p-4 border-t border-slate-800/50 bg-[#0D0F12]">
                    <div className="flex gap-2 items-center bg-slate-900/50 border border-slate-700 rounded-xl p-1.5 focus-within:border-purple-500/50 transition-all">
                        <button 
                            onClick={toggleVoice}
                            className={`p-3 rounded-lg transition-all active:scale-95 ${
                                voiceStatus === 'LISTENING' 
                                ? 'text-white bg-red-500 shadow-[0_0_15px_red] animate-pulse' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {voiceStatus === 'LISTENING' ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                            placeholder="Consult the Council..."
                            className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0 font-medium py-3 px-2"
                            disabled={councilStatus === 'PROCESSING'}
                        />
                        
                        <button 
                            onClick={() => handleSend(input)}
                            disabled={!input.trim() || councilStatus === 'PROCESSING'}
                            className="p-3 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-800 transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
