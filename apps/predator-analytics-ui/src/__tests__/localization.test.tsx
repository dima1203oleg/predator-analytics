import { render, screen } from '@testing-library/react';
import App from '../App';

// Тест перевіряє, що в UI не залишилось англійських слів (латинських букв) у візуальному тексті.
describe('Локалізація UI', () => {
  test('не містить англійських слів', async () => {
    render(<App />);
    // Отримати усі текстові вузли, що не порожні
    const allText = document.body.textContent || '';
    // Регулярний вираз шукає будь‑яку послідовність латинських букв довжиною >=3
    const englishWord = /[A-Za-z]{3,}/;
    expect(englishWord.test(allText)).toBeFalsy();
  });
});
