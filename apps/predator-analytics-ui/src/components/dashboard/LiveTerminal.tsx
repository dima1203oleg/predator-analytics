import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LOG_MESSAGES = [
  "Ініціалізація нейронного ядра...",
  "Синхронізація з віддаленими кластерами [ОК]",
  "Виявлено аномалію в секторі 7-Г",
  "Спроба перехоплення даних... [УСПІШНО]",
  "Аналіз фінансових транзакцій: 1042 пакети",
  "Оновлення матриці ризиків завершено",
  "WARNING: Несанкціонований доступ відхилено (IP: 192.168.0.x)",
  "Калібрування голографічного проектора [ОК]",
  "Завантаження модулів когнітивного аналізу...",
  "Підключення до бази даних PREDATOR... встановлено.",
  "Очікування нових інструкцій оператора...",
];

export default function LiveTerminal() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < LOG_MESSAGES.length) {
        setLogs(prev => [...prev.slice(-4), LOG_MESSAGES[index]]);
        index++;
      } else {
        // Randomly pick a log
        const randomLog = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
        setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString('uk-UA')}] ${randomLog}`]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-cyber-bg/80 border border-cyber-border/30 rounded p-3 font-mono text-[10px] sm:text-xs h-32 overflow-hidden flex flex-col justify-end">
      {logs.map((log, i) => (
        <motion.div
          key={`${i}-${log}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`${i === logs.length - 1 ? 'text-cyber-neon' : 'text-cyber-neon/40'} mb-1`}
        >
          <span className="text-cyber-gold mr-2">&gt;</span>
          {log}
        </motion.div>
      ))}
      {logs.length === 0 && (
        <div className="text-cyber-neon/40 animate-pulse">
          <span className="text-cyber-gold mr-2">&gt;</span>
          Підключення до терміналу...
        </div>
      )}
    </div>
  );
}
