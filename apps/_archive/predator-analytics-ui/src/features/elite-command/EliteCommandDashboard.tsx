'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { CommandCenterScene } from './components/CommandCenterScene';
import { VideoIntroScreen } from './components/VideoIntroScreen';
import { AccessLevelSelector, UserRole } from './components/AccessLevelSelector';
import { useUser } from '../../context/UserContext';
import { resolveUserRole, UserRole as AppUserRole } from '../../config/roles';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { EmotionState } from './components/models/PredatorModel';
import { Loader } from '@react-three/drei';

type AppPhase = 'intro' | 'auth' | 'app';

interface Message {
  sender: 'user' | 'predator';
  text: string;
  time: string;
}

const LOCALIZATION = {
  uk: {
    title: "PREDATOR ELITE",
    subtitle: "SOVEREIGN COMMAND CENTER v2.0",
    role: "РОЛЬ",
    encrypted: "ЗАШИФРОВАНЕ З'ЄДНАННЯ",
    vramGuard: "VRAM АКТИВНА",
    nvidiaNode: "NVIDIA ВУЗОЛ",
    changeRole: "ЗМІНИТИ РОЛЬ (ВИХІД)",
    aiAssistant: "AI АСИСТЕНТ ХИЖАКА",
    inputPlaceholder: "Запитайте асистента або введіть команду...",
    cleanVoice: "Чистий голос",
    predatorVoice: "Голос Хижака",
    listening: "Слухаю...",
    systemSpeaking: "Асистент мовить",
    systemStatus: "СТАТУС СИСТЕМНИХ БАЗ ДАНИХ (CONTRACT v4.0)",
    aiPulse: "AI СИСТЕМНИЙ ПУЛЬС",
    stable: "СТАБІЛЬНИЙ",
    threatLevel: "РІВЕНЬ ЗАГРОЗИ",
    vramLoad: "ЗАВАНТАЖЕННЯ VRAM",
    cpuLoad: "ЗАВАНТАЖЕННЯ CPU",
    ramLoad: "ЗАВАНТАЖЕННЯ RAM",
    zrokSpeed: "ШВИДКІСТЬ ZROK",
    overrides: "ПЕРЕВИЗНАЧЕННЯ СТАНУ",
    neutral: "НЕЙТРАЛЬНИЙ",
    analytic: "АНАЛІЗ",
    warning: "УВАГА",
    aggressive: "ТРИВОГА",
    positive: "УСПІХ",
    chatWelcome: "Всі системи активовані. Я слухаю твої накази."
  },
  en: {
    title: "PREDATOR ELITE",
    subtitle: "SOVEREIGN COMMAND CENTER v2.0",
    role: "ROLE",
    encrypted: "ENCRYPTED CONNECTION",
    vramGuard: "VRAM GUARD ACTIVE",
    nvidiaNode: "NVIDIA NODE",
    changeRole: "CHANGE ROLE (EXIT)",
    aiAssistant: "PREDATOR AI ASSISTANT",
    inputPlaceholder: "Ask assistant or type a command...",
    cleanVoice: "Clean Voice",
    predatorVoice: "Predator Voice",
    listening: "Listening...",
    systemSpeaking: "Assistant is speaking",
    systemStatus: "DATABASE SYSTEM STATUS (CONTRACT v4.0)",
    aiPulse: "AI SYSTEM PULSE",
    stable: "STABLE",
    threatLevel: "THREAT LEVEL",
    vramLoad: "VRAM UTILIZATION",
    cpuLoad: "CPU LOAD",
    ramLoad: "RAM LOAD",
    zrokSpeed: "ZROK TUNNEL SPEED",
    overrides: "STATE OVERRIDE",
    neutral: "NEUTRAL",
    analytic: "ANALYZE",
    warning: "WARNING",
    aggressive: "ALERT",
    positive: "SUCCESS",
    chatWelcome: "All systems activated. I am listening to your commands."
  }
};

export function EliteCommandDashboard() {
  const { user } = useUser();
  const appRole = resolveUserRole(user?.role);
  
  // Map app role to local role for backward compatibility with 3D components
  const localRoleMap: Record<AppUserRole, UserRole> = {
    [AppUserRole.CORE]: 'admin',
    [AppUserRole.SOVEREIGN]: 'analyst',
    [AppUserRole.PRO]: 'operator',
    [AppUserRole.TERMINAL]: 'viewer',
  };
  const defaultRole = localRoleMap[appRole] || 'viewer';

  const [phase, setPhase] = useState<AppPhase>('app');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(defaultRole);
  const [emotion, setEmotion] = useState<EmotionState>('NEUTRAL');
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  
  // Симульовані метрики заліза
  const [vram, setVram] = useState(4.2);
  const [cpu, setCpu] = useState(24);
  const [ram, setRam] = useState(14.8);
  const [zrok, setZrok] = useState(85.4);
  const [threat, setThreat] = useState(12);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Голосовий асистент
  const voice = useVoiceAssistant((text) => {
    handleUserMessage(text);
  });

  const lang = voice.language;
  const t = LOCALIZATION[lang];

  // Скрол до останнього повідомлення чату
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Симуляція оновлення метрик заліза
  useEffect(() => {
    if (phase !== 'app') return;
    const interval = setInterval(() => {
      setVram(prev => Math.min(7.9, Math.max(2.1, Number((prev + (Math.random() - 0.5) * 0.2).toFixed(1)))));
      setCpu(prev => Math.min(99, Math.max(10, Math.round(prev + (Math.random() - 0.5) * 8))));
      setRam(prev => Math.min(30, Math.max(8, Number((prev + (Math.random() - 0.5) * 0.4).toFixed(1)))));
      setZrok(prev => Math.min(250, Math.max(20, Number((prev + (Math.random() - 0.5) * 5).toFixed(1)))));
    }, 3000);
    return () => clearInterval(interval);
  }, [phase]);

  // Вітальне привітання при автентифікації
  useEffect(() => {
    if (phase === 'app' && selectedRole) {
      const roleEmotionMap: Record<UserRole, EmotionState> = {
        viewer: 'NEUTRAL',
        operator: 'POSITIVE',
        analyst: 'ANALYTIC',
        admin: 'AGGRESSIVE'
      };
      setEmotion(roleEmotionMap[selectedRole]);
      
      const roleTitlesUk: Record<UserRole, string> = {
        viewer: 'Спостерігач',
        operator: 'Оператор',
        analyst: 'Аналітик',
        admin: 'Адміністратор'
      };

      const roleTitlesEn: Record<UserRole, string> = {
        viewer: 'Viewer',
        operator: 'Operator',
        analyst: 'Analyst',
        admin: 'Administrator'
      };

      const title = lang === 'uk' ? roleTitlesUk[selectedRole] : roleTitlesEn[selectedRole];
      const welcomeText = lang === 'uk'
        ? `Автентифікацію підтверджено. Вітаю в системі, ${title}. Всі системи працюють нормально.`
        : `Authentication confirmed. Welcome to the system, ${title}. All units are operational.`;

      setChatHistory([
        { sender: 'predator', text: welcomeText, time: new Date().toLocaleTimeString().slice(0, 5) }
      ]);

      setTimeout(() => {
        voice.speak(welcomeText);
      }, 1000);
    }
  }, [phase, selectedRole, lang]);

  // Обробка реплік користувача (текст та голос)
  const handleUserMessage = (text: string) => {
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString().slice(0, 5);
    const newMsg: Message = { sender: 'user', text, time };
    setChatHistory(prev => [...prev, newMsg]);

    const lower = text.toLowerCase();
    let responseText = '';
    let targetEmotion: EmotionState = 'NEUTRAL';

    // Інтелектуальна логіка відповідей Хижака
    if (lang === 'uk') {
      if (lower.includes("ризик") || lower.includes("загроз") || lower.includes("небезпек")) {
        responseText = "Виявлено аномальну активність у митних деклараціях. Рівень загрози підвищено. Запускаю повний сканер ризиків.";
        targetEmotion = 'AGGRESSIVE';
        setThreat(78);
      } else if (lower.includes("аналіз") || lower.includes("дані") || lower.includes("баз") || lower.includes("статус")) {
        responseText = "Проводжу агрегацію OLAP-даних з ClickHouse та аналіз зв'язків через Neo4j. Всі вузли синхронізовано.";
        targetEmotion = 'ANALYTIC';
        setThreat(15);
      } else if (lower.includes("привіт") || lower.includes("хто ти") || lower.includes("хижак")) {
        responseText = "Я — PREDATOR AI, суверенний інтелект цього командного центру. Готовий вистежувати цілі.";
        targetEmotion = 'POSITIVE';
      } else if (lower.includes("двійник") || lower.includes("симуляц")) {
        responseText = "Запускаю віртуальний зліпок системи. Починаю прорахунок майбутніх сценаріїв.";
        targetEmotion = 'ANALYTIC';
      } else {
        responseText = "Запит отримано. Проводжу миттєвий пошук у векторній пам'яті Qdrant.";
        targetEmotion = 'NEUTRAL';
      }
    } else {
      // English responses
      if (lower.includes("risk") || lower.includes("threat") || lower.includes("danger") || lower.includes("alert")) {
        responseText = "Anomalous customs activity detected. Threat level increased. Deploying multi-layered risk scanner.";
        targetEmotion = 'AGGRESSIVE';
        setThreat(82);
      } else if (lower.includes("analyze") || lower.includes("data") || lower.includes("db") || lower.includes("status")) {
        responseText = "Aggregating OLAP records from ClickHouse and building relational links via Neo4j. All systems synched.";
        targetEmotion = 'ANALYTIC';
        setThreat(18);
      } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("predator")) {
        responseText = "I am PREDATOR AI, the sovereign core of this command structure. Ready to hunt.";
        targetEmotion = 'POSITIVE';
      } else if (lower.includes("twin") || lower.includes("simulation")) {
        responseText = "Activating virtual system twin. Starting trajectory calculations.";
        targetEmotion = 'ANALYTIC';
      } else {
        responseText = "Query accepted. Running immediate search on Qdrant vector storage index.";
        targetEmotion = 'NEUTRAL';
      }
    }

    setEmotion(targetEmotion);

    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        sender: 'predator',
        text: responseText,
        time: new Date().toLocaleTimeString().slice(0, 5)
      }]);
      voice.speak(responseText);
    }, 1000);
  };

  return (
    <main className="flex min-h-screen flex-col bg-black overflow-hidden font-mono text-neutral-200">
      {phase === 'intro' && (
        <VideoIntroScreen onComplete={() => setPhase('app')} />
      )}

      {/* We skip auth phase entirely since we rely on app context auth */}
      {phase === 'auth' && (
        <AccessLevelSelector onSelect={(role) => {
          setSelectedRole(role);
          setPhase('app');
        }} />
      )}

      {phase === 'app' && (
        <div className="relative w-full h-screen bg-black">
          {/* 3D Scene Layer */}
          <div className="w-full h-full absolute inset-0 z-0">
            <CommandCenterScene 
               emotion={emotion} 
               speakActive={voice.isSpeaking}
               lang={lang}
               onPortalSelect={(portalId, label) => {
                 const triggerText = lang === 'uk' 
                   ? `Фокусування на системному модулі: ${label}.`
                   : `Focusing camera angle on module: ${label}.`;
                 
                 setChatHistory(prev => [...prev, {
                   sender: 'predator',
                   text: triggerText,
                   time: new Date().toLocaleTimeString().slice(0, 5)
                 }]);
                 voice.speak(triggerText);
               }}
            />
            <Loader 
              containerStyles={{ background: '#000', zIndex: 100 }}
              innerStyles={{ background: 'rgba(255, 0, 51, 0.2)', width: '300px', height: '4px' }}
              barStyles={{ background: '#ff0033' }}
              dataStyles={{ color: '#ff0033', fontSize: '18px', fontFamily: 'monospace', letterSpacing: '0.1em' }}
              dataInterpolation={(p) => `ЗАВАНТАЖЕННЯ АКТИВІВ PREDATOR... ${p.toFixed(0)}%`}
            />
          </div>

          {/* Top Header UI */}
          <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
            <div className="flex items-center space-x-4 pointer-events-auto">
              <div className={`w-12 h-12 bg-neutral-900/50 border rounded-full flex items-center justify-center animate-pulse backdrop-blur-sm
                ${selectedRole === 'admin' ? 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 
                  selectedRole === 'analyst' ? 'border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 
                  selectedRole === 'operator' ? 'border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 
                  'border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]'}`}
              >
                <span className="font-bold text-2xl">P</span>
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-widest text-neutral-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  {t.title}
                </h1>
                <p className="text-neutral-400 text-[9px] tracking-widest mt-0.5">{t.subtitle}</p>
                <div className="mt-1 flex items-center space-x-2">
                  <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold
                    ${selectedRole === 'admin' ? 'border-red-500/50 text-red-400 bg-red-950/40' : 
                    selectedRole === 'analyst' ? 'border-amber-400/50 text-amber-300 bg-amber-950/40' : 
                    selectedRole === 'operator' ? 'border-emerald-400/50 text-emerald-300 bg-emerald-950/40' : 
                    'border-cyan-400/50 text-cyan-300 bg-cyan-950/40'}`}
                  >
                    {t.role}: {selectedRole}
                  </span>
                  <span className="text-[8px] text-neutral-500 border border-neutral-800 px-2 py-0.5 rounded">
                    {t.encrypted}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end pointer-events-auto">
              <div className="flex items-center space-x-3">
                {/*Language switcher */}
                <div className="flex bg-neutral-900/80 rounded border border-neutral-800 p-0.5 text-[9px]">
                  <Button variant="cyber" 
                    onClick={() => voice.setLanguage('uk')}
                    className={`px-2 py-1 rounded transition-colors ${lang === 'uk' ? 'bg-cyan-500 text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    УКР
                  </Button>
                  <Button variant="cyber" 
                    onClick={() => voice.setLanguage('en')}
                    className={`px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-cyan-500 text-black font-bold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    ENG
                  </Button>
                </div>

                <div className="flex items-center space-x-2 bg-neutral-950/60 px-3 py-1 rounded border border-neutral-800 backdrop-blur-md">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                  <span className="text-red-500 text-[10px] tracking-widest font-bold drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">{t.vramGuard}</span>
                </div>
              </div>
              
              <span className="text-neutral-500 text-[8px] tracking-widest mt-1.5 uppercase">{t.nvidiaNode}: 194.177.1.240</span>
              <Button variant="cyber" 
                className="mt-3 text-[9px] text-neutral-400 hover:text-white border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-900/80 px-3 py-1 rounded backdrop-blur-sm transition-all duration-300"
                onClick={() => {
                  voice.stopSpeaking();
                  setPhase('auth');
                }}
              >
                {t.changeRole}
              </Button>
            </div>
          </div>
          
          {/* Left Panel: AI Assistant Chat */}
          <div className="absolute top-24 left-6 z-10 w-80 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col h-[calc(100vh-240px)]">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/40 rounded-t-2xl">
              <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">{t.aiAssistant}</span>
              <div className="flex items-center space-x-2">
                <span className="text-[8px] text-neutral-500">{voice.cleanVoiceMode ? t.cleanVoice : t.predatorVoice}</span>
                <Button variant="cyber" 
                  onClick={() => voice.setCleanVoiceMode(!voice.cleanVoiceMode)}
                  className={`w-6 h-3 rounded-full relative transition-colors ${voice.cleanVoiceMode ? 'bg-cyan-500' : 'bg-neutral-800'}`}
                >
                  <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${voice.cleanVoiceMode ? 'right-0.5' : 'left-0.5'}`} />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[90%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-cyan-950/40 border border-cyan-800/60 text-cyan-200' 
                      : 'bg-neutral-900/60 border border-neutral-800 text-neutral-300 shadow-[0_0_8px_rgba(0,0,0,0.3)]'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-neutral-600 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Status indicators */}
            {voice.isSpeaking && (
              <div className="px-4 py-1.5 bg-cyan-950/20 border-t border-cyan-900/20 text-cyan-400 text-[8px] uppercase tracking-widest flex items-center space-x-2">
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"></span>
                <span>{t.systemSpeaking}</span>
              </div>
            )}

            {voice.isListening && (
              <div className="px-4 py-1.5 bg-red-950/20 border-t border-red-900/20 text-red-500 text-[8px] uppercase tracking-widest flex items-center space-x-2">
                <span className="w-1 h-1 bg-red-500 rounded-full animate-ping"></span>
                <span>{t.listening}</span>
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t border-neutral-800 flex items-center space-x-2 bg-neutral-950/40 rounded-b-2xl">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUserMessage(inputText);
                    setInputText('');
                  }
                }}
                placeholder={t.inputPlaceholder}
                className="flex-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-cyan-500 focus:outline-none rounded px-3 py-1.5 text-xs text-neutral-200 transition-colors"
              />
              <Button variant="cyber" 
                onClick={() => {
                  handleUserMessage(inputText);
                  setInputText('');
                }}
                className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 text-xs rounded transition-colors"
              >
                ➔
              </Button>
              
              {/* Voice button */}
              <Button variant="cyber" 
                onClick={voice.isListening ? voice.stopListening : voice.startListening}
                className={`p-1.5 rounded border transition-all ${
                  voice.isListening 
                    ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                🎤
              </Button>
            </div>
          </div>

          {/* Bottom Panel: SYSTEM STATUS & Metrics */}
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="bg-neutral-950/80 backdrop-blur-xl border border-neutral-800/80 p-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              
              {/* Database memory contract statuses */}
              <div className="flex flex-col space-y-2 w-full md:w-auto">
                <span className="text-[8px] text-neutral-500 tracking-widest uppercase text-center md:text-left">{t.systemStatus}</span>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <StatusWidget name="POSTGRES (SSOT)" status="ONLINE" color="text-cyan-400" />
                  <StatusWidget name="CLICKHOUSE (OLAP)" status="ACTIVE" color="text-emerald-400" />
                  <StatusWidget name="OPENSEARCH (TEXT)" status="STABLE" color="text-teal-400" />
                  <StatusWidget name="QDRANT (VECTOR)" status="INDEXING" color="text-purple-400" />
                  <StatusWidget name="NEO4J (GRAPH)" status="CONNECTED" color="text-amber-400" />
                  <StatusWidget name="REDIS (CACHE)" status="HIT: 98%" color="text-pink-400" />
                  <StatusWidget name="MINIO (S3)" status="READY" color="text-indigo-400" />
                </div>
              </div>

              {/* Hardware resources live metrics */}
              <div className="flex items-center space-x-6 border-l border-r border-neutral-800/60 px-6">
                <MetricBar label={t.vramLoad} value={`${vram} GB`} percent={(vram / 8) * 100} color="bg-cyan-500" glow="shadow-[0_0_8px_#06b6d4]" />
                <MetricBar label={t.cpuLoad} value={`${cpu}%`} percent={cpu} color="bg-amber-500" glow="shadow-[0_0_8px_#f59e0b]" />
                <MetricBar label={t.ramLoad} value={`${ram} GB`} percent={(ram / 32) * 100} color="bg-purple-500" glow="shadow-[0_0_8px_#a855f7]" />
                <MetricBar label={t.zrokSpeed} value={`${zrok} Mb/s`} percent={(zrok / 200) * 100} color="bg-emerald-500" glow="shadow-[0_0_8px_#10b981]" />
              </div>

              {/* Threat Level Indicator & State Override */}
              <div className="flex items-center space-x-5 min-w-[200px] justify-end">
                <div className="flex flex-col items-end pr-4 border-r border-neutral-800/60">
                  <span className="text-[8px] text-neutral-500 tracking-widest uppercase mb-1">{t.threatLevel}</span>
                  <span className={`text-sm font-black tracking-widest ${threat > 50 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                    {threat}%
                  </span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-neutral-500 tracking-widest uppercase mb-1.5">{t.overrides}</span>
                  <div className="flex gap-1">
                    <Button variant="cyber" onClick={() => { setEmotion('NEUTRAL'); setThreat(10); }} className={`px-2 py-1 text-[8px] tracking-wider border rounded transition-colors ${emotion === 'NEUTRAL' ? 'bg-cyan-950/50 border-cyan-500 text-cyan-400' : 'border-neutral-800 text-neutral-500 hover:text-neutral-400'}`}>
                      {t.neutral}
                    </Button>
                    <Button variant="cyber" onClick={() => { setEmotion('ANALYTIC'); setThreat(22); }} className={`px-2 py-1 text-[8px] tracking-wider border rounded transition-colors ${emotion === 'ANALYTIC' ? 'bg-blue-950/50 border-blue-500 text-blue-400' : 'border-neutral-800 text-neutral-500 hover:text-neutral-400'}`}>
                      {t.analytic}
                    </Button>
                    <Button variant="cyber" onClick={() => { setEmotion('WARNING'); setThreat(48); }} className={`px-2 py-1 text-[8px] tracking-wider border rounded transition-colors ${emotion === 'WARNING' ? 'bg-amber-950/50 border-amber-500 text-amber-400' : 'border-neutral-800 text-neutral-500 hover:text-neutral-400'}`}>
                      {t.warning}
                    </Button>
                    <Button variant="cyber" onClick={() => { setEmotion('AGGRESSIVE'); setThreat(85); }} className={`px-2 py-1 text-[8px] tracking-wider border rounded transition-colors ${emotion === 'AGGRESSIVE' ? 'bg-red-950/50 border-red-500 text-red-400' : 'border-neutral-800 text-neutral-500 hover:text-neutral-400'}`}>
                      {t.aggressive}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatusWidget({ name, status, color }: { name: string, status: string, color: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-neutral-900/40 rounded px-2 py-1 border border-neutral-800/40 w-[105px]">
      <span className="text-neutral-500 text-[7px] tracking-widest mb-0.5 truncate w-full text-center">{name}</span>
      <span className={`${color} font-bold text-[8px] tracking-widest drop-shadow-[0_0_2px_currentColor]`}>{status}</span>
    </div>
  );
}

function MetricBar({ label, value, percent, color, glow }: { label: string, value: string, percent: number, color: string, glow: string }) {
  return (
    <div className="flex flex-col w-20">
      <div className="flex justify-between items-center text-[7px] tracking-wider mb-1">
        <span className="text-neutral-500 truncate w-14 text-left">{label}</span>
        <span className="text-neutral-300 font-bold">{value}</span>
      </div>
      <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
        <div className={`h-full ${color} ${glow} transition-all duration-1000`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </div>
  );
}

