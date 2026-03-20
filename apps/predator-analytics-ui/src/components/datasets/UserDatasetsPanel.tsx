
/**
 * 📚 User Datasets Panel
 *
 * Панель для управління власними датасетами користувача.
 * Дозволяє завантажувати датасети та використовувати їх як приклади для генерації нових.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Upload, FileSpreadsheet, Trash2, Star, CheckCircle,
    Plus, X, RefreshCw, Sparkles, Download, Eye, ToggleLeft, ToggleRight,
    Layers, Zap, FileText, Clock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { api } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';

export interface UserDataset {
    id: string;
    name: string;
    filename: string;
    type: 'excel' | 'csv' | 'json' | 'parquet';
    size: number;
    rows: number;
    columns: number;
    uploadedAt: string;
    isExampleEnabled: boolean;
    isReference: boolean; // 🆕
    tags: string[];
    description?: string;
}

interface UserDatasetsPanelProps {
    className?: string;
    onDatasetSelect?: (dataset: UserDataset) => void;
}

export const UserDatasetsPanel: React.FC<UserDatasetsPanelProps> = ({ className, onDatasetSelect }) => {
    const [datasets, setDatasets] = useState<UserDataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);



    // Load datasets
    useEffect(() => {
        const fetchDatasets = async () => {
            setLoading(true);
            try {
                const res = await api.datasets.list();
                setDatasets(Array.isArray(res) ? res : (res?.data || []));
            } catch (e) {
                console.error('Failed to load datasets', e);
                setDatasets([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDatasets();
    }, []);

    // Activate as Reference
    const activateReference = useCallback(async (id: string) => {
        try {
            await api.datasets.activateReference(id);
            setDatasets(prev => prev.map(ds => ({
                ...ds,
                isReference: ds.id === id // Only one reference for now
            })));
        } catch (e) {
            console.error('Failed to activate reference', e);
        }
    }, []);

    // Toggle example status
    const toggleExample = useCallback(async (id: string) => {
        const dataset = datasets.find(d => d.id === id);
        if (!dataset) return;
        const nextValue = !dataset.isExampleEnabled;
        if (nextValue) onDatasetSelect?.(dataset);

        // Optimistically update UI
        setDatasets(prev => prev.map(ds =>
            ds.id === id ? { ...ds, isExampleEnabled: nextValue } : ds
        ));
        try {
            await api.datasets.update(id, { isExampleEnabled: nextValue });
        } catch (e) {
            // Revert on failure
            console.error('Failed to persist example toggle', e);
            setDatasets(prev => prev.map(ds =>
                ds.id === id ? { ...ds, isExampleEnabled: !nextValue } : ds
            ));
        }
    }, [datasets, onDatasetSelect]);

    // Handle file upload
    const handleUpload = async () => {
        if (!uploadFile) return;

        setUploading(true);
        try {
            const result = await api.datasets.upload(uploadFile);
            const newDataset: UserDataset = {
                id: result.id || `ds-${Date.now()}`,
                name: result.name || uploadFile.name.replace(/\.[^/.]+$/, ""),
                filename: result.filename || uploadFile.name,
                type: result.type || (uploadFile.name.endsWith('.csv') ? 'csv' :
                    uploadFile.name.endsWith('.json') ? 'json' : 'excel'),
                size: result.size || uploadFile.size,
                rows: result.rows || 0,
                columns: result.columns || 0,
                uploadedAt: result.uploaded_at || new Date().toISOString(),
                isExampleEnabled: false,
                isReference: false,
                tags: result.tags || [],
                description: result.description,
            };

            setDatasets(prev => [newDataset, ...prev]);
            setShowUploadModal(false);
            setUploadFile(null);
        } catch (e: any) {
            console.error('Upload failed', e);
        } finally {
            setUploading(false);
        }
    };

    // Delete dataset
    const handleDelete = useCallback(async (id: string) => {
        if (!confirm(premiumLocales.datasetStudio.panels.userDatasets.dataset.deleteConfirm)) return;
        try {
            await api.datasets.delete(id);
            setDatasets(prev => prev.filter(ds => ds.id !== id));
        } catch (e) {
            console.error('Delete failed', e);
        }
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const getTypeIcon = (type: UserDataset['type']) => {
        switch (type) {
            case 'excel': return <FileSpreadsheet size={16} className="text-emerald-400" />;
            case 'csv': return <FileText size={16} className="text-blue-400" />;
            case 'json': return <Layers size={16} className="text-amber-400" />;
            default: return <Database size={16} className="text-slate-400" />;
        }
    };

    const enabledCount = datasets.filter(d => d.isExampleEnabled).length;

    return (
        <div className={cn("bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm", className)}>
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-black/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/20">
                            <Database className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest">{premiumLocales.datasetStudio.panels.userDatasets.title}</h3>
                            <p className="text-[10px] text-slate-500 font-mono">
                                {premiumLocales.datasetStudio.panels.userDatasets.stats.replace('{count}', String(datasets.length)).replace('{active}', String(enabledCount))}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-600/20"
                    >
                        <Plus size={16} /> {premiumLocales.datasetStudio.panels.userDatasets.upload}
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-indigo-500/5 border-b border-indigo-500/10 flex items-center gap-4">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <p className="text-xs text-indigo-300">
                    <strong>{premiumLocales.datasetStudio.panels.userDatasets.info.title}</strong> {premiumLocales.datasetStudio.panels.userDatasets.info.desc}
                </p>
            </div>

            {/* Dataset List */}
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : datasets.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                        <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">{premiumLocales.datasetStudio.panels.userDatasets.empty.title}</p>
                        <p className="text-slate-600 text-sm mt-1">{premiumLocales.datasetStudio.panels.userDatasets.empty.subtitle}</p>
                    </div>
                ) : (
                    datasets.map((dataset, i) => (
                        <motion.div
                            key={dataset.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "p-4 rounded-2xl border transition-all group",
                                dataset.isExampleEnabled
                                    ? "bg-purple-500/5 border-purple-500/30 shadow-lg shadow-purple-500/5"
                                    : "bg-slate-800/20 border-white/5 hover:border-white/10"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center border",
                                        dataset.isExampleEnabled
                                            ? "bg-purple-500/20 border-purple-500/30"
                                            : "bg-slate-800 border-slate-700"
                                    )}>
                                        {getTypeIcon(dataset.type)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate">{dataset.name}</h4>
                                        <p className="text-[10px] text-slate-500 font-mono truncate">{dataset.filename}</p>

                                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                                            <span>{dataset.rows.toLocaleString()} {premiumLocales.datasetStudio.panels.userDatasets.dataset.rows}</span>
                                            <span>{dataset.columns} {premiumLocales.datasetStudio.panels.userDatasets.dataset.cols}</span>
                                            <span>{formatSize(dataset.size)}</span>
                                        </div>

                                        {/* Tags */}
                                        {dataset.tags.length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                                {dataset.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[9px] rounded-md">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                // Actions
                                <div className="flex items-center gap-3">
                                    {/* Reference Toggle */}
                                    <button
                                        onClick={() => activateReference(dataset.id)}
                                        className={cn(
                                            "p-2 rounded-xl transition-all",
                                            dataset.isReference ? "text-amber-400 bg-amber-400/10 shadow-lg" : "text-slate-600 hover:text-amber-400"
                                        )}
                                        title="Встановити як еталонний датасет"
                                    >
                                        <Star size={18} fill={dataset.isReference ? "currentColor" : "none"} />
                                    </button>

                                    {/* Example Toggle */}
                                    <button
                                        onClick={() => toggleExample(dataset.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                                            dataset.isExampleEnabled
                                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                                : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-purple-500/30 hover:text-purple-400"
                                        )}
                                        title={dataset.isExampleEnabled ? premiumLocales.datasetStudio.panels.userDatasets.dataset.turnOff : premiumLocales.datasetStudio.panels.userDatasets.dataset.turnOn}
                                    >
                                        {dataset.isExampleEnabled ? (
                                            <>
                                                <ToggleRight size={16} />
                                                <span className="uppercase tracking-wider">{premiumLocales.datasetStudio.panels.userDatasets.dataset.example}</span>
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft size={16} />
                                                <span className="uppercase tracking-wider">{premiumLocales.datasetStudio.panels.userDatasets.dataset.enable}</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(dataset.id)}
                                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Видалити"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Enabled indicator */}
                            {dataset.isExampleEnabled && (
                                <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center gap-2 text-[10px] text-purple-400">
                                    <Sparkles size={12} />
                                    <span>{premiumLocales.datasetStudio.panels.userDatasets.dataset.activeDesc}</span>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950">
                                <h3 className="text-lg font-bold text-white uppercase tracking-widest">{premiumLocales.datasetStudio.panels.userDatasets.uploadModal.title}</h3>
                                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8">
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer",
                                        uploadFile
                                            ? "border-purple-500 bg-purple-500/5"
                                            : "border-slate-700 hover:border-slate-600"
                                    )}
                                    onClick={() => document.getElementById('dataset-upload-input')?.click()}
                                >
                                    <input
                                        id="dataset-upload-input"
                                        type="file"
                                        accept=".xlsx,.xls,.csv,.json,.parquet"
                                        className="hidden"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    />

                                    {uploadFile ? (
                                        <>
                                            <FileSpreadsheet className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                                            <p className="text-white font-bold">{uploadFile.name}</p>
                                            <p className="text-slate-500 text-sm mt-1">{formatSize(uploadFile.size)}</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-400">{premiumLocales.datasetStudio.panels.userDatasets.uploadModal.dragDrop}</p>
                                            <p className="text-slate-600 text-sm mt-2">{premiumLocales.datasetStudio.panels.userDatasets.uploadModal.supported}</p>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!uploadFile || uploading}
                                    className="mt-6 w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            {premiumLocales.datasetStudio.panels.userDatasets.uploadModal.uploading}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            {premiumLocales.datasetStudio.panels.userDatasets.uploadModal.action}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDatasetsPanel;
