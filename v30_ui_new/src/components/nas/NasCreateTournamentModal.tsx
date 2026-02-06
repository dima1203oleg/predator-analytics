
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import Modal from '../../components/Modal';

interface NasCreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, dataset: string, strategy: string) => void;
    dataCatalog: any[];
}

export const NasCreateTournamentModal: React.FC<NasCreateTournamentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    dataCatalog
}) => {
    const [name, setName] = useState('');
    const [dataset, setDataset] = useState('');
    const [strategy, setStrategy] = useState('EVOLUTIONARY');

    const handleConfirm = () => {
        onConfirm(name, dataset, strategy);
        // Reset state after confirm
        setName('');
        setDataset('');
        setStrategy('EVOLUTIONARY');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Новий NAS Турнір"
            icon={<Trophy size={20} className="text-yellow-500 icon-3d-amber" />}
        >
            <div className="p-8 space-y-6 glass-morphism">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block pl-1">Назва Турніру</label>
                    <input
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sales Forecast Q4"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block pl-1">Датасет</label>
                    <select
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                        value={dataset}
                        onChange={(e) => setDataset(e.target.value)}
                    >
                        <option value="">Оберіть датасет...</option>
                        {dataCatalog.map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.classification?.sector || 'RAW'})</option>
                        ))}
                        {dataCatalog.length === 0 && (
                            <>
                                <option value="swift_transactions">SWIFT Transactions (Clean)</option>
                                <option value="prozorro_tenders">Prozorro Tenders 2023</option>
                            </>
                        )}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block pl-1 mb-1">Стратегія Пошуку</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['EVOLUTIONARY', 'REINFORCEMENT', 'DARTS', 'GRID_SEARCH'].map(s => (
                            <motion.button
                                key={s}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setStrategy(s)}
                                className={`p-3 rounded-xl border text-[10px] font-bold transition-all uppercase tracking-wider ${strategy === s
                                        ? 'bg-blue-900/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                            >
                                {s.replace('_', ' ')}
                            </motion.button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end pt-6 border-t border-slate-800">
                    <button
                        onClick={handleConfirm}
                        disabled={!name || !dataset}
                        className={`
                            px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all btn-3d
                            ${!name || !dataset
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-500/20'}
                        `}
                    >
                        Запустити NAS
                    </button>
                </div>
            </div>
        </Modal>
    );
};
