// @ts-nocheck

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { SIDEBAR_GROUPS } from "./components/SidebarGroups";
import CatalogTab from "./components/CatalogTab";
import LicenseTab from "./components/LicenseTab";
import ArchitectureTab from "./components/ArchitectureTab";
import GapAnalysisTab from "./components/GapAnalysisTab";
import RoadmapTab from "./components/RoadmapTab";
import VolumesTab from "./components/VolumesTab";
import AdvisorTab from "./components/AdvisorTab";
import OsintWorkbench from "./components/OsintWorkbench";
import PersonProfiler from "./components/PersonProfiler";
import DashboardView from "./components/DashboardView";
import DataIngestionTab from "./components/DataIngestionTab";
import InspectorPanel from "./components/InspectorPanel";
import LiveAnalyticalCenter from "./components/LiveAnalyticalCenter";
import AdminBackOffice from "./components/AdminBackOffice";
import AutonomousFactoryTab from "./components/AutonomousFactoryTab";
import MapsTab from "./components/MapsTab";
import InvestigationSandbox from "./components/InvestigationSandbox";
import { MediaForensicsTab } from "./components/MediaForensicsTab";
import { VoiceCall } from "./components/VoiceCall";
import { ToastProvider } from "./components/ToastProvider";
import { OSINT_ENTITIES, OsintEntity } from "./osintData";
import { SOLUTIONS } from "./data";
import {
  Layers,
  ShieldCheck, Shield,
  Network,
  Wrench,
  Calendar,
  Bot,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen,
  Menu,
  X,
  Search,
  Bell,
  User,
  Terminal,
  Cpu,
  Database,
  Activity,
  Camera,
  Landmark,
  MessageSquare,
  Sparkles,
  Send,
  HelpCircle,
  Maximize2,
  Minimize2,
  Settings,
  ShieldAlert,
  Compass,
  Briefcase,
  Truck,
  Globe,
  TrendingUp,
  Users,
  Map,
  Mic,
  UserCheck, Tablet, LayoutDashboard} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LiveChatBot } from "./components/LiveChatBot";
import { AuthStatus } from "./components/AuthStatus";

type TabId =
  | "live-analytical-center"
  | "admin-back-office"
  | "dashboard"
  | "osint"
  | "person-profiler"
  | "maps"
  | "catalog"
  | "license"
  | "architecture"
  | "gap"
  | "roadmap"
  | "volumes"
  | "advisor"
  | "sandbox"
  | "media-forensics"
  | "data-ingestion"
  | "autonomous-factory";

export default function App() {
  const [ecosystem, setEcosystem] = useState<"user" | "admin">("user");
  const [activeTab, setActiveTab] = useState<TabId>("data-ingestion");
  const [selectedScenario, setSelectedScenario] = useState<string>("business");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Interactive rendering and mobile adaptive states
  const [deviceMode, setDeviceMode] = useState<"desktop" | "ipad" | "iphone">("desktop");
  const [isRealMobile, setIsRealMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [iphoneTime, setIphoneTime] = useState("09:41");

  // iPhone physical interactions states
  const [isIphoneLocked, setIsIphoneLocked] = useState(false);
  const [isIphoneMuted, setIsIphoneMuted] = useState(false);
  const [iphoneVolume, setIphoneVolume] = useState(65);
  const [showVolumeHUD, setShowVolumeHUD] = useState(false);
  const [dynamicIslandState, setDynamicIslandState] = useState<
    "normal" | "expanded" | "mute-alert" | "unmute-alert"
  >("normal");
  const [volumeTimer, setVolumeTimer] = useState<any>(null);
  const [lockscreenDate, setLockscreenDate] = useState("Четвер, 16 липня");

  // Dynamic date calculation for Lock Screen
  useEffect(() => {
    const days = [
      "Неділя",
      "Понеділок",
      "Вівторок",
      "Середа",
      "Четвер",
      "П'ятниця",
      "Субота",
    ];
    const months = [
      "січня",
      "лютого",
      "березня",
      "квітня",
      "травня",
      "червня",
      "липня",
      "серпня",
      "вересня",
      "жовтня",
      "листопада",
      "грудня",
    ];
    const now = new Date();
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dateNum = now.getDate();
    setLockscreenDate(`${dayName}, ${dateNum} ${monthName}`);
  }, []);

  const handleActionButton = () => {
    const nextMuted = !isIphoneMuted;
    setIsIphoneMuted(nextMuted);
    setDynamicIslandState(nextMuted ? "mute-alert" : "unmute-alert");
    setTimeout(() => {
      setDynamicIslandState("normal");
    }, 2000);
  };

  const adjustVolume = (amount: number) => {
    setIphoneVolume((prev) => Math.max(0, Math.min(prev + amount, 100)));
    setShowVolumeHUD(true);
    if (volumeTimer) clearTimeout(volumeTimer);
    const t = setTimeout(() => {
      setShowVolumeHUD(false);
    }, 1800);
    setVolumeTimer(t);
  };

  const toggleIphonePower = () => {
    setIsIphoneLocked((prev) => !prev);
  };

  const handleDynamicIslandClick = () => {
    if (dynamicIslandState === "normal") {
      setDynamicIslandState("expanded");
    } else if (dynamicIslandState === "expanded") {
      setDynamicIslandState("normal");
    }
  };

  // Sync real-time clock for the iOS status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, "0");
      const mins = now.getMinutes().toString().padStart(2, "0");
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
      const isTabletSize = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsRealMobile(isMobileSize);
      if (isMobileSize) {
        setDeviceMode("iphone");
        setIsInspectorOpen(false);
        setSidebarCollapsed(true);
      } else if (isTabletSize) {
        setDeviceMode("ipad");
        setSidebarCollapsed(true);
      } else {
        setDeviceMode("desktop");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Inspector contents
  const [selectedEntity, setSelectedEntity] = useState<OsintEntity | null>(
    OSINT_ENTITIES[0],
  );
  const [selectedTool, setSelectedTool] = useState<any | null>(SOLUTIONS[0]);
  const [selectedNode, setSelectedNode] = useState<any | null>({
    id: "core_api",
    label: "Core REST API",
    group: "Core",
    details:
      "Основний бекенд-сервіс на базі FastAPI. Забезпечує оркестрацію черг, інтеграцію ШІ-моделей vLLM та інтерфейс до баз даних Qdrant та Neo4j.",
  });

  // Floating AI Assistant state
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "ai",
      text: "Вітаю. Я аналітичний ШІ-асистент NEXUS. Я можу знайти приховані зв'язки, написати висновки про компанії або згенерувати SQL-запити до бази.",
    },
  ]);

  // Spotlight / Command Center State
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");

  // Voice Command / Web Speech API states
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = React.useRef<any>(null);

  // Microsoft TTS Engine state (Web Speech Synthesis Integration)
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [selectedTtsVoice, setSelectedTtsVoice] = useState(
    "Microsoft Pavel (UA)",
  );
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  // Initialize and load Speech Synthesis voices natively supporting Microsoft cloud-inspired voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const speakText = (text: string) => {
    if (!isTtsEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn("SpeechSynthesis cancel notice:", e);
    }

    // Clean text: remove code blocks, formatting, long logs
    let cleanText = text
      .replace(/```sql[\s\S]*?```/g, " [Згенеровано SQL запит] ")
      .replace(/```[\s\S]*?```/g, " [Фрагмент коду] ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*#_\[\]()\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    // Split into readable sentences to avoid browser length bottlenecks
    const sentences = cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText];

    sentences.forEach((sentence) => {
      const sTrimmed = sentence.trim();
      if (!sTrimmed) return;

      const utterance = new SpeechSynthesisUtterance(sTrimmed);
      utterance.lang = "uk-UA";
      utterance.rate = 0.8; // slower, masked pace
      utterance.pitch = 0.1; // deeply lowered pitch for masked voice effect

      // Match selected voice or any Ukrainian Microsoft cloud voice
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = null;

      if (selectedTtsVoice.includes("Irina")) {
        matchedVoice =
          voices.find(
            (v) => v.lang.startsWith("uk") && v.name.includes("Irina"),
          ) ||
          voices.find(
            (v) => v.lang.startsWith("uk") && v.name.includes("Microsoft"),
          );
      } else if (selectedTtsVoice.includes("Pavel")) {
        matchedVoice =
          voices.find(
            (v) => v.lang.startsWith("uk") && v.name.includes("Pavel"),
          ) ||
          voices.find(
            (v) => v.lang.startsWith("uk") && v.name.includes("Microsoft"),
          );
      } else {
        matchedVoice = voices.find(
          (v) => v.lang.startsWith("uk") && v.name.includes("Microsoft"),
        );
      }

      if (!matchedVoice) {
        // Fallback to general Ukrainian engines (Microsoft, Google, iOS native)
        matchedVoice =
          voices.find((v) => v.lang.startsWith("uk")) ||
          voices.find((v) => v.lang.startsWith("uk-UA")) ||
          voices.find((v) => v.name.toLowerCase().includes("ukrainian"));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    });
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
    if (
      lower.includes("дашборд") ||
      lower.includes("dashboard") ||
      lower.includes("панель")
    ) {
      setActiveTab("dashboard");
      const msg = `Перехід на інтерактивний Дашборд`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("мапа") ||
      lower.includes("карта") ||
      lower.includes("maps") ||
      lower.includes("map")
    ) {
      setActiveTab("maps");
      const msg = `Перехід на інтерактивну карту`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("пошук") ||
      lower.includes("search") ||
      lower.includes("осінт") ||
      lower.includes("osint")
    ) {
      setActiveTab("osint");
      const msg = `Перехід на пошуковий робочий стіл OSINT`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("ядро") ||
      lower.includes("центр") ||
      lower.includes("live") ||
      lower.includes("шi")
    ) {
      setActiveTab("live-analytical-center");
      const msg = `Перехід до живого аналітичного ядра NEXUS`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("адмін") ||
      lower.includes("адмінка") ||
      lower.includes("консоль") ||
      lower.includes("admin") ||
      lower.includes("office")
    ) {
      setEcosystem("admin");
      setActiveTab("admin-back-office");
      const msg = `Доступ надано. Перехід у बैक офіс консоль`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("пісочниця") ||
      lower.includes("павутина") ||
      lower.includes("sandbox") ||
      lower.includes("investigation")
    ) {
      setActiveTab("sandbox");
      const msg = `Перехід до аналітичної пісочниці Павутина`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("граф") ||
      lower.includes("архітектура") ||
      lower.includes("залежності") ||
      lower.includes("architecture")
    ) {
      setActiveTab("architecture");
      const msg = `Відкриття графу залежностей архітектури`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("прогалини") ||
      lower.includes("ризики") ||
      lower.includes("gap")
    ) {
      setActiveTab("gap");
      const msg = `Завантаження аналізу прогалин та ризиків комплаєнсу`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("дорожня карта") ||
      lower.includes("план") ||
      lower.includes("roadmap")
    ) {
      setActiveTab("roadmap");
      const msg = `Показ дорожньої карти впровадження системи`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("томи") ||
      lower.includes("регламенти") ||
      lower.includes("volumes")
    ) {
      setActiveTab("volumes");
      const msg = `Відкриття електронних томів технічного завдання`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("архітектор") ||
      lower.includes("радник") ||
      lower.includes("advisor")
    ) {
      setActiveTab("advisor");
      const msg = `Підключення до радника ШІ архітектора`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }

    // 2. Action / Device commands
    if (
      lower.includes("заблокувати") ||
      lower.includes("розблокувати") ||
      lower.includes("lock") ||
      lower.includes("unlock")
    ) {
      toggleIphonePower();
      const msg = `Зміна режиму блокування симулятора`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("беззвучний") ||
      lower.includes("звук") ||
      lower.includes("mute") ||
      lower.includes("unmute")
    ) {
      handleActionButton();
      const msg = `Перемикання звукового режиму`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("гучніше") ||
      lower.includes("гучність плюс") ||
      lower.includes("volume up")
    ) {
      adjustVolume(10);
      const msg = `Гучність збільшено`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("тихіше") ||
      lower.includes("гучність мінус") ||
      lower.includes("volume down")
    ) {
      adjustVolume(-10);
      const msg = `Гучність зменшено`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (lower.includes("інспектор") || lower.includes("inspector")) {
      setIsInspectorOpen((prev) => !prev);
      const msg = `Перемикання стану панелі інспектора`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }

    // 3. Search queries
    let queryText = text;
    let isExplicitSearch = false;
    if (lower.startsWith("знайди ") || lower.startsWith("пошук ")) {
      queryText = text.substring(6).trim();
      isExplicitSearch = true;
    } else if (lower.startsWith("find ") || lower.startsWith("search ")) {
      queryText = text.substring(5).trim();
      isExplicitSearch = true;
    }

    if (
      isExplicitSearch ||
      lower.includes("коваленко") ||
      lower.includes("спецтехпостач") ||
      lower.includes("фольксваген") ||
      lower.includes("клієнт")
    ) {
      const queryLower = queryText.toLowerCase();
      const matched =
        (window as any).OSINT_ENTITIES ||
        (typeof OSINT_ENTITIES !== "undefined" ? OSINT_ENTITIES : []).find(
          (ent: any) =>
            ent.name.toLowerCase().includes(queryLower) ||
            ent.code.includes(queryLower),
        );

      if (matched) {
        setSelectedEntity(matched);
        setSelectedTool(null);
        setSelectedNode(null);
        setIsInspectorOpen(true);
        setActiveTab("live-analytical-center");
        const msg = `Знайдено об'єкт дослідження: ${matched.name}`;
        setVoiceFeedback(msg);
        speakText(msg);
        return;
      }
    }

    // 4. Default: Chat with NEXUS
    setChatHistory((prev) => [...prev, { sender: "user", text: text }]);
    setIsAiChatOpen(true);

    setTimeout(() => {
      let aiResponse =
        "Голосовий запит опрацьовано ШІ-ядром NEXUS через Web Speech API. Збігів у базі санкцій не знайдено.";

      if (lower.includes("санкції") || lower.includes("рнбо")) {
        aiResponse =
          "ШІ знайшов критичну загрозу: ТОВ 'СпецТехПостач' (код 38294012) знаходиться під санкціями РНБО з 2026 року через обхід експортних обмежень через турецьких контрагентів.";
      } else if (lower.includes("коваленко")) {
        aiResponse =
          "Коваленко Ігор Вікторович є засновником ТОВ 'СпецТехПостач' (51%) та володіє BTC-гаманцем bc1qxy...d831. ШІ оцінює рівень ризику особи як ВИСОКИЙ (82%).";
      } else if (lower.includes("sql")) {
        aiResponse =
          "Ось згенерований SQL для пошуку пов'язаних бенефіціарів:\n\nSELECT * FROM company_founders WHERE risk_level = 'HIGH';";
      } else if (lower.includes("pdf")) {
        aiResponse =
          "Надішліть PDF-файл ТЗ чи митної декларації в чат. Я проведу миттєвий комплаєнс-аналіз згідно з 16 томами.";
      } else if (
        lower.includes("привіт") ||
        lower.includes("вітаю") ||
        lower.includes("hello")
      ) {
        aiResponse =
          "Вітаю! Я уважно слухаю ваші голосові команди. Ви можете сказати 'Перейди на дашборд', 'Покажи карту' або запитати про санкції.";
      }

      setChatHistory((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      speakText(aiResponse);
    }, 800);
  };

  const startVoiceControl = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        "Web Speech API не підтримується у цьому браузері. Будь ласка, використовуйте Google Chrome.",
      );
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    if (isVoiceListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsVoiceListening(false);
      setDynamicIslandState("normal");
      return;
    }

    setIsVoiceListening(true);
    setVoiceError(null);
    setVoiceFeedback("Активація мікрофона...");
    setDynamicIslandState("voice-listening");

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "uk-UA";

    rec.onstart = () => {
      setVoiceFeedback("Слухаю... Назвіть команду");
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition notice (non-fatal):", event);
      if (event.error === "no-speech") {
        setVoiceError(
          "Голос не виявлено. Спробуйте ще раз або виберіть симуляцію нижче:",
        );
      } else if (event.error === "not-allowed") {
        setVoiceError(
          "Доступ заблоковано (запуск у пісочниці/фреймі). Виберіть симуляцію:",
        );
      } else {
        setVoiceError(
          `Помилка розпізнавання: ${event.error}. Виберіть симуляцію:`,
        );
      }
      setIsVoiceListening(false);
      setDynamicIslandState("normal");
      setTimeout(() => setVoiceError(null), 15000);
    };

    rec.onend = () => {
      setIsVoiceListening(false);
      setTimeout(() => {
        setDynamicIslandState((prev) =>
          prev === "voice-listening" ? "normal" : prev,
        );
      }, 3000);
    };

    rec.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript;
      setVoiceTranscript(transcript);
      handleVoiceCommand(transcript);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.warn(
        "Could not start speech recognition directly (non-fatal):",
        err,
      );
      setIsVoiceListening(false);
      setDynamicIslandState("normal");
    }
  };

  // Handle key escape and Ctrl/Cmd+K to toggle Spotlight
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<TabId>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("change-active-tab", handleTabChange);
    return () =>
      window.removeEventListener("change-active-tab", handleTabChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsInspectorOpen(false);
        setIsAiChatOpen(false);
        setIsSpotlightOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Spotlight categorized search results
  const spotlightResults = React.useMemo(() => {
    if (ecosystem === "admin") {
      const allNavs = [
        {
          id: "admin-back-office",
          label: "⚙️ Адмінка / ArgoCD Back Office",
          type: "nav",
        },
        { id: "catalog", label: "📦 Каталог готових рішень", type: "nav" },
        {
          id: "license",
          label: "🛡️ Сумісність та активація ліцензій",
          type: "nav",
        },
      ];

      const allActions = [
        {
          id: "toggle-inspector",
          label: isInspectorOpen
            ? "📂 Закрити бічний інспектор"
            : "📂 Відкрити бічний інспектор",
          type: "action",
        },
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
        navigation: allNavs.filter((n) =>
          n.label.toLowerCase().includes(query),
        ),
        actions: allActions.filter((a) =>
          a.label.toLowerCase().includes(query),
        ),
        entities: [],
      };
    } else {
      const allNavs = [
        {
          id: "live-analytical-center",
          label: "🛰️ Живе ШІ-Ядро (Спецпроект NEXUS)",
          type: "nav",
        },
        { id: "dashboard", label: "📊 Інтерактивний Дашборд", type: "nav" },
        { id: "osint", label: "🔍 Робочий стіл OSINT пошуку", type: "nav" },
        {
          id: "architecture",
          label: "🕸️ Граф архітектури та залежностей",
          type: "nav",
        },
        { id: "gap", label: "🛡️ Аналіз прогалин та ризиків", type: "nav" },
        { id: "roadmap", label: "📅 Дорожня карта впровадження", type: "nav" },
        { id: "volumes", label: "📚 Томи ТЗ (Митні регламенти)", type: "nav" },
        { id: "advisor", label: "🤖 ШІ-Архітектор", type: "nav" },
      ];

      const allActions = [
        {
          id: "mute-toggle",
          label: isIphoneMuted
            ? "🔊 Увімкнути звук коментаря (NEXUS uk-UA)"
            : "🔇 Вимкнути звук коментаря",
          type: "action",
        },
        {
          id: "lock-toggle",
          label: isIphoneLocked
            ? "🔓 Розблокувати iPhone 15 Pro"
            : "🔒 Заблокувати iPhone 15 Pro",
          type: "action",
        },
        {
          id: "vol-up",
          label: "🔊 Збільшити гучність симулятора (+10%)",
          type: "action",
        },
        {
          id: "vol-down",
          label: "🔉 Зменшити гучність симулятора (-10%)",
          type: "action",
        },
        {
          id: "toggle-inspector",
          label: isInspectorOpen
            ? "📂 Закрити бічний інспектор"
            : "📂 Відкрити бічний інспектор",
          type: "action",
        },
      ];

      if (!spotlightQuery.trim()) {
        return {
          navigation: allNavs.slice(0, 4),
          actions: allActions.slice(0, 3),
          entities: OSINT_ENTITIES.slice(0, 3).map((e) => ({
            id: e.id,
            label: `👤 ${e.name} [${e.code}]`,
            type: "entity",
            raw: e,
          })),
        };
      }

      const query = spotlightQuery.toLowerCase();

      return {
        navigation: allNavs.filter((n) =>
          n.label.toLowerCase().includes(query),
        ),
        actions: allActions.filter((a) =>
          a.label.toLowerCase().includes(query),
        ),
        entities: OSINT_ENTITIES.filter(
          (e) =>
            e.name.toLowerCase().includes(query) ||
            e.code.includes(query) ||
            (e.description && e.description.toLowerCase().includes(query)),
        ).map((e) => ({
          id: e.id,
          label: `👤 ${e.name} [${e.code}]`,
          type: "entity",
          raw: e,
        })),
      };
    }
  }, [
    ecosystem,
    spotlightQuery,
    isIphoneMuted,
    isIphoneLocked,
    isInspectorOpen,
  ]);

  const handleSpotlightSelect = (item: any) => {
    if (item.type === "nav") {
      setActiveTab(item.id);
    } else if (item.type === "action") {
      if (item.id === "mute-toggle") {
        handleActionButton();
      } else if (item.id === "lock-toggle") {
        toggleIphonePower();
      } else if (item.id === "vol-up") {
        adjustVolume(10);
      } else if (item.id === "vol-down") {
        adjustVolume(-10);
      } else if (item.id === "toggle-inspector") {
        setIsInspectorOpen(!isInspectorOpen);
      }
    } else if (item.type === "entity") {
      setSelectedEntity(item.raw);
      setSelectedTool(null);
      setSelectedNode(null);
      setActiveTab("live-analytical-center");
      setIsInspectorOpen(true);
    }
    setIsSpotlightOpen(false);
    setSpotlightQuery("");
  };

  const [headerSearchQuery, setHeaderSearchQuery] = useState("");

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearchQuery.trim()) return;

    // Search for matching entity
    const matched = OSINT_ENTITIES.find(
      (ent) =>
        ent.name.toLowerCase().includes(headerSearchQuery.toLowerCase()) ||
        ent.code.includes(headerSearchQuery),
    );

    if (matched) {
      setSelectedEntity(matched);
      setSelectedTool(null);
      setSelectedNode(null);
      setActiveTab("osint");
      setIsInspectorOpen(true);
    } else {
      // Switch tab to search workbench
      setActiveTab("osint");
    }
  };

  const selectEntityById = (id: string) => {
    const found = OSINT_ENTITIES.find((e) => e.id === id);
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
    setChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatMessage("");

    // Generate responsive analytical answers
    setTimeout(() => {
      let aiResponse =
        "Аналіз завершено. Запит опрацьовано ШІ-моделлю Gemini 3.5 Flash. Збігів у базі санкцій не знайдено.";

      const lower = userMsg.toLowerCase();
      if (lower.includes("санкції") || lower.includes("рнбо")) {
        aiResponse =
          "ШІ знайшов критичну загрозу: ТОВ 'СпецТехПостач' (код 38294012) знаходиться під санкціями РНБО з 2026 року через обхід експортних обмежень через турецьких контрагентів.";
      } else if (lower.includes('ков")') || lower.includes("коваленко")) {
        aiResponse =
          "Коваленко Ігор Вікторович є засновником ТОВ 'СпецТехПостач' (51%) та володіє BTC-гаманцем bc1qxy...d831. ШІ оцінює рівень ризику особи як ВИСОКИЙ (82%).";
      } else if (lower.includes("sql")) {
        aiResponse =
          "Ось згенерований SQL для пошуку пов'язаних бенефіціарів:\n\nSELECT * FROM company_founders WHERE risk_level = 'HIGH';";
      } else if (lower.includes("pdf")) {
        aiResponse =
          "Надішліть PDF-файл ТЗ чи митної декларації в чат. Я проведу миттєвий комплаєнс-аналіз згідно з 16 томами.";
      }

      setChatHistory((prev) => [...prev, { sender: "ai", text: aiResponse }]);
    }, 800);
  };

  const renderMobileMainContent = () => {
    return (
      <div
        className="h-full flex flex-col relative bg-slate-950 text-slate-200 font-sans"
        id="mobile-viewport-root"
      >
        {/* Compact iOS / Mobile App Header */}
        <header className="border-b border-slate-800 bg-slate-900 shadow-sm px-3 py-2 flex items-center justify-between gap-2 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                N
              </div>
              <span className="text-sm font-bold tracking-wide text-slate-200">
                Nexus
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isRealMobile && (
              <button
                onClick={() => setDeviceMode("desktop")}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-200 transition-all"
                title="Режим Десктоп"
              >
                Десктоп
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Mobile Main Area */}
        <main
          className="flex-1 overflow-y-auto p-3 bg-transparent relative custom-scrollbar"
          id="mobile-scroll-container"
        >
          {/* Mobile Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-widest mb-3 font-semibold">
            <span>Nexus</span>
            <span>/</span>
            <span className="text-blue-400 truncate max-w-[150px]">
              {activeTab === "live-analytical-center"
                ? "Аналітика"
                : activeTab.toUpperCase().replace("-", " ")}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
              className="w-full pb-10"
            >
              {ecosystem === "user" ? (
                <>
                  {activeTab === "live-analytical-center" && (
                    <LiveAnalyticalCenter
                      selectedEntity={selectedEntity}
                      onSelectEntityGlobal={(ent) => {
                        setSelectedEntity(ent);
                        setSelectedTool(null);
                        setSelectedNode(null);
                      }}
                      selectedScenario={selectedScenario}
                      onSelectScenario={setSelectedScenario}
                    />
                  )}
                  {activeTab === "dashboard" && (
                    <DashboardView
                      onSelectTab={(tabId) => {
                        if (tabId === "osint") {
                          setActiveTab("live-analytical-center");
                        } else {
                          setActiveTab(tabId as TabId);
                        }
                      }}
                      onSelectEntity={(entId) => {
                        selectEntityById(entId);
                        setActiveTab("live-analytical-center");
                      }}
                    />
                  )}
                  {activeTab === "osint" && (
                    <OsintWorkbench
                      selectedEntity={selectedEntity}
                      onSelectEntityForInspector={(ent) => {
                        setSelectedEntity(ent);
                        setSelectedTool(null);
                        setSelectedNode(null);
                        setIsInspectorOpen(true);
                      }}
                    />
                  )}
                  {activeTab === "person-profiler" && <PersonProfiler />}
                  {activeTab === "sandbox" && <InvestigationSandbox />}
                  {activeTab === "maps" && (
                    <MapsTab
                      onSelectEntityGlobal={(ent) => {
                        setSelectedEntity(ent);
                        setSelectedTool(null);
                        setSelectedNode(null);
                        setActiveTab("live-analytical-center");
                      }}
                    />
                  )}
                  {activeTab === "media-forensics" && <MediaForensicsTab />}
                  {activeTab === "data-ingestion" && <DataIngestionTab />}
                </>
              ) : (
                <>
                  {activeTab === "admin-back-office" && <AdminBackOffice />}
                  {activeTab === "autonomous-factory" && <AutonomousFactoryTab />}
                  {activeTab === "catalog" && <CatalogTab />}
                  {activeTab === "license" && <LicenseTab />}
                  {activeTab === "architecture" && <ArchitectureTab />}
                  {activeTab === "gap" && <GapAnalysisTab />}
                  {activeTab === "roadmap" && <RoadmapTab />}
                  {activeTab === "volumes" && <VolumesTab />}
                  {activeTab === "advisor" && <AdvisorTab />}
                </>
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
                className="absolute inset-0 bg-black z-50"
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute top-0 left-0 bottom-0 w-[280px] bg-slate-900 border-r border-slate-800 shadow-2xl z-50 flex flex-col overflow-y-auto"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
                      N
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-wide text-slate-200">
                        Nexus Analytics
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Ecosystem Selector */}
                <div className="p-4 space-y-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Простір Управління
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEcosystem("user");
                        setActiveTab("live-analytical-center");
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center ${ecosystem === "user" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                    >
                      Користувач
                    </button>
                    <button
                      onClick={() => {
                        setEcosystem("admin");
                        setActiveTab("admin-back-office");
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center ${ecosystem === "admin" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                    >
                      Адміністратор
                    </button>
                  </div>
                </div>

                {/* Scenarios / Action tabs list */}
                <div className="p-4 space-y-6">
                  {ecosystem === "user" ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                          Головне
                        </span>
                        <button onClick={() => {setActiveTab("dashboard"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Layers className="w-4 h-4"/> Головна Панель
                        </button>
                        <button onClick={() => {setActiveTab("live-analytical-center"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Compass className="w-4 h-4"/> Аналітика та Звіти
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                          Розслідування
                        </span>
                        <button onClick={() => {setActiveTab("osint"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Search className="w-4 h-4"/> Глибокий Пошук
                        </button>
                        <button onClick={() => {setActiveTab("person-profiler"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <UserCheck className="w-4 h-4"/> Перевірка Осіб
                        </button>
                        <button onClick={() => {setActiveTab("media-forensics"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Camera className="w-4 h-4"/> Аналіз Фото/Відео
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                          Додатково
                        </span>
                        <button onClick={() => {setActiveTab("maps"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Globe className="w-4 h-4"/> Інтерактивна Карта
                        </button>
                        <button onClick={() => {setActiveTab("data-ingestion"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Database className="w-4 h-4"/> Завантаження Даних
                        </button>
                        <button onClick={() => {setActiveTab("sandbox"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Network className="w-4 h-4"/> Розширений Аналіз
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                          Адміністрування
                        </span>
                        <button onClick={() => {setActiveTab("admin-back-office"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Settings className="w-4 h-4"/> Back Office Консоль
                        </button>
                        <button onClick={() => {setActiveTab("autonomous-factory"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Cpu className="w-4 h-4"/> Автономна Фабрика
                        </button>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1 mt-4">
                          Архітектура Інфраструктури
                        </span>
                        {[
                          { id: "architecture", label: "Граф залежностей", icon: Network },
                          { id: "gap", label: "Аналіз прогалин", icon: Wrench },
                          { id: "roadmap", label: "Дорожня карта", icon: Calendar },
                          { id: "catalog", label: "Каталог рішень", icon: Layers },
                          { id: "license", label: "Сумісність ліцензій", icon: ShieldAlert },
                          { id: "volumes", label: "Томи ТЗ", icon: Database },
                          { id: "advisor", label: "ШІ-Архітектор", icon: Cpu },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id as TabId);
                                setMobileMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3"
                            >
                              <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderIpadLayout = () => {
    return (
      <div
        className="min-h-screen w-full bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-2 relative overflow-hidden select-none"
        id="ipad-simulator-view"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_100%)] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-[1024px] h-[768px] bg-slate-900/40 backdrop-blur-md rounded-[32px] p-2 shadow-2xl shadow-black/50 border border-slate-800 flex flex-col transform origin-center scale-[0.85] 2xl:scale-100"
        >
          {/* Hardware bezel details */}
          <div className="absolute top-1/2 -left-0.5 w-1 h-12 bg-slate-700 rounded-l-md -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-0.5 w-1 h-12 bg-slate-700 rounded-r-md -translate-y-1/2"></div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-black border border-slate-800 flex items-center justify-center">
             <div className="w-1 h-1 rounded-full bg-blue-900/40" />
          </div>
          
          <div className="flex-1 rounded-[20px] overflow-hidden bg-slate-950 flex flex-col relative border border-black shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
             {renderDesktopLayout()}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderIphoneLayout = () => {
    return (
      <div
        className="min-h-screen w-full bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-2 relative overflow-hidden select-none"
      >
        <div className="absolute top-4 text-center z-50">
          <button
            onClick={() => setDeviceMode("desktop")}
            className="mt-2 px-3.5 py-1.5 bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 hover:bg-slate-800 text-blue-400 text-xs font-bold font-mono tracking-wider rounded-2xl transition-all cursor-pointer shadow flex items-center gap-1.5 mx-auto"
          >
            💻 ПОВЕРНУТИСЬ НА ДЕСКТОП
          </button>
        </div>

        <div className="relative mx-auto my-auto transition-all duration-500 z-10 w-[390px] h-[844px] bg-black rounded-[50px] border-[8px] border-slate-900 shadow-2xl flex flex-col overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-50 flex items-center justify-around px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-900/40"></div>
          </div>
          {renderMobileMainContent()}
        </div>
      </div>
    );
  };

  const renderDesktopLayout = () => {
    return (
      <div
        className="h-full bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500/30"
        id="nexus-hub-app"
      >
        {/* TOP NAVBAR */}
        <header className="shrink-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                N
              </div>
              <span className="text-sm font-bold tracking-wide text-slate-200 flex items-center gap-2">
                Nexus Analytics
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1 ml-6 bg-slate-950/50 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setDeviceMode("desktop")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${deviceMode === "desktop" ? "bg-slate-800 text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                title="Режим ПК"
              >
                💻 ПК
              </button>
              <button
                onClick={() => setDeviceMode("ipad")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${deviceMode === "ipad" ? "bg-slate-800 text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                title="Режим Планшет"
              >
                <Tablet className="w-4 h-4" />
                Планшет
              </button>
              <button
                onClick={() => setDeviceMode("iphone")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${deviceMode === "iphone" ? "bg-slate-800 text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                title="Режим Телефон"
              >
                📱 Телефон
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 pr-4 border-r border-slate-800">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Статус Системи</span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ALL SYSTEMS NOMINAL
                </span>
              </div>
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800">
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </button>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-[2px] cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              <div className="w-full h-full rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT ZONE */}
        <div className="flex-1 flex overflow-hidden relative bg-slate-950">
          {/* LEFT SIDEBAR */}
          <aside
            className={`shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-10 ${sidebarCollapsed ? "w-[68px]" : "w-[260px]"}`}
            id="tactical-sidebar"
          >
            {/* Navigation group */}
            <div className="p-3 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Ecosystem Selector Desktop */}
              {!sidebarCollapsed && (
                <div className="mb-4 space-y-2 pb-4 border-b border-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block px-1">
                    Простір Управління
                  </span>
                  <div className="flex gap-1.5 p-1 bg-slate-950/50 rounded-lg border border-slate-800/80">
                    <button
                      onClick={() => {
                        setEcosystem("user");
                        setActiveTab("live-analytical-center");
                      }}
                      className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${ecosystem === "user" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                    >
                      <User className="w-3 h-3" /> Користувач
                    </button>
                    <button
                      onClick={() => {
                        setEcosystem("admin");
                        setActiveTab("admin-back-office");
                      }}
                      className={`flex-1 py-1.5 px-1 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${ecosystem === "admin" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                    >
                      <Shield className="w-3 h-3" /> Адміністратор
                    </button>
                  </div>
                </div>
              )}

              {/* DYNAMIC SIDEBAR BASED ON SIDEBAR_GROUPS */}
              {SIDEBAR_GROUPS.map((group) => {
                // Filter groups based on ecosystem (hide admin groups in user mode, etc., though here we can just show/hide based on group.id)
                if (ecosystem === "user" && group.id === "admin") return null;
                if (ecosystem === "admin" && group.id !== "admin") return null;

                return (
                  <div key={group.id} className="space-y-1">
                    {!sidebarCollapsed && (
                      <div className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {group.label}
                      </div>
                    )}
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      // Determine icon based on item.id
                      let Icon = LayoutDashboard;
                      if (item.id === "live-analytical-center") Icon = Activity;
                      else if (item.id === "osint") Icon = Search;
                      else if (item.id === "person-profiler") Icon = UserCheck;
                      else if (item.id === "maps") Icon = Globe;
                      else if (item.id === "media-forensics") Icon = Camera;
                      else if (item.id === "sandbox") Icon = Network;
                      else if (item.id === "data-ingestion") Icon = Database;
                      else if (item.id === "admin-back-office") Icon = Settings;
                      else if (item.id === "architecture") Icon = Network;
                      else if (item.id === "catalog") Icon = Layers;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${isActive ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                          </div>
                          {!sidebarCollapsed && item.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider
                              ${item.badgeColor === "emerald" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : ""}
                              ${item.badgeColor === "rose" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : ""}
                              ${item.badgeColor === "blue" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : ""}
                              ${item.badgeColor === "fuchsia" ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30" : ""}
                              ${item.badgeColor === "indigo" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : ""}
                            `}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {!sidebarCollapsed && (
                <div className="bg-slate-800/30 border border-slate-700/50 p-3 rounded-xl space-y-3 mt-6">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Стан Системи
                  </span>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex justify-between items-center">
                      <span>Kafka:</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        0 lag
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Qdrant:</span>
                      <span className="text-blue-400 font-medium">98% Match</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsed control */}
            <div className="p-3 border-t border-slate-800">
              <button
                onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {!sidebarCollapsed && <LayoutDashboard className="w-4 h-4" />}
                {sidebarCollapsed
                  ? "INSP"
                  : isInspectorOpen
                    ? "Сховати Інспектор"
                    : "Показати Інспектор"}
              </button>
            </div>
          </aside>
          {/* MAIN WORKSPACE (Section 8) */}
          <main
            className="flex-1 overflow-y-auto p-2 bg-slate-950 relative"
            id="workspace-main"
          >
          <div className="max-w-[1800px] mx-auto space-y-6">
            {/* Active Navigation Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">
              <span>NEXUS</span>
              <span>/</span>
              <span className="text-blue-400 font-bold">
                {ecosystem === "user"
                  ? "КОРИСТУВАЦЬКА ЕКОСИСТЕМА"
                  : "АДМІНІСТРАТИВНА ЕКОСИСТЕМА"}
              </span>
              <span>/</span>
              <span className="text-blue-400 font-bold">
                {activeTab === "live-analytical-center" &&
                  "Живий Аналітичний Центр (ШІ-Ядро)"}
                {activeTab === "admin-back-office" &&
                  "Back Office Консоль (ArgoCD & Grafana)"}
                {activeTab === "dashboard" && "Аналітичний Дашборд"}
                {activeTab === "osint" && "Розширений OSINT Пошук OSINT"}
                {activeTab === "maps" && "Інтерактивна Карта NEXUS"}
                {activeTab === "catalog" && "Каталог рішень"}
                {activeTab === "license" && "Сумісність ліцензій"}
                {activeTab === "architecture" && "Граф залежностей"}
                {activeTab === "gap" && "Аналіз прогалин"}
                {activeTab === "roadmap" && "Дорожня карта"}
                {activeTab === "volumes" && "Томи ТЗ"}
                {activeTab === "advisor" && "ШІ-Архітектор"}
                {activeTab === "media-forensics" && "Аналіз Медіа (Forensics)"}
                {activeTab === "data-ingestion" &&
                  "AI Intelligence Acquisition"}
                {activeTab === "autonomous-factory" &&
                  "Автономна Фабрика Оркестрації"}
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
                {activeTab === "live-analytical-center" && (
                  <LiveAnalyticalCenter
                    selectedEntity={selectedEntity}
                    onSelectEntityGlobal={(ent) => {
                      setSelectedEntity(ent);
                      setSelectedTool(null);
                      setSelectedNode(null);
                    }}
                    selectedScenario={selectedScenario}
                    onSelectScenario={setSelectedScenario}
                  />
                )}
                {activeTab === "admin-back-office" && <AdminBackOffice />}
                {activeTab === "dashboard" && (
                  <DashboardView
                    onSelectTab={(tabId) => {
                      if (tabId === "osint") {
                        setActiveTab("live-analytical-center");
                      } else {
                        setActiveTab(tabId as TabId);
                      }
                    }}
                    onSelectEntity={(entId) => {
                      selectEntityById(entId);
                      setActiveTab("live-analytical-center");
                    }}
                  />
                )}
                {activeTab === "osint" && (
                  <OsintWorkbench
                    selectedEntity={selectedEntity}
                    onSelectEntityForInspector={(ent) => {
                      setSelectedEntity(ent);
                      setSelectedTool(null);
                      setSelectedNode(null);
                      setIsInspectorOpen(true);
                    }}
                  />
                )}
                {activeTab === "person-profiler" && <PersonProfiler />}
                {activeTab === "sandbox" && <InvestigationSandbox />}
                {activeTab === "maps" && (
                  <MapsTab
                    onSelectEntityGlobal={(ent) => {
                      setSelectedEntity(ent);
                      setSelectedTool(null);
                      setSelectedNode(null);
                      setActiveTab("live-analytical-center");
                    }}
                  />
                )}
                {activeTab === "catalog" && <CatalogTab />}
                {activeTab === "license" && <LicenseTab />}
                {activeTab === "architecture" && <ArchitectureTab />}
                {activeTab === "gap" && <GapAnalysisTab />}
                {activeTab === "roadmap" && <RoadmapTab />}
                {activeTab === "volumes" && <VolumesTab />}
                {activeTab === "advisor" && <AdvisorTab />}
                {activeTab === "media-forensics" && <MediaForensicsTab />}
                {activeTab === "data-ingestion" && <DataIngestionTab />}
                {activeTab === "autonomous-factory" && <AutonomousFactoryTab />}
              </motion.div>
            </AnimatePresence>
          </div>
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
        {ecosystem === "user" && (
          <div className="fixed bottom-14 right-6 z-50">
            {/* Toggle bubble button */}
            <button
              onClick={() => setIsAiChatOpen(!isAiChatOpen)}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-2xl transition-all cursor-pointer flex items-center justify-center border border-blue-400/20 group"
              title="ШІ-Помічник NEXUS"
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
                  className="absolute bottom-14 right-0 w-80 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[380px]"
                >
                  {/* Header */}
                  <div className="p-2 bg-indigo-950/20 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        NEXUS ШІ-Асистент
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
                  <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-2xl leading-relaxed max-w-[85%] ${msg.sender === "user" ? "bg-blue-600 text-white ml-auto" : "bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 text-slate-300"}`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Запитайте ШІ про санкції чи SQL..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                      }}
                      className="flex-1 bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 rounded-2xl px-2.5 py-2 text-xs focus:outline-none focus:border-slate-800"
                    />
                    <button
                      onClick={startVoiceControl}
                      className={`p-2 rounded-2xl transition-colors cursor-pointer flex items-center justify-center ${isVoiceListening ? "bg-red-500/20 text-red-400 border border-red-500/20 animate-pulse" : "bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 text-slate-300 hover:text-blue-400"}`}
                      title="Голосовий ввід"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-2xl transition-colors cursor-pointer"
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
        {ecosystem === "admin" ? (
          <footer className="border-t border-slate-800 bg-slate-950 px-2 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider z-40 sticky bottom-0">
            {/* Left indicators */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                NEXUS ENG: ONLINE
              </span>
              <span>API: 12ms</span>
              <span className="text-blue-400 font-bold">
                GPU: NVIDIA A100 (42% VRAM)
              </span>
              <span>CPU: 18%</span>
              <span>RAM: 14.8 GB / 64 GB</span>
            </div>

            {/* Right indices and queues statuses */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-400">
                INDEXING: ACTIVE (140 files/sec)
              </span>
              <span>БАЗИ: Neo4j, Qdrant, PG</span>
              <span className="text-amber-500 font-bold">
                QUEUES: KAFKA (0 LAG)
              </span>
              <span>LLM: GEMINI 3.5 FLASH</span>
              <span>КЛАСТЕР: CLOUD RUN EUR-W2</span>
            </div>
          </footer>
        ) : (
          <footer className="border-t border-slate-800 bg-slate-950 px-2 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider z-40 sticky bottom-0">
            {/* Left analytical indicators */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                СЕКТОР: АНАЛІТИКА ТА РОЗСЛІДУВАННЯ (ДЕРЖСПЕЦЗВ'ЯЗОК)
              </span>
              <span className="text-slate-300">
                РЕЄСТРИ:{" "}
                <strong className="text-slate-200">СИНХРОНІЗОВАНО</strong>
              </span>
              <span className="text-emerald-400 font-bold">
                КЛАС КАНАЛУ: НАДІЙНИЙ (AES-GCM)
              </span>
              <span className="text-slate-300">
                КАБІНЕТ:{" "}
                <strong className="text-slate-200">ОФІЦЕР-АНАЛІТИК</strong>
              </span>
            </div>

            {/* Right analytical indicators */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-blue-400 font-bold">
                ПРОТОКОЛ: RSA-4096 (ДЕРЖСПЕЦЗВ'ЯЗОК)
              </span>
              <span className="text-slate-300">
                ІНТЕГРАЦІЯ: YOUCONTROL, OPENDATABOT, МИТНИЦЯ, РНБО
              </span>
              <span className="text-blue-400 font-bold">
                ШІ-ЯДРО: NEXUS INTEL v3.5
              </span>
            </div>
          </footer>
        )}

        {/* 6. COMMAND CENTER SPOTLIGHT PANEL (Ctrl+K) */}
        <AnimatePresence>
          {isSpotlightOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-3">
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
                className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px] z-50"
              >
                {/* Search input header */}
                <div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-800 bg-slate-950/50">
                  <Search className="w-4 h-4 text-blue-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Введіть запит для пошуку (напр. 'Дашборд', 'сан', 'Коваленко' чи 'звук')..."
                    value={spotlightQuery}
                    onChange={(e) => setSpotlightQuery(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                  />
                  <span className="text-xs bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 text-slate-300 px-2 py-1 rounded font-mono shrink-0">
                    ESC
                  </span>
                </div>

                {/* Categorized results list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                  {/* Navigation suggestions */}
                  {spotlightResults.navigation.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold block">
                        🧭 Навігація та Екосистема
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {spotlightResults.navigation.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleSpotlightSelect(n)}
                            className="w-full text-left px-2 py-1.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-blue-600/20 hover:border-slate-800 border border-transparent transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_2px_10px_rgba(99,102,241,0.15)] flex items-center justify-between cursor-pointer"
                          >
                            <span>{n.label}</span>
                            <span className="text-xs text-blue-500 font-mono">
                              Перейти →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Simulated Device controls / Actions */}
                  {spotlightResults.actions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-bold block">
                        ⚡ Команди керування симуляцією
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {spotlightResults.actions.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => handleSpotlightSelect(a)}
                            className="text-left px-2 py-1.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-amber-600/20 hover:border-slate-800 border border-transparent bg-black/30 transition-all flex items-center justify-between cursor-pointer"
                          >
                            <span>{a.label}</span>
                            <span className="text-xs text-amber-500 font-mono">
                              Виконати
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities / OSINT records */}
                  {spotlightResults.entities.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-rose-400 uppercase tracking-widest font-bold block">
                        👥 Аналітична база даних OSINT (Компанії / Бенефіціари)
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {spotlightResults.entities.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => handleSpotlightSelect(e)}
                            className="w-full text-left px-2 py-1.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-rose-600/20 hover:border-slate-800 border border-transparent transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_2px_10px_rgba(244,63,94,0.15)] flex items-center justify-between cursor-pointer"
                          >
                            <span>{e.label}</span>
                            <span className="text-xs bg-rose-500/10 border border-slate-800 px-2 py-1 rounded text-rose-400 font-mono font-bold">
                              {e.raw.risk_level === "CRITICAL"
                                ? "⚠️ КРИТИЧНИЙ"
                                : "🔴 ВИСОКИЙ"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If nothing matches */}
                  {spotlightResults.navigation.length === 0 &&
                    spotlightResults.actions.length === 0 &&
                    spotlightResults.entities.length === 0 && (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-bounce" />
                        <p className="text-xs text-slate-300 font-semibold">
                          Жодного збігу не знайдено для "{spotlightQuery}"
                        </p>
                        <p className="text-xs text-slate-600 mt-1 font-mono">
                          Спробуйте ввести інший пошуковий термін
                        </p>
                      </div>
                    )}
                </div>

                {/* Spotlight footer */}
                <div className="px-2 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <span>Швидкі дії:</span>
                    <strong className="text-slate-300 font-bold bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 px-2 py-1 rounded">
                      ↑↓
                    </strong>
                    <span>для вибору,</span>
                    <strong className="text-slate-300 font-bold bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 px-2 py-1 rounded">
                      Enter
                    </strong>
                    <span>для запуску</span>
                  </span>
                  <span className="text-blue-400 font-bold uppercase tracking-wider">
                    NEXUS COMMAND PANEL v2.5
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {deviceMode === "iphone" ? renderIphoneLayout() : deviceMode === "ipad" ? renderIpadLayout() : (
    <div className="h-screen w-full bg-slate-950 overflow-hidden">
      {renderDesktopLayout()}
    </div>
  )}
      </AnimatePresence>

      {/* Floating Voice Control HUD Overlay */}
      <AnimatePresence>
        {isVoiceListening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-red-500/30 shadow-2xl rounded-2xl px-2 py-1.5 z-50 flex items-center gap-2 w-[420px] max-w-[90vw] backdrop-blur-md"
          >
            <div className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                🎙️ Голосовий аналізатор NEXUS активний
              </p>
              <p className="text-xs text-slate-200 font-medium truncate mt-0.5 font-sans">
                {voiceFeedback ||
                  "Слухаю голос... Назвіть команду навігації чи пошуку"}
              </p>
            </div>
            <div className="flex gap-0.5 items-center justify-end h-5 w-12 shrink-0">
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 12 }}
              />
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 20 }}
              />
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 8 }}
              />
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 24 }}
              />
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 14 }}
              />
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
            className={`fixed top-20 left-1/2 -translate-x-1/2 shadow-[0_15px_40px_rgba(0,0,0,0.5)] rounded-2xl p-2 z-50 flex flex-col gap-2 w-[450px] max-w-[90vw] backdrop-blur-md border ${voiceError ? "bg-red-950/95 border-red-500/40 text-red-200 shadow-red-900/10" : "bg-slate-950/95 border-slate-800 text-slate-200 shadow-indigo-900/10"}`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xs shrink-0 mt-0.5">
                {voiceError ? "⚠️" : "🎙️"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  {voiceError
                    ? "Помилка голосового аналізатора"
                    : "Аналітичний голос NEXUS"}
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
                <p className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider mb-2">
                  ⚡ Клікніть, щоб симулювати голосову команду:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    {
                      label: "📊 Перейти на Дашборд",
                      cmd: "перейди на дашборд",
                    },
                    { label: "🗺️ Показати Карту", cmd: "покажи карту" },
                    { label: "🔍 OSINT пошук", cmd: "осінт пошук" },
                    { label: "👤 Знайди Коваленко", cmd: "знайди Коваленко" },
                    { label: "🛡️ Дорожня карта", cmd: "дорожня карта" },
                    { label: "⚠️ Санкції РНБО?", cmd: "які санкції?" },
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setVoiceError(null);
                        setVoiceFeedback(`Симульовано команду: "${item.cmd}"`);
                        handleVoiceCommand(item.cmd);
                        setTimeout(() => setVoiceFeedback(null), 3000);
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white border border-red-500/20 hover:border-red-500/40 px-2 py-1.5 rounded-2xl text-xs font-semibold text-left transition-all cursor-pointer truncate"
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
      <VoiceCall />
    </>
  );
}
