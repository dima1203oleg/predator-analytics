import { Button } from '@/components/ui/button';
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideToExecute } from '../polish/SlideToExecute';
import { TacticalModal } from '../ui/TacticalModal';
import { useUISound, UISoundType } from '@/hooks/useUISound';

/**
 * ═══════════════════════════════════════════════════════════════
 * RED BUTTON COMPONENT - Emergency Protocol UI
 * Predator v45 | Neural Analytics*
 * Три рівні екстреної зупинки:
 * Level 1: PAUSE - Призупинити SOM
 * Level 2: ISOLATE - Ізолювати від production
 * Level 3: SHUTDOWN - Повне вимкнення
 * ═══════════════════════════════════════════════════════════════
 */

interface RedButtonProps {
  onActivate: (level: 1 | 2 | 3, confirmationCode: string) => Promise<void>;
  onDeactivate: () => Promise<void>;
  currentEmergencyLevel: number | null;
  isLoading?: boolean;
}

const EMERGENCY_LEVELS = {
  1: {
    name: 'PAUSE',
    nameUk: 'ПАУЗА',
    description: 'Призупинити всі автономні дії SOM',
    code: 'PAUSE_SOM_ALPHA',
    color: '#f59e0b', // amber
    icon: '⏸️',
  },
  2: {
    name: 'ISOLATE',
    nameUk: 'ІЗОЛЯЦІЯ',
    description: 'Ізолювати SOM від production середовища',
    code: 'ISOLATE_SOM_BETA',
    color: '#f97316', // orange
    icon: '🔒',
  },
  3: {
    name: 'SHUTDOWN',
    nameUk: 'ВИМКНЕННЯ',
    description: 'Повне вимкнення системи зі збереженням стану',
    code: 'SHUTDOWN_SOM_OMEGA',
    color: '#ef4444', // red
    icon: '⛔',
  },
};

export const RedButton: React.FC<RedButtonProps> = ({
  onActivate,
  onDeactivate,
  currentEmergencyLevel,
  isLoading = false,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { play } = useUISound();

  const handleLevelClick = useCallback((level: 1 | 2 | 3) => {
    if (currentEmergencyLevel) return;
    play(UISoundType.CLICK, 90);
    setSelectedLevel(level);
    setShowConfirmDialog(true);
    setConfirmationInput('');
    setError(null);
  }, [currentEmergencyLevel, play]);

  const handleConfirm = useCallback(async () => {
    if (!selectedLevel) return;

    const expectedCode = EMERGENCY_LEVELS[selectedLevel].code;
    if (confirmationInput !== expectedCode) {
      play(UISoundType.ERROR, 120);
      setError('Невірний код підтвердження');
      return;
    }

    try {
      await onActivate(selectedLevel, confirmationInput);
      play(UISoundType.SUCCESS, 100);
      setShowConfirmDialog(false);
      setSelectedLevel(null);
      setConfirmationInput('');
    } catch (err) {
      play(UISoundType.ERROR, 120);
      setError('Помилка активації екстреного протоколу');
    }
  }, [selectedLevel, confirmationInput, onActivate, play]);

  const handleDeactivate = useCallback(async () => {
    try {
      await onDeactivate();
      play(UISoundType.SUCCESS, 100);
    } catch (err) {
      play(UISoundType.ERROR, 120);
      setError('Помилка деактивації');
    }
  }, [onDeactivate, play]);

  const handleCancel = useCallback(() => {
    play(UISoundType.CLICK, 60);
    setShowConfirmDialog(false);
    setSelectedLevel(null);
    setConfirmationInput('');
    setError(null);
  }, [play]);

  return (
    <div className="red-button-container">
      <style>{`
        .red-button-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .red-button-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .red-button-title {
          color: #ef4444;
          font-size: 20px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .red-button-subtitle {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 4px;
        }

        .emergency-levels {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .level-button {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 12px;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          text-align: left;
        }

        .level-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        .level-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .level-button.active {
          animation: pulse-border 1.5s infinite;
        }

        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }

        .level-icon {
          font-size: 28px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .level-info {
          flex: 1;
        }

        .level-name {
          font-size: 16px;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 4px;
        }

        .level-description {
          font-size: 13px;
          color: #94a3b8;
        }

        .level-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .confirm-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .confirm-dialog {
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
          border-radius: 20px;
          padding: 32px;
          max-width: 480px;
          width: 90%;
          border: 2px solid rgba(239, 68, 68, 0.5);
          box-shadow: 0 0 60px rgba(239, 68, 68, 0.3);
        }

        .confirm-title {
          color: #ef4444;
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 20px;
        }

        .confirm-warning {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .confirm-warning p {
          color: #fca5a5;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .confirm-input-label {
          color: #94a3b8;
          font-size: 13px;
          margin-bottom: 8px;
          display: block;
        }

        .confirm-code-hint {
          color: #f59e0b;
          font-family: monospace;
          background: rgba(245, 158, 11, 0.1);
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .confirm-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: 2px solid rgba(239, 68, 68, 0.3);
          background: rgba(0, 0, 0, 0.3);
          color: #f8fafc;
          font-size: 16px;
          font-family: monospace;
          margin-bottom: 12px;
          transition: border-color 0.3s;
        }

        .confirm-input:focus {
          outline: none;
          border-color: #ef4444;
        }

        .confirm-error {
          color: #ef4444;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .confirm-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .confirm-button {
          flex: 1;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .confirm-button.cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }

        .confirm-button.cancel:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .confirm-button.activate {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .confirm-button.activate:hover {
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        }

        .confirm-button.activate:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .active-emergency {
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid #ef4444;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }

        .active-emergency-title {
          color: #ef4444;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .active-emergency-level {
          font-size: 48px;
          margin: 16px 0;
        }

        .deactivate-button {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 10px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          transition: all 0.3s;
        }

        .deactivate-button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
        }
      `}</style>

      <div className="red-button-header">
        <span style={{ fontSize: '32px' }}>🔴</span>
        <div>
          <div className="red-button-title">Червона Кнопка</div>
          <div className="red-button-subtitle">Протокол екстреної зупинки системи</div>
        </div>
      </div>

      {currentEmergencyLevel ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="active-emergency"
        >
          <div className="active-emergency-title">
            🚨 АКТИВНИЙ ЕКСТ ЕНИЙ РЕЖИМ
          </div>
          <div className="active-emergency-level">
            {EMERGENCY_LEVELS[currentEmergencyLevel as 1 | 2 | 3].icon}
          </div>
          <div style={{ color: '#fca5a5', fontSize: '16px', marginBottom: '8px' }}>
            рівень {currentEmergencyLevel}: {EMERGENCY_LEVELS[currentEmergencyLevel as 1 | 2 | 3].nameUk}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>
            {EMERGENCY_LEVELS[currentEmergencyLevel as 1 | 2 | 3].description}
          </div>
          <Button variant="cyber"
            className="deactivate-button"
            onClick={handleDeactivate}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Деактивація...' : '✅ Деактивувати екстрений режим'}
          </Button>
        </motion.div>
      ) : (
        <div className="emergency-levels">
          {([1, 2, 3] as const).map((level) => {
            const config = EMERGENCY_LEVELS[level];
            return (
              <motion.button
                key={level}
                className="level-button"
                onClick={() => handleLevelClick(level)}
                onMouseEnter={() => play(UISoundType.HOVER, 80)}
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{ borderColor: `${config.color}33` }}
              >
                <div
                  className="level-icon"
                  style={{ background: `${config.color}20` }}
                >
                  {config.icon}
                </div>
                <div className="level-info">
                  <div className="level-name">
                    рівень {level}: {config.nameUk}
                  </div>
                  <div className="level-description">{config.description}</div>
                </div>
                <div
                  className="level-badge"
                  style={{
                    background: `${config.color}20`,
                    color: config.color,
                  }}
                >
                  Level {level}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <TacticalModal
        isOpen={showConfirmDialog}
        onClose={handleCancel}
        title={`ПІДТВЕРДЖЕННЯ ЕКСТРЕНОГО ПРОТОКОЛУ — РІВЕНЬ ${selectedLevel}`}
        confirmLabel="АКТИВУВАТИ"
        cancelLabel="СКАСУВАТИ"
        onConfirm={handleConfirm}
        danger
        variant="critical"
        glitch
      >
        <div className="space-y-6">
          <div className="glass-obsidian rounded-xl p-6 border-l-2 border-[#e11d48]/40">
            <p className="font-interface text-sm text-[#8a8a8a] leading-relaxed">
              Ви збираєтесь активувати <strong className="text-[#e11d48]">рівень {selectedLevel}: {selectedLevel ? EMERGENCY_LEVELS[selectedLevel].nameUk : ''}</strong>.
              <br /><br />
              {selectedLevel ? EMERGENCY_LEVELS[selectedLevel].description : ''}
              <br /><br />
              Для підтвердження введіть код нижче:
            </p>
          </div>

          <div>
            <label className="font-display text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-[0.1em] mb-2 block">
              КОД ПІДТВЕРДЖЕННЯ
            </label>
            <div className="font-data text-lg text-[#c9a227] tracking-wider mb-3">
              {selectedLevel ? EMERGENCY_LEVELS[selectedLevel].code : ''}
            </div>
            <input
              type="text"
              className="w-full bg-[#0a0a0c] border border-[#1a1a1c] rounded-xl px-4 py-3 font-data text-sm text-[#e8e8e8] placeholder-[#3a3a3c] focus:border-[#e11d48]/40 focus:outline-none transition-colors"
              placeholder="Введіть код підтвердження..."
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <div className="font-display text-xs text-[#e11d48] uppercase tracking-wider">
              {error}
            </div>
          )}

          <div>
            <SlideToExecute
              label="ПОВЗУНОК ДЛЯ АКТИВАЦІЇ"
              confirmLabel={`АКТИВОВАНО ${selectedLevel ? EMERGENCY_LEVELS[selectedLevel as 1 | 2 | 3].nameUk : ''}`}
              onExecute={handleConfirm}
              onCancel={handleCancel}
              danger
              disabled={!confirmationInput || isLoading}
            />
          </div>
        </div>
      </TacticalModal>
    </div>
  );
};

export default RedButton;
