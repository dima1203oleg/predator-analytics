/**
 * Простий скрипт для перевірки React компонентів
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import TestComponent from './src/components/dashboard/TestComponent';

try {
  const html = renderToString(React.createElement(TestComponent));
  console.log('✅ React працює нормально');
  console.log('Вихідний HTML:', html.substring(0, 200));
  process.exit(0);
} catch (error) {
  console.error('❌ Помилка React рендерингу:', error.message);
  console.error(error.stack);
  process.exit(1);
}
