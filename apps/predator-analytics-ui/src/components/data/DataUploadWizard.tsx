
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, X, Check, CheckCircle, RefreshCw } from 'lucide-react';

interface DataUploadWizardProps {
    wizardStep: 'idle' | 'preview' | 'uploading' | 'success';
    selectedFile: File | null;
    previewData: any[];
    uploadProgress: number;
    onCancel: () => void;
    onConfirm: () => void;
}

export const DataUploadWizard: React.FC<DataUploadWizardProps> = ({
    wizardStep,
    selectedFile,
    previewData,
    uploadProgress,
    onCancel,
    onConfirm
}) => {
    if (wizardStep === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[32px]  shadow-2xl"
                >
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <FileSearch className="text-indigo-400" /> ПОПЕ ЕДНІЙ ПЕ ЕГЛЯД
                            </h2>
                            <p className="text-slate-400 font-mono text-xs mt-1 uppercase">Файл: {selectedFile?.name}</p>
                        </div>
                        <button onClick={onCancel} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                            <X size={24} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="p-8">
                        {wizardStep === 'preview' ? (
                            <div className="space-y-6">
                                <div className="overflow-x-auto rounded-xl border border-white/5">
                                    <table className="w-full text-left text-xs font-mono">
                                        <thead className="bg-white/5 text-slate-400">
                                            <tr>
                                                {previewData[0] && Object.keys(previewData[0]).map(k => (
                                                    <th key={k} className="p-4 border-b border-white/5">{k}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-300">
                                            {previewData.map((row, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    {Object.values(row).map((v: any, j) => (
                                                        <td key={j} className="p-4 opacity-80">{v}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end gap-4 pt-4">
                                    <button onClick={onCancel} className="px-6 py-3 border border-slate-700 text-slate-400 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                                        СКАСУВАТИ
                                    </button>
                                    <button onClick={onConfirm} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                                        <Check size={20} /> ПІДТВЕ ДИТИ ІМПОРТ
                                    </button>
                                </div>
                            </div>
                        ) : wizardStep === 'success' ? (
                            <div className="py-12 flex flex-col items-center animate-in zoom-in duration-300">
                                <div className="p-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mb-6 shadow-xl shadow-emerald-500/20">
                                    <CheckCircle size={64} className="text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">ЗАВАНТАЖЕННЯ УСПІШНЕ</h3>
                                <p className="text-slate-400 font-mono text-center max-w-md">
                                    Файл передано на сервер. <br/>
                                     озпочато ETLпроцес обробки та індексації даних.
                                </p>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center">
                                <RefreshCw size={64} className="text-indigo-500 animate-spin mb-6" />
                                <h3 className="text-xl font-bold text-white uppercase tracking-widest">ЗАВАНТАЖЕННЯ...</h3>
                                <div className="w-full max-w-md mt-8 h-2 bg-slate-800 rounded-full ">
                                    <motion.div
                                        className="h-full bg-indigo-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="mt-4 text-indigo-400 font-mono">{uploadProgress}% ЗАВЕ ШЕНО</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
