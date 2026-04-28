import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, TrendingUp, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { useRole } from '../../../context/RoleContext';
import { useNavigate } from 'react-router-dom';

export const Overview: React.FC = () => {
  const { user } = useUser();
  const { isPremium, isAdmin } = useRole();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-2xl p-8 relative "
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Вітаємо, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-blue-200/80 text-lg max-w-2xl">
            Система Predator v45 | Neural Analyticsготова до роботи.
            {isPremium
              ? ' Всі аналітичні модулі активні.'
              : ' Ознайомтесь з останніми новинами та трендами.'}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/3" />
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Morning Newspaper Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/newspaper')}
          className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl cursor-pointer hover:bg-slate-800/50 hover:border-blue-500/30 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
            <Newspaper className="text-blue-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300"> анкова Газета</h3>
          <p className="text-slate-400 mb-4 text-sm">
            Щоденний огляд критично важливих подій та аналітики.
          </p>
          <div className="flex items-center text-blue-400 text-sm font-medium">
            Читати випуск <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Global Trends Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/trends')}
          className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl cursor-pointer hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
            <TrendingUp className="text-indigo-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-300">Тренди</h3>
          <p className="text-slate-400 mb-4 text-sm">
            Аналіз динаміки змін та виявлення глобальних тенденцій.
          </p>
          <div className="flex items-center text-indigo-400 text-sm font-medium">
            Огляд трендів <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Search Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/search')}
          className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl cursor-pointer hover:bg-slate-800/50 hover:border-emerald-500/30 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
            <Search className="text-emerald-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-300">Пошук</h3>
          <p className="text-slate-400 mb-4 text-sm">
            Глибокий пошук по базі знань та документах.
          </p>
          <div className="flex items-center text-emerald-400 text-sm font-medium">
            Почати пошук <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </motion.div>

      {/* Premium Teaser (Only for Basic) */}
      {!isPremium && !isAdmin && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <ShieldCheck className="text-amber-400" size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Доступна Преміум-аналітика</h3>
              <p className="text-slate-400 text-sm max-w-lg">
                Отримайте доступ до інтерактивних дашбордів, графів зв'язків та глибинного аналізу даних.
              </p>
            </div>
          </div>
          <button
            onClick={() => confirm('Бажаєте оновити до Premium?') && window.location.reload()} // Demo action
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-amber-500/10"
          >
            Активувати Преміум
          </button>
        </motion.div>
      )}
    </div>
  );
};
