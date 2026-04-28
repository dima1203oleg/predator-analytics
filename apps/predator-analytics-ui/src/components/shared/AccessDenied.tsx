import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  message?: string;
  showBack?: boolean;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = 'У вас немає прав дляперегляду цієї сторінки',
  showBack = true,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 ring-1 ring-red-500/30">
        <ShieldAlert className="text-red-500" size={40} />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">Доступ заборонено</h2>
      <p className="text-slate-400 mb-8 max-w-md">
        {message}
      </p>

      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Повернутися назад</span>
        </button>
      )}
    </motion.div>
  );
};
