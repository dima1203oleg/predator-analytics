# Архітектура Scroll - Predator v25 Web Interface

## Проблема (ДО виправлення)

```
body (overflow: hidden) ❌
  └─ #root (overflow: hidden) ❌
      └─ Shell Container (overflow: hidden) ❌ ПРОБЛЕМА!
          ├─ Sidebar
          └─ Main Area (overflow: hidden) ❌ ПРОБЛЕМА!
              ├─ Header
              └─ Main Content ❌ Scroll НЕ ПРАЦЮЄ
```

**Проблема**: `overflow: hidden` на Shell Container та Main Area блокував scroll

---

## Рішення (ПІСЛЯ виправлення)

```
body (overflow: hidden) ✅ Блокує scroll body
  └─ #root (overflow: hidden) ✅ Блокує scroll root
      └─ Shell Container (flex, h-screen) ✅ БЕЗ overflow-hidden!
          ├─ Sidebar (flex-shrink-0) ✅ Не стискається
          └─ Main Area (flex-1, min-w-0) ✅ Займає весь простір
              ├─ Header (flex-shrink-0) ✅ Фіксована висота
              └─ Main Content (overflow-y-auto, scroll-smooth) ✅ SCROLL ТУТ!
                  └─ Children (min-h-full) ✅ Контент
```

**Рішення**:
- ЄДИНИЙ scroll контейнер на рівні Main Content
- Всі батьківські контейнери використовують flexbox
- `flex-shrink-0` для sidebar та header
- `min-w-0` для запобігання overflow

---

## Ключові Принципи

### 1. Один Scroll Контейнер
```css
/* ❌ НЕ РОБИТИ */
.parent {
  overflow: hidden; /* Блокує scroll */
}
.child {
  overflow-y: auto; /* Не працює! */
}

/* ✅ ПРАВИЛЬНО */
.parent {
  display: flex;
  flex-direction: column;
  /* БЕЗ overflow */
}
.child {
  flex: 1;
  overflow-y: auto; /* Працює! */
}
```

### 2. Flexbox Layout
```css
/* Головний контейнер */
.shell-container {
  display: flex;
  height: 100vh; /* або 100dvh для mobile */
}

/* Sidebar - не стискається */
.sidebar {
  flex-shrink: 0;
  width: 260px;
}

/* Main area - займає решту простору */
.main-area {
  flex: 1;
  min-width: 0; /* Важливо для overflow */
  display: flex;
  flex-direction: column;
}

/* Header - фіксована висота */
.header {
  flex-shrink: 0;
  height: 64px;
}

/* Main content - scroll тут */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS momentum */
}
```

### 3. iOS Momentum Scrolling
```css
.scroll-smooth {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* Критично для iOS! */
}
```

---

## Приклади для Кожного Shell

### ExplorerShell
```tsx
<div className="flex h-screen"> {/* БЕЗ overflow-hidden */}
  <aside className="flex-shrink-0 w-64"> {/* Sidebar */}
    {/* Navigation */}
  </aside>

  <div className="flex-1 flex flex-col min-w-0"> {/* Main area */}
    <header className="flex-shrink-0 h-16"> {/* Header */}
      {/* Breadcrumbs */}
    </header>

    <main className="flex-1 overflow-y-auto scroll-smooth"> {/* SCROLL */}
      {children}
    </main>
  </div>
</div>
```

### OperatorShell
```tsx
<div className="flex h-screen"> {/* БЕЗ overflow-hidden */}
  <motion.aside className="flex-shrink-0"> {/* Collapsible sidebar */}
    {/* Tactical navigation */}
  </motion.aside>

  <div className="flex-1 flex flex-col min-w-0"> {/* Main area */}
    <header className="flex-shrink-0 h-12"> {/* HUD header */}
      {/* Status indicators */}
    </header>

    <main className="flex-1 overflow-y-auto"> {/* SCROLL */}
      {children}
    </main>

    <footer className="flex-shrink-0 h-6"> {/* Footer */}
      {/* Metadata */}
    </footer>
  </div>
</div>
```

### CommanderShell
```tsx
<div className="flex h-screen"> {/* БЕЗ overflow-hidden */}
  {/* Floating navigation (fixed) */}
  <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
    {/* Top bar */}
  </nav>

  {/* Left sidebar (fixed) */}
  <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40">
    {/* Quick actions */}
  </aside>

  {/* Right sidebar (fixed) */}
  <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-40">
    {/* System status */}
  </aside>

  {/* Main content */}
  <main className="flex-1 flex flex-col min-w-0 p-12 pl-32 pr-80">
    <div className="flex-1 overflow-y-auto scroll-smooth"> {/* SCROLL */}
      {children}
    </div>
  </main>
</div>
```

---

## Debugging Scroll Issues

### Перевірка 1: Чи є overflow-hidden на батьківських елементах?
```bash
# В DevTools Console:
document.querySelectorAll('[class*="overflow-hidden"]')
```

### Перевірка 2: Чи правильна висота контейнерів?
```bash
# В DevTools Console:
const main = document.querySelector('main');
console.log({
  scrollHeight: main.scrollHeight,
  clientHeight: main.clientHeight,
  hasScroll: main.scrollHeight > main.clientHeight
});
```

### Перевірка 3: Чи працює scroll?
```bash
# В DevTools Console:
const main = document.querySelector('main');
main.scrollTop = 100; // Має прокрутити
```

---

## Тестування Scroll

### Desktop
- [ ] Mouse wheel вгору/вниз
- [ ] Trackpad двома пальцями
- [ ] Scrollbar drag
- [ ] Keyboard (Page Up/Down, Space, Arrow keys)

### Mobile
- [ ] Touch swipe вгору/вниз
- [ ] Momentum scrolling (швидкий swipe)
- [ ] Overscroll bounce (iOS)
- [ ] Pull-to-refresh (якщо потрібно)

### Cross-browser
- [ ] Chrome (Blink engine)
- [ ] Safari (WebKit engine)
- [ ] Firefox (Gecko engine)
- [ ] Edge (Blink engine)

---

## Поширені Помилки

### ❌ Помилка 1: overflow-hidden на батьківському елементі
```tsx
// НЕ РОБИТИ
<div className="overflow-hidden">
  <div className="overflow-y-auto">
    {/* Scroll НЕ працює */}
  </div>
</div>
```

### ❌ Помилка 2: Відсутність flex-1 на scroll контейнері
```tsx
// НЕ РОБИТИ
<div className="flex flex-col h-screen">
  <header>...</header>
  <main className="overflow-y-auto"> {/* Немає flex-1! */}
    {/* Scroll НЕ працює */}
  </main>
</div>
```

### ❌ Помилка 3: height: 100% замість flex
```tsx
// НЕ РОБИТИ
<div className="h-full">
  <div className="h-full overflow-y-auto">
    {/* Може не працювати */}
  </div>
</div>

// РОБИТИ
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto">
    {/* Працює! */}
  </div>
</div>
```

---

## Висновок

✅ **Правильна архітектура scroll**:
1. БЕЗ `overflow-hidden` на Shell Container
2. Flexbox layout для всіх контейнерів
3. `flex-shrink-0` для sidebar та header
4. `flex-1` + `overflow-y-auto` для main content
5. `scroll-behavior: smooth` для плавного scroll
6. `-webkit-overflow-scrolling: touch` для iOS

❌ **Чого уникати**:
1. `overflow-hidden` на батьківських елементах
2. Вкладені scroll контейнери
3. `height: 100%` замість flexbox
4. Відсутність `min-w-0` на flex items

---

**Автор**: Antigravity AI
**Дата**: 2026-01-09
**Версія**: 1.0
