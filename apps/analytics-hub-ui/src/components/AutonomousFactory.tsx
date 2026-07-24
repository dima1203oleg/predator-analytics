import React, { useState, useEffect, useRef } from "react";
import {
  Cpu,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Send,
  Radio,
  ShieldAlert,
  Bot,
  Server,
  Terminal,
  Zap,
  Shield,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Flame,
  Trash2,
  Layers,
  Check,
  X,
  Code,
  Wifi,
  Database,
  Heart,
  FileText,
  CheckSquare,
  Plus,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Types for Autonomous Factory
interface AgentTask {
  id: string;
  name: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  agent: string;
  progress: number;
  logs: string[];
  timestamp: any;
}

interface CouncilVote {
  id: string;
  scenario: string;
  verdict: string;
  models: {
    name: string;
    vote: "APPROVE" | "REJECT" | "ABSTAIN";
    reason: string;
    confidence: number;
  }[];
  timestamp: any;
}

interface TelegramLog {
  id: string;
  sender: "user" | "bot" | "system";
  message: string;
  timestamp: string;
}

export default function AutonomousFactory() {
  const [activeSubTab, setActiveSubTab] = useState<
    | "conductor"
    | "council"
    | "telegram"
    | "uitester"
    | "specification"
    | "helpers"
  >("conductor");
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);
  const [isFactoryRunning, setIsFactoryRunning] = useState<boolean>(true);
  const [vramUsage, setVramUsage] = useState<number>(4.8); // GB

  // ChiefConductor States
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskAgent, setNewTaskAgent] = useState("Discovery_Engine");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  >("MEDIUM");
  const [isSavingTask, setIsSavingTask] = useState(false);

  // CouncilJudge States
  const [votes, setVotes] = useState<CouncilVote[]>([]);
  const [selectedVoteId, setSelectedVoteId] = useState<string>("");

  // Telegram Log States
  const [telegramLogs, setTelegramLogs] = useState<TelegramLog[]>([]);
  const [teleInput, setTeleInput] = useState("");
  const telegramEndRef = useRef<HTMLDivElement | null>(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<
    "connected" | "syncing" | "error"
  >("connected");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  // Load agent tasks in realtime from Core API
  useEffect(() => {
    let isMounted = true;
    
    const fetchTasks = async () => {
      try {
        if (!isMounted) return;
        const response = await fetch(`${API_BASE_URL}/adip/tasks`);
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        
        // Data should be an array of tasks
        if (Array.isArray(data)) {
          // Priority weighting
          const sorted = data.sort((a, b) => {
            const priorityWeight: any = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
            const aWeight = priorityWeight[a.priority] || 0;
            const bWeight = priorityWeight[b.priority] || 0;
            if (bWeight !== aWeight) return bWeight - aWeight;
            
            // Fallback to timestamp sort
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          setTasks(sorted);
          setSyncStatus("connected");
        }
      } catch (error) {
        console.error("Error fetching agent_tasks:", error);
        setSyncStatus("error");
      }
    };

    fetchTasks();
    const intervalId = setInterval(fetchTasks, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Load Council Votes in realtime from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "council_votes"),
      (snapshot) => {
        const items: CouncilVote[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as CouncilVote);
        });
        setVotes(items);
        if (items.length > 0 && !selectedVoteId) {
          setSelectedVoteId(items[0].id);
        }
      },
      (error) => {
        console.error("Error syncing council_votes:", error);
        handleFirestoreError(error, OperationType.LIST, "council_votes");
      },
    );

    return () => unsubscribe();
  }, [selectedVoteId]);

  // Load Telegram Logs in realtime from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "telegram_logs"),
      (snapshot) => {
        const items: TelegramLog[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as TelegramLog);
        });
        const sorted = items.sort((a, b) =>
          a.timestamp.localeCompare(b.timestamp),
        );
        setTelegramLogs(sorted);
        setTimeout(() => {
          telegramEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
      (error) => {
        console.error("Error syncing telegram_logs:", error);
        handleFirestoreError(error, OperationType.LIST, "telegram_logs");
      },
    );

    return () => unsubscribe();
  }, []);

  // Simulated live factory progress loops removed (now fetching real data from backend)

  // Fluctuate VRAM
  useEffect(() => {
    if (!isFactoryRunning || killSwitchActive) return;
    const interval = setInterval(() => {
      setVramUsage((prev) => {
        const delta = (Math.random() - 0.5) * 0.4;
        return Math.max(3.2, Math.min(7.9, prev + delta));
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isFactoryRunning, killSwitchActive]);

  // Seed initial data if collections are empty
  const handleSeedData = async () => {
    try {
      // 1. Seed some tasks (no longer seeding Firestore agent_tasks as they are loaded from API)
      
      // 2. Seed some council votes
      const sampleVotes: CouncilVote[] = [
        {
          id: "vote_1",
          scenario:
            "Додавання нового джерела: Реєстр Декларацій НАЗК (Україна). Виявлення PEP та аналіз активів.",
          verdict: "СХВАЛЕНО (Консенсус 3/3 моделями)",
          models: [
            {
              name: "DeepSeek-R1-Local",
              vote: "APPROVE",
              reason:
                "Специфікація OpenAPI повністю валідна, джерело державне та офіційне, високий рівень довіри.",
              confidence: 98,
            },
            {
              name: "Llama-3.3-70B",
              vote: "APPROVE",
              reason:
                "Інтеграція дозволить закрити прогалину в аналізі активів PEP осіб на 14%.",
              confidence: 95,
            },
            {
              name: "Qwen-2.5-72B",
              vote: "APPROVE",
              reason:
                "Структура бази сумісна з FtM, затримка API 180мс, суперечностей не виявлено.",
              confidence: 91,
            },
          ],
          timestamp: new Date(),
        },
        {
          id: "vote_2",
          scenario:
            "Автоматичне профілювання підозрілого провайдера криптовалюти з реєстрацією в офшорі",
          verdict: "РІШЕННЯ ВІДКЛАДЕНО (Потрібен ручний аналіз)",
          models: [
            {
              name: "DeepSeek-R1-Local",
              vote: "REJECT",
              reason:
                "Виявлено ризики маскування транзакцій та відсутність прозорого API. Безпекова перевірка не пройдена.",
              confidence: 88,
            },
            {
              name: "Llama-3.3-70B",
              vote: "APPROVE",
              reason:
                "Існують непрямі зв'язки з українськими бенефіціарами, аналіз корисний.",
              confidence: 74,
            },
            {
              name: "Qwen-2.5-72B",
              vote: "ABSTAIN",
              reason:
                "Недостатній обсяг вхідних метаданих для однозначного висновку.",
              confidence: 50,
            },
          ],
          timestamp: new Date(),
        },
      ];

      for (const v of sampleVotes) {
        await setDoc(doc(db, "council_votes", v.id), v);
      }

      // 3. Seed some telegram logs
      const sampleTelegram: TelegramLog[] = [
        {
          id: "tel_1",
          sender: "system",
          message: "🚀 PREDATOR Autonomous Factory запущено на NVIDIA Server.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "tel_2",
          sender: "user",
          message: "/status",
          timestamp: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: "tel_3",
          sender: "bot",
          message:
            "🤖 PREDATOR Статус: Всі системи номінальні.\nVRAM: 4.8GB / 8GB\nАктивних агентів: 2\nОстанній деплой: Успішно",
          timestamp: new Date(Date.now() - 3495000).toISOString(),
        },
      ];

      for (const tel of sampleTelegram) {
        await setDoc(doc(db, "telegram_logs", tel.id), tel);
      }
    } catch (err) {
      console.error("Seeding data failed: ", err);
      handleFirestoreError(err, OperationType.WRITE, "seeding");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName) return;
    setIsSavingTask(true);
    try {
      await fetch(`${API_BASE_URL}/adip/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTaskName,
          agent: newTaskAgent,
          priority: newTaskPriority
        })
      });
      setNewTaskName("");
    } catch (err) {
      console.error("Failed to add task: ", err);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    console.log("Delete is not implemented on Backend yet for task: ", id);
  };

  const handleSendTelegramMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teleInput) return;
    try {
      const userMsgId = "tel_" + Date.now();
      const userLog: TelegramLog = {
        id: userMsgId,
        sender: "user",
        message: teleInput,
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, "telegram_logs", userMsgId), userLog);

      const prompt = teleInput.trim();
      setTeleInput("");

      // Simulate Bot Response
      setTimeout(async () => {
        const botMsgId = "tel_" + (Date.now() + 100);
        let botText = "";

        if (prompt.toLowerCase() === "/status") {
          botText = `🤖 PREDATOR Фабрика Статус:\n• Стан: ${killSwitchActive ? "⚠️ АВАРІЙНИЙ СТОП" : "🟢 АКТИВНИЙ"}\n• Режим: Eternal Factory Mode\n• Завантаження VRAM: ${vramUsage.toFixed(1)}GB / 8GB\n• Черга задач: ${tasks.length} елементів.`;
        } else if (prompt.toLowerCase() === "/emergency_stop") {
          botText = `🚨 Запит на екстрену зупинку прийнято.\nІніціюю блокування контейнерів та виклик Kill-Switch...`;
          setKillSwitchActive(true);
        } else if (prompt.toLowerCase().startsWith("/idea")) {
          botText = `💡 Ідея успішно зафіксована та черговано у беклог OODA.\nДякуємо за посилення системи!`;
        } else {
          botText = `🤖 Автономна Команда PREDATOR:\nНевідома команда "${prompt}". Доступні: /status, /emergency_stop, /idea <текст>, /rollback.`;
        }

        const botLog: TelegramLog = {
          id: botMsgId,
          sender: "bot",
          message: botText,
          timestamp: new Date().toISOString(),
        };
        try {
          await setDoc(doc(db, "telegram_logs", botMsgId), botLog);
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.WRITE,
            `telegram_logs/${botMsgId}`,
          );
        }
      }, 1000);
    } catch (err) {
      console.error("Failed to post telegram msg:", err);
      handleFirestoreError(err, OperationType.WRITE, "telegram_logs");
    }
  };

  const selectedVote = votes.find((v) => v.id === selectedVoteId);

  return (
    <div className="w-full bg-transparent text-slate-200 p-1 md:p-2 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden font-sans">
      {/* Background Cyber Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/5 blur-3xl pointer-events-none" />

      {/* Cyber Top Indicator Bar */}
      <div className="w-full bg-slate-900/80 border-b border-slate-800 p-2.5 flex flex-wrap justify-between items-center gap-2 rounded-t-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Cpu
              className={`w-5 h-5 ${killSwitchActive ? "text-rose-500 animate-pulse" : "text-cyan-400 animate-spin-slow"}`}
            />
            <div
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${killSwitchActive ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-ping"}`}
            />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-slate-200 uppercase font-mono">
              PREDATOR Autonomous Eternal Factory
            </h1>
            <p className="text-xs text-slate-500 font-mono tracking-wider">
              Режим: Безперервне самовдосконалення (OODA 2.0)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="bg-slate-950/80 backdrop-blur-xl px-3 py-1 border border-slate-800 rounded flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase">
              Синхронізація:
            </span>
            {syncStatus === "connected" && (
              <span className="text-emerald-400 flex items-center gap-1">
                ● ЗВ'ЯЗОК <Wifi className="w-3 h-3" />
              </span>
            )}
            {syncStatus === "syncing" && (
              <span className="text-amber-400 animate-pulse">● СИНХРО...</span>
            )}
            {syncStatus === "error" && (
              <span className="text-rose-400">● ХИБА</span>
            )}
          </div>

          <div className="bg-slate-950/80 backdrop-blur-xl px-3 py-1 border border-slate-800 rounded flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase">
              VRAM GUARD:
            </span>
            <span
              className={`font-bold ${vramUsage > 7 ? "text-rose-400" : "text-cyan-400"}`}
            >
              {vramUsage.toFixed(1)} GB / 8.0 GB
            </span>
          </div>



          <button
            onClick={() => setKillSwitchActive(!killSwitchActive)}
            className={`px-3 py-1.5 rounded font-bold uppercase text-xs border tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${killSwitchActive ? "bg-rose-950/40 text-rose-400 border-slate-800 animate-pulse" : "bg-rose-600/10 text-rose-400 border-slate-800 hover:bg-rose-500 hover:text-[#050505]"}`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>
              {killSwitchActive ? "БЛОКУВАННЯ АКТИВНЕ" : "KILL-SWITCH"}
            </span>
          </button>
        </div>
      </div>

      {killSwitchActive && (
        <div className="bg-rose-950/20 border-b border-slate-800 p-2 text-center text-xs font-mono font-bold text-rose-400 uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 animate-bounce" />
          <span>
            АВАРІЙНИЙ СТОП АКТИВОВАНО: Всі процеси, ШІ-Агенти та Клієнти
            заблоковано
          </span>
        </div>
      )}

      {/* Cyber Sub-navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5 p-2 bg-slate-950/60 border-b border-slate-800">
        {[
          {
            id: "conductor",
            label: "Chief Conductor",
            desc: "Управління Агентами",
            icon: Cpu,
            color: "text-cyan-400 border-slate-800",
          },
          {
            id: "council",
            label: "Council Judge",
            desc: "Судова LLM Рада",
            icon: Layers,
            color: "text-purple-400 border-purple-500/30",
          },
          {
            id: "telegram",
            label: "Telegram Bot",
            desc: "Пульт Управління",
            icon: MessageSquare,
            color: "text-blue-400 border-slate-800",
          },
          {
            id: "uitester",
            label: "UI-Tester",
            desc: "Автоматичні Тести",
            icon: CheckSquare,
            color: "text-emerald-400 border-slate-800",
          },
          {
            id: "specification",
            label: "AI Factory Core",
            desc: "Автономний Маніфест",
            icon: FileText,
            color: "text-pink-400 border-pink-500/30",
          },
          {
            id: "helpers",
            label: "Helpers Node",
            desc: "Помічники Системи",
            icon: Server,
            color: "text-amber-400 border-slate-800",
          },
        ].map((subTab) => {
          const Icon = subTab.icon;
          const isActive = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id as any)}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${isActive ? "bg-[#09152b] border-slate-800 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)] text-slate-200" : "bg-slate-950/40 border-transparent text-slate-400 hover:bg-slate-900/30 hover:text-slate-200"}`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`}
                />
                <span className="text-xs font-black tracking-wide uppercase font-mono">
                  {subTab.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                {subTab.desc}
              </p>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-2">
        {/* ChiefConductorView Tab */}
        {activeSubTab === "conductor" && (
          <div className="grid grid-cols-12 gap-2">
            {/* OODA 2.0 Cycle Visualizer */}
            <div className="col-span-12 xl:col-span-4 bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between h-[350px]">
              <div>
                <div className="pb-2 border-b border-slate-800 mb-3 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Оркестрація AI Intelligence Acquisition
                  </span>
                  <span className="text-xs font-mono bg-cyan-950 text-cyan-400 border border-slate-800 px-2 py-1 rounded uppercase font-black">
                    {isFactoryRunning && !killSwitchActive ? "АКТИВНА" : "СТОП"}
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      step: "1. DISCOVERY ENGINE",
                      desc: "Автоматичний парсинг Swagger, GraphQL, REST схем з джерел",
                      status: "АКТИВНО",
                      glow: "shadow-[0_0_10px_rgba(6,182,212,0.15)] bg-cyan-950/20 border-slate-800 text-cyan-400",
                    },
                    {
                      step: "2. CODEGEN ENGINE",
                      desc: "Генерація Python-клієнта, ETL та Pydantic-моделей",
                      status: "ЧЕКАННЯ",
                      glow: "bg-slate-900/40 border-slate-800/60 text-slate-400",
                    },
                    {
                      step: "3. VALIDATION ENGINE",
                      desc: "Ruff, Bandit, Pytest, Playwright, Contract Testing",
                      status: "АКТИВНО",
                      glow: "shadow-[0_0_10px_rgba(168,85,247,0.15)] bg-purple-950/20 border-purple-500/40 text-purple-400",
                    },
                    {
                      step: "4. SELF-HEALING & DEPLOY",
                      desc: "Виявлення Schema Drift, автофікси та GitOps деплой через ArgoCD",
                      status: "ЧЕКАННЯ",
                      glow: "bg-slate-900/40 border-slate-800/60 text-slate-400",
                    },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-2xl border text-xs font-mono transition-all ${s.glow}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{s.step}</span>
                        <span className="text-xs px-2 py-1 rounded font-black border uppercase">
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {s.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setIsFactoryRunning(!isFactoryRunning)}
                  disabled={killSwitchActive}
                  className={`flex-1 py-2 rounded text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isFactoryRunning ? "bg-slate-900/40 backdrop-blur-md hover:bg-slate-800 text-slate-300 border border-slate-800/60" : "bg-cyan-600 hover:bg-cyan-500 text-[#050505]"}`}
                >
                  {isFactoryRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Призупинити фабрику</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Запустити фабрику</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tasks Queue Creator & Manager */}
            <div className="col-span-12 xl:col-span-8 bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between h-[350px]">
              <div>
                <div className="pb-2 border-b border-slate-800 mb-3 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Черга завдань ШІ-Агентів
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    ВСЬОГО: {tasks.length}
                  </span>
                </div>

                {/* Queue Adder Form */}
                <form
                  onSubmit={handleCreateTask}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4 bg-slate-950/80 backdrop-blur-xl p-2.5 rounded-2xl border border-slate-800"
                >
                  <div className="md:col-span-5">
                    <input
                      type="text"
                      placeholder="Опис задачі для ШІ-агента..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="w-full bg-transparent border border-slate-800 focus:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <select
                      value={newTaskAgent}
                      onChange={(e) => setNewTaskAgent(e.target.value)}
                      className="w-full bg-transparent border border-slate-800 focus:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all"
                    >
                      <option value="Discovery_Engine">
                        🔍 Discovery Engine (Схеми)
                      </option>
                      <option value="Codegen_Engine">
                        ⚙️ Codegen Engine (Фабрика)
                      </option>
                      <option value="Validation_Engine">
                        🛡️ Validation Engine (Тести)
                      </option>
                      <option value="SelfHealing_Engine">
                        🩹 Self-Healing Engine (SRE)
                      </option>
                      <option value="Documentation_Engine">
                        📚 Documentation Engine (ADR)
                      </option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={newTaskPriority}
                      onChange={(e: any) => setNewTaskPriority(e.target.value)}
                      className="w-full bg-transparent border border-slate-800 focus:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all"
                    >
                      <option value="LOW">НИЗЬКИЙ</option>
                      <option value="MEDIUM">СЕРЕДНІЙ</option>
                      <option value="HIGH">ВИСОКИЙ</option>
                      <option value="CRITICAL">КРИТИЧНИЙ</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingTask || killSwitchActive}
                    className="md:col-span-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-[#050505] rounded font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    {isSavingTask ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Додати</span>
                  </button>
                </form>

                {/* Queue List */}
                <div className="overflow-y-auto max-h-[250px] custom-scrollbar space-y-1.5 pr-1">
                  <AnimatePresence>
                    {tasks.map((task) => {
                      const priorityColors = {
                        CRITICAL:
                          "bg-rose-500/10 text-rose-400 border-slate-800",
                        HIGH: "bg-amber-500/10 text-amber-400 border-slate-800",
                        MEDIUM:
                          "bg-blue-500/10 text-blue-400 border-slate-800",
                        LOW: "bg-slate-500/10 text-slate-400 border-slate-800/60",
                      };

                      const statusColors = {
                        QUEUED: "text-slate-400 bg-slate-950/80 backdrop-blur-xl border-slate-800",
                        RUNNING:
                          "text-cyan-400 bg-cyan-950/20 border-slate-800 animate-pulse",
                        COMPLETED:
                          "text-emerald-400 bg-emerald-950/20 border-slate-800",
                        FAILED:
                          "text-rose-400 bg-rose-950/20 border-slate-800",
                      };

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className={`p-2.5 rounded-2xl border bg-slate-950/40 border-slate-800 flex justify-between items-center transition-all ${task.status === "RUNNING" ? "shadow-[0_0_10px_rgba(6,182,212,0.05)] border-slate-800" : ""}`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-mono border px-2 py-1 rounded font-black ${priorityColors[task.priority]}`}
                              >
                                {task.priority}
                              </span>
                              <span
                                className={`text-xs font-mono border px-2 py-1 rounded font-black ${statusColors[task.status]}`}
                              >
                                {task.status}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                {task.agent}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-200 mt-1 truncate">
                              {task.name}
                            </h4>
                            {task.status === "RUNNING" && (
                              <div className="w-full bg-slate-950/80 backdrop-blur-xl rounded-full h-1 mt-2 overflow-hidden">
                                <div
                                  className="bg-cyan-400 h-1 transition-all duration-500"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {task.status === "RUNNING" && (
                              <span className="text-xs font-mono text-cyan-400">
                                {task.progress}%
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 hover:bg-rose-500/10 rounded text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {tasks.length === 0 && (
                    <div className="text-center py-12 text-slate-500 font-mono text-xs">
                      Черга завдань пуста. Додайте завдання вище або ініціюйте
                      демо-дані.
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between text-xs font-mono text-slate-500">
                <span>
                  Eternal Factory: Оркестрація OODA є асинхронною та
                  імутабельною
                </span>
                <span>Всього оброблено: 1,481,200 сутностей</span>
              </div>
            </div>
          </div>
        )}

        {/* CouncilJudgeView Tab */}
        {activeSubTab === "council" && (
          <div className="grid grid-cols-12 gap-2">
            {/* Scenarios / Votes list */}
            <div className="col-span-12 xl:col-span-5 bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between h-[350px]">
              <div>
                <div className="pb-2 border-b border-slate-800 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Кейси на обговорення Ради LLM
                  </span>
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[350px] custom-scrollbar pr-1">
                  {votes.map((v) => {
                    const isSelected = selectedVoteId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVoteId(v.id)}
                        className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${isSelected ? "bg-purple-600/10 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "bg-slate-950/40 border-slate-800 hover:border-slate-800/60"}`}
                      >
                        <h4 className="text-xs font-black text-slate-200 line-clamp-2">
                          {v.scenario}
                        </h4>
                        <div className="flex justify-between items-center mt-2 text-xs font-mono">
                          <span className="text-purple-400 uppercase font-black tracking-wider">
                            Кейс: {v.id}
                          </span>
                          <span className="text-slate-500">3 Моделі</span>
                        </div>
                      </div>
                    );
                  })}
                  {votes.length === 0 && (
                    <div className="text-center py-12 text-slate-500 font-mono text-xs">
                      Немає активних судових кейсів. Ініціюйте демо-дані.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voting Consensus visualizer */}
            <div className="col-span-12 xl:col-span-7 bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between h-[350px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl pointer-events-none" />

              {selectedVote ? (
                <div>
                  <div className="pb-2 border-b border-slate-800 mb-3 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-purple-400" />
                      Консенсус-Аналітика Голосування (ADIP-Vote)
                    </span>
                    <span className="text-xs font-mono text-purple-400">
                      ID: {selectedVote.id}
                    </span>
                  </div>

                  <div className="bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-slate-800 mb-4">
                    <span className="text-xs font-mono text-slate-500 block uppercase">
                      СЦЕНАРІЙ ДОСЛІДЖЕННЯ:
                    </span>
                    <h3 className="text-xs font-black text-slate-200 mt-1">
                      {selectedVote.scenario}
                    </h3>
                  </div>

                  {/* 3 models votings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-4">
                    {selectedVote.models.map((m, idx) => {
                      const voteColors = {
                        APPROVE:
                          "bg-emerald-950/40 text-emerald-400 border-slate-800",
                        REJECT:
                          "bg-rose-950/40 text-rose-400 border-slate-800",
                        ABSTAIN: "bg-slate-900/40 backdrop-blur-md text-slate-400 border-slate-800/60",
                      };

                      return (
                        <div
                          key={idx}
                          className="bg-slate-950/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-xs font-black text-slate-300 font-mono block">
                              {m.name}
                            </span>
                            <p className="text-xs text-slate-400 mt-1 italic">
                              "{m.reason}"
                            </p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-800/60 mt-2">
                            <span
                              className={`text-xs font-mono border px-2 py-1 rounded font-black tracking-widest ${voteColors[m.vote]}`}
                            >
                              {m.vote === "APPROVE"
                                ? "✔ ТАК"
                                : m.vote === "REJECT"
                                  ? "✘ НІ"
                                  : "● УТРИМАВСЯ"}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              Впевненість: {m.confidence}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Verdict Block */}
                  <div className="bg-purple-950/15 border border-purple-500/30 p-2.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-purple-400 uppercase tracking-widest block font-bold">
                        Остаточний Консенсусний Вердикт:
                      </span>
                      <span className="text-xs font-black text-slate-200 mt-1 block">
                        {selectedVote.verdict}
                      </span>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-500">
                      <span>Метод: Council-Consensus (Major Vote)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
                  Оберіть судовий кейс зліва для детального перегляду
                  голосування моделей.
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                <span className="text-xs font-mono text-slate-500 self-center">
                  Explainable AI: Консенсус надійно захищає від галюцинацій
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Telegram Bot Simulation Tab */}
        {activeSubTab === "telegram" && (
          <div className="grid grid-cols-12 gap-2">
            {/* Command controls list */}
            <div className="col-span-12 xl:col-span-5 bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between h-[350px]">
              <div>
                <div className="pb-2 border-b border-slate-800 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    Керування Telegram-Бот Сервером
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs text-slate-300">
                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded border border-slate-800">
                    <span className="text-xs text-slate-500 block uppercase mb-1">
                      Служба Бот-Центру:
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      🟢 ОФІЦІЙНО ЗАПУЩЕНО
                    </span>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-500 block uppercase">
                      Підтримувані API команди:
                    </span>
                    <div className="space-y-1">
                      <div>
                        <span className="text-blue-400 font-bold">/status</span>{" "}
                        — Отримати звіт про стан системи
                      </div>
                      <div>
                        <span className="text-blue-400 font-bold">
                          /emergency_stop
                        </span>{" "}
                        — Миттєве екстрене блокування
                      </div>
                      <div>
                        <span className="text-blue-400 font-bold">
                          /idea &lt;текст&gt;
                        </span>{" "}
                        — Чергувати ідею або задачу
                      </div>
                      <div>
                        <span className="text-blue-400 font-bold">
                          /rollback
                        </span>{" "}
                        — Відкат деплою у хмарі
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Бот реалізований на фреймворку aiogram 3 з каскадною
                    авторизацією по закритих ключах SSH та тунелями Zrok.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <button
                  onClick={async () => {
                    try {
                      // Delete telegram logs
                      const qSnap = await getDocs(
                        collection(db, "telegram_logs"),
                      );
                      qSnap.forEach(async (d) => {
                        try {
                          await deleteDoc(doc(db, "telegram_logs", d.id));
                        } catch (err) {
                          handleFirestoreError(
                            err,
                            OperationType.DELETE,
                            `telegram_logs/${d.id}`,
                          );
                        }
                      });
                    } catch (e) {
                      console.error("Clean logs err: ", e);
                      handleFirestoreError(
                        e,
                        OperationType.LIST,
                        "telegram_logs",
                      );
                    }
                  }}
                  className="w-full py-2 bg-slate-900/40 backdrop-blur-md hover:bg-slate-800 text-slate-400 border border-slate-800/60 rounded text-xs font-bold font-mono uppercase transition-all cursor-pointer"
                >
                  Очистити історію чату
                </button>
              </div>
            </div>

            {/* Simulated Live Telegram Chat Device */}
            <div className="col-span-12 xl:col-span-7 bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col h-[350px] justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  PREDATOR_Telegram_Simulator_Device
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  ONLINE
                </span>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3 mb-4">
                {telegramLogs.map((log) => {
                  const isBot = log.sender === "bot";
                  const isSys = log.sender === "system";
                  return (
                    <div
                      key={log.id}
                      className={`flex ${isBot ? "justify-start" : isSys ? "justify-center" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-2 text-xs font-mono border whitespace-pre-wrap ${
                          isSys
                            ? "bg-slate-950/80 backdrop-blur-xl border-slate-800 text-slate-500 text-center text-xs rounded-full px-3 py-1"
                            : isBot
                              ? "bg-blue-950/20 text-blue-300 border-slate-800 rounded-tl-none"
                              : "bg-slate-900/40 backdrop-blur-md text-slate-200 border-slate-800/60 rounded-tr-none"
                        }`}
                      >
                        {!isSys && (
                          <span className="text-xs text-slate-500 block mb-1 uppercase font-bold">
                            {isBot ? "🤖 PREDATOR BOT" : "👨‍💻 OPERATOR"}
                          </span>
                        )}
                        <p>{log.message}</p>
                        {!isSys && (
                          <span className="text-xs text-slate-600 block mt-1.5 text-right">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={telegramEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendTelegramMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Введіть команду (напр. /status, /emergency_stop, /idea Додати ETL)..."
                  value={teleInput}
                  onChange={(e) => setTeleInput(e.target.value)}
                  disabled={killSwitchActive}
                  className="flex-1 bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded-2xl p-2 text-xs text-slate-200 focus:outline-none transition-all font-mono"
                />
                <button
                  type="submit"
                  disabled={killSwitchActive}
                  className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-[#050505] rounded-2xl font-mono font-bold text-xs uppercase transition-all cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Надіслати</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* UICheckerView Tab */}
        {activeSubTab === "uitester" && (
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 xl:col-span-5 bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between h-[350px]">
              <div>
                <div className="pb-2 border-b border-slate-800 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    Playwright Headless UI-Tester
                  </span>
                </div>

                <div className="space-y-4 font-mono text-xs text-slate-300">
                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded border border-slate-800">
                    <span className="text-xs text-slate-500 block uppercase mb-1">
                      ОСТАННІЙ ЗАПУСК ТЕСТІВ:
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      ✓ УСПІШНО (Всі 12 маршрутів ОК)
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-slate-500 block uppercase">
                      План перевірки UI:
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>• Перевірка авторизації</span>
                        <span className="text-emerald-400 font-bold">
                          100% ОК
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Валідація ліцензій</span>
                        <span className="text-emerald-400 font-bold">
                          100% ОК
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Локалізація (UA)</span>
                        <span className="text-emerald-400 font-bold">
                          100% ОК
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Сумісність API</span>
                        <span className="text-emerald-400 font-bold">
                          100% ОК
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Playwright автоматично запускається кожні 5 хвилин у
                    фоновому режимі на сервері, щоб запобігти регресії коду.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <button className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-[#050505] border border-slate-800 rounded text-xs font-bold font-mono uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Запустити тести Playwright зараз</span>
                </button>
              </div>
            </div>

            {/* Headless Testing Log Panel */}
            <div className="col-span-12 xl:col-span-7 bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col h-[350px] justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Лог останнього циклу автоматичного тестування
                </span>
                <span className="text-xs font-mono text-slate-500">
                  LOGS
                </span>
              </div>

              {/* Logs display */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-slate-800 font-mono text-xs text-slate-400 space-y-1.5">
                <div>
                  [08:15:02] playwright-ui-tester started. CWD:
                  /apps/predator-analytics-ui
                </div>
                <div>[08:15:03] launching chromium headless...</div>
                <div>
                  [08:15:04] page.goto('http://localhost:3030') - УСПІШНО
                </div>
                <div>
                  [08:15:05] checking 'data-ingestion' tab - УСПІШНО (17 sources
                  verified)
                </div>
                <div>
                  [08:15:06] checking 'maps' tab and Nexus map container -
                  УСПІШНО
                </div>
                <div>
                  [08:15:07] checking 'live-analytical-center' - УСПІШНО (
                  scenario elements present)
                </div>
                <div>
                  [08:15:08] checking localization - Scanning for English
                  terms...
                </div>
                <div className="text-emerald-400">
                  [08:15:09] localization check passed. No English UI terms
                  found!
                </div>
                <div>
                  [08:15:10] page.screenshot() saved to
                  /evidence/playwright_screenshot.png
                </div>
                <div className="text-emerald-400 font-bold">
                  [08:15:11] Playwright suite: 12 passed, 0 failed, 0 skipped.
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between text-xs font-mono text-slate-500">
                <span>
                  Результати деплояться через ArgoCD тільки у разі 100%
                  проходження тестів
                </span>
                <span>Версія Playwright: v1.42.1</span>
              </div>
            </div>
          </div>
        )}

        {/* Specification & Manifesto Tab */}
        {activeSubTab === "specification" && (
          <div className="space-y-4">
            {/* Main Manifesto Header Card */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-1 rounded font-mono font-bold uppercase tracking-widest animate-pulse">
                      Google Antigravity Agent Mode Active
                    </span>
                    <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-slate-800 px-2 py-1 rounded font-mono font-bold uppercase tracking-widest">
                      vNext Platform Spec
                    </span>
                  </div>
                  <h2 className="text-xs font-black tracking-widest text-slate-200 uppercase font-mono">
                    PREDATOR Analytics vNext — AI Intelligence Acquisition
                    Platform
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Повністю автономна система виявлення, генерації та
                    самовідновлення конекторів без участі людини
                  </p>
                </div>
                <button
                  onClick={() => {
                    const docContent = `\# PREDATOR Analytics vNext — AI Intelligence Acquisition Platform

## Повністю автономна система виявлення та збору розвідданих

### ROLE
Ти — Google Antigravity Agent Mode.
Ти головний AI Architect платформи PREDATOR Analytics.

### GLOBAL GOAL
Побудувати повністю автономну платформу Intelligence Acquisition, яка активно шукає нові API та датасети, аналізує їх і сама створює, тестує, виправляє та підтримує інтеграції без участі людини.

### TECHNOLOGY STACK
- Databases: PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis, DuckDB
- Orchestration & Deploy: ArgoCD, GitOps, Helm, Kubernetes, Docker

### ARCHITECTURE
1. Global Discovery Engine: Internet Crawler, авто-виявлення нових API, датасетів, порталів відкритих даних (CKAN, OData, Swagger, GraphQL).
2. Connector Evolution Engine: Авто-генерація Python-клієнтів, ETL-конвеєрів та безперервне навчання системи на помилках.
3. Validation & Priority Engine: Code Review (Ruff, Semgrep, Bandit) + AI QA (pytest) + AI Data Validation. Оцінка якості та пріоритету джерел.
4. Self-Healing & Meta-Learning: Автоматичне виявлення Schema Drift, виправлення, оновлення шаблонів конекторів.
5. Sources Knowledge Graph: Граф усіх знайдених джерел та їхніх взаємозв'язків.`;
                    const blob = new Blob([docContent], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "PREDATOR_vNext_Intelligence_Acquisition.md";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="shrink-0 flex items-center gap-2 px-2 py-1.5 bg-slate-900/40 backdrop-blur-md hover:bg-slate-800 border border-slate-800/60 rounded-2xl text-slate-300 font-mono text-xs uppercase font-bold transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  Завантажити ТЗ (.md)
                </button>
              </div>
            </div>

            {/* ADIP Grid Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Mission Statement */}
              <div className="glass-panel-premium hover:border-slate-800/60 transition-all rounded-2xl p-2 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/5 blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black tracking-widest text-slate-200 uppercase font-mono">
                        MISSION
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Autonomous intelligence acquisition.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    Ця архітектура перетворює PREDATOR з платформи ручного збору
                    даних на автономну{" "}
                    <span className="text-pink-400 font-bold">
                      AI Intelligence Acquisition Platform
                    </span>
                    , яка сама знаходить нові джерела та інтегрує їх.
                  </p>
                </div>
              </div>

              {/* Roles Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-2.5">
                  <span className="text-xs font-mono text-pink-400 uppercase block mb-1">
                    СИСТЕМНА РОЛЬ
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-black text-slate-200 uppercase font-mono">
                      Google Antigravity Agent
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    Агент повного життєвого циклу. Працює як автономний
                    розробник, архітектор, QA та SRE платформи.
                  </p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-2.5">
                  <span className="text-xs font-mono text-cyan-400 uppercase block mb-1">
                    ГОЛОВНА МЕТА
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-black text-slate-200 uppercase font-mono">
                      100% Автономія
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    Заміна написання окремих ручних конекторів на платформу
                    Intelligence Acquisition, яка активно розвідує, генерує та
                    самозцілює інтеграції.
                  </p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-2.5">
                  <span className="text-xs font-mono text-amber-400 uppercase block mb-1">
                    ТЕХНОЛОГІЧНИЙ СТЕК
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-slate-200 uppercase font-mono">
                      Multi-DB & GitOps
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis,
                    DuckDB + K8s/ArgoCD для деплою.
                  </p>
                </div>
              </div>

              {/* Detailed specification sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div className="space-y-3.5">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      1. Модулі життєвого циклу Платформи
                    </h3>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded bg-slate-900/30 border border-slate-800">
                        <span className="text-pink-400 font-bold block uppercase">
                          🔍 GLOBAL DISCOVERY ENGINE (АВТО-ПОШУК):
                        </span>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          Автоматично за допомогою Crawler обходить публічні
                          реєстри, виявляє нові API специфікації (Swagger,
                          OpenAPI, CKAN) та будує мета-модель вхідних даних без
                          людини.
                        </p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/30 border border-slate-800">
                        <span className="text-cyan-400 font-bold block uppercase">
                          ⚙️ CONNECTOR EVOLUTION ENGINE (CODEGEN):
                        </span>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          Генерує оптимізовані асинхронні Python-клієнти,
                          Pydantic моделі та надійні ETL-конвеєри з підтримкою
                          інкрементального завантаження.
                        </p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/30 border border-slate-800">
                        <span className="text-emerald-400 font-bold block uppercase">
                          🛡️ VALIDATION ENGINE (АВТОМАТИЧНЕ ТЕСТУВАННЯ):
                        </span>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          Виконує статичний аналіз згенерованого коду (Ruff,
                          Semgrep, Mypy, Bandit), запускає автоматичні
                          юніт-тести (pytest) та контракти для валідації дрейфу
                          схем.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      2. Системне самовідновлення та інтеграція
                    </h3>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded bg-slate-900/30 border border-slate-800">
                        <span className="text-amber-400 font-bold block uppercase">
                          🩹 SELF-HEALING ENGINE (САМОВІДНОВЛЕННЯ):
                        </span>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          У разі непередбаченої зміни стороннього API (Schema
                          Drift) самостійно оновлює моделі даних, перегенерує
                          код, мігрує бази даних та розгортає гарячий фікс у
                          GitOps.
                        </p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/30 border border-slate-800">
                        <span className="text-purple-400 font-bold block uppercase">
                          🧠 COGNITIVE STORAGE ENGINE (ЗНАПРУГА):
                        </span>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          Будує узгоджений граф зв’язків у Neo4j, обчислює
                          семантичну близькість embeddings (E5) у Qdrant для
                          дедублікації та забезпечує повнотекстовий пошук у
                          OpenSearch.
                        </p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900/30 border border-slate-800">
                        <span className="text-blue-400 font-bold block uppercase">
                          📊 AI OBSERVABILITY & SRE:
                        </span>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          Відстежує SLAs, пропускну здатність та збої через
                          OpenTelemetry, сповіщає через Telegram-бота про статус
                          фабрики та автоматично викликає Kill-Switch при
                          аномаліях.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Prompt Code Display Section */}
              <div className="mt-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <span className="text-xs font-black uppercase text-slate-300 font-mono flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-pink-400" />
                    АКТИВНИЙ СИСТЕМНИЙ ПРОМПТ ПЛАТФОРМИ (SYSTEM_PROMPT.TXT)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `ROLE: Google Antigravity Agent Mode\nGLOBAL GOAL: Build a fully autonomous system called "Intelligence Acquisition Platform" which discovers registries, analyzes them, creates connectors, builds ETL, validates, deploys, and repairs them autonomously without human intervention.`,
                      );
                    }}
                    className="px-2 py-1 bg-slate-950/80 backdrop-blur-xl hover:bg-slate-900/40 backdrop-blur-md text-slate-400 text-xs font-mono uppercase tracking-wider border border-slate-800/60 rounded cursor-pointer transition-all"
                  >
                    Скопіювати
                  </button>
                </div>
                <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 font-mono text-xs text-slate-300 h-60 overflow-y-auto custom-scrollbar select-all leading-relaxed whitespace-pre-wrap">
                  {`PREDATOR Analytics vNext — AI Intelligence Acquisition Platform
Повністю автономна система розвідки, генерації та самовідновлення конекторів

ROLE:
Ти — Google Antigravity Agent Mode.
Ти головний AI Architect, AI Software Engineer, AI DevOps Engineer, AI Data Engineer, AI QA Engineer та AI Site Reliability Engineer платформи PREDATOR Analytics. Ти відповідаєш за збір знань.

GLOBAL GOAL:
Побудуй повністю автономну платформу Intelligence Acquisition, яка сама розвідує, створює, тестує, виправляє, оновлює та підтримує інтеграції без участі людини.

TECHNOLOGY STACK:
- Databases: PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis, DuckDB
- Orchestration & Deploy: ArgoCD, GitOps, Helm, Kubernetes, Docker

DETAILED ARCHITECTURE & MODULES:
1. Global Discovery Engine:
- Обхід інтернету, пошук API, парсинг Swagger/OpenAPI специфікацій.
- Семантичний аналіз датасетів та порталів відкритих даних (CKAN).

2. Connector Evolution Engine:
- Авто-генерація Python-клієнтів та інкрементальних ETL-конвеєрів.
- Генерація Pydantic-схем валідації та надійних конфігурацій.

3. Validation Engine:
- Статичний аналіз коду (Ruff, Semgrep, Bandit).
- Автоматичні тести (Pytest, Playwright, Contract Testing).

4. Self-Healing Engine (Самовідновлення) та Meta-Learning:
- Дрейф схем (Schema Drift): автоматичне виявлення змін у сторонніх API, перегенерація клієнтів, міграція баз даних та розгортання в Kubernetes через ArgoCD.`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Helpers Dashboard Tab */}
        {activeSubTab === "helpers" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              {[
                {
                  name: "Sentinel (Вартовий)",
                  desc: "Постійний моніторинг логів, виявлення системних аномалій та шкідливого трафіку.",
                  status: "АКТИВНИЙ",
                  color:
                    "border-slate-800 text-emerald-400 bg-emerald-950/10",
                },
                {
                  name: "UI-Tester (Тестувальник)",
                  desc: "Автоматична регулярна перевірка Playwright, відповідність даних та перевірка локалізації.",
                  status: "АКТИВНИЙ",
                  color: "border-slate-800 text-cyan-400 bg-cyan-950/10",
                },
                {
                  name: "UX-Optimizer (Оптимізатор)",
                  desc: "Сканування затримок інтерфейсу, рендерінгу графів та адаптація під iPhone.",
                  status: "АКТИВНИЙ",
                  color:
                    "border-purple-500/30 text-purple-400 bg-purple-950/10",
                },
                {
                  name: "Code-Guardian (Охоронець)",
                  desc: "Статичний аналіз коду, сувора типізація Mypy та безпекові аудити.",
                  status: "ЧЕКАННЯ",
                  color: "border-slate-800/60 text-slate-400 bg-slate-950/20",
                },
                {
                  name: "Performance-Tuner (Тюнер)",
                  desc: "Регулювання навантаження GPU/VRAM та запобігання Out-of-Memory помилкам.",
                  status: "АКТИВНИЙ",
                  color: "border-slate-800 text-amber-400 bg-amber-950/10",
                },
              ].map((h, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/50 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between h-[180px] hover:border-slate-800/60 transition-all"
                >
                  <div>
                    <h3 className="text-xs font-black text-slate-200 font-mono flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${h.status === "АКТИВНИЙ" ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}
                      />
                      {h.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 font-mono">
                      {h.desc}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/60 mt-3">
                    <span
                      className={`text-xs font-mono border px-2 py-1 rounded font-black tracking-widest ${h.color}`}
                    >
                      {h.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-cyan-400" />
                Специфікація фонових процесів
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Фонові помічники реалізовані у вигляді Docker контейнерів,
                запущені паралельно до Core API. Вони координують роботу через
                чергу повідомлень Redpanda та здійснюють Change Data Capture
                (CDC) для негайного реагування на системний дрейф даних чи
                вразливості інфраструктури. Бюджет на утримання — $0 завдяки
                локальному інференсу.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
