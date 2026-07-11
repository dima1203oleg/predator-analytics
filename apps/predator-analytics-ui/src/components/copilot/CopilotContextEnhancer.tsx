import React from 'react';
import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import { useCognitiveStore } from '../../store/cognitiveStore';

export const CopilotContextEnhancer: React.FC = () => {
  const telemetry = useCognitiveStore((s) => s.telemetry);
  const activeNeuron = useCognitiveStore((s) => s.activeNeuron);
  const currentState = useCognitiveStore((s) => s.currentState);

  // Надаємо агенту знання про поточний стан системи
  useCopilotReadable({
    description: 'Поточний стан PREDATOR Analytics (телеметрія та когнітивний режим).',
    value: {
      telemetry,
      currentState,
    },
  });

  // Надаємо агенту знання про обраний нейрон (якщо є)
  useCopilotReadable({
    description: 'Дані поточного обраного аналітичного вузла (нейрона) в OSINT-мозку.',
    value: activeNeuron || 'Немає обраного вузла.',
  });

  // Додатковий екшн для зміни стану системи через AI
  const setState = useCognitiveStore((s) => s.setState);
  useCopilotAction({
    name: 'changeCognitiveState',
    description: 'Змінює режим роботи квантового мозку PREDATOR.',
    parameters: [
      {
        name: 'newState',
        type: 'string',
        description: 'Новий стан (Contemplation, Correlation, Inference, Validation, Discovery, Prediction, Optimization, Alert, Learning)',
        required: true,
      }
    ],
    handler: (args) => {
      setState(args.newState as any);
      return `Стан системи змінено на ${args.newState}`;
    },
  });

  return null;
};
