
import React, { useMemo, useState } from "react";
import { useToast } from "../context/ToastContext";

type EnvKey = "predator-mac" | "predator-nvidia" | "predator-oracle";

type FeatureToggleKey =
  | "metrics"
  | "telemetry"
  | "rateLimit"
  | "billing"
  | "brainTrainer";

interface FeatureToggle {
  key: FeatureToggleKey;
  label: string;
  description: string;
}

const FEATURE_TOGGLES: FeatureToggle[] = [
  {
    key: "metrics",
    label: "Metrics (Prometheus / ServiceMonitor)",
    description: "Увімкнути / вимкнути експорт Prometheus-метрик для сервісів.",
  },
  {
    key: "telemetry",
    label: "Telemetry (OTEL traces)",
    description:
      "Контроль OpenTelemetry-трейсів (OTEL_EXPORTER_OTLP_ENDPOINT, sampler тощо).",
  },
  {
    key: "rateLimit",
    label: "Rate Limiting",
    description:
      "Ліміти RPS/хвилину через Redis + логічний rate limiting у сервісах.",
  },
  {
    key: "billing",
    label: "Billing / Usage Audit",
    description:
      "Збір api_usage_events в PostgreSQL для білінгу та аудиту використання.",
  },
  {
    key: "brainTrainer",
    label: "Brain Trainer (Self-Learning CronJob)",
    description:
      "CronJob, який експортує тренувальні датасети з brain_training_samples.",
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
    name: "Mac Dev (локальний)",
    description:
      "Локальне середовище розробки на MacBook: мінімальні ліміти, вимкнений OTEL/brain-trainer.",
    toggles: {
      metrics: true,
      telemetry: false,
      rateLimit: false,
      billing: false,
      brainTrainer: false,
    },
    brainTrainerSchedule: "0 3 * * *", // не має значення, brainTrainer=false
  },
  "predator-nvidia": {
    name: "NVIDIA Lab (GPU сервер)",
    description:
      "Lab-середовище на NVIDIA 1080: увімкнені метрики, rate limiting, billing, OTEL, self-learning.",
    toggles: {
      metrics: true,
      telemetry: true,
      rateLimit: true,
      billing: true,
      brainTrainer: true,
    },
    brainTrainerSchedule: "0 2 * * *", // наприклад, щодня о 02:00
  },
  "predator-oracle": {
    name: "Oracle / Prod-like",
    description:
      "Prod-подібне середовище: все увімкнено, більш консервативний графік CronJob.",
    toggles: {
      metrics: true,
      telemetry: true,
      rateLimit: true,
      billing: true,
      brainTrainer: true,
    },
    brainTrainerSchedule: "0 1 * * *", // наприклад, щодня о 01:00
  },
};

const SettingsView: React.FC = () => {
  const [selectedEnv, setSelectedEnv] = useState<EnvKey>("predator-mac");
  const [envConfig, setEnvConfig] = useState<EnvConfigState>(
    INITIAL_ENV_CONFIG
  );
  const toast = useToast();

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

  const handleSave = () => {
    console.log("Save env config", envConfig);
    toast.success("Збережено", "Налаштування конфігурації оновлено успішно.");
  };

  const handleGenerateYamlPreview = () => {
    const cfg = currentEnv;
    const yamlParams = [
      `# Env: ${selectedEnv}`,
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
    <div className="h-full w-full px-6 py-4 flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Predator Settings
          </h1>
          <p className="text-sm text-slate-400">
            Керуєш фічами для середовищ: Dev (Mac), Lab (NVIDIA), Prod-like
            (Oracle). Це адміністративний шар над Helm + ArgoCD.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateYamlPreview}
            className="px-3 py-2 rounded-md text-xs font-medium border border-sky-500 text-sky-300 hover:bg-sky-900/40 transition btn-3d"
          >
            Згенерувати YAML parameters
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-xs font-semibold bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition btn-3d"
          >
            Зберегти налаштування
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 flex-1">
        {/* Sidebar: Env selector */}
        <aside className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 flex flex-col gap-3 panel-3d">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Середовища
          </h2>
          <div className="flex flex-col gap-2">
            {(
              Object.keys(envConfig) as Array<EnvKey>
            ).map((envKey: EnvKey) => {
              const env = envConfig[envKey];
              const active = envKey === selectedEnv;
              return (
                <button
                  key={envKey}
                  onClick={() => setSelectedEnv(envKey)}
                  className={[
                    "text-left px-3 py-2 rounded-lg border text-sm transition",
                    active
                      ? "border-sky-500 bg-sky-500/10 text-sky-100"
                      : "border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800/60",
                  ].join(" ")}
                >
                  <div className="font-medium">{env.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {envKey}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3">
            <button
              onClick={handleResetEnv}
              className="w-full text-xs px-3 py-2 rounded-lg border border-rose-500/80 text-rose-300 hover:bg-rose-950/50 transition btn-3d"
            >
              Скинути до дефолту
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 flex flex-col gap-4 overflow-auto panel-3d">
          {/* Env summary */}
          <section className="border border-slate-700/80 rounded-lg p-3 bg-slate-950/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  {currentEnv.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {currentEnv.description}
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] bg-slate-800 text-slate-200">
                {selectedEnv}
              </span>
            </div>
          </section>

          {/* Feature toggles */}
          <section className="border border-slate-700/80 rounded-lg p-3 bg-slate-950/60">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Фічі стека
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FEATURE_TOGGLES.map((feature) => {
                const enabled = currentEnv.toggles[feature.key];
                return (
                  <div
                    key={feature.key}
                    className="flex items-start justify-between gap-3 border border-slate-700 rounded-lg px-3 py-2 bg-slate-900/80"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-100">
                        {feature.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {feature.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleChange(feature.key)}
                      className={[
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                        enabled ? "bg-emerald-500" : "bg-slate-600",
                      ].join(" ")}
                      aria-pressed={enabled}
                    >
                      <span
                        className={[
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-900 shadow ring-0 transition duration-200",
                          enabled ? "translate-x-5" : "translate-x-0",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Brain-trainer schedule */}
          <section className="border border-slate-700/80 rounded-lg p-3 bg-slate-950/60">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Brain Trainer — Cron Schedule
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              CRON-розклад для підчарту <code>brain-trainer</code>, який
              експортує датасети з таблиці{" "}
              <code>brain_training_samples</code>. Застосовується тільки якщо
              опція <b>Brain Trainer</b> увімкнена для цього середовища.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <input
                type="text"
                className="w-full sm:w-64 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={currentEnv.brainTrainerSchedule}
                onChange={(e) => handleScheduleChange(e.target.value)}
                placeholder="0 3 * * *"
              />
              <span className="text-[11px] text-slate-500">
                Напр.: <code>0 3 * * *</code> — щодня о 03:00 (UTC/кластерний
                час).
              </span>
            </div>
          </section>

          {/* Preview of JSON config for this env */}
          <section className="border border-slate-700/80 rounded-lg p-3 bg-slate-950/60">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              JSON Preview (internal state)
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Це внутрішнє представлення конфігурації для обраного середовища.
              На бекенді воно транслюється у Helm values та ArgoCD parameters.
            </p>
            <pre className="text-[11px] leading-relaxed bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-200 overflow-auto max-h-64 custom-scrollbar">
{JSON.stringify(currentEnv, null, 2)}
            </pre>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SettingsView;
    