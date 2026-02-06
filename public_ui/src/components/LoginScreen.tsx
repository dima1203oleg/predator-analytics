import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Crown, ShieldAlert } from 'lucide-react';
import { useUser, SubscriptionTier } from '../context/UserContext';
import { UserRole } from '../config/roles';

interface LoginScreenProps {
    onLogin: () => void;
    isLocked?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const { setUser } = useUser();

    const handleDemoLogin = (role: UserRole) => {
        let tier = SubscriptionTier.FREE;
        if (role === UserRole.CLIENT_PREMIUM) tier = SubscriptionTier.PRO;
        if (role === UserRole.ADMIN) tier = SubscriptionTier.ENTERPRISE;

        setUser({
            id:  role === UserRole.ADMIN ? 'admin-1' : 'client-1',
            name: role === UserRole.ADMIN ? 'System Administrator' : role === UserRole.CLIENT_PREMIUM ? 'Premium Analyst' : 'Basic User',
            email: role === UserRole.ADMIN ? 'admin@predator.ai' : 'user@client.com',
            role: role,
            tier: tier,
            tenant_id: 'demo-tenant',
            tenant_name: 'Demo Organization',
            last_login: new Date().toISOString()
        });

        onLogin();
    };

    const variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />

            <motion.div
                initial="hidden"
                animate="visible"
                transition={{ staggerChildren: 0.1 }}
                className="w-full max-w-4xl z-10"
            >
                <motion.div variants={variants} className="text-center mb-16">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <ShieldCheck className="text-white" size={32} />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">PREDATOR ANALYTICS</h1>
                    <p className="text-slate-400 text-lg">Оберіть рівень доступу для входу в систему (DEMO)</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Client */}
                    <motion.button
                        variants={variants}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDemoLogin(UserRole.CLIENT_BASIC)}
                        className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-left transition-all hover:border-slate-600 group"
                    >
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-700 transition-colors">
                            <User className="text-slate-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Клієнтський доступ</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Базовий перегляд новин, пошук та доступ до публічних звітів.
                        </p>
                    </motion.button>

                    {/* Premium Client */}
                    <motion.button
                        variants={variants}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDemoLogin(UserRole.CLIENT_PREMIUM)}
                        className="bg-slate-900/50 border border-amber-500/30 p-8 rounded-2xl text-left transition-all hover:border-amber-500/50 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 bg-amber-500/10 rounded-bl-xl border-b border-l border-amber-500/20">
                            <span className="text-[10px] font-bold text-amber-500 uppercase">Recommended</span>
                        </div>
                        <div className="w-12 h-12 bg-amber-950/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-900/40 transition-colors border border-amber-500/20">
                            <Crown className="text-amber-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Преміум-аналітика</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Повний доступ до дашбордів, графів зв'язків та чутливих даних.
                        </p>
                    </motion.button>

                    {/* Admin */}
                    <motion.button
                        variants={variants}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDemoLogin(UserRole.ADMIN)}
                        className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-left transition-all hover:border-purple-500/50 group"
                    >
                        <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-900/30 transition-colors">
                            <ShieldAlert className="text-purple-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Адміністратор</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Керування користувачами, сервісами та перегляд системних логів.
                        </p>
                    </motion.button>
                </div>

                <motion.div variants={variants} className="mt-12 text-center text-slate-500 text-xs font-mono">
                    Predator Analytics v2.0 • Unified Web Interface • 2026
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
