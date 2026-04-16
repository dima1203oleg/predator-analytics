/**
 * PREDATOR v56.5-ELITE — Канонічні пресети анімацій (Framer Motion)
 * Єдине джерело для всіх motion-конфігурацій.
 */

/** Стандартні transition пресети */
export const TRANSITION = {
  fast:   { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const },
  normal: { duration: 0.3,  ease: [0.4, 0, 0.2, 1] as const },
  slow:   { duration: 0.5,  ease: [0.23, 1, 0.32, 1] as const },
  spring: { type: 'spring' as const, damping: 25, stiffness: 200 },
  bounce: { type: 'spring' as const, damping: 15, stiffness: 300 },
} as const;

/** Варіанти для сторінок (enter / exit) */
export const PAGE_VARIANTS = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
} as const;

/** Stagger-контейнер + елемент для списків */
export const STAGGER = {
  container: {
    initial: {},
    animate: { transition: { staggerChildren: 0.05 } },
  },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: TRANSITION.normal },
  },
  itemFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: TRANSITION.fast },
  },
} as const;

/** Hover-ефекти для карток */
export const HOVER = {
  lift:  { y: -4, transition: { duration: 0.2 } },
  scale: { scale: 1.02, transition: { duration: 0.2 } },
  glow:  { boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)', transition: { duration: 0.3 } },
} as const;

/** Пульсація для статус-індикаторів */
export const PULSE = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
  },
} as const;

/** Fade-in з масштабуванням */
export const FADE_SCALE = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: TRANSITION.normal },
  exit:    { opacity: 0, scale: 0.95, transition: TRANSITION.fast },
} as const;

/** Sidebar collapse/expand */
export const SIDEBAR = {
  width: {
    open: 280,
    closed: 72,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const },
  },
  label: {
    show: { opacity: 1, x: 0, display: 'block', transition: { delay: 0.1, duration: 0.2 } },
    hide: { opacity: 0, x: -10, transitionEnd: { display: 'none' }, transition: { duration: 0.15 } },
  },
} as const;
