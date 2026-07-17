import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Shield, Fingerprint, Database, Maximize, Cpu } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { useCyberStore } from '@/store/useCyberStore';
import { CyberPanel, CyberInput, CyberButton } from '@/components/ui/CyberHUD';
import { cn } from '@/utils/cn';

const SearchPage: React.FC = () => {
    const setAvatarMode = useCyberStore(state => state.setAvatarMode);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        // У режимі пошуку аватар може бути в режимі SCAN або DATA_PROCESSING
        setAvatarMode('SEARCH');
    }, [setAvatarMode]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 2000);
    };

    return (
        <PageTransition>
            {/* Головний контейнер прозорий для 3D */}
            <div className="min-h-screen bg-transparent text-slate-200 relative font-sans pt-24 pb-40 px-8">
                
                <div className="max-w-[1900px] mx-auto grid grid-cols-12 gap-8 h-full">
                    
                    {/* Ліва панель фільтрів */}
                    <div className="col-span-12 xl:col-span-3 space-y-6">
                        <CyberPanel>
                            <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4 mb-6">
                                <Filter size={20} className="text-cyan-400" />
                                <h2 className="text-sm font-black text-white tracking-[0.2em] uppercase">
                                    ВЕКТОРИ ПОШУКУ
                                </h2>
                            </div>
                            
                            <div className="space-y-3">
                                {['ФІЗИЧНІ ОСОБИ', 'ЮРИДИЧНІ ОСОБИ', 'ТРАНЗАКЦІЇ', 'ДОКУМЕНТИ', 'КРИПТОГАМАНЦІ'].map((filter, i) => (
                                    <div key={i} className="flex items-center gap-3 group cursor-pointer">
                                        <div className="w-4 h-4 border border-cyan-500/50 rounded flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                            {i === 0 || i === 1 ? <div className="w-2 h-2 bg-cyan-400" /> : null}
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">
                                            {filter}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-white/5">
                                <h3 className="text-[10px] font-mono text-slate-500 mb-4 uppercase tracking-widest">ДЖЕРЕЛА ДАНИХ</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                        <span className="flex items-center gap-2"><Database size={12} /> OSINT.IO</span>
                                        <span className="text-emerald-400">ОК</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                        <span className="flex items-center gap-2"><Database size={12} /> CLEARVIEW</span>
                                        <span className="text-emerald-400">ОК</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                        <span className="flex items-center gap-2"><Database size={12} /> NBU_REGISTRY</span>
                                        <span className="text-amber-400">ЗАТРИМКА</span>
                                    </div>
                                </div>
                            </div>
                        </CyberPanel>
                    </div>

                    {/* Центральна область пошуку (знизу) */}
                    <div className="col-span-12 xl:col-span-6 flex flex-col justify-end">
                        <div className="w-full max-w-2xl mx-auto mb-12">
                            <form onSubmit={handleSearch} className="relative group">
                                {/* Анімація сканування при пошуку */}
                                {isScanning && (
                                    <motion.div 
                                        className="absolute -inset-1 bg-cyan-500/20 blur-xl rounded-full"
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                )}
                                
                                <div className="relative flex items-center">
                                    <div className="absolute left-4 z-10 text-cyan-400 pointer-events-none">
                                        {isScanning ? (
                                            <Cpu size={24} className="animate-spin-slow" />
                                        ) : (
                                            <Search size={24} />
                                        )}
                                    </div>
                                    
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="ВВЕДІТЬ ІДЕНТИФІКАТОР, ПІБ АБО ХЕШ..."
                                        className={cn(
                                            "w-full bg-black/40 border border-cyan-500/30 rounded-xl py-5 pl-14 pr-32",
                                            "text-white font-mono text-sm tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 backdrop-blur-md transition-all",
                                            isScanning ? "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]" : ""
                                        )}
                                    />
                                    
                                    <div className="absolute right-2 flex items-center gap-2">
                                        <CyberButton 
                                            type="submit"
                                            variant="primary"
                                            size="sm"
                                            className="px-6 py-2 uppercase tracking-widest text-[10px]"
                                            disabled={isScanning}
                                        >
                                            {isScanning ? 'АНАЛІЗ...' : 'ІНІЦІАЛІЗАЦІЯ'}
                                        </CyberButton>
                                    </div>
                                </div>

                                <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest px-4">
                                    <span>ВВЕДЕННЯ ДАНИХ АВТОРИЗОВАНО</span>
                                    <span>АЛГОРИТМ: HEURISTIC_V3</span>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Права панель швидких дій */}
                    <div className="col-span-12 xl:col-span-3 space-y-6">
                        <CyberPanel>
                            <h2 className="text-[11px] font-black text-slate-300 tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                                <Shield size={16} className="text-cyan-400" />
                                ОСТАННІ ЗАПИТИ
                            </h2>
                            
                            <div className="space-y-4">
                                {[
                                    { q: '3948271049', type: 'ЄДРПОУ', time: '14 ХВ ТОМУ' },
                                    { q: '0x71C...89A', type: 'ETH WALLET', time: '2 ГОД ТОМУ' },
                                    { q: 'АХ4920ВС', type: 'АВТОНОМЕР', time: '4 ГОД ТОМУ' }
                                ].map((item, i) => (
                                    <div key={i} className="group p-3 border border-white/5 rounded-lg bg-black/20 hover:bg-cyan-950/20 hover:border-cyan-500/30 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-mono text-cyan-400">{item.q}</span>
                                            <span className="text-[9px] font-mono text-slate-500">{item.time}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.type}</span>
                                            <Fingerprint size={12} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CyberPanel>
                    </div>

                </div>
            </div>
        </PageTransition>
    );
};

export default SearchPage;
