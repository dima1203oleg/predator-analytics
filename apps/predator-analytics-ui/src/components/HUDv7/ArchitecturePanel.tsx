import React from 'react';
import { Network, Cpu, Database, BrainCircuit, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ArchitecturePanel = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 text-xs font-mono">
      <div className="mb-4">
        <h3 className="text-cyan-tactical uppercase tracking-widest border-b border-cyan-tactical/30 pb-1 mb-2">{t('hud.system_architecture')}</h3>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-cyan-tactical/50 flex items-center justify-center bg-obsidian text-cyan-tactical">
          <Cpu size={14} />
        </div>
        <div>
          <div className="text-cyan-tactical/80 font-bold uppercase tracking-wider">{t('hud.void_forge')}</div>
          <div className="text-[10px] text-cyan-tactical/50">{t('hud.void_forge_desc')}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-cyan-tactical/80 flex items-center justify-center bg-cyan-tactical/10 text-cyan-tactical shadow-[0_0_10px_rgba(0,229,255,0.3)]">
          <BrainCircuit size={14} />
        </div>
        <div>
          <div className="text-cyan-tactical font-bold uppercase tracking-wider">{t('hud.quantum_mind')}</div>
          <div className="text-[10px] text-cyan-tactical/60">{t('hud.quantum_mind_desc')}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-cyan-tactical/50 flex items-center justify-center bg-obsidian text-cyan-tactical">
          <Database size={14} />
        </div>
        <div>
          <div className="text-cyan-tactical/80 font-bold uppercase tracking-wider">{t('hud.knowledge_universe')}</div>
          <div className="text-[10px] text-cyan-tactical/50">{t('hud.knowledge_universe_desc')}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-cyan-tactical/50 flex items-center justify-center bg-obsidian text-cyan-tactical">
          <Network size={14} />
        </div>
        <div>
          <div className="text-cyan-tactical/80 font-bold uppercase tracking-wider">{t('hud.ai_reasoning')}</div>
          <div className="text-[10px] text-cyan-tactical/50">{t('hud.ai_reasoning_desc')}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-cyan-tactical/50 flex items-center justify-center bg-obsidian text-cyan-tactical">
          <User size={14} />
        </div>
        <div>
          <div className="text-cyan-tactical/80 font-bold uppercase tracking-wider">{t('hud.user')}</div>
          <div className="text-[10px] text-cyan-tactical/50">{t('hud.user_desc')}</div>
        </div>
      </div>
    </div>
  );
};
