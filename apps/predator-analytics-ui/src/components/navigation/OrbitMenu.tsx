import { AnimatePresence, motion } from 'framer-motion';
import { Cpu, Dna, Fingerprint, Network, Search, Trophy } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OrbitMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <Cpu size={20} />, label: 'ОГЛЯД', color: 'text-blue-400', path: '/overview' },
    { icon: <Network size={20} />, label: 'АНАЛІТИКА', color: 'text-emerald-400', path: '/analytics' },
    { icon: <Search size={20} />, label: 'ПОШУК', color: 'text-cyan-400', path: '/search-v2' },
    { icon: <Trophy size={20} />, label: 'ОПТИМІЗАТО� ', color: 'text-amber-400', path: '/llm/nas' },
    { icon: <Dna size={20} />, label: 'ЕВОЛЮЦІЯ', color: 'text-rose-400', path: '/evolution' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-12 right-32 z-[100]">
      <motion.button
        onMouseEnter={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-16 h-16 bg-slate-950 border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:border-blue-500/50 transition-all z-50 relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
        <Fingerprint className="text-blue-400 relative z-10" size={32} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            onMouseLeave={() => setIsOpen(false)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute bottom-[-40px] right-[-40px] w-96 h-96 flex items-center justify-center pointer-events-none"
          >
            {/* Ambient Pulse */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              className="absolute inset-0 bg-blue-500 rounded-full blur-[100px]"
            />

            {/* Spinning Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-80 h-80 border border-dashed border-white/5 rounded-full"
            />

            {/* Menu Items arranged in circle */}
            {menuItems.map((item, i) => {
              const angle = (i * (360 / menuItems.length)) - 90;
              const radius = 130;
              const x = radius * Math.cos(angle * (Math.PI / 180));
              const y = radius * Math.sin(angle * (Math.PI / 180));
              const isActive = location.pathname === item.path;

              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ x, y, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
                  className="absolute pointer-events-auto"
                >
                  <button
                    onClick={() => handleNavigate(item.path)}
                    className="flex flex-col items-center group"
                  >
                    <div className={`p-4 bg-slate-950 border transition-all duration-300 rounded-3xl ${isActive
                        ? 'border-blue-500/60 shadow-[0_0_30px_rgba(37,99,235,0.4)]'
                        : 'border-white/10 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                      } ${item.color}`}>
                      {item.icon}
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-6 flex flex-col items-center"
                    >
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 whitespace-nowrap bg-black/80 px-2 py-1 rounded backdrop-blur-md border border-white/5 shadow-2xl">
                        {item.label}
                      </span>
                      <div className="w-1 h-1 bg-blue-500 rounded-full mt-1" />
                    </motion.div>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrbitMenu;
