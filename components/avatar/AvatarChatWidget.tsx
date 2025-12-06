import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Maximize2, Minimize2, X } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

export const AvatarChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', text: 'Greetings, Commander. How can I assist you today?', timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        // Simulate response stub
        setTimeout(() => {
            const response: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: 'Analyzing request... (Avatar Engine not connected yet)',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, response]);
        }, 1000);
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        // TODO: Implement Whisper STT integration
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-primary-500 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-all z-50 border-2 border-primary-400/30 animate-pulse-slow group"
            >
                <div className="relative">
                    <Volume2 className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                </div>
            </button>
        );
    }

    return (
        <div className={`fixed z-50 transition-all duration-300 ease-in-out bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl overflow-hidden font-sans
      ${isExpanded ? 'inset-4 rounded-2xl' : 'bottom-6 right-6 w-[400px] h-[600px] rounded-2xl'}
    `}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50">
                <h3 className="font-display font-bold text-primary-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    AI INTERFACE // V18
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className={`flex ${isExpanded ? 'h-[calc(100%-64px)] flex-row' : 'h-[calc(100%-64px)] flex-col relative'}`}>

                {/* Avatar Viewport (3D Scene Placeholder) */}
                <div className={`relative bg-black transition-all ${isExpanded ? 'w-1/2 h-full border-r border-slate-700' : 'w-full h-1/2 min-h-[250px]'}`}>
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        {/* TODO: Add <AvatarCanvas /> here */}
                        {/* Background Grid Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />

                        <div className="text-center space-y-4 relative z-10">
                            <div className="w-32 h-32 mx-auto rounded-full border-2 border-primary-500/30 flex items-center justify-center bg-slate-900/50 backdrop-blur shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-pulse">
                                <span className="font-display text-4xl text-primary-500">AI</span>
                            </div>
                            <p className="text-primary-400/50 font-mono text-xs tracking-widest">[3D AVATAR MODULE CONNECTING...]</p>
                        </div>

                        {/* Audio Visualizer Placeholder */}
                        <div className="absolute bottom-8 left-0 right-0 h-16 flex items-end justify-center gap-1 px-8 opacity-50">
                            {[...Array(30)].map((_, i) => (
                                <div key={i} className="w-1 bg-primary-500 rounded-t-full animate-pulse" style={{
                                    height: `${20 + Math.random() * 80}%`,
                                    animationDelay: `${i * 0.05}s`,
                                    animationDuration: '0.8s'
                                }} />
                            ))}
                        </div>
                    </div>

                    {/* Controls Overlay */}
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/40 backdrop-blur rounded-lg text-white hover:bg-white/10 transition-colors border border-white/10">
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                    </div>
                </div>

                {/* Chat Interface */}
                <div className={`flex flex-col bg-slate-950 ${isExpanded ? 'w-1/2 h-full' : 'w-full h-1/2 flex-1'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-br-none'
                                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <p className={`text-[10px] mt-1 font-mono text-right ${msg.role === 'user' ? 'text-primary-200' : 'text-slate-500'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <div className="relative flex items-center gap-2">
                            <button
                                onClick={toggleRecording}
                                className={`p-3 rounded-xl transition-all ${isRecording
                                        ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                            >
                                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type command or speak..."
                                className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-500 text-white placeholder-slate-500 focus:outline-none transition-all"
                            />

                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim()}
                                className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
