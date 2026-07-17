import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArchitecturePanel } from './ArchitecturePanel';
import { SystemStatePanel } from './SystemStatePanel';
import { DialoguePanel } from './DialoguePanel';
import { ThinkingTimeline } from './ThinkingTimeline';
import { LivingArchives } from './LivingArchives';
import { ActiveReasoning } from './ActiveReasoning';
import { CognitiveStatesGrid } from './CognitiveStatesGrid';

export const HUDv7 = () => {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      {/* TOP SECTION */}
      <div className="flex justify-between items-start pointer-events-auto">
        {/* TOP LEFT */}
        <div className="flex flex-col gap-6">
          <div className="font-mono text-xs max-w-xs">
            <h2 className="text-cyan-tactical tracking-widest uppercase text-sm mb-2">{t('hud.welcome')}</h2>
            <p className="text-cyan-tactical/60 leading-relaxed">
              {t('hud.welcome_desc')}
            </p>
          </div>
          <ArchitecturePanel />
        </div>

        {/* TOP CENTER - Title */}
        <div className="flex flex-col items-center pointer-events-none mt-2">
          <div className="text-cyan-tactical/50 tracking-[0.5em] text-xs font-mono uppercase mb-1">Predator Analytics</div>
          <h1 className="text-cyan-tactical text-5xl font-light tracking-widest uppercase drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">{t('hud.title_main')}</h1>
          <div className="text-cyan-tactical/60 text-[10px] tracking-widest uppercase mt-2">{t('hud.title_sub')}</div>
        </div>

        {/* TOP RIGHT */}
        <div className="flex flex-col gap-6 items-end">
          <SystemStatePanel />
          <div className="mt-8">
            <DialoguePanel />
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="flex flex-col gap-4 pointer-events-auto">
        {/* TIMELINE */}
        <div className="w-full">
          <ThinkingTimeline />
        </div>

        {/* 3 BOTTOM PANELS */}
        <div className="flex justify-between items-stretch gap-6 h-64">
          <LivingArchives />
          <ActiveReasoning />
          <CognitiveStatesGrid />
        </div>
        
        {/* FOOTER */}
        <div className="flex justify-center mt-2 pointer-events-none">
          <div className="flex flex-col items-center">
            <div className="text-cyan-tactical/40 text-[10px] tracking-widest uppercase">{t('hud.footer_tagline')}</div>
            <div className="text-cyan-tactical/20 text-[8px] tracking-[0.3em] uppercase mt-1">{t('hud.footer_sub')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
