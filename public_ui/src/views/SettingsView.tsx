
import React, { useMemo, useState } from "react";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { ViewHeader } from "../components/ViewHeader";
import { TacticalCard } from "../components/TacticalCard";
import {
  Settings, Server, Globe, Database, Cpu, Activity,
  CreditCard, ShieldCheck, Save, RotateCcw, Copy,
  BrainCircuit, Terminal, Sparkles, Zap
} from "lucide-react";
import { HoloContainer } from "../components/HoloContainer";
import { CyberGrid } from "../components/CyberGrid";
import { motion, AnimatePresence } from "framer-motion";

type EnvKey = "predator-mac" | "predator-nvidia" | "predator-oracle";

type FeatureToggleKey =
  | "metrics"
  | "telemetry"
  | "rateLimit"
  | "billing"
  | "brainTrainer"
  | "quantumAudit"
  | "cliStack";

interface FeatureToggle {
  key: FeatureToggleKey;
  label: string;
  description: string;
}

const FEATURE_TOGGLES: FeatureToggle[] = [
  {
    key: "metrics",
    label: "Метрики (Prometheus / ServiceMonitor)",
    description: "Експорт Prometheus-метрик для глибокого моніторингу сервісів.",
  },
  {
    key: "telemetry",
    label: "Телеметрія (OTEL трейси)",
    description: "Контроль OpenTelemetry-трейсів та OTLP експорту даних.",
  },
  {
    key: "rateLimit",
    label: "Обмеження Швидкості (Rate Limiting)",
    description: "Інтелектуальні ліміти RPS через Redis для захисту API.",
  },
  {
    key: "billing",
    label: "Білінг / Аудит Використання",
    description: "Збір та аналіз подій використання ресурсів для фінансового обліку.",
  },
  {
    key: "brainTrainer",
    label: "Тренування Мозку (CronJob)",
    description: "Автоматичний цикл донавчання моделей на основі нових даних.",
  },
  {
    key: "quantumAudit",
    label: "Квантовий Аудит (V25 Active)",
    description: "Безперервний контроль цілісності та безпеки золотого шару.",
  },
  {
    key: "cliStack",
    label: "TOP CLI Stack (Gemini/Mistral)",
    description: "Інтеграція стратегічних агентів Planner та Codegen.",
  },
];

interface EnvConfig {
  name: string;
  description: string;
  toggles: Record<FeatureToggleKey, boolean>;
  brainTrainerSchedule: string;
}

type EnvConfigState = Record<EnvKey, EnvConfig>;

const INITIAL_ENV_CONFIG: EnvConfigState = {
  "predator-mac": {
    name: "Mac Dev (Локальний)",
    description:
      "Локальне середовище розробки на MacBook: мінімальні ліміти, вимкнений OTEL/brain-trainer.",
    toggles: {
      metrics: true,
      telemetry: false,
      rateLimit: false,
      billing: false,
      brainTrainer: false,
      quantumAudit: false,
      cliStack: true,
    },
    brainTrainerSchedule: "0 3 * * *",
  },
  "predator-nvidia": {
    name: "NVIDIA Lab (GPU Сервер)",
    description:
      "Lab-середовище на NVIDIA 1080: увімкнені метрики, rate limiting, billing, OTEL, self-learning.",
    toggles: {
      metrics: true,
      telemetry: true,
      rateLimit: true,
      billing: true,
      brainTrainer: true,
      quantumAudit: true,
      cliStack: true,
    },
    brainTrainerSchedule: "0 2 * * *",
  },
  "predator-oracle": {
    name: "Oracle (Продакшн)",
    description:
      "Prod-подібне середовище: все увімкнено, консервативний графік CronJob.",
    toggles: {
      metrics: true,
      telemetry: true,
      rateLimit: true,
      billing: true,
      brainTrainer: true,
      quantumAudit: true,
      cliStack: true,
    },
    brainTrainerSchedule: "0 1 * * *",
  },
};

const SettingsView: React.FC = () => {
  const [selectedEnv, setSelectedEnv] = useState<EnvKey>("predator-mac");
  const [envConfig, setEnvConfig] = useState<EnvConfigState>(
    INITIAL_ENV_CONFIG
  );
  const toast = useToast();

  // Load config from backend on mount
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await api.getConfig();
        if (savedConfig && Object.keys(savedConfig).length > 0) {
            setEnvConfig(prev => ({ ...prev, ...savedConfig }));
            toast.info("Завантажено", "Конфігурацію відновлено з сервера.");
        }
      } catch (err) {
        console.error("Failed to load config:", err);
      }
    };
    loadConfig();
  }, [toast]);

  const currentEnv = useMemo(
    () => envConfig[selectedEnv],
    [envConfig, selectedEnv]
  );

  const handleToggleChange = (key: FeatureToggleKey) => {
    setEnvConfig((prev) => ({
      ...prev,
      [selectedEnv]: {
        ...prev[selectedEnv],
        toggles: {
          ...prev[selectedEnv].toggles,
          [key]: !prev[selectedEnv].toggles[key],
        },
      },
    }));
  };

  const handleScheduleChange = (value: string) => {
    setEnvConfig((prev) => ({
      ...prev,
      [selectedEnv]: {
        ...prev[selectedEnv],
        brainTrainerSchedule: value,
      },
    }));
  };

  const handleResetEnv = () => {
    setEnvConfig((prev) => ({
      ...prev,
      [selectedEnv]: INITIAL_ENV_CONFIG[selectedEnv],
    }));
    toast.info("Скинуто", `Налаштування для ${selectedEnv} повернуто до початкових.`);
  };

  const handleSave = async () => {
    try {
      await api.saveConfig(envConfig);
      toast.success("Збережено", "Налаштування конфігурації оновлено успішно.");
    } catch (e) {
      console.error(e);
      toast.error("Помилка", "Не вдалося зберегти налаштування.");
    }
  };

  const handleGenerateYamlPreview = () => {
    const cfg = currentEnv;
    const yamlParams = [
      `# Оточення: ${selectedEnv}`,
      `- name: predator-brain.metrics.enabled`,
      `  value: "${cfg.toggles.metrics ? "true" : "false"}"`,
      `- name: ua-sources.metrics.enabled`,
      `  value: "${cfg.toggles.metrics ? "true" : "false"}"`,
      `- name: predator-brain.telemetry.enabled`,
      `  value: "${cfg.toggles.telemetry ? "true" : "false"}"`,
      `- name: ua-sources.telemetry.enabled`,
      `  value: "${cfg.toggles.telemetry ? "true" : "false"}"`,
      `- name: predator-brain.rateLimit.enabled`,
      `  value: "${cfg.toggles.rateLimit ? "true" : "false"}"`,
      `- name: ua-sources.rateLimit.enabled`,
      `  value: "${cfg.toggles.rateLimit ? "true" : "false"}"`,
      `- name: predator-brain.billing.enabled`,
      `  value: "${cfg.toggles.billing ? "true" : "false"}"`,
      `- name: ua-sources.billing.enabled`,
      `  value: "${cfg.toggles.billing ? "true" : "false"}"`,
      `- name: brain-trainer.enabled`,
      `  value: "${cfg.toggles.brainTrainer ? "true" : "false"}"`,
      `- name: brain-trainer.schedule`,
      `  value: "${cfg.brainTrainerSchedule}"`,
    ].join("\n");

    navigator.clipboard
      .writeText(yamlParams)
      .then(() => toast.info("Скопійовано", "YAML параметри скопійовано в буфер обміну."))
      .catch(() => toast.error("Помилка", "Не вдалося скопіювати YAML у буфер."));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24 w-full max-w-[1600px] mx-auto relative z-10"
    >
      <CyberGrid />
      <ViewHeader
          title="КОНФІГУРАЦІЯ КЛАСТЕРА (V25.0)"
          icon={<Settings size={20} className="icon-3d-blue" />}
          breadcrumbs={['СИНАПСИС', 'СИСТЕМА', 'КОНФІГУРАЦІЯ']}
          stats={[
              { label: 'Середовище', value: currentEnv.name.toUpperCase(), icon: <Server size={14} className="icon-3d-blue"/>, color: 'primary' },
              { label: 'Стандарт', value: 'V25 GOLD', icon: <Database size={14} className="icon-3d-amber"/>, color: 'success' },
              { label: 'Статус', value: 'СИНХРОННО', icon: <Globe size={14} className="icon-3d-green"/>, color: 'success' },
          ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        <HoloContainer  className="lg:col-span-3 h-fit p-6 glass-morphism">
            {/* Sidebar: Env selector */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={14} /> Середовища
                </h3>
            <div className="space-y-2">
            {(
              Object.keys(envConfig) as Array<EnvKey>
            ).map((envKey: EnvKey) => {
              const env = envConfig[envKey];
              const active = envKey === selectedEnv;
              return (
                <motion.button
                  key={envKey}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedEnv(envKey)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all duration-300 btn-3d
                    ${active
                      ? "border-sky-500 bg-sky-500/10 text-sky-100 shadow-[0_0_20px_rgba(14,165,233,0.2)]"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }
                  `}
                >
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Server size={14} className={active ? "text-sky-400" : "text-slate-500"} />
                    {env.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1 pl-6">
                    {envKey}
                  </div>
                </motion.button>
              );
            })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                onClick={handleResetEnv}
                className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg border border-rose-900/50 text-rose-400 hover:bg-rose-900/10 transition-colors btn-3d"
                >
                <RotateCcw size={12} />
                Скинути до початкових
                </button>
            </div>
          </div>
        </HoloContainer>

        {/* Main content */}
        <div className="lg:col-span-9 space-y-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedEnv}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                >
                    <HoloContainer  className="p-6 glass-morphism">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <Terminal size={22} className="text-blue-400" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Налаштування Середовища</h3>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGenerateYamlPreview}
                                    className="flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-slate-400 hover:bg-white/5 transition-all"
                                >
                                    <Copy size={16} />
                                    YAML Код
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                >
                                    <Save size={16} />
                                    Зберегти Зміни
                                </button>
                            </div>
                        </div>

                                    {/* Feature toggles */}
                        <TacticalCard variant="holographic" title={`Функції (${currentEnv.name})`} className="mb-6 border-slate-700/30">
                            <div className="mb-4 p-4 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-3">
                                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <p>{currentEnv.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {FEATURE_TOGGLES.map((feature, idx) => {
                                const enabled = currentEnv.toggles[feature.key];
                                return (
                                <motion.div
                                    key={feature.key}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleToggleChange(feature.key)}
                                    className={`
                                        cursor-pointer group flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 relative overflow-hidden
                                        ${enabled
                                            ? "bg-slate-900/60 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                            : "bg-slate-950/30 border-slate-800 hover:border-slate-700"}
                                    `}
                                >
                                    {enabled && (
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    )}

                                    <div className={`p-2.5 rounded-lg mt-0.5 transition-colors ${enabled ? "bg-emerald-500/20 text-emerald-400 scale-110" : "bg-slate-900 text-slate-600"}`}>
                                        {feature.key === 'metrics' ? <Activity size={18} /> :
                                        feature.key === 'telemetry' ? <Globe size={18} /> :
                                        feature.key === 'rateLimit' ? <ShieldCheck size={18} /> :
                                        feature.key === 'billing' ? <CreditCard size={18} /> : <Cpu size={18} />}
                                    </div>

                                    <div className="flex-1">
                                    <div className={`text-sm font-bold transition-colors ${enabled ? "text-emerald-100" : "text-slate-400 group-hover:text-slate-200"}`}>
                                        {feature.label}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                        {feature.description}
                                    </div>
                                    </div>

                                    <div className={`w-10 h-5 rounded-full relative transition-colors mt-1 ${enabled ? "bg-emerald-500" : "bg-slate-700"}`}>
                                        <motion.div
                                            animate={{ x: enabled ? 20 : 0 }}
                                            className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                        />
                                    </div>
                                </motion.div>
                                );
                            })}
                            </div>
                        </TacticalCard>

                        {/* CLI API KEYS */}
                        <TacticalCard variant="holographic"  title="API Ключі (Mixed TOP CLI Stack)" className="panel-3d bg-slate-900/40 border-slate-800/50">
                            <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                                <ShieldCheck size={14} className="text-blue-400" />
                                <p className="text-[11px] text-slate-400">
                                    Ключі використовуються для роботи Planner (Gemini) та Codegen (Mistral Vibe). Дані зберігаються зашифрованими.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2 group">
                                <div className="flex justify-between items-center text-[10px] font-bold text-blue-400 uppercase tracking-widest group-hover:text-blue-300 transition-colors">
                                    <span>API Ключ Gemini</span>
                                    <div className="flex gap-1 text-[8px] border border-blue-500/30 px-1 rounded animate-pulse">ЗАШИФРОВАНО</div>
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-800 group-hover:border-slate-700"
                                    placeholder="••••••••••••••••••••••••••••"
                                />
                                </div>

                                <div className="space-y-2 group">
                                <div className="flex justify-between items-center text-[10px] font-bold text-orange-400 uppercase tracking-widest group-hover:text-orange-300 transition-colors">
                                    <span>API Ключ Mistral</span>
                                    <div className="flex gap-1 text-[8px] border border-orange-500/30 px-1 rounded animate-pulse">ЗАШИФРОВАНО</div>
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-orange-100 focus:border-orange-500 focus:outline-none transition-all placeholder:text-slate-800 group-hover:border-slate-700"
                                    placeholder="••••••••••••••••••••••••••••"
                                />
                                </div>
                            </div>
                            </div>
                        </TacticalCard>

                        {/* Brain-trainer schedule */}
                        <TacticalCard variant="holographic"  title="Тренування Мозку (Cron Розклад)" className="panel-3d border-slate-800/50">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl icon-3d-purple self-center md:self-start">
                                    <BrainCircuit size={32} className="text-purple-400" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                    CRON-розклад для сервісу <code className="text-purple-300 bg-purple-900/20 px-1 rounded">brain-trainer</code>. Експортує датасети з <code className="text-purple-300 bg-purple-900/20 px-1 rounded">brain_training_samples</code>. Активно тільки якщо опція увімкнена.
                                    </p>

                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="relative flex-1 w-full max-w-sm">
                                            <input
                                                type="text"
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-sm text-purple-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                                value={currentEnv.brainTrainerSchedule}
                                                onChange={(e) => handleScheduleChange(e.target.value)}
                                                placeholder="0 3 * * *"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">UTC</div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 italic">
                                            Поточний: <code className="text-slate-300 font-bold not-italic font-mono">{currentEnv.brainTrainerSchedule}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TacticalCard>

                        {/* Preview of JSON config for this env */}
                        <TacticalCard variant="holographic" title="Конфігурація JSON" className="opacity-60 hover:opacity-100 transition-opacity" noPadding>
                            <pre className="text-[10px] leading-relaxed bg-[#050a14]/80 p-6 text-emerald-500/80 font-mono overflow-auto max-h-48">
                                {JSON.stringify(currentEnv, null, 2)}
                            </pre>
                        </TacticalCard>
                    </HoloContainer>
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsView;
