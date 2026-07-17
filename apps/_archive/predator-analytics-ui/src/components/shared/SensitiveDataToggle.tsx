import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useSensitiveData } from '../../context/SensitiveDataContext';
import { TacticalModal } from '../ui/TacticalModal';

export const SensitiveDataToggle: React.FC = () => {
  const { isEnabled, setEnabled, acknowledged, setAcknowledged, isLoading } = useSensitiveData();
  const [showModal, setShowModal] = useState(false);

  const handleToggle = () => {
    if (isEnabled) {
      setEnabled(false);
    } else {
      if (!acknowledged) {
        setShowModal(true);
      } else {
        setEnabled(true);
      }
    }
  };

  const handleConfirm = () => {
    setAcknowledged(true);
    setEnabled(true);
    setShowModal(false);
  };

  return (
    <>
      <Button variant="cyber"
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
          ${isEnabled
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }
        `}
      >
        {isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
        <span>{isEnabled ? 'Чутливі дані: ВКЛ' : 'Чутливі дані: ВИКЛ'}</span>
      </Button>

      <TacticalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="ДОСТУП ДО ЧУТЛИВИХ ДАНИХ"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#c9a227]/10 rounded-full flex items-center justify-center ring-1 ring-[#c9a227]/30">
              <AlertTriangle className="text-[#c9a227]" size={24} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-[#e8e8e8] uppercase tracking-wider">УВАГА</h3>
              <p className="font-interface text-xs text-[#5a5a5a]">PII Access Request</p>
            </div>
          </div>

          <p className="font-interface text-sm text-[#8a8a8a] leading-relaxed">
            Ви намагаєтесь увімкнути відображення персональних даних (PII).
            Ця дія буде <strong className="text-[#c9a227]">зафіксована в журналі аудиту</strong> з вашим ID та IP-адресою.
          </p>

          <div className="glass-obsidian rounded-xl p-4 border-l-2 border-[#c9a227]/40">
            <p className="font-interface text-xs text-[#c9a227]/80">
              Я підтверджую, що маю законні підстави для доступу до цієї інформації та несу відповідальність за її нерозголошення.
            </p>
          </div>
        </div>
      </TacticalModal>
    </>
  );
};
