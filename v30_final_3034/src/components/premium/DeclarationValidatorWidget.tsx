import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck, FileWarning, UploadCloud,
  CheckCircle2, AlertOctagon, Loader2, ShieldCheck, Download
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

export const DeclarationValidatorWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'safe' | 'risk'>('idle');
  const [score, setScore] = useState(0);

  if (persona !== 'TITAN') return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const scanFile = (f: File) => {
    setFile(f);
    setStatus('scanning');

    // Simulate AI Scan
    setTimeout(() => {
        const isRisk = Math.random() > 0.7; // 30% chance of random risk for demo
        setStatus(isRisk ? 'risk' : 'safe');
        setScore(isRisk ? 78 : 98);
    }, 2500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      scanFile(e.dataTransfer.files[0]);
    }
  };

  const reset = () => {
      setFile(null);
      setStatus('idle');
      setScore(0);
  };

  return (
    <div className="bg-slate-950/80 border border-emerald-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden h-full flex flex-col p-6 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 rounded-xl bg-emerald-500/20">
          <ShieldCheck className="text-emerald-400" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wide">
            {premiumLocales.declarationValidator.title}
          </h3>
          <p className="text-[10px] text-slate-500 font-mono">{premiumLocales.declarationValidator.subtitle}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10">
        <AnimatePresence mode='wait'>
            {status === 'idle' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                        "h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 text-center p-6 transition-colors",
                        dragActive ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-white/5"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                        <UploadCloud size={28} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{premiumLocales.declarationValidator.dropArea.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{premiumLocales.declarationValidator.dropArea.hint}</p>
                    </div>
                    <input
                        type="file"
                        accept=".xml,.json,.pdf"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => e.target.files?.[0] && scanFile(e.target.files[0])}
                    />
                    <label
                        htmlFor="file-upload"
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase rounded-lg cursor-pointer transition-colors"
                    >
                        {premiumLocales.declarationValidator.dropArea.button}
                    </label>
                </motion.div>
            )}

            {status === 'scanning' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-full flex flex-col items-center justify-center gap-6"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                        <Loader2 size={48} className="text-emerald-400 animate-spin relative z-10" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-lg font-black text-white animate-pulse">{premiumLocales.declarationValidator.scanning}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-2">{file?.name}</p>
                    </div>
                    <div className="w-full max-w-[200px] h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2.5, ease: "easeInOut" }}
                        />
                    </div>
                </motion.div>
            )}

            {(status === 'safe' || status === 'risk') && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex flex-col items-center justify-center gap-6"
                >
                    <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center border-4",
                        status === 'safe'
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : "bg-rose-500/20 border-rose-500 text-rose-400"
                    )}>
                        {status === 'safe' ? <CheckCircle2 size={40} /> : <AlertOctagon size={40} />}
                    </div>

                    <div className="text-center">
                        <h4 className={cn(
                            "text-2xl font-black uppercase tracking-wider mb-2",
                            status === 'safe' ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {status === 'safe' ? premiumLocales.declarationValidator.status.safe : premiumLocales.declarationValidator.status.risk}
                        </h4>
                        <div className="inline-block px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs text-slate-300 font-mono">
                            {premiumLocales.declarationValidator.status.score}: <span className="text-white font-bold">{score}/100</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors">
                            <FileCheck size={14} /> {premiumLocales.declarationValidator.actions.report}
                        </button>
                        <button
                            onClick={reset}
                            className={cn(
                                "flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-bold transition-colors border",
                                status === 'safe'
                                    ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                                    : "bg-rose-600 hover:bg-rose-500 border-rose-500"
                            )}
                        >
                            {status === 'safe' ? <Download size={14} /> : <FileWarning size={14} />}
                            {status === 'safe' ? premiumLocales.declarationValidator.actions.certificate : premiumLocales.declarationValidator.actions.fix}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};
