import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { User, LogIn, LogOut } from 'lucide-react';

export function AuthStatus() {
  const { user, loading, signInWithGoogle, logout } = useAuth();

  if (loading) return <div className="text-xs text-slate-500 animate-pulse">Loading auth...</div>;

  if (user) {
    return (
      <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Користувач" className="w-4 h-4 rounded-full border border-slate-800" />
          ) : (
            <User className="w-4 h-4 text-slate-300" />
          )}
          <span className="text-xs text-slate-300 font-mono font-bold truncate max-w-[100px]">
            {user.email}
          </span>
        </div>
        <button 
          onClick={logout}
          className="text-slate-500 hover:text-red-400 transition-colors"
          title="Вийти"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={signInWithGoogle}
      className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all border border-slate-800"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>Ідентифікація</span>
    </button>
  );
}
