import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerEchartsThemes } from './utils/echartsTheme';

const rootElement = document.getElementById('root');
if (rootElement) {
    registerEchartsThemes();
    const root = createRoot(rootElement);
    root.render(<App />);
}
