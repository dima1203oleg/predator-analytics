/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import CatalogTab from './components/CatalogTab';
import LicenseTab from './components/LicenseTab';
import ArchitectureTab from './components/ArchitectureTab';
import GapAnalysisTab from './components/GapAnalysisTab';
import RoadmapTab from './components/RoadmapTab';
import VolumesTab from './components/VolumesTab';
import AdvisorTab from './components/AdvisorTab';
import OsintWorkbench from './components/OsintWorkbench';
import DashboardView from './components/DashboardView';
import { AuthStatus } from './components/AuthStatus';
import InspectorPanel from './components/InspectorPanel';
import LiveAnalyticalCenter from './components/LiveAnalyticalCenter';
import { OodaRadar } from './components/OodaRadar';
import { SovereignDashboard } from './components/SovereignDashboard';
import { WarRoom } from './components/WarRoom';
import AdminBackOffice from './components/AdminBackOffice';
import MapsTab from './components/MapsTab';
import { OSINT_ENTITIES, OsintEntity } from './osintData';
import { SOLUTIONS } from './data';
import { apiFetch } from './api';
import { 
  Layers, ShieldCheck, Network, Wrench, Calendar, Bot, 
  FileText, CheckCircle, AlertTriangle, Info, BookOpen,
  Menu, X, Search, Bell, User, Terminal, Cpu, Database, 
  Activity, Landmark, MessageSquare, Sparkles, Send, HelpCircle,
  Maximize2, Minimize2, Settings, ShieldAlert, Compass,
  Briefcase, Truck, Globe, TrendingUp, Users, Map, Mic, Zap, LogOut, Shield, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveChatBot } from './components/LiveChatBot';
import { CopilotPanel } from './components/CopilotPanel';
import { MediaForensicsTab } from './components/MediaForensicsTab';
import { RestrictedFeatureOverlay } from './components/RestrictedFeatureOverlay';
import { LoginScreen } from './components/LoginScreen';
import { usePAEStream } from './hooks/usePAEStream';
import './styles/cyber-theme.css';
import { GenesisCanvas } from './components/canvas/GenesisCanvas';
import { CommandPalette } from './components/CommandPalette';
import { DataFlowInspector } from './components/ingestion/DataFlowInspector';
import { AlertCenter } from './components/AlertCenter';
import { WatchlistPanel } from './components/WatchlistPanel';
import { OracleWorkspace } from './components/OracleWorkspace';
import { ShieldCompliance } from './components/ShieldCompliance';
import ACPFactoryPage from './pages/ACPFactoryPage';
import ResearchEnginePage from './pages/ResearchEnginePage';

type TabId = 'genesis-workspace' | 'live-analytical-center' | 'data-ingestion' | 'sovereign-dashboard' | 'admin-back-office' | 'dashboard' | 'osint' | 'maps' | 'warroom' | 'oracle' | 'shield' | 'catalog' | 'license' | 'architecture' | 'gap' | 'roadmap' | 'volumes' | 'advisor' | 'media-forensics' | 'acp-factory' | 'research-engine';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('predator_token'));
  const [userRole, setUserRole] = useState<'admin' | 'predator' | 'predator-pro'>('predator-pro');
  const [ecosystem, setEcosystem] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    const handleLogoutEvent = () => setIsAuthenticated(false);
    window.addEventListener('predator:logout', handleLogoutEvent);
    return () => window.removeEventListener('predator:logout', handleLogoutEvent);
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      setEcosystem('admin');
    } else {
      setEcosystem('user');
    }
  }, [userRole]);

  const [activeTab, setActiveTab] = useState<TabId>('genesis-workspace');
  const [selectedScenario, setSelectedScenario] = useState<string>('business');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  
  // Genesis Canvas States
  const [intentActive, setIntentActive] = useState(false);
  const [genesisQuery, setGenesisQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { data: paeData, sendIntent } = usePAEStream();
  
  // Watchlist State
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  
  // Genesis Canvas Global Input Listener
  useEffect(() => {
    if (activeTab !== 'genesis-workspace') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an existing input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // If alphanumeric, start typing
      if (e.key.length === 1 && /[a-zA-Z0-9А-Яа-яЄєІіЇїҐґ ]/.test(e.key)) {
        if (!isTyping) {
          setIsTyping(true);
          setIntentActive(true);
        }
      }
      
      if (e.key === 'Escape') {
        setIsTyping(false);
        setIntentActive(false);
        setGenesisQuery('');
      }
      
      if (e.key === 'Enter' && isTyping && genesisQuery.trim().length > 0) {
        console.log("Submitting Intent to PAE:", genesisQuery);
        sendIntent(genesisQuery);
        setIntentActive(false);
        setTimeout(() => setIntentActive(true), 200);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isTyping, genesisQuery, sendIntent]);
  
  // Interactive rendering and mobile adaptive states
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'iphone'>('desktop');
  const [isRealMobile, setIsRealMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [iphoneTime, setIphoneTime] = useState('09:41');

  // iPhone physical interactions states
  const [isIphoneLocked, setIsIphoneLocked] = useState(false);
  const [isIphoneMuted, setIsIphoneMuted] = useState(false);
  const [iphoneVolume, setIphoneVolume] = useState(65);
  const [showVolumeHUD, setShowVolumeHUD] = useState(false);
  const [dynamicIslandState, setDynamicIslandState] = useState<'normal' | 'expanded' | 'mute-alert' | 'unmute-alert' | 'voice-listening'>('normal');
  const [volumeTimer, setVolumeTimer] = useState<any>(null);
  const [lockscreenDate, setLockscreenDate] = useState('Четвер, 16 липня');

  // Dynamic date calculation for Lock Screen
  useEffect(() => {
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
    const months = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dateNum = now.getDate();
    setLockscreenDate(`${dayName}, ${dateNum} ${monthName}`);
  }, []);

  const handleActionButton = () => {
    const nextMuted = !isIphoneMuted;
    setIsIphoneMuted(nextMuted);
    setDynamicIslandState(nextMuted ? 'mute-alert' : 'unmute-alert');
    setTimeout(() => {
      setDynamicIslandState('normal');
    }, 2000);
  };

  const adjustVolume = (amount: number) => {
    setIphoneVolume(prev => Math.max(0, Math.min(prev + amount, 100)));
    setShowVolumeHUD(true);
    if (volumeTimer) clearTimeout(volumeTimer);
    const t = setTimeout(() => {
      setShowVolumeHUD(false);
    }, 1800);
    setVolumeTimer(t);
  };

  const toggleIphonePower = () => {
    setIsIphoneLocked(prev => !prev);
  };

  const handleDynamicIslandClick = () => {
    if (dynamicIslandState === 'normal') {
      setDynamicIslandState('expanded');
    } else if (dynamicIslandState === 'expanded') {
      setDynamicIslandState('normal');
    }
  };

  // Sync real-time clock for the iOS status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setIphoneTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Detect real narrow-screen mobile device on load and resize
  useEffect(() => {
    const handleResize = () => {
      const isMobileSize = window.innerWidth < 768;
      setIsRealMobile(isMobileSize);
      if (isMobileSize) {
        setDeviceMode('iphone');
        setIsInspectorOpen(false);
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inspector contents
  const [selectedEntity, setSelectedEntity] = useState<OsintEntity | null>(OSINT_ENTITIES[0]);
  const [selectedTool, setSelectedTool] = useState<any | null>(SOLUTIONS[0]);
  const [selectedNode, setSelectedNode] = useState<any | null>({
    id: 'core_api',
    label: 'Core REST API',
    group: 'Core',
    details: 'Основний бекенд-сервіс на базі FastAPI. Забезпечує оркестрацію черг, інтеграцію ШІ-моделей vLLM та інтерфейс до баз даних Qdrant та Neo4j.'
  });

  const handleSelectEntityFromWatchlist = (entityId: string) => {
    // В реальній програмі тут буде запит на бекенд для отримання повних даних про сутність,
    // але для демо використовуємо заглушку або шукаємо в локальних даних
    const entity = OSINT_ENTITIES.find(e => e.id === entityId) || null;
    if (entity) {
      setSelectedEntity(entity);
      setActiveTab('live-analytical-center');
      setIsWatchlistOpen(false);
    }
  };


  // Floating AI Assistant state
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Вітаю. Я аналітичний ШІ-асистент PREDATOR. Я можу знайти приховані зв\'язки, написати висновки про компанії або згенерувати SQL-запити до бази.' }
  ]);

  // Spotlight / Command Center State
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');

  // Voice Command / Web Speech API states
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  // Backend TTS Engine (Piper via FastAPI)
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);

  const speakText = async (text: string) => {
    if (!isTtsEnabled) return;

    // Clean text: remove code blocks, formatting, long logs
    let cleanText = text
      .replace(/```sql[\s\S]*?```/g, ' [Згенеровано SQL запит] ')
      .replace(/```[\s\S]*?```/g, ' [Фрагмент коду] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_\[\]()\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    try {
      const response = await apiFetch('/api/v1/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: cleanText })
      });

      if (!response.ok) {
        throw new Error(`TTS API Error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      // Auto-cleanup URL object after playing
      audio.onended = () => {
        URL.revokeObjectURL(url);
      };
      
      audio.play();
    } catch (e) {
      console.warn("Failed to synthesize speech via backend:", e);
    }
  };

  const handleVoiceCommand = (transcript: string) => {
    const text = transcript.trim();
    if (!text) return;

    const lower = text.toLowerCase();
    setVoiceFeedback(`Почуто: "${text}"`);

    // Automatic clear of feedback
    setTimeout(() => {
      setVoiceFeedback(null);
    }, 4000);

    // 1. Navigation commands
    if (lower.includes('дашборд') || lower.includes('dashboard') || lower.includes('панель')) {
      setActiveTab('dashboard');
      const msg = `Перехід на інтерактивний Дашборд`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('мапа') || lower.includes('карта') || lower.includes('maps') || lower.includes('map')) {
      setActiveTab('maps');
      const msg = `Перехід на інтерактивну карту`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('пошук') || lower.includes('search') || lower.includes('осінт') || lower.includes('osint')) {
      setActiveTab('osint');
      const msg = `Перехід на пошуковий робочий стіл OSINT`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('ядро') || lower.includes('центр') || lower.includes('live') || lower.includes('шi')) {
      setActiveTab('live-analytical-center');
      const msg = `Перехід до живого аналітичного ядра PREDATOR`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('адмін') || lower.includes('адмінка') || lower.includes('консоль') || lower.includes('admin') || lower.includes('office')) {
      setEcosystem('admin');
      setActiveTab('admin-back-office');
      const msg = `Доступ надано. Перехід у बैक офіс консоль`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('граф') || lower.includes('архітектура') || lower.includes('залежності') || lower.includes('architecture')) {
      setActiveTab('architecture');
      const msg = `Відкриття графу залежностей архітектури`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('прогалини') || lower.includes('ризики') || lower.includes('gap')) {
      setActiveTab('gap');
      const msg = `Завантаження аналізу прогалин та ризиків комплаєнсу`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('дорожня карта') || lower.includes('план') || lower.includes('roadmap')) {
      setActiveTab('roadmap');
      const msg = `Показ дорожньої карти впровадження системи`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('томи') || lower.includes('регламенти') || lower.includes('volumes')) {
      setActiveTab('volumes');
      const msg = `Відкриття електронних томів технічного завдання`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('архітектор') || lower.includes('радник') || lower.includes('advisor')) {
      setActiveTab('advisor');
      const msg = `Підключення до радника ШІ архітектора`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }

    // 2. Action / Device commands
    if (lower.includes('заблокувати') || lower.includes('розблокувати') || lower.includes('lock') || lower.includes('unlock')) {
      toggleIphonePower();
      const msg = `Зміна режиму блокування симулятора`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('беззвучний') || lower.includes('звук') || lower.includes('mute') || lower.includes('unmute')) {
      handleActionButton();
      const msg = `Перемикання звукового режиму`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('гучніше') || lower.includes('гучність плюс') || lower.includes('volume up')) {
      adjustVolume(10);
      const msg = `Гучність збільшено`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('тихіше') || lower.includes('гучність мінус') || lower.includes('volume down')) {
      adjustVolume(-10);
      const msg = `Гучність зменшено`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes('інспектор') || lower.includes('inspector')) {
      setIsInspectorOpen(prev => !prev);
      const msg = `Перемикання стану панелі інспектора`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }

    // 3. Search queries
    let queryText = text;
    let isExplicitSearch = false;
    if (lower.startsWith('знайди ') || lower.startsWith('пошук ')) {
      queryText = text.substring(6).trim();
      isExplicitSearch = true;
    } else if (lower.startsWith('find ') || lower.startsWith('search ')) {
      queryText = text.substring(5).trim();
      isExplicitSearch = true;
    }

    if (isExplicitSearch || lower.includes('коваленко') || lower.includes('спецтехпостач') || lower.includes('фольксваген') || lower.includes('клієнт')) {
      const queryLower = queryText.toLowerCase();
      const matched = (window as any).OSINT_ENTITIES || (typeof OSINT_ENTITIES !== 'undefined' ? OSINT_ENTITIES : []).find((ent: any) => 
        ent.name.toLowerCase().includes(queryLower) ||
        ent.code.includes(queryLower)
      );

      if (matched) {
        setSelectedEntity(matched);
        setSelectedTool(null);
        setSelectedNode(null);
        setIsInspectorOpen(true);
        setActiveTab('live-analytical-center');
        const msg = `Знайдено об'єкт дослідження: ${matched.name}`;
        setVoiceFeedback(msg);
        speakText(msg);
        return;
      }
    }

    // 4. Default: Chat with Jarvis
    setChatHistory(prev => [...prev, { sender: 'user', text: text }]);
    setIsAiChatOpen(true);
    
    setTimeout(() => {
      let aiResponse = "Голосовий запит опрацьовано ШІ-ядром PREDATOR через Web Speech API. Збігів у базі санкцій не знайдено.";
      
      if (lower.includes('санкції') || lower.includes('рнбо')) {
        aiResponse = "ШІ знайшов критичну загрозу: ТОВ 'СпецТехПостач' (код 38294012) знаходиться під санкціями РНБО з 2026 року через обхід експортних обмежень через турецьких контрагентів.";
      } else if (lower.includes('коваленко')) {
        aiResponse = "Коваленко Ігор Вікторович є засновником ТОВ 'СпецТехПостач' (51%) та володіє BTC-гаманцем bc1qxy...d831. ШІ оцінює рівень ризику особи як ВИСОКИЙ (82%).";
      } else if (lower.includes('sql')) {
        aiResponse = "Ось згенерований SQL для пошуку пов'язаних бенефіціарів:\n\nSELECT * FROM company_founders WHERE risk_level = 'HIGH';";
      } else if (lower.includes('pdf')) {
        aiResponse = "Надішліть PDF-файл ТЗ чи митної декларації в чат. Я проведу миттєвий комплаєнс-аналіз згідно з 16 томами.";
      } else if (lower.includes('привіт') || lower.includes('вітаю') || lower.includes('hello')) {
        aiResponse = "Вітаю! Я уважно слухаю ваші голосові команди. Ви можете сказати 'Перейди на дашборд', 'Покажи карту' або запитати про санкції.";
      }

      setChatHistory(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      speakText(aiResponse);
    }, 800);
  };

  const startVoiceControl = async () => {
    if (isVoiceListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsVoiceListening(true);
        setVoiceError(null);
        setVoiceFeedback("Слухаю... Назвіть команду");
        setDynamicIslandState('voice-listening');
      };

      mediaRecorder.onstop = async () => {
        setIsVoiceListening(false);
        setVoiceFeedback("Аналіз аудіо...");
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        // Зупинка всіх треків мікрофона
        stream.getTracks().forEach(track => track.stop());

        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'voice.webm');
          
          const response = await apiFetch('/api/v1/voice/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`STT API Error: ${response.status}`);
          }
          
          const data = await response.json();
          const transcript = data.text;
          
          if (transcript) {
            setVoiceTranscript(transcript);
            handleVoiceCommand(transcript);
          } else {
            setVoiceError("Голос не виявлено.");
            setTimeout(() => setVoiceError(null), 5000);
          }
          
          setTimeout(() => {
            setDynamicIslandState(prev => prev === 'voice-listening' ? 'normal' : prev);
          }, 3000);
        } catch (err: any) {
          setVoiceError(`Помилка розпізнавання: ${err.message}`);
          setDynamicIslandState('normal');
          setTimeout(() => setVoiceError(null), 15000);
        }
      };

      mediaRecorder.start();
    } catch (err: any) {
      console.error("Microphone access denied or error:", err);
      setVoiceError("Доступ до мікрофона заблоковано або не підтримується.");
      setTimeout(() => setVoiceError(null), 15000);
      setIsVoiceListening(false);
      setDynamicIslandState('normal');
    }
  };

  // Handle key escape and Ctrl/Cmd+K to toggle Spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsInspectorOpen(false);
        setIsAiChatOpen(false);
        setIsSpotlightOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Spotlight categorized search results
  const spotlightResults = React.useMemo(() => {
    if (ecosystem === 'admin') {
      const allNavs = [
        { id: 'admin-back-office', label: '⚙️ Адмінка / ArgoCD Back Office', type: 'nav' },
        { id: 'catalog', label: '📦 Каталог готових рішень', type: 'nav' },
        { id: 'license', label: '🛡️ Сумісність та активація ліцензій', type: 'nav' },
      ];

      const allActions = [
        { id: 'toggle-inspector', label: isInspectorOpen ? '📂 Закрити бічний інспектор' : '📂 Відкрити бічний інспектор', type: 'action' },
      ];

      if (!spotlightQuery.trim()) {
        return {
          navigation: allNavs,
          actions: allActions,
          entities: [],
        };
      }

      const query = spotlightQuery.toLowerCase();
      
      return {
        navigation: allNavs.filter(n => n.label.toLowerCase().includes(query)),
        actions: allActions.filter(a => a.label.toLowerCase().includes(query)),
        entities: [],
      };
    } else {
      const allNavs = [
        { id: 'live-analytical-center', label: '🛰️ Живе ШІ-Ядро (Спецпроект PREDATOR)', type: 'nav' },
        { id: 'warroom', label: '🛡️ Воєнна Кімната (War Room)', type: 'nav' },
        { id: 'oracle', label: '🧠 PREDATOR ORACLE (AI NLI)', type: 'nav' },
        { id: 'shield', label: '🛡️ PREDATOR SHIELD', type: 'nav' },
        { id: 'dashboard', label: '📊 Інтерактивний Дашборд', type: 'nav' },
        { id: 'media-forensics', label: '🎥 Media Forensics', type: 'nav' },
        { id: 'osint', label: '🔍 Робочий стіл OSINT пошуку', type: 'nav' },
        { id: 'architecture', label: '🕸️ Граф архітектури та залежностей', type: 'nav' },
        { id: 'gap', label: '🛡️ Аналіз прогалин та ризиків', type: 'nav' },
        { id: 'roadmap', label: '📅 Дорожня карта впровадження', type: 'nav' },
        { id: 'volumes', label: '📚 Томи ТЗ (Митні регламенти)', type: 'nav' },
        { id: 'advisor', label: '🤖 ШІ-Архітектор', type: 'nav' },
        { id: 'data-ingestion', label: '📥 Центр Інгестії Даних', type: 'nav' },
        { id: 'acp-factory', label: '⚡ ACP Factory', type: 'nav' },
        { id: 'research-engine', label: '🧠 AI Research Engine', type: 'nav' },
      ];

      const allActions = [
        { id: 'mute-toggle', label: isIphoneMuted ? '🔊 Увімкнути звук коментаря (Jarvis uk-UA)' : '🔇 Вимкнути звук коментаря', type: 'action' },
        { id: 'lock-toggle', label: isIphoneLocked ? '🔓 Розблокувати iPhone 15 Pro' : '🔒 Заблокувати iPhone 15 Pro', type: 'action' },
        { id: 'vol-up', label: '🔊 Збільшити гучність симулятора (+10%)', type: 'action' },
        { id: 'vol-down', label: '🔉 Зменшити гучність симулятора (-10%)', type: 'action' },
        { id: 'toggle-inspector', label: isInspectorOpen ? '📂 Закрити бічний інспектор' : '📂 Відкрити бічний інспектор', type: 'action' },
      ];

      if (!spotlightQuery.trim()) {
        return {
          navigation: allNavs.slice(0, 4),
          actions: allActions.slice(0, 3),
          entities: OSINT_ENTITIES.slice(0, 3).map(e => ({ id: e.id, label: `👤 ${e.name} [${e.code}]`, type: 'entity', raw: e })),
        };
      }

      const query = spotlightQuery.toLowerCase();
      
      return {
        navigation: allNavs.filter(n => n.label.toLowerCase().includes(query)),
        actions: allActions.filter(a => a.label.toLowerCase().includes(query)),
        entities: OSINT_ENTITIES.filter(e => 
          e.name.toLowerCase().includes(query) || 
          e.code.includes(query) ||
          (e.description && e.description.toLowerCase().includes(query))
        ).map(e => ({ id: e.id, label: `👤 ${e.name} [${e.code}]`, type: 'entity', raw: e })),
      };
    }
  }, [ecosystem, spotlightQuery, isIphoneMuted, isIphoneLocked, isInspectorOpen]);

  const handleSpotlightSelect = (item: any) => {
    if (item.type === 'nav') {
      setActiveTab(item.id);
    } else if (item.type === 'action') {
      if (item.id === 'mute-toggle') {
        handleActionButton();
      } else if (item.id === 'lock-toggle') {
        toggleIphonePower();
      } else if (item.id === 'vol-up') {
        adjustVolume(10);
      } else if (item.id === 'vol-down') {
        adjustVolume(-10);
      } else if (item.id === 'toggle-inspector') {
        setIsInspectorOpen(!isInspectorOpen);
      }
    } else if (item.type === 'entity') {
      setSelectedEntity(item.raw);
      setSelectedTool(null);
      setSelectedNode(null);
      setActiveTab('live-analytical-center');
      setIsInspectorOpen(true);
    }
    setIsSpotlightOpen(false);
    setSpotlightQuery('');
  };

  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearchQuery.trim()) return;

    // Search for matching entity
    const matched = OSINT_ENTITIES.find(ent => 
      ent.name.toLowerCase().includes(headerSearchQuery.toLowerCase()) ||
      ent.code.includes(headerSearchQuery)
    );

    if (matched) {
      setSelectedEntity(matched);
      setSelectedTool(null);
      setSelectedNode(null);
      setActiveTab('osint');
      setIsInspectorOpen(true);
    } else {
      // Switch tab to search workbench
      setActiveTab('osint');
    }
  };

  const selectEntityById = (id: string) => {
    const found = OSINT_ENTITIES.find(e => e.id === id);
    if (found) {
      setSelectedEntity(found);
      setSelectedTool(null);
      setSelectedNode(null);
      setIsInspectorOpen(true);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatMessage('');

    // Generate responsive analytical answers
    setTimeout(() => {
      let aiResponse = "Аналіз завершено. Запит опрацьовано ШІ-моделлю Gemini 3.5 Flash. Збігів у базі санкцій не знайдено.";
      
      const lower = userMsg.toLowerCase();
      if (lower.includes('санкції') || lower.includes('рнбо')) {
        aiResponse = "ШІ знайшов критичну загрозу: ТОВ 'СпецТехПостач' (код 38294012) знаходиться під санкціями РНБО з 2026 року через обхід експортних обмежень через турецьких контрагентів.";
      } else if (lower.includes('ков")') || lower.includes('коваленко')) {
        aiResponse = "Коваленко Ігор Вікторович є засновником ТОВ 'СпецТехПостач' (51%) та володіє BTC-гаманцем bc1qxy...d831. ШІ оцінює рівень ризику особи як ВИСОКИЙ (82%).";
      } else if (lower.includes('sql')) {
        aiResponse = "Ось згенерований SQL для пошуку пов'язаних бенефіціарів:\n\nSELECT * FROM company_founders WHERE risk_level = 'HIGH';";
      } else if (lower.includes('pdf')) {
        aiResponse = "Надішліть PDF-файл ТЗ чи митної декларації в чат. Я проведу миттєвий комплаєнс-аналіз згідно з 16 томами.";
      }

      setChatHistory(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 800);
  };

  const renderMobileMainContent = () => {
    return (
      <div className="h-full flex flex-col relative bg-[#020611] text-slate-100 font-sans" id="mobile-viewport-root">
        
        {/* Compact iOS / Mobile App Header */}
        <header className="border-b border-slate-900 bg-[#050c18]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-2 sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 hover:bg-slate-900/60 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-mono font-black text-xs text-white shadow shadow-indigo-500/20">
                P
              </div>
              <span className="text-xs font-black uppercase text-white font-mono tracking-wider">PREDATOR</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time status dot */}
            <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
            
            {/* Quick Desktop back switcher if simulated */}
            {!isRealMobile && (
              <button
                onClick={() => setDeviceMode('desktop')}
                className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold font-mono text-indigo-400 hover:bg-slate-850 transition-all"
                title="Режим Десктоп"
              >
                ДЕСКТОП 💻
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Mobile Main Area */}
        <main className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-[#020712] relative pb-20 select-text" id="mobile-scroll-container">
          
          {/* Mobile Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-mono uppercase tracking-widest mb-1">
            <span>PREDATOR OS</span>
            <span>/</span>
            <span className="text-indigo-400 font-bold truncate max-w-[150px]">
              {activeTab === 'live-analytical-center' ? 'ЖИВЕ ШІ-ЯДРО' : activeTab.toUpperCase().replace('-', ' ')}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
              className="w-full"
            >
              {/* Dynamic mobile workspace render */}
              {activeTab === 'live-analytical-center' && (
                <LiveAnalyticalCenter 
                  selectedEntity={selectedEntity}
                  onSelectEntityGlobal={(ent) => {
                    setSelectedEntity(ent);
                    setSelectedTool(null);
                    setSelectedNode(null);
                  }}
                  selectedScenario={selectedScenario}
                  onSelectScenario={setSelectedScenario}
                  userRole={userRole}
                />
              )}
              {activeTab === 'warroom' && (
                <WarRoom />
              )}
              {activeTab === 'oracle' && (
                <OracleWorkspace />
              )}
              {activeTab === 'shield' && (
                <ShieldCompliance />
              )}
              {activeTab === 'admin-back-office' && (
                <AdminBackOffice />
              )}
              {activeTab === 'sovereign-dashboard' && (
                <SovereignDashboard />
              )}
              {activeTab === 'dashboard' && (
                <DashboardView 
                  onSelectTab={(tabId) => setActiveTab(tabId as TabId)}
                  onSelectEntity={(entId) => {
                    const found = OSINT_ENTITIES.find(e => e.id === entId);
                    if (found) {
                      setSelectedEntity(found);
                      setSelectedTool(null);
                      setSelectedNode(null);
                    }
                  }}
                />
              )}
              {activeTab === 'data-ingestion' && (
                <div className="h-full overflow-y-auto">
                  <DataFlowInspector jobId="idle" />
                </div>
              )}
              {activeTab === 'media-forensics' && (
                userRole === 'predator' ? (
                  <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Media Forensics" />
                ) : (
                  <MediaForensicsTab />
                )
              )}
              {activeTab === 'osint' && (
                <OsintWorkbench 
                  selectedEntity={selectedEntity}
                  onSelectEntityForInspector={(ent) => {
                    setSelectedEntity(ent);
                    setSelectedTool(null);
                    setSelectedNode(null);
                    setIsInspectorOpen(true);
                  }}
                  userRole={userRole}
                />
              )}
              {activeTab === 'catalog' && <CatalogTab />}
              {activeTab === 'license' && <LicenseTab />}
              {activeTab === 'architecture' && (
                userRole === 'predator' ? (
                  <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Граф архітектури" />
                ) : (
                  <ArchitectureTab />
                )
              )}
              {activeTab === 'gap' && (
                userRole === 'predator' ? (
                  <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Аналіз прогалин" />
                ) : (
                  <GapAnalysisTab />
                )
              )}
              {activeTab === 'roadmap' && (
                userRole === 'predator' ? (
                  <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Дорожня карта" />
                ) : (
                  <RoadmapTab />
                )
              )}
              {activeTab === 'volumes' && (
                userRole === 'predator' ? (
                  <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Томи ТЗ" />
                ) : (
                  <VolumesTab />
                )
              )}
              {activeTab === 'advisor' && (
                userRole === 'predator' ? (
                  <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="ШІ-Архітектор" />
                ) : (
                  <AdvisorTab />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Left Sidebar sliding drawer overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="absolute inset-0 bg-black/80 z-50 cursor-pointer"
              />
              
              {/* Drawer slide panel */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#050b14] border-r border-slate-900 z-50 flex flex-col justify-between shadow-2xl"
              >
                <div className="p-4 space-y-5 overflow-y-auto flex-1">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-mono font-black text-white shadow">P</div>
                      <div>
                        <h2 className="text-xs font-black font-mono tracking-wider uppercase text-white">PREDATOR MOBILE</h2>
                        <p className="text-[8px] text-indigo-400 font-mono tracking-widest font-semibold">TACTICAL OSINT v2.1</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Ecosystem Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-widest block px-1">
                      РОЛЬ ТА РІВЕНЬ ДОСТУПУ
                    </span>
                    <div className="grid grid-cols-3 bg-slate-900/60 p-0.5 rounded-xl border border-slate-850 gap-0.5">
                      <button
                        onClick={() => {
                          setUserRole('predator');
                          setActiveTab('live-analytical-center');
                          setMobileMenuOpen(false);
                        }}
                        className={`py-2 rounded-lg text-[7px] font-black font-mono uppercase tracking-tight transition-all text-center ${userRole === 'predator' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        🦅 PREDATOR
                      </button>
                      <button
                        onClick={() => {
                          setUserRole('predator-pro');
                          setActiveTab('live-analytical-center');
                          setMobileMenuOpen(false);
                        }}
                        className={`py-2 rounded-lg text-[7px] font-black font-mono uppercase tracking-tight transition-all text-center ${userRole === 'predator-pro' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        ⚡ PRO
                      </button>
                      <button
                        onClick={() => {
                          setUserRole('admin');
                          setActiveTab('admin-back-office');
                          setMobileMenuOpen(false);
                        }}
                        className={`py-2 rounded-lg text-[7px] font-black font-mono uppercase tracking-tight transition-all text-center ${userRole === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        ⚙️ ADMIN
                      </button>
                    </div>
                  </div>

                  {/* Scenarios / Action tabs list */}
                  <div className="space-y-2">
                    <span className="text-[8px] text-indigo-400 font-mono font-bold uppercase tracking-widest block px-1">
                      {ecosystem === 'user' ? '🔮 СЦЕНАРІЇ ДОСЛІДЖЕННЯ' : '⚙️ АДМІНІСТРУВАННЯ'}
                    </span>
                    
                    {ecosystem === 'user' ? (
                      <div className="space-y-1">
                        {[
                          { id: 'business', label: 'Бізнес-профіль', icon: Briefcase },
                          { id: 'logistics', label: 'Логістичні шляхи', icon: Truck },
                          { id: 'taxes', label: 'Податкові ризики', icon: Landmark },
                          { id: 'customs', label: 'Митна декларація', icon: Database },
                          { id: 'geography', label: 'Гео-аналітика', icon: Globe },
                          { id: 'analytics', label: 'Прогнозування', icon: TrendingUp },
                          { id: 'assistant', label: 'ШІ-Асистент Jarvis', icon: Bot },
                          { id: 'partners', label: 'Контрагенти', icon: Users },
                          { id: 'risks', label: 'Рівні ризиків', icon: ShieldAlert },
                        ].map((scen) => {
                          const Icon = scen.icon;
                          const isActive = activeTab === 'live-analytical-center' && selectedScenario === scen.id;
                          return (
                            <button
                              key={scen.id}
                              onClick={() => {
                                setActiveTab('live-analytical-center');
                                setSelectedScenario(scen.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-semibold transition-all text-left border ${isActive ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 shadow-sm' : 'text-slate-400 border-transparent hover:bg-slate-900/30'}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{scen.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {[
                          { id: 'admin-back-office', label: 'Back Office Консоль', icon: Settings },
                          { id: 'architecture', label: 'Граф залежностей', icon: Network },
                          { id: 'gap', label: 'Аналіз прогалин', icon: Wrench },
                          { id: 'roadmap', label: 'Дорожня карта', icon: Calendar },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id as TabId);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-semibold transition-all text-left border ${isActive ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 shadow-sm' : 'text-slate-400 border-transparent hover:bg-slate-900/30'}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Mobile Stats alert */}
                  <div className="bg-[#020612] border border-slate-900 p-3 rounded-xl space-y-1.5 text-[9px] font-mono">
                    <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block">СТАТУС З'ЄДНАННЯ</span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Пінґ Сервера:</span>
                      <span className="text-emerald-400 font-bold">14ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Канали зв'язку:</span>
                      <span className="text-indigo-400 font-bold">Зашифровано</span>
                    </div>
                  </div>

                </div>

                <div className="p-3.5 border-t border-slate-900 text-center text-[8px] text-slate-600 font-mono tracking-widest uppercase">
                  Military Crypto v3.5
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Swipe Bottom Sheet for Inspector Detail panel */}
        <AnimatePresence>
          {isInspectorOpen && (selectedEntity || selectedTool || selectedNode) && (
            <>
              {/* Backdrop blur click receiver */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsInspectorOpen(false)}
                className="absolute inset-0 bg-black/70 z-45 cursor-pointer"
              />
              
              {/* iOS Bottom Sheet Wrapper */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute left-0 right-0 bottom-0 h-[72%] bg-[#050b14] border-t border-slate-800 rounded-t-[32px] z-50 flex flex-col shadow-2xl overflow-hidden select-text"
              >
                {/* Horizontal Drag handle indicator bar */}
                <div 
                  className="py-3 flex justify-center items-center cursor-pointer border-b border-slate-900/60 shrink-0 bg-[#050b14]"
                  onClick={() => setIsInspectorOpen(false)}
                >
                  <div className="w-12 h-1 bg-slate-700 hover:bg-slate-500 rounded-full transition-colors" />
                </div>
                
                {/* Embedded Inspector Content */}
                <div className="flex-1 overflow-y-auto">
                  <InspectorPanel 
                    selectedEntity={selectedEntity}
                    selectedTool={selectedTool}
                    selectedNode={selectedNode}
                    onClose={() => setIsInspectorOpen(false)}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating AI Jarvis Chat button (Mobile optimized) */}
        <div className="fixed bottom-18 right-4 z-40">
          <button
            onClick={() => setIsAiChatOpen(!isAiChatOpen)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg transition-all flex items-center justify-center border border-indigo-400/20"
            title="AI Jarvis"
          >
            <Bot className="w-5 h-5" />
          </button>
        </div>

        {/* Floating AI Assistant Chat panel for Mobile Screen */}
        <AnimatePresence>
          {isAiChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-18 right-4 left-4 h-[300px] bg-[#050c18] border border-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col z-40 select-text"
            >
              {/* Header */}
              <div className="p-2.5 bg-indigo-950/20 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9px] font-mono font-bold text-white uppercase tracking-wider">JARVIS ШІ</span>
                </div>
                <button onClick={() => setIsAiChatOpen(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat history list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-[11px]">
                {chatHistory.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`p-2 rounded-xl leading-relaxed max-w-[90%] ${msg.sender === 'user' ? 'bg-indigo-600 text-white ml-auto' : 'bg-slate-900 border border-slate-850 text-slate-300'}`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Chat inputs */}
              <div className="p-1.5 border-t border-slate-900 bg-slate-950 flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Запитайте ШІ про санкції..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 bg-slate-900 border border-slate-850 rounded-md px-2 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500/40"
                />
                <button
                  onClick={startVoiceControl}
                  className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${isVoiceListening ? 'bg-red-500/20 text-red-400 border border-red-500/20 animate-pulse' : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-indigo-400'}`}
                  title="Голосовий ввід"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-md transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom iOS Navigation / Tab Bar */}
        <nav className="border-t border-slate-900 bg-slate-950/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shrink-0 relative z-30 pb-5">
          {[
            { id: 'live-analytical-center', label: 'ШІ-Ядро', icon: Compass },
            { id: 'dashboard', label: 'Дашборд', icon: Layers },
            { id: 'osint', label: 'Пошук', icon: Search },
            { id: 'admin-back-office', label: 'Адмін', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'admin-back-office') {
                    setEcosystem('admin');
                    setActiveTab('admin-back-office');
                  } else {
                    setEcosystem('user');
                    setActiveTab(tab.id as TabId);
                  }
                }}
                className={`flex flex-col items-center gap-1.5 cursor-pointer py-1 px-3.5 rounded-xl transition-all ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[8px] font-bold font-mono tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    );
  };

  const renderIphoneLayout = () => {
    // If on a real mobile screen size, omit physical iPhone simulator border wrapping to save real estate
    if (isRealMobile) {
      return renderMobileMainContent();
    }

    return (
      <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none" id="iphone-simulator-view">
        
        {/* Cinematic tech cockpit backgrounds */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        {/* Top Floating Simulation Menu */}
        <div className="mb-5 flex flex-col items-center text-center gap-1.5 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black tracking-widest text-slate-300 font-mono uppercase">📱 СИМУЛЯТОР IPHONE 15 PRO</h2>
            <span className="text-[8px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded px-1.5 py-0.5 font-bold uppercase tracking-widest font-mono">
              ACTIVE EMBED
            </span>
          </div>
          <p className="text-[10px] text-slate-500 max-w-sm font-mono leading-relaxed uppercase tracking-tight">
            Інтерфейс системи <strong className="text-indigo-400">PREDATOR</strong> повністю адаптований під iOS та сенсорний інтерфейс.
          </p>
          <button
            onClick={() => setDeviceMode('desktop')}
            className="mt-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-indigo-400 text-[10px] font-bold font-mono tracking-wider rounded-xl transition-all cursor-pointer shadow flex items-center gap-1.5"
          >
            💻 ПОВЕРНУТИСЬ НА ДЕСКТОП
          </button>
        </div>

        {/* Realistic Graphite Titanium iPhone 15 Pro physical mockup container */}
        <div className="relative mx-auto my-auto transition-all duration-500 z-10">
          
          {/* Side Mechanical Buttons - Clickable & Interactive on Desktop */}
          <button 
            onClick={handleActionButton}
            className="absolute left-[-6px] top-[140px] w-[6px] h-[35px] bg-[#1e293b] hover:bg-indigo-500 active:scale-95 rounded-l border-r border-slate-950 transition-all z-40 cursor-pointer focus:outline-none" 
            title="Кнопка Дії: Беззвучний режим"
          />
          <button 
            onClick={() => adjustVolume(10)}
            className="absolute left-[-6px] top-[195px] w-[6px] h-[60px] bg-[#1e293b] hover:bg-indigo-500 active:scale-95 rounded-l border-r border-slate-950 transition-all z-40 cursor-pointer focus:outline-none" 
            title="Збільшити гучність (+10%)"
          />
          <button 
            onClick={() => adjustVolume(-10)}
            className="absolute left-[-6px] top-[265px] w-[6px] h-[60px] bg-[#1e293b] hover:bg-indigo-500 active:scale-95 rounded-l border-r border-slate-950 transition-all z-40 cursor-pointer focus:outline-none" 
            title="Зменшити гучність (-10%)"
          />
          <button 
            onClick={toggleIphonePower}
            className="absolute right-[-6px] top-[230px] w-[6px] h-[90px] bg-[#1e293b] hover:bg-indigo-500 active:scale-95 rounded-r border-l border-slate-950 transition-all z-40 cursor-pointer focus:outline-none" 
            title="Кнопка живлення: Блокування екрану"
          />

          {/* Native-style iOS Volume Slider HUD */}
          <AnimatePresence>
            {showVolumeHUD && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute left-4 top-[220px] w-6 h-32 bg-black/95 rounded-xl z-50 border border-slate-850/80 p-1 flex flex-col items-center justify-end overflow-hidden shadow-2xl"
              >
                <div className="flex-1 w-full bg-slate-900 rounded-lg overflow-hidden flex flex-col justify-end relative">
                  <motion.div 
                    className="w-full bg-indigo-500"
                    animate={{ height: `${iphoneVolume}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <span className="text-[8px] text-slate-400 font-mono mt-1 font-bold">
                  {iphoneVolume}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Device outer frame bezel */}
          <div className="w-[395px] h-[844px] bg-[#0c0f17] rounded-[55px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_45px_rgba(99,102,241,0.06)] border-[10px] border-[#222c3d] relative flex flex-col overflow-hidden ring-1 ring-white/10">
            
            {/* Interactive Dynamic Island bar pill */}
            <motion.div 
              layout
              onClick={handleDynamicIslandClick}
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-[20px] z-50 flex items-center justify-between pointer-events-auto border border-slate-900/80 shadow-2xl cursor-pointer select-none overflow-hidden"
              animate={{
                width: dynamicIslandState === 'expanded' ? 320 : dynamicIslandState === 'voice-listening' ? 240 : dynamicIslandState === 'mute-alert' || dynamicIslandState === 'unmute-alert' ? 150 : 112,
                height: dynamicIslandState === 'expanded' ? 120 : dynamicIslandState === 'voice-listening' ? 36 : 26,
                borderRadius: dynamicIslandState === 'expanded' ? 28 : 20,
                paddingLeft: dynamicIslandState === 'expanded' ? 16 : 10,
                paddingRight: dynamicIslandState === 'expanded' ? 16 : 10,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            >
              {dynamicIslandState === 'normal' && (
                <>
                  <div className="w-2 h-2 bg-indigo-950 rounded-full border border-indigo-500/40 flex items-center justify-center shrink-0">
                    <div className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-[7px] text-indigo-400 font-mono font-black tracking-widest uppercase animate-pulse shrink-0">PREDATOR</span>
                  <div className="w-2 h-2 bg-slate-900 rounded-full flex items-center justify-center shrink-0">
                    <div className="w-1 h-1 bg-[#020617] rounded-full"></div>
                  </div>
                </>
              )}

              {dynamicIslandState === 'voice-listening' && (
                <div className="w-full flex items-center justify-between gap-2 text-[9px] font-mono text-white py-1">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[7px] uppercase tracking-wider text-red-400 font-bold animate-pulse">Голос</span>
                  </div>
                  <div className="flex items-center gap-0.5 justify-center flex-1 h-3 shrink-0">
                    <span className="w-0.5 h-2 bg-indigo-400 animate-pulse rounded"></span>
                    <span className="w-0.5 h-3 bg-indigo-400 animate-pulse rounded delay-75"></span>
                    <span className="w-0.5 h-1.5 bg-indigo-400 animate-pulse rounded delay-150"></span>
                    <span className="w-0.5 h-3 bg-indigo-400 animate-pulse rounded delay-200"></span>
                    <span className="w-0.5 h-1 bg-indigo-400 animate-pulse rounded delay-300"></span>
                  </div>
                  <span className="text-[7px] text-slate-400 truncate max-w-[110px] shrink-0 font-sans italic">
                    {voiceFeedback ? voiceFeedback.replace('Почуто: ', '').replace('Об\'єкт: ', '') : "Слухаю..."}
                  </span>
                </div>
              )}

              {(dynamicIslandState === 'mute-alert' || dynamicIslandState === 'unmute-alert') && (
                <div className="w-full flex items-center justify-center gap-2 text-[9px] font-mono font-bold">
                  {dynamicIslandState === 'mute-alert' ? (
                    <>
                      <span className="text-amber-500">🔕</span>
                      <span className="text-amber-400 uppercase tracking-wider">Без звуку</span>
                    </>
                  ) : (
                    <>
                      <span className="text-emerald-500">🔔</span>
                      <span className="text-emerald-400 uppercase tracking-wider">Дзвінок</span>
                    </>
                  )}
                </div>
              )}

              {dynamicIslandState === 'expanded' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-full h-full flex flex-col justify-between py-2 text-left"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[9px] font-mono font-black uppercase text-indigo-400 tracking-wider">PREDATOR INTEL ENGINE</span>
                    </div>
                    <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-white font-mono">
                      v2.5
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div className="bg-slate-950/60 p-1.5 rounded-lg border border-white/5 text-center">
                      <p className="text-[7px] text-slate-500 font-mono uppercase">GPU LOAD</p>
                      <p className="text-[10px] font-bold text-emerald-400 font-mono">42%</p>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded-lg border border-white/5 text-center">
                      <p className="text-[7px] text-slate-500 font-mono uppercase">MEM LATENCY</p>
                      <p className="text-[10px] font-bold text-indigo-400 font-mono">14ms</p>
                    </div>
                    <div className="bg-slate-950/60 p-1.5 rounded-lg border border-white/5 text-center">
                      <p className="text-[7px] text-slate-500 font-mono uppercase">MODELS</p>
                      <p className="text-[9px] font-bold text-amber-400 font-mono leading-none pt-0.5">GEMINI 3.5</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[8px] text-slate-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Зв'язок захищено (СБУ-VIP)
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAiChatOpen(true);
                        setDynamicIslandState('normal');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded text-[8px] text-white font-mono font-bold uppercase transition-colors"
                    >
                      КЛИК ПО ШІ
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Simulated interactive iOS status notifications */}
            <AnimatePresence>
              {isAiChatOpen && dynamicIslandState !== 'expanded' && (
                <motion.div
                  initial={{ top: -10, scale: 0.8, opacity: 0 }}
                  animate={{ top: 12, scale: 1, opacity: 1 }}
                  exit={{ top: -10, scale: 0.8, opacity: 0 }}
                  className="absolute left-1/2 -translate-x-1/2 w-72 bg-black/95 text-white py-2 px-3.5 rounded-full z-50 border border-indigo-500/20 flex items-center justify-between text-[8px] font-mono shadow-2xl pointer-events-auto"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                    <span className="font-bold text-slate-200">JARVIS ШІ: АКТИВНИЙ</span>
                  </div>
                  <span className="text-[7px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">ОНЛАЙН</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simulated iOS Status Bar Flanking Dynamic Island */}
            <div className="absolute top-4 left-0 right-0 h-6 z-40 flex items-center justify-between px-8 text-[11px] font-mono text-slate-300 font-bold pointer-events-none select-none">
              {/* Time */}
              <div>{iphoneTime}</div>
              
              {/* Icons */}
              <div className="flex items-center gap-1.5 text-[9px]">
                <span className="text-[8px] font-bold text-slate-400">5G</span>
                {/* Strength bars */}
                <div className="flex gap-[1px] items-end h-2">
                  <div className="w-[1px] h-[3px] bg-slate-400 rounded-full" />
                  <div className="w-[1px] h-[5px] bg-slate-400 rounded-full" />
                  <div className="w-[1px] h-[7px] bg-indigo-400 rounded-full" />
                  <div className="w-[1px] h-[9px] bg-indigo-400 rounded-full" />
                </div>
                <span>📶</span>
                {/* Battery */}
                <div className="flex items-center gap-0.5 border border-slate-500 rounded px-[1.5px] py-[0.5px]">
                  <span className="text-[7px] scale-[0.8] leading-none text-slate-400 font-medium">98%</span>
                  <div className="w-2.5 h-1 bg-emerald-500 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Emulated iPhone Virtual Screen Frame */}
            <div className="flex-1 rounded-[42px] overflow-hidden bg-[#020617] flex flex-col relative border border-white/5 shadow-inner">
              {isIphoneLocked ? (
                <div 
                  onClick={toggleIphonePower}
                  className="absolute inset-0 bg-[#020308] z-40 flex flex-col justify-between p-6 cursor-pointer select-none"
                  id="iphone-lockscreen"
                >
                  {/* Subtle Deep Nebula Space Gradient with stars */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(49,46,129,0.35)_0%,transparent_75%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(9,9,11,0.95)_0%,rgba(2,3,8,1)_100%)]" />
                  
                  {/* Lock Screen Header */}
                  <div className="relative z-10 flex flex-col items-center mt-12 space-y-1">
                    <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-[0.25em] uppercase">
                      🔒 PREDATOR TACTICAL OS
                    </span>
                    <h3 className="text-[11px] text-slate-400 font-medium font-sans">
                      {lockscreenDate}
                    </h3>
                    <h1 className="text-6xl font-light tracking-tighter text-white font-sans mt-2">
                      {iphoneTime}
                    </h1>

                    {/* Circular Lockscreen Widgets */}
                    <div className="flex gap-4 mt-6">
                      {/* Battery Circle */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center w-[72px] h-[72px]">
                        <span className="text-[7px] text-slate-500 font-mono uppercase font-bold tracking-wider">BATTERY</span>
                        <div className="relative w-8 h-8 flex items-center justify-center mt-1">
                          <svg className="w-8 h-8 -rotate-90">
                            <circle cx="16" cy="16" r="13" className="stroke-slate-800" strokeWidth="2.5" fill="none" />
                            <circle cx="16" cy="16" r="13" className="stroke-emerald-500" strokeWidth="2.5" fill="none" strokeDasharray="81.68" strokeDashoffset={81.68 * (1 - 0.98)} />
                          </svg>
                          <span className="absolute text-[8px] font-mono font-bold text-white">98%</span>
                        </div>
                      </div>

                      {/* System Status */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center justify-center w-[120px] h-[72px]">
                        <span className="text-[7px] text-indigo-400 font-mono uppercase font-bold tracking-wider">SYSTEM</span>
                        <div className="text-center mt-1.5 space-y-0.5">
                          <p className="text-[9px] font-bold text-white font-mono">SECURE CHNL</p>
                          <p className="text-[7px] text-slate-500 font-mono">ID: 02894-A</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lock Screen Bottom Swipe Hint */}
                  <div className="relative z-10 flex flex-col items-center space-y-3 mb-4 animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 text-xs">
                      ⚡
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-black font-mono tracking-widest text-white/80 uppercase">
                        TAP TO UNLOCK
                      </p>
                      <p className="text-[8px] text-slate-500 font-mono">
                        Або натисніть кнопку живлення
                      </p>
                    </div>
                  </div>

                </div>
              ) : (
                renderMobileMainContent()
              )}
            </div>

            {/* Bottom physical home swipe gesture line */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-[3.5px] bg-white/30 rounded-full z-50 pointer-events-none" />

          </div>
        </div>

      </div>
    );
  };

  const renderDesktopLayout = () => {
    return (
      <>
      <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200" id="predator-hub-app">
        
        {/* 1. STICKY HEADER (Section 6) */}
        <header className="glass-nav sticky top-0 z-40 px-5 py-3.5 flex items-center justify-between gap-4">
          
          {/* Left: Brand logo & name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню"}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-mono font-black text-lg tracking-wider text-white shadow-lg shadow-indigo-500/10 border border-indigo-500/20" id="header-logo">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-wider uppercase text-white font-mono">PREDATOR Analytics</h1>
                  <span className="text-[8px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded px-1.5 py-0.5 font-bold uppercase tracking-widest font-mono">
                    MILITARY INTEL
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold font-mono uppercase tracking-tight">
                  Центр управління аналітикою безпеки
                </p>
              </div>
            </div>
          </div>

          {/* Search Trigger for Command Center (Ctrl+K) & Voice Control */}
          <div className="hidden lg:flex items-center gap-2">
            <div 
              onClick={() => setIsSpotlightOpen(true)}
              className="flex items-center gap-2 bg-slate-900/50 border border-slate-850 hover:border-indigo-500/30 rounded-xl px-3 py-2 cursor-pointer transition-all w-72 select-none group"
              id="spotlight-header-trigger"
            >
              <Search className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <span className="text-slate-400 text-xs flex-1 text-left">Шукати фірму, особу чи гаманець...</span>
              <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                Ctrl+K
              </span>
            </div>
            <button
              onClick={startVoiceControl}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${isVoiceListening ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-slate-900/50 text-slate-400 border-slate-850 hover:border-indigo-500/30 hover:text-indigo-400'}`}
              title="Голосовий пошук та команди (Web Speech API)"
              id="voice-header-trigger"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Triple Role Switch Toggle & Device Rendering Switch */}
          <div className="flex bg-slate-900/60 border border-slate-850 p-1 rounded-xl max-w-2xl gap-3 items-center" id="ecosystem-toggle">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setUserRole('predator');
                  setActiveTab('live-analytical-center');
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black font-mono tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${userRole === 'predator' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'}`}
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>🦅 PREDATOR</span>
              </button>
              <button
                onClick={() => {
                  setUserRole('predator-pro');
                  setActiveTab('live-analytical-center');
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black font-mono tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${userRole === 'predator-pro' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'}`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ PREDATOR PRO</span>
              </button>
              <button
                onClick={() => {
                  setUserRole('admin');
                  setActiveTab('admin-back-office');
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black font-mono tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${userRole === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'}`}
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>⚙️ ADMIN</span>
              </button>
            </div>

            {!isRealMobile && (
              <div className="h-6 w-[1px] bg-slate-800"></div>
            )}

            {!isRealMobile && (
              <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-900 gap-1">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`px-2.5 py-1.5 rounded text-[9px] font-black font-mono tracking-wider transition-all flex items-center gap-1 cursor-pointer ${deviceMode === 'desktop' ? 'bg-slate-900 text-indigo-400 border border-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Режим Десктоп"
                >
                  💻 ДЕСКТОП
                </button>
                <button
                  onClick={() => setDeviceMode('iphone')}
                  className={`px-2.5 py-1.5 rounded text-[9px] font-black font-mono tracking-wider transition-all flex items-center gap-1 cursor-pointer ${deviceMode === 'iphone' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Режим iPhone 15"
                >
                  📱 IPHONE
                </button>
              </div>
            )}
          </div>

          {/* Right: Actions, Subscription level, system status */}
          <div className="flex items-center gap-4 text-xs font-mono">
            
            {/* Subscription Badge (Section 6) */}
            <div className="hidden lg:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP ENTERPRISE / СБУ</span>
            </div>

            {/* Quick Status indicators (Section 6) */}
            <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[10px]">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                API: <strong className="text-slate-200">14ms</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                State: <strong className="text-emerald-400">Tactical 60 FPS</strong>
              </span>
            </div>

            {/* Alerts Bell notification */}
            <AlertCenter 
              onOpenWatchlist={() => setIsWatchlistOpen(true)}
              onSelectEntity={handleSelectEntityFromWatchlist}
            />

            {/* Profile Avatars */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-900">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-900 flex items-center justify-center font-bold text-indigo-400 font-mono">
                UA
              </div>
              <div className="hidden xl:block text-left text-[10px] leading-tight">
                <p className="font-bold text-slate-200">Черговий : АН</p>
                <p className="text-slate-500 font-mono">ID: 02894-A</p>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('predator_token');
                  setIsAuthenticated(false);
                }}
                className="ml-2 p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                title="Завершити сесію"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </header>

        {/* MILITARY BROADCAST SECURITY NEWS TICKER */}
        {ecosystem === 'user' && (
          <div className="bg-slate-950/90 border-b border-slate-900/60 h-8 flex items-center overflow-hidden relative select-none z-30 shrink-0">
            <div className="absolute left-0 top-0 bottom-0 px-3 bg-indigo-950/80 border-r border-indigo-900/40 text-indigo-400 font-mono text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 z-10 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>ШІ-СЕНСОР</span>
            </div>

            <div className="flex-1 overflow-hidden pl-24">
              <div className="animate-marquee whitespace-nowrap flex gap-12 text-[10px] text-slate-400 font-mono font-medium py-1">
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-rose-500 font-bold">🚨 КРИТИЧНО:</span>
                  <span>Виявлено обхід санкцій через Туреччину у ТОВ "СпецТехПостач" (Код: 38294012).</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-emerald-500 font-bold">⚡ ШІ PREDATOR:</span>
                  <span>Оброблено черговий пакет судових рішень за 14ms (точність комплаєнсу 99.9%).</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-indigo-400 font-bold">📡 ГЕО-РАДАР:</span>
                  <span>Логістичні ланцюги Шеньчжень → Київ оновлено в реальному часі.</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-amber-400 font-bold">🔒 СИСТЕМА:</span>
                  <span>Канал зв'язку захищено алгоритмом СБУ-VIP (RSA-4096).</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-indigo-400 font-bold">💡 ПІДКАЗКА:</span>
                  <span>Натисніть <strong className="text-white bg-slate-900 border border-slate-800 px-1 rounded">Ctrl+K</strong> або клікніть "Швидкий пошук" для миттєвих команд.</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2 & 8 & 9. MAIN CONTENT ZONE (Sidebar | Main Workspace | Inspector Panel) */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* LEFT SIDEBAR (Section 7) */}
          <aside 
            className={`shrink-0 glass-nav flex flex-col justify-between transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}`}
            id="tactical-sidebar"
          >
            
            {/* Navigation group */}
            <div className="p-3 space-y-4 overflow-y-auto flex-1">
              
              {ecosystem === 'user' ? (
                <>
                  {/* User Ecosystem Navigation */}
                  <div className="space-y-1.5">
                    {!sidebarCollapsed && (
                      <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-widest block px-2.5 py-1">
                        🛰️ АНАЛІТИЧНИЙ ПРОСТІР
                      </span>
                    )}
                    
                    <button 
                      onClick={() => setActiveTab('genesis-workspace')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'genesis-workspace' ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Map className={`w-4 h-4 ${activeTab === 'genesis-workspace' ? 'text-cyan-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Genesis Canvas</span>
                          <span className="text-[8px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest">PAE</span>
                        </div>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('live-analytical-center')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'live-analytical-center' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Compass className={`w-4 h-4 ${activeTab === 'live-analytical-center' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Живе ШІ-Ядро</span>
                          <span className="text-[8px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest">CORE</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('sovereign-dashboard')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'sovereign-dashboard' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <ShieldAlert className={`w-4 h-4 ${activeTab === 'sovereign-dashboard' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Командний Центр</span>
                          <span className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest">CMD</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('maps')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'maps' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Map className={`w-4 h-4 ${activeTab === 'maps' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Інтерактивна Карта</span>
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono font-bold">MAP</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('warroom')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'warroom' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Shield className={`w-4 h-4 ${activeTab === 'warroom' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Воєнна Кімната</span>
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono font-bold">WAR</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('oracle')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'oracle' ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <BrainCircuit className={`w-4 h-4 ${activeTab === 'oracle' ? 'text-cyan-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>PREDATOR ORACLE</span>
                          <span className="text-[9px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold">NLI</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('shield')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'shield' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <ShieldCheck className={`w-4 h-4 ${activeTab === 'shield' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>PREDATOR SHIELD</span>
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">WORM</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Layers className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Старий Дашборд</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">LIVE</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('osint')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'osint' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Search className={`w-4 h-4 ${activeTab === 'osint' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Старий Пошук</span>
                          <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono">RISK</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('data-ingestion')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'data-ingestion' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Database className={`w-4 h-4 ${activeTab === 'data-ingestion' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Центр Інгестії</span>
                          <span className="text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold">DATA</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('acp-factory')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'acp-factory' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Zap className={`w-4 h-4 ${activeTab === 'acp-factory' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>ACP Factory</span>
                          <span className="text-[9px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-mono font-bold">ACP</span>
                        </div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveTab('research-engine')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'research-engine' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <BrainCircuit className={`w-4 h-4 ${activeTab === 'research-engine' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Research Engine</span>
                          <span className="text-[9px] bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 px-1.5 py-0.5 rounded font-mono font-bold">AI</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Group: Scenarios (User Space) */}
                  <div className="space-y-1">
                    {!sidebarCollapsed && (
                      <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-widest block px-2.5 py-1">
                        🔮 СЦЕНАРІЇ ДОСЛІДЖЕННЯ
                      </span>
                    )}

                    {[
                      { id: 'business', label: 'Бізнес-профіль', icon: Briefcase },
                      { id: 'logistics', label: 'Логістичні шляхи', icon: Truck },
                      { id: 'taxes', label: 'Податкові ризики', icon: Landmark },
                      { id: 'customs', label: 'Митна декларація', icon: Database },
                      { id: 'geography', label: 'Гео-аналітика', icon: Globe },
                      { id: 'analytics', label: 'Прогнозування', icon: TrendingUp },
                      { id: 'assistant', label: 'ШІ-Асистент Jarvis', icon: Bot },
                      { id: 'partners', label: 'Контрагенти', icon: Users },
                      { id: 'risks', label: 'Рівні ризиків', icon: ShieldAlert },
                    ].map((scen) => {
                      const Icon = scen.icon;
                      const isActive = activeTab === 'live-analytical-center' && selectedScenario === scen.id;
                      return (
                        <button
                          key={scen.id}
                          onClick={() => {
                            setActiveTab('live-analytical-center');
                            setSelectedScenario(scen.id);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                          {!sidebarCollapsed && <span>{scen.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Admin Ecosystem Navigation */}
                  <div className="space-y-1.5">
                    {!sidebarCollapsed && (
                      <span className="text-[9px] text-amber-500 font-mono font-bold uppercase tracking-widest block px-2.5 py-1">
                        ⚙️ АДМІНІСТРУВАННЯ КЛАСУ
                      </span>
                    )}
                    
                    <button 
                      onClick={() => setActiveTab('admin-back-office')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'admin-back-office' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                    >
                      <Settings className={`w-4 h-4 ${activeTab === 'admin-back-office' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>Back Office Консоль</span>
                          <span className="text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest">ADMIN</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Group: Infra Specifications (Admin Space) */}
                  <div className="space-y-1">
                    {!sidebarCollapsed && (
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block px-2.5 py-1">
                        АРХІТЕКТУРА ІНФРАСТРУКТУРИ
                      </span>
                    )}

                    {[
                      { id: 'architecture', label: 'Граф залежностей', icon: Network },
                      { id: 'gap', label: 'Аналіз прогалин', icon: Wrench },
                      { id: 'roadmap', label: 'Дорожня карта', icon: Calendar },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as TabId);
                            if (tab.id === 'architecture') {
                              setSelectedNode({
                                id: 'core_api',
                                label: 'Core REST API',
                                group: 'Core'
                              });
                              setSelectedEntity(null);
                              setSelectedTool(null);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${isActive ? 'bg-slate-900 text-indigo-400 border border-slate-800' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/30'}`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                          {!sidebarCollapsed && <span>{tab.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Quick status alerts inside sidebar */}
              {!sidebarCollapsed && (
                <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl space-y-2 mt-4">
                  <span className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider block">СТАН СИСТЕМИ PREDATOR</span>
                  <div className="space-y-1 text-[10px] text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>Kafka Queue:</span>
                      <span className="text-emerald-400 font-bold">0 lag</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Qdrant:</span>
                      <span className="text-indigo-400">98% Match</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Collapsed control */}
            <div className="p-3 border-t border-slate-900 text-center">
              <button 
                onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {sidebarCollapsed ? 'INSP' : isInspectorOpen ? 'Сховати Інспектор' : 'Показати Інспектор'}
              </button>
            </div>

          </aside>

          {/* MAIN WORKSPACE (Section 8) */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950 relative" id="workspace-main">
            
            {/* Active Navigation Breadcrumbs */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">
              <span>PREDATOR</span>
              <span>/</span>
              <span className="text-indigo-400 font-bold">
                {ecosystem === 'user' ? 'КОРИСТУВАЦЬКА ЕКОСИСТЕМА' : 'АДМІНІСТРАТИВНА ЕКОСИСТЕМА'}
              </span>
              <span>/</span>
              <span className="text-indigo-400 font-bold">
                {activeTab === 'live-analytical-center' && 'Живий Аналітичний Центр (ШІ-Ядро)'}
                {activeTab === 'admin-back-office' && 'Back Office Консоль (ArgoCD & Grafana)'}
                {activeTab === 'dashboard' && 'Старий Дашборд'}
                {activeTab === 'osint' && 'Старий Пошук OSINT'}
                {activeTab === 'maps' && 'Інтерактивна Карта PREDATOR'}
                {activeTab === 'warroom' && 'PREDATOR WAR ROOM'}
                {activeTab === 'oracle' && 'PREDATOR ORACLE (AI NLI)'}
                {activeTab === 'shield' && 'PREDATOR SHIELD (Compliance)'}
                {activeTab === 'catalog' && 'Каталог рішень'}
                {activeTab === 'license' && 'Сумісність ліцензій'}
                {activeTab === 'architecture' && 'Граф залежностей'}
                {activeTab === 'gap' && 'Аналіз прогалин'}
                {activeTab === 'roadmap' && 'Дорожня карта'}
                {activeTab === 'volumes' && 'Томи ТЗ'}
                {activeTab === 'advisor' && 'ШІ-Архітектор'}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {/* Dynamic routing */}
                {activeTab === 'genesis-workspace' && (
                  <div className="absolute inset-0 overflow-hidden">
                    <GenesisCanvas intentActive={intentActive} data={paeData} />
                    <div className="ui-overlay pointer-events-none flex flex-col items-center justify-center">
                      <AnimatePresence>
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="cyber-panel p-6 rounded-2xl w-[600px] pointer-events-auto shadow-2xl shadow-cyan-500/20"
                          >
                            <h3 className="hud-element text-sm mb-4 tracking-[0.2em] uppercase text-cyan-400">
                              [PAE] Введіть намір або об'єкт...
                            </h3>
                            <input
                              type="text"
                              value={genesisQuery}
                              onChange={(e) => setGenesisQuery(e.target.value)}
                              placeholder="Type to command..."
                              className="cyber-type-input"
                              autoFocus
                            />
                            <p className="text-[10px] text-cyan-500/50 mt-4 text-center font-mono">
                              Press ENTER to Synthesize • ESC to abort
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                {activeTab === 'live-analytical-center' && (
                  <div className="flex flex-col gap-6">
                    <OodaRadar />
                    <LiveAnalyticalCenter 
                      selectedEntity={selectedEntity}
                      onSelectEntityGlobal={(ent) => {
                        setSelectedEntity(ent);
                        setSelectedTool(null);
                        setSelectedNode(null);
                      }}
                      selectedScenario={selectedScenario}
                      onSelectScenario={setSelectedScenario}
                      userRole={userRole}
                    />
                  </div>
                )}
                {activeTab === 'admin-back-office' && (
                  <AdminBackOffice />
                )}
                {activeTab === 'dashboard' && (
                  <DashboardView 
                    onSelectTab={(tabId) => {
                      if (tabId === 'osint') {
                        setActiveTab('live-analytical-center');
                      } else {
                        setActiveTab(tabId as TabId);
                      }
                    }}
                    onSelectEntity={(entId) => {
                      selectEntityById(entId);
                      setActiveTab('live-analytical-center');
                    }}
                  />
                )}
                {activeTab === 'media-forensics' && (
                  userRole === 'predator' ? (
                    <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Media Forensics" />
                  ) : (
                    <MediaForensicsTab />
                  )
                )}
                {activeTab === 'osint' && (
                  <OsintWorkbench 
                    selectedEntity={selectedEntity}
                    onSelectEntityForInspector={(ent) => {
                      setSelectedEntity(ent);
                      setSelectedTool(null);
                      setSelectedNode(null);
                      setIsInspectorOpen(true);
                    }}
                    userRole={userRole}
                  />
                )}
                {activeTab === 'maps' && (
                  <MapsTab 
                    onSelectEntityGlobal={(ent) => {
                      setSelectedEntity(ent);
                      setSelectedTool(null);
                      setSelectedNode(null);
                      setActiveTab('live-analytical-center');
                    }}
                  />
                )}
                {activeTab === 'catalog' && <CatalogTab />}
                {activeTab === 'license' && <LicenseTab />}
                {activeTab === 'architecture' && (
                  userRole === 'predator' ? (
                    <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Граф архітектури" />
                  ) : (
                    <ArchitectureTab />
                  )
                )}
                {activeTab === 'gap' && (
                  userRole === 'predator' ? (
                    <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Аналіз прогалин" />
                  ) : (
                    <GapAnalysisTab />
                  )
                )}
                {activeTab === 'roadmap' && (
                  userRole === 'predator' ? (
                    <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Дорожня карта" />
                  ) : (
                    <RoadmapTab />
                  )
                )}
                {activeTab === 'volumes' && (
                  userRole === 'predator' ? (
                    <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="Томи ТЗ" />
                  ) : (
                    <VolumesTab />
                  )
                )}
                {activeTab === 'advisor' && (
                  userRole === 'predator' ? (
                    <RestrictedFeatureOverlay onUpgrade={() => setUserRole('predator-pro')} tabName="ШІ-Архітектор" />
                  ) : (
                    <AdvisorTab />
                  )
                )}
                {activeTab === 'acp-factory' && (
                  <ACPFactoryPage />
                )}
                {activeTab === 'research-engine' && (
                  <ResearchEnginePage />
                )}
              </motion.div>
            </AnimatePresence>

          </main>

          {/* RIGHT INSPECTOR PANEL (Section 9) */}
          <AnimatePresence>
            {isInspectorOpen && (
              <motion.aside 
                initial={{ opacity: 0, x: 200, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 340 }}
                exit={{ opacity: 0, x: 200, width: 0 }}
                className="shrink-0 h-full overflow-hidden"
                id="right-inspector-panel"
              >
                <InspectorPanel 
                  selectedEntity={selectedEntity}
                  selectedTool={selectedTool}
                  selectedNode={selectedNode}
                  onClose={() => setIsInspectorOpen(false)}
                />
              </motion.aside>
            )}
          </AnimatePresence>

        </div>

        {/* 5. FLOATING AI ASSISTANT TERMINAL (Section 17) */}
        {ecosystem === 'user' && (
          <div className="fixed bottom-14 right-6 z-50">
            
            {/* Toggle bubble button */}
            <button
              onClick={() => setIsAiChatOpen(!isAiChatOpen)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-2xl transition-all cursor-pointer flex items-center justify-center border border-indigo-400/20 group"
              title="ШІ-Помічник PREDATOR"
            >
              <Bot className="w-5.5 h-5.5 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
            </button>

            {/* Assistant window */}
            <AnimatePresence>
              {isAiChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  className="absolute bottom-14 right-0 w-80 bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[380px]"
                >
                  {/* Header */}
                  <div className="p-3 bg-indigo-950/20 border-b border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                        PREDATOR ШІ-Асистент
                      </span>
                    </div>
                    <button 
                      onClick={() => setIsAiChatOpen(false)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                    {chatHistory.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`p-2.5 rounded-xl leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'bg-indigo-600 text-white ml-auto' : 'bg-slate-900 border border-slate-850 text-slate-300'}`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-2 border-t border-slate-900 bg-slate-950/80 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Запитайте ШІ про санкції чи SQL..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      className="flex-1 bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-indigo-500/40"
                    />
                    <button
                      onClick={startVoiceControl}
                      className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${isVoiceListening ? 'bg-red-500/20 text-red-400 border border-red-500/20 animate-pulse' : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-indigo-400'}`}
                      title="Голосовий ввід"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* 4. BOTTOM STATUS BAR (Section 10) */}
        {ecosystem === 'admin' ? (
          <footer className="border-t border-slate-900 bg-slate-950 px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] text-slate-500 font-mono uppercase tracking-wider z-40 sticky bottom-0">
            
            {/* Left indicators */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                PREDATOR ENG: ONLINE
              </span>
              <span>API: 12ms</span>
              <span className="text-indigo-400 font-bold">GPU: NVIDIA A100 (42% VRAM)</span>
              <span>CPU: 18%</span>
              <span>RAM: 14.8 GB / 64 GB</span>
            </div>

            {/* Right indices and queues statuses */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-emerald-400">INDEXING: ACTIVE (140 files/sec)</span>
              <span>BASES: Neo4j, Qdrant, PG</span>
              <span className="text-amber-500 font-bold">QUEUES: KAFKA (0 LAG)</span>
              <span>LLM: GEMINI 3.5 FLASH</span>
              <span>CLUSTER: CLOUD RUN EUR-W2</span>
            </div>

          </footer>
        ) : (
          <footer className="border-t border-slate-900 bg-slate-950 px-5 py-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] text-slate-500 font-mono uppercase tracking-wider z-40 sticky bottom-0">
            
            {/* Left analytical indicators */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                СЕКТОР: АНАЛІТИКА ТА РОЗСЛІДУВАННЯ (СБУ-VIP)
              </span>
              <span className="text-slate-400">РЕЄСТРИ: <strong className="text-slate-200">СИНХРОНІЗОВАНО</strong></span>
              <span className="text-emerald-400 font-bold">КЛАС КАНАЛУ: НАДІЙНИЙ (AES-GCM)</span>
              <span className="text-slate-400">КАБІНЕТ: <strong className="text-slate-200">ОФІЦЕР-АНАЛІТИК</strong></span>
            </div>

            {/* Right analytical indicators */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-indigo-400 font-bold">ПРОТОКОЛ: RSA-4096 (СБУ-VIP)</span>
              <span className="text-slate-400">ІНТЕГРАЦІЯ: YOUCONTROL, OPENDATABOT, МИТНИЦЯ, РНБО</span>
              <span className="text-indigo-400 font-bold">ШІ-ЯДРО: PREDATOR INTEL v3.5</span>
            </div>

          </footer>
        )}

        {/* 6. COMMAND CENTER SPOTLIGHT PANEL (Ctrl+K) */}
        <AnimatePresence>
          {isSpotlightOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
              {/* Backdrop blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSpotlightOpen(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              />

              {/* Modal Dialog container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-2xl bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px] z-50"
              >
                {/* Search input header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-900 bg-slate-950/50">
                  <Search className="w-5 h-5 text-indigo-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Введіть запит для пошуку (напр. 'Дашборд', 'сан', 'Коваленко' чи 'звук')..."
                    value={spotlightQuery}
                    onChange={(e) => setSpotlightQuery(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                  />
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono shrink-0">
                    ESC
                  </span>
                </div>

                {/* Categorized results list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  {/* Navigation suggestions */}
                  {spotlightResults.navigation.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold block">
                        🧭 Навігація та Екосистема
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {spotlightResults.navigation.map(n => (
                          <button
                            key={n.id}
                            onClick={() => handleSpotlightSelect(n)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-indigo-600/20 hover:border-indigo-500/20 border border-transparent transition-all flex items-center justify-between cursor-pointer"
                          >
                            <span>{n.label}</span>
                            <span className="text-[9px] text-indigo-500 font-mono">Перейти →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Simulated Device controls / Actions */}
                  {spotlightResults.actions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold block">
                        ⚡ Команди керування симуляцією
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {spotlightResults.actions.map(a => (
                          <button
                            key={a.id}
                            onClick={() => handleSpotlightSelect(a)}
                            className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-amber-600/20 hover:border-amber-500/20 border border-transparent bg-slate-900/30 transition-all flex items-center justify-between cursor-pointer"
                          >
                            <span>{a.label}</span>
                            <span className="text-[9px] text-amber-500 font-mono">Виконати</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities / OSINT records */}
                  {spotlightResults.entities.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-rose-400 uppercase tracking-widest font-bold block">
                        👥 Аналітична база даних OSINT (Компанії / Бенефіціари)
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {spotlightResults.entities.map(e => (
                          <button
                            key={e.id}
                            onClick={() => handleSpotlightSelect(e)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-rose-600/20 hover:border-rose-500/20 border border-transparent transition-all flex items-center justify-between cursor-pointer"
                          >
                            <span>{e.label}</span>
                            <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded text-rose-400 font-mono font-bold">
                              {e.raw.riskScore >= 75 ? '⚠️ КРИТИЧНИЙ' : '🔴 ВИСОКИЙ'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If nothing matches */}
                  {spotlightResults.navigation.length === 0 && spotlightResults.actions.length === 0 && spotlightResults.entities.length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs text-slate-400 font-semibold">Жодного збігу не знайдено для "{spotlightQuery}"</p>
                      <p className="text-[10px] text-slate-600 mt-1 font-mono">Спробуйте ввести інший пошуковий термін</p>
                    </div>
                  )}

                </div>

                {/* Spotlight footer */}
                <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <span>Швидкі дії:</span>
                    <strong className="text-slate-400 font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">↑↓</strong>
                    <span>для вибору,</span>
                    <strong className="text-slate-400 font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">Enter</strong>
                    <span>для запуску</span>
                  </span>
                  <span className="text-indigo-400 font-bold uppercase tracking-wider">
                    PREDATOR COMMAND PANEL v2.5
                  </span>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      {/* Floating Watchlist Panel */}
      <AnimatePresence>
        {isWatchlistOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[60px] right-0 bottom-0 w-[420px] max-w-[100vw] z-[60] shadow-2xl border-l border-slate-800"
            style={{ background: 'rgba(10,12,20,0.98)' }}
          >
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setIsWatchlistOpen(false)}
                className="p-1.5 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-700/50"
              >
                <X size={16} />
              </button>
            </div>
            <WatchlistPanel onSelectEntity={handleSelectEntityFromWatchlist} />
          </motion.div>
        )}
      </AnimatePresence>
      </>
    );
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={(token) => setIsAuthenticated(true)} />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {deviceMode === 'iphone' ? renderIphoneLayout() : renderDesktopLayout()}
      </AnimatePresence>

      {/* Floating Voice Control HUD Overlay */}
      <AnimatePresence>
        {isVoiceListening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#090e1a]/95 border border-red-500/30 shadow-2xl rounded-2xl px-5 py-3 z-50 flex items-center gap-4 w-[420px] max-w-[90vw] backdrop-blur-md"
          >
            <div className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                🎙️ Голосовий аналізатор PREDATOR активний
              </p>
              <p className="text-xs text-slate-200 font-medium truncate mt-0.5 font-sans">
                {voiceFeedback || "Слухаю голос... Назвіть команду навігації чи пошуку"}
              </p>
            </div>
            <div className="flex gap-0.5 items-center justify-end h-5 w-12 shrink-0">
              <motion.div className="w-[3px] bg-red-400 rounded-full animate-pulse" style={{ height: 12 }} />
              <motion.div className="w-[3px] bg-red-400 rounded-full animate-pulse" style={{ height: 20 }} />
              <motion.div className="w-[3px] bg-red-400 rounded-full animate-pulse" style={{ height: 8 }} />
              <motion.div className="w-[3px] bg-red-400 rounded-full animate-pulse" style={{ height: 24 }} />
              <motion.div className="w-[3px] bg-red-400 rounded-full animate-pulse" style={{ height: 14 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Voice Control Toast / Feedback Alert */}
      <AnimatePresence>
        {!isVoiceListening && (voiceFeedback || voiceError) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 10, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 shadow-[0_15px_40px_rgba(0,0,0,0.5)] rounded-2xl p-4.5 z-50 flex flex-col gap-3 w-[450px] max-w-[90vw] backdrop-blur-md border ${voiceError ? 'bg-red-950/95 border-red-500/40 text-red-200 shadow-red-900/10' : 'bg-slate-950/95 border-indigo-500/40 text-slate-200 shadow-indigo-900/10'}`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-sm shrink-0 mt-0.5">{voiceError ? '⚠️' : '🎙️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {voiceError ? 'Помилка голосового аналізатора' : 'Аналітичний голос PREDATOR'}
                </p>
                <p className="text-xs font-semibold tracking-wide leading-relaxed mt-0.5">
                  {voiceError || voiceFeedback}
                </p>
              </div>
              <button 
                onClick={() => {
                  setVoiceError(null);
                  setVoiceFeedback(null);
                }}
                className="text-slate-500 hover:text-slate-300 transition-colors text-xs p-1 font-bold font-mono"
              >
                ✕
              </button>
            </div>

            {voiceError && (
              <div className="border-t border-red-500/10 pt-2.5 mt-0.5">
                <p className="text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider mb-2">
                  ⚡ Клікніть, щоб симулювати голосову команду:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '📊 Перейти на Дашборд', cmd: 'перейди на дашборд' },
                    { label: '🗺️ Показати Карту', cmd: 'покажи карту' },
                    { label: '🔍 OSINT пошук', cmd: 'осінт пошук' },
                    { label: '👤 Знайди Коваленко', cmd: 'знайди Коваленко' },
                    { label: '🛡️ Дорожня карта', cmd: 'дорожня карта' },
                    { label: '⚠️ Санкції РНБО?', cmd: 'які санкції?' },
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setVoiceError(null);
                        setVoiceFeedback(`Симульовано команду: "${item.cmd}"`);
                        handleVoiceCommand(item.cmd);
                        setTimeout(() => setVoiceFeedback(null), 3000);
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white border border-red-500/20 hover:border-red-500/40 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-left transition-all cursor-pointer truncate"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <LiveChatBot />
      <CopilotPanel />
      <CommandPalette onNavigate={(tab) => setActiveTab(tab as TabId)} />
    </>
  );
}
