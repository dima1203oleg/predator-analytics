/**
 * ═══════════════════════════════════════════════════════════════════
 * PREDATOR Room Navigation Store
 * Manages the active room, transition state, and entity context
 * for the spatial 3D environment.
 * ═══════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';

export type RoomId =
  | 'hub'
  | 'simulation'
  | 'twin'
  | 'graph'
  | 'osint'
  | 'intake'
  | 'forecast'
  | 'investigation'
  | 'anomaly'
  | 'avatar'
  | 'memory'
  | 'risk'
  | 'market';

export interface RoomDefinition {
  id: RoomId;
  label: string;
  labelUK: string;
  icon: string;
  color: string;
  glowColor: string;
  description: string;
  route: string;
  /** Polar angle (radians) around the hub center */
  angle: number;
  /** Distance from hub center */
  radius: number;
}

export const ROOMS: RoomDefinition[] = [
  {
    id: 'simulation',
    label: 'Simulation',
    labelUK: 'Симуляція',
    icon: '⟁',
    color: '#a855f7',
    glowColor: 'rgba(168,85,247,0.4)',
    description: 'Моделювання сценаріїв — "що буде якщо"',
    route: '/room/simulation',
    angle: 0,
    radius: 14,
  },
  {
    id: 'twin',
    label: 'Digital Twin',
    labelUK: 'Цифровий Двійник',
    icon: '◈',
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.4)',
    description: 'Жива модель об\'єкта: людина / компанія / контрагент',
    route: '/room/twin',
    angle: (Math.PI * 2) / 9,
    radius: 14,
  },
  {
    id: 'graph',
    label: 'Graph Intel',
    labelUK: 'Граф Зв\'язків',
    icon: '⬡',
    color: '#22c55e',
    glowColor: 'rgba(34,197,94,0.4)',
    description: 'Мережевий аналіз — структура зв\'язків між об\'єктами',
    route: '/room/graph',
    angle: (Math.PI * 4) / 9,
    radius: 14,
  },
  {
    id: 'osint',
    label: 'OSINT',
    labelUK: 'OSINT Розвідка',
    icon: '◎',
    color: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.4)',
    description: 'Потоковий аналіз відкритих джерел: Telegram, веб, медіа',
    route: '/room/osint',
    angle: (Math.PI * 6) / 9,
    radius: 14,
  },
  {
    id: 'intake',
    label: 'Data Intake',
    labelUK: 'Завантаження Даних',
    icon: '⬇',
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.4)',
    description: 'Drag-drop: CSV, Excel, Telegram, URL, API, відео',
    route: '/room/intake',
    angle: (Math.PI * 8) / 9,
    radius: 14,
  },
  {
    id: 'forecast',
    label: 'Prediction',
    labelUK: 'Прогнозування',
    icon: '◇',
    color: '#10b981',
    glowColor: 'rgba(16,185,129,0.4)',
    description: 'Тренди, ризики, фінансові прогнози, поведінкові моделі',
    route: '/room/forecast',
    angle: (Math.PI * 10) / 9,
    radius: 14,
  },
  {
    id: 'investigation',
    label: 'Investigation',
    labelUK: 'Розслідування',
    icon: '⌖',
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.4)',
    description: 'Справи, таймлайни, доказові ланцюги',
    route: '/room/investigation',
    angle: (Math.PI * 12) / 9,
    radius: 14,
  },
  {
    id: 'anomaly',
    label: 'Anomaly',
    labelUK: 'Аномалії',
    icon: '⚠',
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.4)',
    description: 'Статистичні відхилення, фінансові аномалії, патерни',
    route: '/room/anomaly',
    angle: (Math.PI * 14) / 9,
    radius: 14,
  },
  {
    id: 'risk',
    label: 'Risk Chamber',
    labelUK: 'Кімната Ризиків',
    icon: '☢',
    color: '#dc2626',
    glowColor: 'rgba(220,38,38,0.5)',
    description: 'Концентрація загроз, червоні зони, live threat radar',
    route: '/room/risk',
    angle: (Math.PI * 16) / 9,
    radius: 14,
  },
];

export type TransitionPhase = 'idle' | 'entering' | 'active' | 'exiting';

interface RoomState {
  activeRoom: RoomId;
  previousRoom: RoomId | null;
  transitionPhase: TransitionPhase;
  transitionTarget: RoomId | null;
  /** Entity ID loaded in DigitalTwinRoom */
  activeEntityId: string | null;
  /** Observer | Operator | Analyst */
  userMode: 'observer' | 'operator' | 'analyst';

  // Actions
  navigateTo: (roomId: RoomId, entityId?: string) => void;
  returnToHub: () => void;
  setUserMode: (mode: 'observer' | 'operator' | 'analyst') => void;
  completeTransition: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  activeRoom: 'hub',
  previousRoom: null,
  transitionPhase: 'idle',
  transitionTarget: null,
  activeEntityId: null,
  userMode: 'operator',

  navigateTo: (roomId, entityId) => {
    const { activeRoom } = get();
    if (roomId === activeRoom) return;

    set({
      transitionPhase: 'entering',
      transitionTarget: roomId,
      activeEntityId: entityId ?? null,
    });

    // After camera zoom animation (600ms), switch room
    setTimeout(() => {
      set({
        activeRoom: roomId,
        previousRoom: activeRoom,
        transitionPhase: 'active',
        transitionTarget: null,
      });
    }, 600);
  },

  returnToHub: () => {
    const { activeRoom } = get();
    set({ transitionPhase: 'exiting' });
    setTimeout(() => {
      set({
        activeRoom: 'hub',
        previousRoom: activeRoom,
        transitionPhase: 'idle',
        activeEntityId: null,
      });
    }, 500);
  },

  setUserMode: (mode) => set({ userMode: mode }),

  completeTransition: () => set({ transitionPhase: 'idle' }),
}));
