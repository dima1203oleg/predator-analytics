import React from 'react';
import { User, Shield, CreditCard, Mail, Building, Crown } from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { useRole } from '../../../context/RoleContext';
import { UserRole } from '../../../config/roles';

export const Profile: React.FC = () => {
  const { user, logout } = useUser();
  const { displayName, description, role } = useRole();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Профіль Користувача</h1>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-500/20 border-4 border-slate-900">
              {user.avatar || user.name.charAt(0)}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              role === UserRole.CLIENT_PREMIUM ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
              role === UserRole.ADMIN ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {displayName}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2">
                  <User size={12} /> Ім'я
                </label>
                <div className="text-white font-medium text-lg">{user.name}</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Mail size={12} /> Email
                </label>
                <div className="text-white font-medium text-lg">{user.email}</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Building size={12} /> Організація
                </label>
                <div className="text-white font-medium">{user.tenant_name}</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2">
                  <Shield size={12} /> Рівень доступу
                </label>
                <div className="text-slate-300">{description}</div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                 <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2">
                    <CreditCard size={12} /> Підписка
                 </label>
                 {role === UserRole.CLIENT_PREMIUM && (
                   <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                     <Crown size={12} /> PREMIUM ACTIVE
                   </span>
                 )}
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                 <div>
                   <div className="text-white font-bold">{user.tier.toUpperCase()} PLAN</div>
                   <div className="text-slate-500 text-xs mt-1">Оновлено: {new Date(user.last_login).toLocaleDateString()}</div>
                 </div>
                 {role !== UserRole.ADMIN && (
                   <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors">
                     Керувати
                   </button>
                 )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={logout}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Вийти з акаунту
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
