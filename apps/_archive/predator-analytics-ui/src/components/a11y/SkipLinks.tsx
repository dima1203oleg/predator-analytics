/**
 * 🎯 Accessibility Skip Links — PREDATOR v66.0-ELITE
 * Компонент для швидкої навігації по контенту для користувачів клавіатури
 */
import React from 'react';

export const SkipLinks: React.FC = () => {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[99999] focus:px-4 focus:py-2 focus:bg-rose-600 focus:text-white focus:rounded-lg focus:font-bold focus:shadow-lg"
      >
        Перейти до основного контенту
      </a>
      <a
        href="#sidebar"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[99999] focus:mt-12 focus:px-4 focus:py-2 focus:bg-rose-600 focus:text-white focus:rounded-lg focus:font-bold focus:shadow-lg"
      >
        Перейти до навігації
      </a>
      <a
        href="#search"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[99999] focus:mt-24 focus:px-4 focus:py-2 focus:bg-rose-600 focus:text-white focus:rounded-lg focus:font-bold focus:shadow-lg"
      >
        Перейти до пошуку
      </a>
    </>
  );
};

export default SkipLinks;