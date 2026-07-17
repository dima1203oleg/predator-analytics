/**
 *   React.memo Optimization Utilities
 *
 * Higher-order components and utilities for optimal memoization.
 * Prevents unnecessary re-renders in complex component trees.
 */

import React, { memo, useMemo, useCallback, ComponentType, ReactNode } from 'react';

// ========================
// Deep Comparison
// ========================

/**
 * Deep comparison function for complex objects
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
};

// ========================
// Memoization Helpers
// ========================

/**
 * Create a memoized version of a function with custom comparison
 */
export const memoizeOne = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  isEqual: (a: Parameters<T>, b: Parameters<T>) => boolean = (a, b) =>
    a.length === b.length && a.every((arg, i) => arg === b[i])
): T => {
  let lastArgs: Parameters<T> | null = null;
  let lastResult: ReturnType<T>;

  return ((...args: Parameters<T>) => {
    if (lastArgs && isEqual(args, lastArgs)) {
      return lastResult;
    }
    lastArgs = args;
    lastResult = fn(...args) as ReturnType<T>;
    return lastResult;
  }) as T;
};

// ========================
// HOC for Deep Memo
// ========================

/**
 * Higher-order component that applies React.memo with deep comparison
 */
export function withDeepMemo<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<ComponentType<P>> {
  return memo(Component, propsAreEqual || ((prev, next) => deepEqual(prev, next)));
}

/**
 * Higher-order component that memos based on specific prop keys
 */
export function withSelectiveMemo<P extends object>(
  Component: ComponentType<P>,
  keys: (keyof P)[]
): React.MemoExoticComponent<ComponentType<P>> {
  return memo(Component, (prev, next) => {
    return keys.every(key => prev[key] === next[key]);
  });
}

// ========================
// Optimized Context Consumer
// ========================

interface OptimizedContextProps<T> {
  context: React.Context<T>;
  selector: (state: T) => unknown;
  children: (selectedState: unknown) => ReactNode;
}

/**
 * Context consumer that only re-renders when selected value changes
 */
export function OptimizedContextConsumer<T>({
  context,
  selector,
  children
}: OptimizedContextProps<T>) {
  const contextValue = React.useContext(context);
  const selectedValue = useMemo(() => selector(contextValue), [contextValue, selector]);

  return <>{children(selectedValue)}</>;
}

// ========================
// Stable Callback Hook
// ========================

/**
 * Creates a stable callback reference that always calls the latest function
 * Useful when you need a stable reference but the function depends on changing values
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = React.useRef(callback);

  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

// ========================
// Memoized Object/Array Hook
// ========================

/**
 * Returns a memoized object that only changes when its deep content changes
 */
export function useMemoizedObject<T extends object>(obj: T): T {
  const ref = React.useRef(obj);

  if (!deepEqual(ref.current, obj)) {
    ref.current = obj;
  }

  return ref.current;
}

/**
 * Returns a memoized array that only changes when its content changes
 */
export function useMemoizedArray<T>(arr: T[]): T[] {
  const ref = React.useRef(arr);

  if (
    ref.current.length !== arr.length ||
    !ref.current.every((item, i) => item === arr[i])
  ) {
    ref.current = arr;
  }

  return ref.current;
}

// ========================
// Component Optimization Wrapper
// ========================

interface OptimizedProps {
  children: ReactNode;
  deps?: unknown[];
}

/**
 * Wrapper component that memoizes its children based on deps
 */
export const Optimized: React.FC<OptimizedProps> = memo(({ children, deps = [] }) => {
  const memoizedChildren = useMemo(() => children, deps);
  return <>{memoizedChildren}</>;
}, (prev, next) => {
  if (!prev.deps || !next.deps) return prev.children === next.children;
  return prev.deps.length === next.deps.length &&
    prev.deps.every((dep, i) => dep === next.deps![i]);
});

// ========================
// Render Prop Optimizer
// ========================

interface RenderOptimizedProps<T> {
  data: T;
  render: (data: T) => ReactNode;
}

/**
 * Optimized render prop pattern
 */
export function RenderOptimized<T>({ data, render }: RenderOptimizedProps<T>) {
  const renderedContent = useMemo(() => render(data), [data, render]);
  return <>{renderedContent}</>;
}

// ========================
// List Item Optimization
// ========================

interface OptimizedListItemProps<T> {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => ReactNode;
}

/**
 * Optimized list item wrapper
 */
export const OptimizedListItem = memo(<T,>({
  item,
  index,
  renderItem
}: OptimizedListItemProps<T>) => {
  return <>{renderItem(item, index)}</>;
}) as <T>(props: OptimizedListItemProps<T>) => JSX.Element;

// ========================
// Exports
// ========================

export default {
  deepEqual,
  memoizeOne,
  withDeepMemo,
  withSelectiveMemo,
  OptimizedContextConsumer,
  useStableCallback,
  useMemoizedObject,
  useMemoizedArray,
  Optimized,
  RenderOptimized,
  OptimizedListItem,
};
