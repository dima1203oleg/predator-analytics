import React from 'react';
import { motion } from 'framer-motion';
import { Lock, FileText, Share2, Bookmark } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import { UpgradePrompt } from '../../shared/UpgradePrompt';

export const Newspaper: React.FC = () => {
  const { isPremium } = useRole();

  const articles = [
    {
      id: 1,
      title: "Глобальні зміни в логістиці: Звіт Q1 2026",
      summary: "Основні тези щодо перебудови транспортних коридорів у Східній Європі та вплив на регіональну економіку.",
      category: "Логістика",
      readTime: "5 хв",
      isPremium: false,
    },
    {
      id: 2,
      title: "Аналіз ризиків: Кібербезпека в енергетичному секторі",
      summary: "Глибинний розбір нових векторів атак на критичну інфраструктуру та рекомендації щодо протидії.",
      category: "Безпека",
      readTime: "12 хв",
      isPremium: true,
    },
    {
      id: 3,
      title: "Прогноз цін на сировинні товари: Метали та Зерно",
      summary: "Моделювання цінових коливань на основі даних за останні 5 років з урахуванням геополітичних факторів.",
      category: "Економіка",
      readTime: "8 хв",
      isPremium: true,
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8 border-b border-white/5">
        <div className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Щоденний Аналітичний Дайджест</div>
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">� анкова Газета</h1>
        <div className="text-slate-400 font-serif italic">Випуск від {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      {/* Articles Grid */}
      <div className="grid gap-8">
        {articles.map((article) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              relative bg-slate-900/30 border border-slate-800 rounded-2xl  group
              ${article.isPremium && !isPremium ? 'opacity-90' : 'hover:bg-slate-900/50 hover:border-slate-700 transition-all'}
            `}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs font-bold uppercase rounded-full tracking-wide">
                  {article.category}
                </span>
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  <FileText size={12} /> {article.readTime}
                </span>
                {article.isPremium && (
                  <span className="ml-auto px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase rounded flex items-center gap-1">
                    <Lock size={10} /> Premium
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors font-serif">
                {article.title}
              </h2>

              <div className="relative">
                <p className={`text-slate-400 leading-relaxed ${article.isPremium && !isPremium ? 'blur-sm select-none' : ''}`}>
                  {article.summary}
                  {article.isPremium && !isPremium && " ... [Цей контент доступний лише для преміум передплатників. Будь ласка, оновіть тарифний план для повного доступу до аналітичних матеріалів.]"}
                </p>

                {/* Premium Lock Overlay */}
                {article.isPremium && !isPremium && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-xl border border-amber-500/30 shadow-xl flex items-center gap-3">
                      <Lock className="text-amber-500" size={20} />
                      <span className="text-amber-200 font-medium text-sm">Тільки з Premium</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 bg-slate-950/30 border-t border-white/5 flex items-center justify-between">
              <button
                disabled={article.isPremium && !isPremium}
                className={`text-sm font-medium transition-colors ${article.isPremium && !isPremium ? 'text-slate-600 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
              >
                Читати повністю &rarr;
              </button>

              <div className="flex gap-4">
                <button className="text-slate-500 hover:text-white transition-colors" title="Зберегти"><Bookmark size={18} /></button>
                <button className="text-slate-500 hover:text-white transition-colors" title="Поділитися"><Share2 size={18} /></button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Upgrade CTA (if Basic) */}
      {!isPremium && <UpgradePrompt title="Отримайте доступ до повної аналітики" />}
    </div>
  );
};
