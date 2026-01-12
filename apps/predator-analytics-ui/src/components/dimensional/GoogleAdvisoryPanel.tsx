import React, { useState, useEffect } from 'react';
import { Lightbulb, Code, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TacticalCard } from '../TacticalCard'; // Assuming TacticalCard is available in parent components folder

interface GoogleSuggestion {
  id: string;
  context: string;
  suggestion: string;
  code_snippet: string;
  timestamp: string;
}

export const GoogleAdvisoryPanel: React.FC = () => {
    const [suggestions, setSuggestions] = useState<GoogleSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    // Real Fetch from Backend
    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/google/suggestions');
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data);
            }
        } catch (e) {
            console.error("Failed to fetch Google suggestions", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    return (
        <TacticalCard variant="holographic" title="🤖 Google AI Advisory (Assistant Mode)" className="border-blue-500/30">
            <div className="space-y-4">
               {/* Controls */}
               <div className="flex justify-end">
                   <button
                     onClick={fetchSuggestions}
                     disabled={loading}
                     className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                     title="Оновити поради"
                   >
                       <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                   </button>
               </div>

               {/* Content */}
               <div className="min-h-[100px]">
                   <AnimatePresence>
                       {suggestions.map((item) => (
                           <motion.div
                               key={item.id}
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               exit={{ opacity: 0, x: 10 }}
                               className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 mb-3 relative overflow-hidden group"
                           >
                               <div className="flex items-start gap-3 relative z-10">
                                   <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                                       <Lightbulb className="w-5 h-5 text-blue-300" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-start mb-1">
                                           <h4 className="text-sm font-bold text-blue-200">{item.context}</h4>
                                           <span className="text-[10px] text-blue-400/60 font-mono">{item.timestamp}</span>
                                       </div>
                                       <p className="text-xs text-blue-200/80 leading-relaxed mb-3">
                                           {item.suggestion}
                                       </p>

                                       {item.code_snippet && (
                                           <div className="bg-black/40 rounded p-2 border border-blue-500/10 font-mono text-[10px] text-blue-300 overflow-x-auto">
                                               <pre>{item.code_snippet}</pre>
                                           </div>
                                       )}

                                       <div className="mt-3 flex gap-2">
                                           <button className="text-[10px] px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded border border-blue-500/30 transition-colors flex items-center gap-1">
                                               <Code className="w-3 h-3" />
                                               Створити пропозицію (CLI)
                                           </button>
                                       </div>
                                   </div>
                               </div>

                               {/* Background Decor */}
                               <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                           </motion.div>
                       ))}
                   </AnimatePresence>

                   {!loading && suggestions.length === 0 && (
                       <div className="text-center py-8 text-slate-500 text-xs">
                           Немає нових пропозицій від Google AI.
                       </div>
                   )}
               </div>
            </div>
        </TacticalCard>
    );
}

export default GoogleAdvisoryPanel;
