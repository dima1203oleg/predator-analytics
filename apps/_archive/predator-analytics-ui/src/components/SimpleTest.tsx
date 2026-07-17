/**
 * Надпростий тестовий компонент без Three.js
 */

import React from 'react';

export default function SimpleTest() {
  return (
    <div style={{
      backgroundColor: '#050608',
      color: 'white',
      padding: '40px',
      fontFamily: 'monospace',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1 style={{ color: '#00ff41', marginBottom: '20px' }}>
        ПРОСТИЙ ТЕСТ REACT
      </h1>
      <div style={{ fontSize: '18px', marginBottom: '20px' }}>
        Якщо ви бачите цей текст, React працює нормально.
      </div>
      <div style={{ color: '#00f0ff', fontSize: '14px' }}>
        Поточний час: {new Date().toLocaleTimeString()}
      </div>
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        border: '1px solid #00f0ff',
        borderRadius: '8px',
        backgroundColor: 'rgba(0, 240, 255, 0.1)'
      }}>
        <div>✅ React рендеринг працює</div>
        <div>✅ CSS стилі працюють</div>
        <div>✅ JavaScript працює</div>
      </div>
    </div>
  );
}
