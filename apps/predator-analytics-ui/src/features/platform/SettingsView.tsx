
import React, { useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { api } from "@/services/api";
import { ViewHeader } from "@/components/ViewHeader";
import { TacticalCard } from "@/components/ui/TacticalCard";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/useAppStore";
import {
  Settings as SettingsIcon, Server, Globe, Database, Save, Copy, Terminal
} from "lucide-react";
import { HoloContainer } from "@/components/HoloContainer";
import { CyberGrid } from "@/components/CyberGrid";
import { motion, AnimatePresence } from "framer-motion";

// Extracted Sub-views
import { EnvSidebar, EnvKey } from "@/components/settings/EnvSidebar";
import { FeatureTogglesGrid, FeatureToggle } from "@/components/settings/FeatureTogglesGrid";
import { ApiKeysConfig } from "@/components/settings/ApiKeysConfig";
import { BrainTrainerConfig } from "@/components/settings/BrainTrainerConfig";

type FeatureToggleKey =
  | "metrics"
  | "telemetry"
  | "rateLimit"
  | "billing"
  | "brainTrainer"
  | "quantumAudit"
  | "cliStack"
  | "autoImprovement";

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
    label: "Квантовий Аудит (V45 Active)",
    description: "Безперервний контроль цілісності та безпеки золотого шару.",
  },
  {
    key: "cliStack",
    label: "TOP CLI Stack (Gemini/Mistral)",
    description: "Інтеграція стратегічних агентів Planner та Codegen.",
  },
  {
    key: "autoImprovement",
    label: "Авто-Покращення (Self-Healing)",
    description: "Автоматичне виправлення помилок та оптимізація коду.",
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
      autoImprovement: false,
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
      autoImprovement: true,
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
      autoImprovement: true,
    },
    brainTrainerSchedule: "0 1 * * *",
  },
};

const SettingsView: React.FC = () => {
  const [selectedEnv, setSelectedEnv] = useState<EnvKey>("predator-mac");
  const [envConfig, setEnvConfig] = useState<EnvConfigState>(
    INITIAL_ENV_CONFIG
  );
  const highVisibility = useAppStore((state) => state.highVisibility);
  const setHighVisibility = useAppStore((state) => state.setHighVisibility);
  const toast = useToast();

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await api.getConfig();
        if (savedConfig && Object.keys(savedConfig).length > 0) {
            setEnvConfig(prev => ({ ...prev, ...savedConfig }));
        }
      } catch (err) {
        console.error("Failed to load config:", err);
      }
    };
    loadConfig();
  }, []);

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
          title="КОНФІГУ� АЦІЯ КЛАСТЕ� А (V45.0)"
          icon={<SettingsIcon size={20} className="icon-3d-blue" />}
          breadcrumbs={['СИНАПСИС', 'СИСТЕМА', 'КОНФІГУ� АЦІЯ']}
          stats={[
              { label: 'Середовище', value: currentEnv.name.toUpperCase(), icon: <Server size={14} className="icon-3d-blue"/>, color: 'primary' },
              { label: 'Стандарт', value: 'V45 GOLD', icon: <Database size={14} className="icon-3d-amber"/>, color: 'success' },
              { label: 'Статус', value: 'СИНХ� ОННО', icon: <Globe size={14} className="icon-3d-green"/>, color: 'success' },
          ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        <EnvSidebar
            envConfig={envConfig}
            selectedEnv={selectedEnv}
            onEnvSelect={setSelectedEnv}
            onResetEnv={handleResetEnv}
        />

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
                    <HoloContainer className="p-6 glass-morphism">
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

                        <TacticalCard
                            variant="glass"
                            title="Видимість інтерфейсу"
                            subtitle="Підсилений контраст, чіткі фокуси та краща читабельність"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-100">Висока видимість</p>
                                    <p className="text-[11px] text-slate-400">
                                        � екомендовано для яскравих екранів, проєкторів та тривалої роботи.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {highVisibility ? "УВІМКНЕНО" : "ВИМКНЕНО"}
                                    </span>
                                    <Switch
                                        checked={highVisibility}
                                        onCheckedChange={setHighVisibility}
                                        aria-label="Висока видимість"
                                    />
                                </div>
                            </div>
                        </TacticalCard>

                        <FeatureTogglesGrid
                            currentEnv={currentEnv}
                            onToggleChange={handleToggleChange}
                            featureToggles={FEATURE_TOGGLES}
                        />

                        <ApiKeysConfig />

                        <BrainTrainerConfig
                            schedule={currentEnv.brainTrainerSchedule}
                            onScheduleChange={handleScheduleChange}
                        />

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
