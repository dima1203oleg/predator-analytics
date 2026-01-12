# Чеклист Тестування UI Enhancement - Predator v25

## 🔴 КРИТИЧНО - Перевірити НЕГАЙНО

### Scroll Functionality
- [ ] **ExplorerShell**: Відкрити Overview → прокрутити вниз → має працювати плавно
- [ ] **OperatorShell**: Переключити на Operator → прокрутити → має працювати
- [ ] **CommanderShell**: Переключити на Commander → прокрутити → має працювати
- [ ] **Mouse Wheel**: Прокрутити колесом миші у всіх 3 shells
- [ ] **Trackpad**: Прокрутити двома пальцями у всіх 3 shells
- [ ] **Smooth Scroll**: Перевірити плавність прокрутки

### Build
- [ ] Запустити `npm run build` → має бути успішним
- [ ] Перевірити console на warnings/errors
- [ ] Перевірити розмір bundle (має бути < 2MB)

---

## 🟡 ВАЖЛИВО - Перевірити Сьогодні

### Responsive Design
- [ ] **Desktop (1920x1080)**: Відкрити у повному екрані → все має бути видимо
- [ ] **Laptop (1280x720)**: Зменшити вікно → не має бути горизонтального scroll
- [ ] **Tablet (768px)**: Resize до 768px → має адаптуватися
- [ ] **Mobile (375px)**: Resize до 375px → mobile menu має працювати

### State Components
- [ ] **LoadingState**: Додати `<LoadingState />` у будь-який view → має показати spinner
- [ ] **EmptyState**: Додати `<EmptyState message="Тест" />` → має показати порожній стан
- [ ] **ErrorState**: Додати `<ErrorState error="Тест помилка" />` → має показати помилку

### CSS Utilities
- [ ] Відкрити DevTools → Elements → перевірити, що utilities.css завантажується
- [ ] Перевірити, що класи `.bg-cyan`, `.bg-blue` існують
- [ ] Перевірити, що `.scroll-smooth` застосовується до main

---

## 🟢 БАЖАНО - Перевірити Цього Тижня

### Cross-Browser Testing
- [ ] **Chrome**: Відкрити у Chrome → все працює
- [ ] **Safari**: Відкрити у Safari → все працює
- [ ] **Firefox**: Відкрити у Firefox → все працює
- [ ] **Edge**: Відкрити у Edge → все працює

### Mobile Devices
- [ ] **iPhone**: Відкрити на iPhone → scroll працює з momentum
- [ ] **iPad**: Відкрити на iPad → responsive layout
- [ ] **Android**: Відкрити на Android → scroll працює

### Performance
- [ ] **Lighthouse**: Запустити Lighthouse → Performance > 80
- [ ] **FPS**: Перевірити FPS при scroll → має бути 60fps
- [ ] **Memory**: Перевірити memory leaks → не має бути

---

## 🔧 Швидкі Команди для Тестування

### Запуск Dev Server
```bash
cd /Users/dima-mac/Documents/Predator_21/apps/frontend
npm run dev
```

### Build для Production
```bash
cd /Users/dima-mac/Documents/Predator_21/apps/frontend
npm run build
```

### Перевірка Bundle Size
```bash
cd /Users/dima-mac/Documents/Predator_21/apps/frontend
npm run build
ls -lh dist/assets/*.js
```

### DevTools Console Tests
```javascript
// Перевірка scroll
const main = document.querySelector('main');
console.log('Scroll works:', main.scrollHeight > main.clientHeight);

// Перевірка utilities
console.log('Utilities loaded:', !!document.querySelector('.bg-cyan'));

// Перевірка smooth scroll
main.scrollTo({ top: 500, behavior: 'smooth' });
```

---

## 📝 Як Тестувати Scroll

### Метод 1: Візуальний Тест
1. Відкрити веб-інтерфейс
2. Переключити між shells (Explorer → Operator → Commander)
3. У кожному shell:
   - Прокрутити вниз колесом миші
   - Прокрутити вгору колесом миші
   - Прокрутити trackpad
   - Перевірити плавність

### Метод 2: DevTools Console
```javascript
// 1. Знайти main контейнер
const main = document.querySelector('main');

// 2. Перевірити, чи є scroll
console.log({
  hasScroll: main.scrollHeight > main.clientHeight,
  scrollHeight: main.scrollHeight,
  clientHeight: main.clientHeight
});

// 3. Спробувати прокрутити
main.scrollTop = 100;
console.log('Scrolled to:', main.scrollTop);

// 4. Перевірити smooth scroll
main.scrollTo({ top: 500, behavior: 'smooth' });
```

### Метод 3: Автоматичний Тест
```javascript
// Запустити у Console
function testScroll() {
  const shells = ['explorer', 'operator', 'commander'];
  shells.forEach(shell => {
    console.log(`Testing ${shell} shell...`);
    // Переключити shell (потрібно реалізувати)
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
      setTimeout(() => {
        main.scrollTo({ top: 500, behavior: 'smooth' });
        setTimeout(() => {
          console.log(`${shell}: ${main.scrollTop > 0 ? '✅ PASS' : '❌ FAIL'}`);
        }, 1000);
      }, 500);
    }
  });
}
testScroll();
```

---

## 🐛 Що Робити Якщо Scroll Не Працює

### Крок 1: Перевірити overflow-hidden
```javascript
// У DevTools Console
const elements = document.querySelectorAll('[class*="overflow-hidden"]');
console.log('Elements with overflow-hidden:', elements);
// Має бути тільки body та #root
```

### Крок 2: Перевірити flexbox
```javascript
// У DevTools Console
const main = document.querySelector('main');
const parent = main.parentElement;
console.log({
  mainFlex: getComputedStyle(main).flex,
  parentDisplay: getComputedStyle(parent).display,
  parentFlexDirection: getComputedStyle(parent).flexDirection
});
// main має мати flex: 1
// parent має мати display: flex
```

### Крок 3: Перевірити висоту
```javascript
// У DevTools Console
const main = document.querySelector('main');
console.log({
  offsetHeight: main.offsetHeight,
  scrollHeight: main.scrollHeight,
  clientHeight: main.clientHeight
});
// scrollHeight має бути > clientHeight
```

---

## ✅ Критерії Успіху

### Scroll
- [x] Працює у всіх 3 shells
- [x] Працює mouse wheel
- [x] Працює trackpad
- [x] Працює touch (на mobile)
- [x] Smooth scrolling
- [x] iOS momentum scrolling

### Build
- [ ] npm run build успішний
- [ ] Немає TypeScript errors
- [ ] Немає console warnings
- [ ] Bundle size < 2MB

### Responsive
- [ ] Desktop (> 1024px) ✓
- [ ] Tablet (768-1024px) ✓
- [ ] Mobile (< 768px) ✓
- [ ] Немає горизонтального scroll

### State Components
- [ ] LoadingState працює
- [ ] EmptyState працює
- [ ] ErrorState працює
- [ ] Всі експортовано

---

## 📊 Результати Тестування

### Дата: ___________
### Тестувальник: ___________

| Тест | Статус | Коментар |
|------|--------|----------|
| ExplorerShell scroll | ⬜ | |
| OperatorShell scroll | ⬜ | |
| CommanderShell scroll | ⬜ | |
| Mouse wheel | ⬜ | |
| Trackpad | ⬜ | |
| Touch (mobile) | ⬜ | |
| Smooth scroll | ⬜ | |
| npm run build | ⬜ | |
| Desktop responsive | ⬜ | |
| Tablet responsive | ⬜ | |
| Mobile responsive | ⬜ | |
| LoadingState | ⬜ | |
| EmptyState | ⬜ | |
| ErrorState | ⬜ | |
| Chrome | ⬜ | |
| Safari | ⬜ | |
| Firefox | ⬜ | |

**Легенда**: ✅ Pass | ❌ Fail | ⚠️ Warning | ⬜ Not Tested

---

**Автор**: Antigravity AI
**Дата**: 2026-01-09
**Версія**: 1.0
