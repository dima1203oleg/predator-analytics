
import React from 'react';
import { GitCommit, Clock, CheckCircle2, XCircle, Loader2, RotateCcw, Box, ArrowRight } from 'lucide-react';
import { PipelineRun } from '../../types';

interface PipelineTableProps {
    pipelines: PipelineRun[];
    onRollback: (id: string) => void;
    onSelect: (run: PipelineRun) => void;
}

export const PipelineTable: React.FC<PipelineTableProps> = ({ pipelines, onRollback, onSelect }) => {
    return (
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-lg shadow-lg panel-3d">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                        <th className="p-4">Статус</th>
                        <th className="p-4">Коміт / Гілка</th>
                        <th className="p-4">Середовища</th>
                        <th className="p-4">Тип</th>
                        <th className="p-4">Час</th>
                        <th className="p-4 text-right">Дії</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {pipelines.map((run) => (
                        <tr 
                            key={run.id} 
                            onClick={() => onSelect(run)}
                            className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
                        >
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full ${
                                        run.status === 'SUCCESS' ? 'bg-green-900/20 text-green-500' : 
                                        run.status === 'FAILED' ? 'bg-red-900/20 text-red-500' : 'bg-blue-900/20 text-blue-500'
                                    }`}>
                                        {run.status === 'SUCCESS' && <CheckCircle2 size={16} />}
                                        {run.status === 'FAILED' && <XCircle size={16} />}
                                        {run.status === 'RUNNING' && <Loader2 size={16} className="animate-spin" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${
                                            run.status === 'SUCCESS' ? 'text-green-400' : 
                                            run.status === 'FAILED' ? 'text-red-400' : 'text-blue-400'
                                        }`}>{run.status}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">#{run.id.split('-')[1]}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="text-sm font-medium text-slate-200 group-hover:text-primary-400 transition-colors">{run.commitMessage}</div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-mono">
                                    <span className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"><GitCommit size={10}/> {run.branch}</span>
                                    <span>@{run.author}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex gap-1.5">
                                    <div className={`w-3 h-3 rounded-full border border-slate-900 ${run.environments.mac ? 'bg-blue-500 shadow-[0_0_8px_blue]' : 'bg-slate-800'}`} title="Local (Mac)"></div>
                                    <div className={`w-3 h-3 rounded-full border border-slate-900 ${run.environments.nvidia ? 'bg-green-500 shadow-[0_0_8px_lime]' : 'bg-slate-800'}`} title="Prod (NVIDIA)"></div>
                                    <div className={`w-3 h-3 rounded-full border border-slate-900 ${run.environments.oracle ? 'bg-orange-500 shadow-[0_0_8px_orange]' : 'bg-slate-800'}`} title="Cloud (Oracle)"></div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                    run.type === 'FULL_DEPLOY' ? 'bg-purple-900/20 text-purple-400 border-purple-900/50' :
                                    run.type === 'TEST_ONLY' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                                    'bg-blue-900/20 text-blue-400 border-blue-900/50'
                                }`}>
                                    {run.type.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-300">{run.timestamp}</span>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5">
                                        <Clock size={10} /> {run.duration}
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRollback(run.id); }}
                                    className="p-2 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors btn-3d border border-transparent hover:border-slate-700" 
                                    title="Rollback to this version"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
