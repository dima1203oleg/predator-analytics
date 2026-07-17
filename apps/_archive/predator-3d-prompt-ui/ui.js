// ============================================================
// PREDATOR Analytics — UI Logic (ui.js)
// Планети, модулі, анімації HUD
// ============================================================

// --- Clock ---
function tick(){
  const n=new Date();
  document.getElementById('time-display').textContent=
    [n.getHours(),n.getMinutes(),n.getSeconds()].map(v=>String(v).padStart(2,'0')).join(':');
}
setInterval(tick,1000); tick();

// --- Module Data ---
const MODULES={
  throne:`<div class="module-grid">
    <div class="data-card red"><h3>🎯 КОМАНДНИЙ ЦЕНТР</h3><p>Головна панель керування. Хижак контролює всі активні полювання.</p><span class="data-num" style="color:var(--neon-red)">247</span><small>АКТИВНИХ ЦІЛЕЙ</small></div>
    <div class="data-card cyan"><h3>🕸️ МЕРЕЖА ЗІМКНЕНЬ</h3><p>Граф зв'язків між компаніями, особами та активами.</p><span class="data-num" style="color:var(--neon-cyan)">1,842</span><small>ВУЗЛІВ У ГРАФІ</small></div>
    <div class="data-card amber"><h3>⚡ RISK ENGINE v56.5</h3><p>200+ параметрів аналізуються в реальному часі.</p><span class="data-num" style="color:var(--neon-amber)">73%</span><small>ПРОГРЕС АНАЛІЗУ</small></div>
    <div class="data-card green"><h3>🛸 РОЗВІДНИКИ</h3><p>Кораблі-розвідники збирають дані між планетами.</p><span class="data-num" style="color:var(--neon-green)">3/5</span><small>АКТИВНИХ АГЕНТІВ</small></div>
    <div class="data-card red"><h3>🔔 ОСТАННІ АЛЕРТИ</h3><p>OFAC список оновлено. 14 нових санкційних записів.</p></div>
    <div class="data-card cyan"><h3>📊 СТАТИСТИКА</h3><p>За сьогодні оброблено 4.2М записів у 89 джерелах.</p></div>
  </div>`,
  osint:`<div class="module-grid">
    <div class="data-card red"><h3>🌐 OPENSANCTIONS</h3><p>Міжнародні санкційні списки. OFAC, EU, UN, SDN.</p><span class="data-num" style="color:var(--neon-red)">342</span><small>НОВИХ ЗАПИСІВ</small></div>
    <div class="data-card amber"><h3>📰 МЕДІА-МОНІТОРИНГ</h3><p>Сканування 1,200+ медіа-джерел в реальному часі.</p><span class="data-num" style="color:var(--neon-amber)">12.4K</span><small>СТАТЕЙ/ДЕНЬ</small></div>
    <div class="data-card cyan"><h3>🔍 ENTITY SEARCH</h3><p>Пошук по ІПН, ЄДРПОУ, іменах, адресах.</p><span class="data-num" style="color:var(--neon-cyan)">892</span><small>СУТНОСТЕЙ ЗНАЙДЕНО</small></div>
    <div class="data-card green"><h3>📡 SOCIAL OSINT</h3><p>Моніторинг соцмереж та відкритих джерел.</p><span class="data-num" style="color:var(--neon-green)">47</span><small>АКТИВНИХ ЦІЛЕЙ</small></div>
  </div>`,
  due:`<div class="module-grid">
    <div class="data-card cyan"><h3>🏢 РЕЄСТР КОМПАНІЙ</h3><p>Повна виписка з ЄДР, структура власності.</p><span class="data-num" style="color:var(--neon-cyan)">3,241</span><small>ПЕРЕВІРЕНО КОМПАНІЙ</small></div>
    <div class="data-card green"><h3>⚖️ СУДОВІ СПРАВИ</h3><p>Реєстр судових рішень. Активні провадження.</p><span class="data-num" style="color:var(--neon-green)">A+</span><small>СЕРЕДНІЙ РЕЙТИНГ</small></div>
    <div class="data-card amber"><h3>💼 БЕНЕФІЦІАРИ</h3><p>Аналіз кінцевих власників через ланцюжки структур.</p><span class="data-num" style="color:var(--neon-amber)">18.7K</span><small>ПЕРЕВІРОК</small></div>
    <div class="data-card red"><h3>📋 PDF ЗВІТИ</h3><p>Автоматична генерація звітів Due Diligence.</p><span class="data-num" style="color:var(--neon-red)">24h</span><small>ЧАС ПІДГОТОВКИ</small></div>
  </div>`,
  kompr:`<div class="module-grid">
    <div class="data-card purple"><h3>⚠️ САНКЦІЇ</h3><p>OFAC, EU, UN перехресна перевірка.</p><span class="data-num" style="color:var(--neon-purple)">342</span><small>ЗАПИСІВ</small></div>
    <div class="data-card red"><h3>🔴 СУДИМОСТІ</h3><p>Реєстр злочинців, вироки, активні провадження.</p><span class="data-num" style="color:var(--neon-red)">HIGH</span><small>РІВЕНЬ РИЗИКУ</small></div>
    <div class="data-card amber"><h3>💸 ТОКСИЧНІ ЗВ'ЯЗКИ</h3><p>Зв'язки з тіньовими структурами, офшорами.</p><span class="data-num" style="color:var(--neon-amber)">14,829</span><small>ЗАПИСІВ У БД</small></div>
    <div class="data-card cyan"><h3>🎯 ТОЧНІСТЬ AI</h3><p>ML-класифікатор ризиків на 91% точності.</p><span class="data-num" style="color:var(--neon-cyan)">91%</span><small>ТОЧНІСТЬ</small></div>
  </div>`,
  customs:`<div class="module-grid">
    <div class="data-card amber"><h3>📦 ДЕКЛАРАЦІЇ</h3><p>89M+ записів. Аналіз операцій імпорт/експорт.</p><span class="data-num" style="color:var(--neon-amber)">89M</span><small>ЗАПИСІВ</small></div>
    <div class="data-card red"><h3>🚨 СХЕМИ УХИЛЕННЯ</h3><p>Заниження митної вартості та контрабанда.</p><span class="data-num" style="color:var(--neon-red)">17</span><small>АКТИВНИХ СХЕМ</small></div>
    <div class="data-card cyan"><h3>💰 ОБСЯГ</h3><p>Загальний обсяг підозрілих операцій за квартал.</p><span class="data-num" style="color:var(--neon-cyan)">₴4.2B</span><small>ЗА КВАРТАЛ</small></div>
    <div class="data-card green"><h3>📈 ТРЕНДИ</h3><p>Ріст ризику +24% порівняно з попереднім кварталом.</p><span class="data-num" style="color:var(--neon-green)">↑24%</span><small>РІСТ РИЗИКУ</small></div>
  </div>`,
  forecast:`<div class="module-grid">
    <div class="data-card green"><h3>🤖 AI ПРОГНОЗ</h3><p>Gemini Pro + Qwen3-Coder аналізують тренди.</p><span class="data-num" style="color:var(--neon-green)">96.4%</span><small>ТОЧНІСТЬ МОДЕЛІ</small></div>
    <div class="data-card cyan"><h3>📊 АНОМАЛІЇ</h3><p>Автоматичне виявлення аномальних патернів.</p><span class="data-num" style="color:var(--neon-cyan)">14</span><small>НОВИХ АНОМАЛІЙ</small></div>
    <div class="data-card amber"><h3>🌡️ ІНДЕКС РИЗИКУ</h3><p>Агрегований показник для кожного суб'єкта.</p><span class="data-num" style="color:var(--neon-amber)">LIVE</span><small>ОНОВЛЕННЯ</small></div>
    <div class="data-card red"><h3>⚡ СИГНАЛИ</h3><p>Раннє попередження про підозрілу активність.</p><span class="data-num" style="color:var(--neon-red)">8</span><small>АКТИВНИХ СИГНАЛІВ</small></div>
  </div>`
};

// --- Planet Nav ---
let current='throne';
document.querySelectorAll('.planet-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(btn.dataset.planet===current) return;
    document.querySelectorAll('.planet-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    current=btn.dataset.planet;
    flash();
    setTimeout(()=>{
      const d=btn.dataset;
      document.getElementById('mc-title').textContent=d.title;
      document.getElementById('mc-title').style.color=d.color;
      document.getElementById('mc-desc').textContent=d.desc;
      document.getElementById('module-card').style.borderColor=d.border;
      document.getElementById('mc-stat1-val').textContent=d.s1;
      document.getElementById('mc-stat1-key').textContent=d.s1k;
      document.getElementById('mc-stat2-val').textContent=d.s2;
      document.getElementById('mc-stat2-key').textContent=d.s2k;
      document.getElementById('mc-stat3-val').textContent=d.s3;
      document.getElementById('mc-stat3-key').textContent=d.s3k;
      document.getElementById('mc-stat4-val').textContent=d.s4;
      document.getElementById('mc-stat4-key').textContent=d.s4k;
      ['mc-stat1-val','mc-stat2-val','mc-stat3-val','mc-stat4-val'].forEach(id=>{
        document.getElementById(id).style.color=d.color;
      });
      document.getElementById('enter-btn').style.background=d['btn-color']||d.btnColor||'';
      document.getElementById('center-holo').style.opacity=current==='throne'?'1':'0.15';
      if(window.predatorScene){
        current==='throne'?window.predatorScene.focusThrone():window.predatorScene.focusTable();
      }
    },300);
  });

  btn.addEventListener('mouseenter',e=>{
    const tt=document.getElementById('tooltip');
    tt.textContent=btn.dataset.desc;
    tt.classList.add('show');
  });
  btn.addEventListener('mousemove',e=>{
    const tt=document.getElementById('tooltip');
    tt.style.left=(e.clientX+16)+'px';
    tt.style.top=(e.clientY-45)+'px';
  });
  btn.addEventListener('mouseleave',()=>document.getElementById('tooltip').classList.remove('show'));
});

// --- Enter Module ---
document.getElementById('enter-btn').addEventListener('click',()=>{
  const btn=document.querySelector('.planet-btn.active');
  flash();
  setTimeout(()=>{
    document.getElementById('overlay-title').textContent=btn.dataset.title;
    document.getElementById('overlay-title').style.color=btn.dataset.color;
    document.getElementById('overlay-content').innerHTML=MODULES[current]||'';
    document.getElementById('overlay-time').textContent=new Date().toLocaleTimeString('uk-UA');
    document.getElementById('module-overlay').classList.add('active');
  },280);
});

document.getElementById('overlay-back').addEventListener('click',()=>{
  flash();
  setTimeout(()=>document.getElementById('module-overlay').classList.remove('active'),180);
});

// --- Flash ---
function flash(){
  const f=document.getElementById('transition-flash');
  f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
  setTimeout(()=>f.classList.remove('flash'),900);
}

// --- Living stats ---
setInterval(()=>{
  const t=document.getElementById('stat-targets');
  const l=document.getElementById('stat-links');
  const f=document.getElementById('stat-fill');
  if(t) t.textContent=(Math.max(200,parseInt(t.textContent.replace(/,/g,''))+Math.round((Math.random()-.5)*4))).toLocaleString();
  if(l) l.textContent=(parseInt(l.textContent.replace(/,/g,''))+Math.round(Math.random()*7)).toLocaleString();
  if(f){ const p=parseFloat(f.style.width)|73; f.style.width=Math.min(96,Math.max(58,p+(Math.random()-.3)*.5))+'%'; }
},2100);

// --- Keyboard ---
const KEYS={'1':'throne','2':'osint','3':'due','4':'kompr','5':'customs','6':'forecast'};
document.addEventListener('keydown',e=>{
  if(KEYS[e.key]) document.querySelector(`[data-planet="${KEYS[e.key]}"]`)?.click();
  if(e.key==='Escape') document.getElementById('module-overlay').classList.remove('active');
});
