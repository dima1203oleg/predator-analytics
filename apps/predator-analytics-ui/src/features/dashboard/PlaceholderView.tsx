import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bell, ArrowRight, Construction, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';

// Particle Background Component
const ParticleField = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const particles: any[] = [];
        const count = 50;

        for(let i=0; i<count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2,
                alpha: Math.random() * 0.5 + 0.1
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#10b981'; // Emerald

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = 0;

                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            requestAnimationFrame(animate);
        };
        const animId = requestAnimationFrame(animate);

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-30" />;
};

export const PlaceholderView = () => {
    const [notified, setNotified] = useState(false);

    return (
        <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden bg-slate-950">
            <ParticleField />

            <div className="relative z-10 text-center px-4 max-w-2xl">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 relative inline-block"
                >
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                    <div className="w-24 h-24 bg-slate-900 border border-emerald-500/30 rounded-2xl flex items-center justify-center relative shadow-2xl shadow-emerald-500/10 rotate-3">
                         <Construction className="w-12 h-12 text-emerald-400" />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
                >
                    Модуль <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">В Розробці</span>
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-400 text-lg mb-10 leading-relaxed"
                >
                    Ми готуємо дещо особливе для цього розділу. Нові алгоритми AI, глибинна аналітика та миттєві інсайти стануть доступні вже скоро.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    {!notified ? (
                        <button
                            onClick={() => setNotified(true)}
                            className="group relative px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/30 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <Bell className="w-4 h-4" /> Сповістити про запуск
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-20 transition-opacity" style={{ backgroundSize: '200% 100%' }} />
                        </button>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 px-8 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20"
                        >
                            <Zap className="w-4 h-4" /> Ви в списку очікування!
                        </motion.div>
                    )}

                    <button className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-2">
                        Дізнатись деталі <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>

                <div className="mt-16 flex items-center justify-center gap-8 opacity-40">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-mono text-white font-bold">04</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Дні</span>
                    </div>
                    <div className="text-2xl font-mono text-slate-600">:</div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-mono text-white font-bold">12</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Год</span>
                    </div>
                    <div className="text-2xl font-mono text-slate-600">:</div>
                     <div className="flex flex-col items-center">
                        <span className="text-2xl font-mono text-white font-bold">30</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Хв</span>
                    </div>
                </div>
            </div>

            {/* Footer Line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </div>
    );
};
