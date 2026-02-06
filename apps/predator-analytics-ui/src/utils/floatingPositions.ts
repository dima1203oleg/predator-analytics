/**
 * 🎯 Floating UI Positioning System
 *
 * Централізована система позиціонування для floating елементів
 * щоб уникнути перекриття кнопок
 */

export const FLOATING_POSITIONS = {
  // Right side (bottom to top)
  AI_COPILOT: 'bottom-6 right-6',           // Найнижча кнопка справа
  QUICK_ACTIONS: 'bottom-24 right-6',       // Над AI Copilot (+72px)
  CHAT_WIDGET: 'bottom-[168px] right-6',    // Над Quick Actions (+72px)
  TOASTER: 'bottom-6 right-24',             // Зліва від AI Copilot

  // Left side
  COMMAND_PALETTE: 'bottom-6 left-6',       // Знизу зліва
  SHELL_SWITCHER: 'bottom-24 left-6',       // Над Command Palette

  // Z-indexes
  Z_INDEX: {
    BASE: 40,
    FLOATING_BUTTONS: 50,
    PANELS: 60,
    TOASTS: 9999,
    MODALS: 10000,
  }
} as const;

export type FloatingPosition = typeof FLOATING_POSITIONS[keyof typeof FLOATING_POSITIONS];
