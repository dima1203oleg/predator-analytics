
import React from 'react';
import { X, CheckCircle2, Circle, Clock, GitCommit, User, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { PipelineRun, PipelineStep } from '../../types';

interface PipelineDetailsModalProps {
    run: PipelineRun | null;
    onClose: () => void;
}

export const PipelineDetailsModal: React.FC<PipelineDetailsModalProps> = ({ run, onClose }) => {
    if (!run) return null;

    const getStepIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle2 size={18} className="text-green-500" />;
            case 'FAILED': return <XCircle size={18} className="text-red-500" />;
            case 'RUNNING': return <Loader2 size={18} className="text-blue-500 animate-spin" />;
            case 'SKIPPED': return <AlertTriangle size={18} className="text-slate-600" />;
            default: return <Circle size={18} className="text-slate-700" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden panel-3d animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-start bg-slate-950/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold px-2 py-0.5 rounded border ${
                                run.status === 'SUCCESS' ? 'bg-green-900/20 border-green-900/50 text-green-400' :
                                run.status === 'FAILED' ? 'bg-red-900/20 border-red-900/50 text-red-400' :
                                'bg-blue-900/20 border-blue-900/50 text-blue-400'
                            }`}>
                                {run.status}
                            </span>
                            <h3 className="text-lg font-bold text-slate-100">Pipeline #{run.id.split('-')[1]}</h3>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{run.commitMessage}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900 border-b border-slate-800 text-xs">
                    <div className="flex flex-col gap-1">
                        <span className="text-slate-500 font-bold uppercase">Branch</span>
                        <div className="flex items-center gap-2 text-slate-300 font-mono">
                            <GitCommit size={14} className="text-purple-500"/> {run.branch}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-slate-500 font-bold uppercase">Author</span>
                        <div className="flex items-center gap-2 text-slate-300">
                            <User size={14} className="text-blue-500"/> {run.author}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-slate-500 font-bold uppercase">Duration</span>
                        <div className="flex items-center gap-2 text-slate-300 font-mono">
                            <Clock size={14} className="text-orange-500"/> {run.duration}
                        </div>
                    </div>
                </div>

                {/* Steps List */}
                <div className="p-4 bg-[#0d1117] max-h-[400px] overflow-y-auto custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Execution Steps</h4>
                    <div className="space-y-2">
                        {run.steps.map((step, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors">
                                <div className="flex items-center gap-3">
                                    {getStepIcon(step.status)}
                                    <span className={`text-sm font-medium ${
                                        step.status === 'SKIPPED' ? 'text-slate-500 line-through' : 'text-slate-200'
                                    }`}>
                                        {step.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {step.duration && <span className="text-xs font-mono text-slate-500">{step.duration}</span>}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        step.status === 'SUCCESS' ? 'bg-green-900/10 text-green-500' :
                                        step.status === 'FAILED' ? 'bg-red-900/10 text-red-500' :
                                        'bg-slate-800 text-slate-500'
                                    }`}>
                                        {step.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded transition-colors btn-3d">
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
};
