/**
 * ♿ Accessibility Utilities & Components
 *
 * ARIA helpers, keyboard navigation, screen reader support,
 * and focus management for WCAG 2.1 compliance.
 */

import React, { useEffect, useRef, useCallback, ReactNode, KeyboardEvent } from 'react';
import { cn } from '../../utils/cn';

// ========================
// Screen Reader Only Text
// ========================

interface SrOnlyProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export const SrOnly: React.FC<SrOnlyProps> = ({ children, as: Component = 'span' }) => (
  <Component className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
    {children}
  </Component>
);

// ========================
// Skip Link (for keyboard navigation)
// ========================

interface SkipLinkProps {
  href: string;
  children?: ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children = 'Перейти до основного вмісту'
}) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
  >
    {children}
  </a>
);

// ========================
// Focus Trap
// ========================

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocus = true,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus and set initial focus
  useEffect(() => {
    if (!active) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const container = containerRef.current;
    if (container) {
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        (focusable[0] as HTMLElement).focus();
      }
    }

    // Restore focus on unmount
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, restoreFocus]);

  // Handle Tab key for focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!active || e.key !== 'Tab') return;

    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [active]);

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </div>
  );
};

// ========================
// Roving Focus
// ========================

interface RovingFocusProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  className?: string;
}

export const RovingFocus: React.FC<RovingFocusProps> = ({
  children,
  orientation = 'both',
  loop = true,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const currentIndex = focusable.findIndex(el => el === document.activeElement);
    let nextIndex = currentIndex;

    const isVertical = orientation === 'vertical' || orientation === 'both';
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';

    switch (e.key) {
      case 'ArrowDown':
        if (isVertical) {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          nextIndex = currentIndex + 1;
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          nextIndex = currentIndex - 1;
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = focusable.length - 1;
        break;
      default:
        return;
    }

    // Handle looping
    if (loop) {
      if (nextIndex < 0) nextIndex = focusable.length - 1;
      if (nextIndex >= focusable.length) nextIndex = 0;
    } else {
      nextIndex = Math.max(0, Math.min(nextIndex, focusable.length - 1));
    }

    (focusable[nextIndex] as HTMLElement).focus();
  }, [orientation, loop]);

  return (
    <div
      ref={containerRef}
      role="group"
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </div>
  );
};

// ========================
// Live Region (for announcements)
// ========================

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearAfter?: number;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  clearAfter = 5000
}) => {
  const [announcement, setAnnouncement] = React.useState(message);

  useEffect(() => {
    setAnnouncement(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => setAnnouncement(''), clearAfter);
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

// ========================
// Accessible Button
// ========================

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  loading = false,
  loadingText = 'Завантаження...',
  icon,
  iconPosition = 'left',
  disabled,
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <SrOnly>{loadingText}</SrOnly>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
        </>
      )}
    </button>
  );
};

// ========================
// Helper Functions
// ========================

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(', ');

export const getFocusableElements = (container: HTMLElement): NodeListOf<Element> => {
  return container.querySelectorAll(FOCUSABLE_SELECTOR);
};

export const isElementFocusable = (element: Element): boolean => {
  return element.matches(FOCUSABLE_SELECTOR);
};

// Keyboard navigation helpers
export const handleArrowNavigation = (
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): number => {
  const isNext =
    (orientation === 'vertical' && e.key === 'ArrowDown') ||
    (orientation === 'horizontal' && e.key === 'ArrowRight');
  const isPrev =
    (orientation === 'vertical' && e.key === 'ArrowUp') ||
    (orientation === 'horizontal' && e.key === 'ArrowLeft');

  if (!isNext && !isPrev) return currentIndex;

  e.preventDefault();
  let newIndex = currentIndex;

  if (isNext) {
    newIndex = (currentIndex + 1) % items.length;
  } else if (isPrev) {
    newIndex = (currentIndex - 1 + items.length) % items.length;
  }

  items[newIndex]?.focus();
  return newIndex;
};

// ========================
// Hooks
// ========================

/**
 * Hook to announce messages to screen readers
 */
export const useAnnounce = () => {
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.textContent = message;

    document.body.appendChild(region);

    setTimeout(() => {
      document.body.removeChild(region);
    }, 1000);
  }, []);

  return announce;
};

/**
 * Hook to manage focus visibility (focus-visible polyfill behavior)
 */
export const useFocusVisible = () => {
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

export default {
  SrOnly,
  SkipLink,
  FocusTrap,
  RovingFocus,
  LiveRegion,
  AccessibleButton,
  getFocusableElements,
  isElementFocusable,
  handleArrowNavigation,
  useAnnounce,
  useFocusVisible,
};
