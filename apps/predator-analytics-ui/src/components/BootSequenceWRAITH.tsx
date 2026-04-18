import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeometricRaptor } from './Logo';

/**
 * 🦅 PREDATOR Analytics // BOOT SEQUENCE v57.5 «APEX PREDATOR»
 * ====================================================
 * Вражаюча, страхітлива візуалізація ініціалізації суверенного ядра аналітики 
 * світового класу (Оціночна вартість системи: > $1.5 Мільярда).
 * v57.5-APEX · Absolute Sovereign Power Design
 * 
 * © 2026 PREDATOR Analytics — HR-04 Compliant
 */

/* ─────────────────────────────────────────────────────────────────────────────
   APEX AUDIO ENGINE (High-Fidelity Synthesized Fear, Bass Drops, Mechanics)
   ─────────────────────────────────────────────────────────────────────────── */
class ApexAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private distortion: WaveShaperNode | null = null;

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.distortion = this.ctx.createWaveShaper();
      
      // Створюємо жорстку дисторшн-криву для ефекту кіберу-розриву
      const k = 100, n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      this.distortion.curve = curve;
      this.distortion.oversample = '4x';
      
      this.master.connect(this.distortion);
      this.distortion.connect(this.ctx.destination);
      this.master.gain.value = 0.8;
    } catch (e) {
      console.warn('AudioContext not supported by this browser');
    }
  }

  /** Квантовий гудіння — старт системи */
  playQuantumHum() {
    this.init();
    if (!this.ctx || !this.master) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const LFO = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lpf = this.ctx.createBiquadFilter();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(41.20, this.ctx.currentTime); // E1 (дуже низька база)
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(41.80, this.ctx.currentTime); // Легкий розсинхрон для жаху
    
    LFO.type = 'sine';
    LFO.frequency.setValueAtTime(0.5, this.ctx.currentTime); // Пульсація
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 15;
    LFO.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + 3);
    
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(80, this.ctx.currentTime);
    lpf.Q.value = 10;
    
    osc1.connect(lpf); osc2.connect(lpf);
    lpf.connect(g); g.connect(this.master);
    
    osc1.start(); osc2.start(); LFO.start();
  }

  /** Удар серця / масивний запуск магістралі */
  playHeartbeatImpact() {
    this.init();
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.3); // Drop!
    
    g.gain.setValueAtTime(1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    
    osc.connect(g); g.connect(this.master);
    osc.start(); osc.stop(this.ctx.currentTime + 0.6);
  }

  /** Клік квантової друкарки */
  playTypeclick() {
    this.init();
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400 + Math.random()*200, this.ctx.currentTime);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
    
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    
    osc.connect(filter); filter.connect(g); g.connect(this.master);
    osc.start(); osc.stop(this.ctx.currentTime + 0.04);
  }

  /** Глобальний сигнал збігу / пробою інфраструктури */
  playApexMatchFlash() {
    this.init();
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.2);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.2);
    
    g.gain.setValueAtTime(0.4, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    
    osc.connect(g); osc2.connect(g); g.connect(this.master);
    osc.start(); osc2.start(); 
    osc.stop(this.ctx.currentTime + 0.8);
    osc2.stop(this.ctx.currentTime + 0.8);
  }
}

const sfx = new ApexAudioEngine();

/* ─────────────────────────────────────────────────────────────────────────────
   ANALYTICAL MODULES (Ukrainian Localized - Apex Level Intelligence)
   ─────────────────────────────────────────────────────────────────────────── */
const RAW_SOURCES = [
  "TCP:192.168.1.104 -> ВХІДНИЙ_ШИФРОВАНИЙ_ПОТІК_SWIFT",
  "DECRYPT: АКТИВИ_ОЛІГАРХА_КОД_АЛЬФА",
  "СИСТЕМА 'ОРБІТАЛЬНИЙ_СКАЙНЕТ' -> СИНХРОНІЗАЦІЯ_УЛЬТРА_HD",
  "ПАРСИНГ_ОФШОРНИХ_ЮРИСДИКЦІЙ: БАГАМСЬКІ_ОСТРОВИ, КІПР, БВІ",
  "ГЛОБАЛЬНИЙ_МОНІТОРИНГ_ФІНАНСІВ: 12.8 МІЛЬЯРДІВ_ВУЗЛІВ",
  "DARK_WEB_CRAWLER: [██████████] 100% ДОСТУП",
  "NEURAL_LINK: ПЕРЕХОПЛЕННЯ_ВІЙСЬКОВОГО_САТЕЛІТУ",
  "АНАЛІЗ_ГРАФІВ: 10_ТРИЛЬЙОНІВ_РЕБЕР_ПЕРЕВІРЕНО",
  "КВАНТОВИЙ_ОБЧИСЛЮВАЧ_ІНІЦІАЛІЗОВАНО: ЗЛАМ SSL/TLS У РЕАЛЬНОМУ ЧАСІ",
  "СИСТЕМА_СПОСТЕРЕЖЕННЯ: ВИЯВЛЕНО ДИСИДЕНТСЬКУ АКТИВНІСТЬ...",
  "ПРОЦЕС_ЛІКВІДАЦІЇ: [██████████] 14% ЗАВЕРШЕНО",
];
];

const REGISTRY_ENTRIES = [
  "ID: 28491023 | СТАТУС: ЛІКВІДАЦІЯ_ФІНАНСОВОЇ_СІТКИ",
  "НАЗВА: ПРИХОВАНО | ЄДРПОУ: 3049103948 (ТІНЕВА_АКТИВНІСТЬ)",
  "АКТИВ: КОМПЛЕКС_НЕРУХОМОСТІ_ЛОНДОН_$140M",
  "ЗВ'ЯЗОК: ОФШОРНИЙ_КОНГЛОМЕРАТ_Z (ВИЯВЛЕНО ПРЯМИЙ КАНАЛ)",
  "ЗБІГ: КРИТИЧНА_ЗАГРОЗА_НАЦІОНАЛЬНІЙ_БЕЗПЕЦІ",
  "ОПЕРАЦІЯ: ТИТАНОВА_ТІНЬ_2026 (ДОЗВІЛ НА ЛІКВІДАЦІЮ ТРАНШІВ)",
  "APEX_SIGNATURE: POSITIVE_IDENT_OK | 99.999% ВІРОГІДНІСТЬ",
  "ПАТЕРН: ВІДМИВАННЯ_ГРОШЕЙ_ЧЕРЕЗ_КРИПТОВАЛЮТНІ_МІКСЕРИ",
  "NEURAL_LINK: ПОВНИЙ_КОНТРОЛЬ_ЗОВНІШНІХ_ШЛЮЗІВ",
  "UBOMAP_RECON: ДОСТУП_ДО_РАХУНКІВ_ТРЕТЬОГО_РІВНЯ",
  "ГЕОПОЛІТИЧНИЙ_ІНТЕЛ: ПОВНИЙ КАРТ-БЛАНШ ДІЙ",
  "МИТНИЙ_SIGINT: КОЖЕН_КОНТЕЙНЕР_ЙДЕ_ЧЕРЕЗ_PREDATOR",
];

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
const BootSequenceWRAITH: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<0 | 1 | 1.5 | 2 | 2.5 | 3 | 4>(0);
  const [sourceText, setSourceText] = useState("");
  const [registryText, setRegistryText] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [matchLine, setMatchLine] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const startTime = useRef(Date.now());
  const particles = useRef<{ x: number; y: number; z: number; px: number; py: number; c: string }[]>([]);
  
  // Matrix Rain references
  const dropsRef = useRef<number[]>([]);

  // Ініціалізація Matrix Rain та Particles
  useEffect(() => {
    particles.current = Array.from({ length: 1500 }, () => ({
      x: (Math.random() - 0.5) * 6000,
      y: (Math.random() - 0.5) * 6000,
      z: Math.random() * 5000,
      px: 0, py: 0,
      c: Math.random() > 0.85 ? '#D4AF37' : (Math.random() > 0.5 ? '#991B1B' : '#78350F')
    }));
    
    const columns = Math.floor(window.innerWidth / 15);
    dropsRef.current = Array.from({ length: columns }, () => Math.random() * -100);
  }, []);

  // Жорсткий потік логів ініціалізації (ПОСИЛЕНО)
  useEffect(() => {
    const logs = [
      "ВСТАНОВЛЕННЯ СУВЕРЕННОГО ЯДРА АНАЛІТИКИ PREDATOR APEX...",
      "УВАГА: ЦЯ СИСТЕМА ОЦІНЮЄТЬСЯ В > $1.5 МІЛЬЯРДА ДОЛАРІВ.",
      "НЕАВТОРИЗОВАНИЙ ДОСТУП ПРИЗВЕДЕ ДО НЕГАЙНОГО КІБЕР-УДАРУ...",
      "ЗАВАНТАЖЕННЯ КВАНТОВОГО РУШІЯ ОСБ (ОЦІНКА СУТНОСТЕЙ)...",
      "ПІДКЛЮЧЕННЯ ДО ПЛАНЕТАРНОГО ГРАФА ПЕРЕКАЗІВ [PALANTIR-LINK]...",
      "СИНХРОНІЗАЦІЯ ZROK-ТУНЕЛЮВАННЯ НА РІВНІ ВІЙСЬКОВОЇ БЕЗПЕКИ...",
      "ПЕРЕВІРКА ЦІЛІСНОСТІ АНАЛІТИКІВ: [БЕЗЗАПЕРЕЧНА_ВЛАДА]",
      "ЗАПУСК КОГНІТИВНОГО ПАРСЕРА ПОДОЛАННЯ TIER-1 ЗАХИСТУ...",
      "APEX_ENGINE_v57.5: ГЛОБАЛЬНИЙ_РЕСУРС_ОНЛАЙН",
      "АКТИВНА РЕКОНОСЦЕНЦІЯ ПАРАМЕТРІВ ПЛАНЕТАРНИХ ТРАНЗАКЦІЙ...",
      "ПЕРЕЗАВАНТАЖЕННЯ БАЗ МІЖНАРОДНИХ РОЗШУКІВ INTERPOL & FINCEN...",
      "АВТЕНТИФІКАЦІЯ УРЯДОВОГО КЛЮЧА ДОСТУПУ: OMEGA_ELITE...",
      "SIGINT_CORE: ГЕОПОЛІТИЧНИЙ СЕЙСМОГРАФ — 100% ПОКРИТТЯ",
      "ЛОГІСТИЧНИЙ ДИКТАТОР: ПАРСЕР МАНІФЕСТІВ ТА СУПЕРКАРГО",
      "ПАРСЕР_РНБО: ПОШУК_САНКЦІЙНИХ_ЗВ'ЯЗКІВ У DARK WEB...",
      "ГЛОБАЛЬНА МЕРЕЖА: ІДЕНТИФІКАЦІЯ УСІХ ЗЛОВМИСНИКІВ",
      "СИСТЕМА ГОТОВА: АРХІТЕКТУРУ СУВЕРЕННОГО СТРАХУ ІНІЦІАЛІЗОВАНО",
      "██████████ ██████ ██████████ [REDACTED]",
      "УВАГА: ВИЯВЛЕНО СПРОБУ СКАНУВАННЯ ЗОВНІШНЬОГО ВУЗЛА...",
      "КОНТР-ЗАХОДИ: АКТИВОВАНО. ЦІЛЬ ЛОКАЛІЗОВАНО.",
      "ОЧІКУВАННЯ ВИБОРУ ВЕКТОРА ДОМІНУВАННЯ...",
    ];
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setBootLogs(prev => [...prev.slice(-12), logs[i]]);
        if (i % 3 === 0) sfx.playHeartbeatImpact();
        i++;
      } else {
        clearInterval(interval);
      }
    }, 450); // Уповільнюємо для відчуття масштабу
    return () => clearInterval(interval);
  }, []);


  // Динамічне оновлення даних цілі фази 1.5
  useEffect(() => {
    if (phase === 1.5) {
      const labels = [
        "UEID: 94021-X // АКТИВНО В МАДРИДІ",
        "СКОРИНГ СТРАХУ: РІВЕНЬ 10 (МАКСИМУМ)",
        "ТРАНСФЕР: $142M ОФШОРНИЙ СИНДИКАТ",
        "БЛОКУВАННЯ РАХУНКІВ ПЕРЕХОПЛЕНО",
        "АЛГОРИТМ 'НЕМЕЗИДА': ЗНИЩЕННЯ СХЕМИ",
        "СИГНАТУРА: КАРТЕЛЬ ФІНАНСИСТІВ",
        "GEO_LOCK: ЗАХОПЛЕНО З СУПУТНИКА",
        "КРИТИЧНА ЗАГРОЗА УСУНЕНА",
        "АНАЛІЗ_ГРАФА: ДОСЛІДЖЕННЯ ТРИЛЬЙОНА ВУЗЛІВ",
        "КАПІТАЛІЗАЦІЯ ЗЛАМАНОЇ СІТКИ: ВПАЛА НА 100%"
      ];
      let i = 0;
      const interval = setInterval(() => {
        setTargetLabel(labels[i % labels.length]);
        i++;
      }, 550);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Друкарський верстат матриці
  useEffect(() => {
    if (phase === 2) {
      let sIdx = 0;
      let rIdx = 0;
      const sTarget = RAW_SOURCES[Math.floor(Math.random() * RAW_SOURCES.length)];
      const rTarget = REGISTRY_ENTRIES[Math.floor(Math.random() * REGISTRY_ENTRIES.length)];

      const interval = setInterval(() => {
        if (sIdx < sTarget.length) {
          setSourceText(prev => prev + sTarget[sIdx]);
          sIdx++;
          sfx.playTypeclick();
        } else if (rIdx < rTarget.length) {
          setRegistryText(prev => prev + rTarget[rIdx]);
          rIdx++;
          sfx.playTypeclick();
        } else {
          setMatchLine(true);
          sfx.playApexMatchFlash();
          clearInterval(interval);
        }
      }, 15); // VERY FAST TYPING
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Main Canvas Render Loop
  useEffect(() => {
    let frame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPhase = phase;

    const render = () => {
      const elapsed = Date.now() - startTime.current;
      const W = canvas.width = window.innerWidth;
      const H = canvas.height = window.innerHeight;
      const cx = W / 2, cy = H / 2;

      ctx.fillStyle = '#010101';
      ctx.fillRect(0, 0, W, H);

      // Phases control (APEX Timings - EXTENDED)
      if (elapsed < 6000 && localPhase !== 0) { localPhase = 0; setPhase(0); sfx.playQuantumHum(); }
      else if (elapsed >= 6000 && elapsed < 13000 && localPhase !== 1) { localPhase = 1; setPhase(1); }
      else if (elapsed >= 13000 && elapsed < 22000 && localPhase !== 1.5) { localPhase = 1.5; setPhase(1.5); }
      else if (elapsed >= 22000 && elapsed < 32000 && localPhase !== 2) { localPhase = 2; setPhase(2); }
      else if (elapsed >= 32000 && elapsed < 42000 && localPhase !== 2.5) { localPhase = 2.5; setPhase(2.5); sfx.playApexMatchFlash(); }
      else if (elapsed >= 42000 && localPhase < 3 && localPhase !== 2.5) { localPhase = 3; setPhase(3); sfx.playApexMatchFlash(); }
      // onComplete will be triggered by user action in phase 3 or timeout at 90s
      if (elapsed >= 90000 && localPhase < 4) { onComplete(); }

      // MATRIX RAIN BACKGROUND (Only for Phase 1.5 and 2 for technical density)
      if (localPhase === 1.5 || localPhase === 2) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(212, 175, 55, 0.15)'; // Gold rain
        ctx.font = '14px monospace';
        
        for (let i = 0; i < dropsRef.current.length; i++) {
          const text = Math.floor(Math.random() * 16).toString(16).toUpperCase();
          ctx.fillText(text, i * 15, dropsRef.current[i] * 15);
          if (dropsRef.current[i] * 15 > H && Math.random() > 0.975) {
            dropsRef.current[i] = 0;
          }
          dropsRef.current[i]++;
        }
      }

      // NOISE OVERLAY (Cinematic Grain)
      if (Math.random() > 0.05) {
        ctx.fillStyle = 'rgba(212, 175, 55, 0.03)';
        for (let i = 0; i < 800; i++) {
          ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
        }
      }

      // NEURAL PULSE RINGS
      if (localPhase >= 1) {
         const pulseScale = Math.pow((elapsed % 1500) / 1500, 1.5); // non-linear expansion
         
         ctx.beginPath();
         ctx.arc(cx, cy, pulseScale * W, 0, Math.PI * 2);
         ctx.strokeStyle = `rgba(220, 38, 38, ${0.1 * (1 - pulseScale)})`; // Red shockwaves
         ctx.lineWidth = 4;
         ctx.stroke();

         ctx.beginPath();
         ctx.arc(cx, cy, ((pulseScale + 0.5) % 1) * W, 0, Math.PI * 2);
         ctx.strokeStyle = `rgba(212, 175, 55, ${0.2 * (1 - ((pulseScale + 0.5) % 1))})`;
         ctx.stroke();
      }

      // 3D Particles + WARP DRIVE Effect towards the end
      const speed = localPhase >= 2 ? (localPhase === 3 ? 400 : 180) : 25;
      
      // Screen shake calculation
      let dx = 0, dy = 0;
      if (localPhase === 3 || matchLine) {
        dx = (Math.random() - 0.5) * 15;
        dy = (Math.random() - 0.5) * 15;
      }
      
      ctx.save();
      ctx.translate(cx + dx, cy + dy);
      
      particles.current.forEach((p) => {
        p.z -= speed;
        if (p.z <= 0) p.z = 5000;
        const sx = p.x / (p.z / 1000);
        const sy = p.y / (p.z / 1000);
        
        if (Math.abs(sx) > W || Math.abs(sy) > H) {
          p.px = 0; p.py = 0; p.z = 5000;
          return;
        }

        if (p.px !== 0) {
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(sx, sy);
          const alpha = Math.floor(Math.min(1, 1 - p.z / 5000) * 255).toString(16).padStart(2, '0');
          ctx.strokeStyle = p.c + alpha;
          ctx.lineWidth = localPhase >= 3 ? 6 : (localPhase === 2 ? 3 : 1.5);
          ctx.stroke();

          // Glitch Lightning on Match
          if (localPhase === 2 && Math.random() > 0.99 && matchLine) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo((Math.random() - 0.5) * W, (Math.random() - 0.5) * H);
            ctx.strokeStyle = `rgba(220, 38, 38, ${Math.random() * 0.9})`; // Red lasers
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
        p.px = sx; p.py = sy;
      });
      ctx.restore();

      // Digital Glitch Blocks
      if (localPhase >= 1 && Math.random() > 0.985) {
        const gx = Math.random() * W;
        const gy = Math.random() * H;
        const gw = Math.random() * 400;
        const gh = Math.random() * 200;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.fillRect(gx, gy, gw, gh);
        // Draw some random "classified" symbols in the glitch
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px monospace';
        ctx.fillText("CLASSIFIED", gx + 10, gy + 50);
      }

      if (localPhase === 3 || matchLine) {
        if (Math.random() > 0.4) {
          const gx = Math.random() * W;
          const gy = Math.random() * H;
          const gw = Math.random() * W;
          const gh = Math.random() * 100; // Larger glitch blocks
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(153, 27, 27, 0.3)';
          ctx.fillRect(gx, gy, gw, gh);
        }
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [onComplete, matchLine, phase]);

  return (
    <div className={`fixed inset-0 z-[99999] bg-[#010101] flex items-center justify-center overflow-hidden font-mono select-none ${matchLine ? 'animate-violent-shake' : ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* SCANNING OVERLAY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[5px] bg-red-600 absolute animate-scan-line-fast shadow-[0_0_50px_rgba(220,38,38,1)] z-50 mix-blend-screen" />
        
        {phase === 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-x-0 h-[400px] top-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-yellow-600/10 to-transparent z-40"
          />
        )}
        
        {/* Extreme Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none z-10" />
        
        {/* MASSIVE RETINA SCAN HUD */}
        {/* TOP SECRET MARKINGS */}
        <div className="absolute top-8 left-10 flex flex-col gap-1 z-50 opacity-40">
           <div className="bg-red-600 px-4 py-1 text-white font-black text-sm skew-x-[-15deg] shadow-[0_0_20px_red]">TOP SECRET</div>
           <div className="bg-black border border-red-600 px-4 py-1 text-red-600 font-bold text-xs skew-x-[-15deg]">EYES ONLY // PREDATOR</div>
        </div>
        
        <div className="absolute top-8 right-10 flex flex-col items-end gap-1 z-50 opacity-40 text-right">
           <div className="text-yellow-500 font-black text-sm tracking-widest italic">CLEARANCE: OMEGA-ELITE</div>
           <div className="text-white/40 font-mono text-[10px] tracking-tighter italic">DIRECTIVE_7_COMPLIANCE // v57.5</div>
        </div>

        <AnimatePresence>
          {phase === 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.8, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 z-30"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border-[2px] border-yellow-500/10 rounded-full animate-spin-slow" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[4px] border-dashed border-red-600/30 rounded-full animate-spin-reverse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-1 bg-yellow-500/40 shadow-[0_0_30px_#d4af37]" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-yellow-500/20 text-[20rem] font-black italic mix-blend-overlay tracking-tighter">
                  APEX
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HUD: TOP STATUS (Heavy, Ominous, Asserting Dominance) */}
      <div className="absolute top-16 inset-x-16 flex justify-between items-start z-40">
        <motion.div 
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="border-l-[8px] border-red-700 pl-8 py-6 bg-black/80 backdrop-blur-2xl rounded-r-3xl border-y border-y-red-900/30 shadow-[0_0_50px_rgba(153,27,27,0.4)]"
        >
          <div className="text-[16px] text-red-500 font-black tracking-[0.2em] uppercase italic">P.R.E.D.A.T.O.R. СИСТЕМА СПОСТЕРЕЖЕННЯ</div>
          <div className="text-[12px] text-yellow-500 mt-2 font-bold tracking-widest flex items-center gap-3">
             <span className="w-2 h-2 bg-yellow-500 animate-pulse" />
             ВАРТІСТЬ ІНФРАСТРУКТУРИ: &gt; $1.5 МІЛЬЯРДА
          </div>
          <div className="mt-6 space-y-2 max-w-xl">
            {bootLogs.map((log, i) => (
              <div key={i} className={`text-[10px] font-mono tracking-widest italic ${log?.includes('УВАГА') || log?.includes('НЕАВТОРИЗОВАНИЙ') ? 'text-red-500 font-black' : 'text-yellow-600/80'}`}>
                {`> [${new Date().toISOString().substring(11, 23)}] ${log || ''}`}
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-right border-r-[8px] border-yellow-600 pr-8 py-6 bg-black/80 backdrop-blur-2xl rounded-l-3xl border-y border-y-yellow-900/30 shadow-[0_0_50px_rgba(212,175,55,0.2)]"
        >
          <div className="text-[18px] text-yellow-500 font-black tracking-[0.1em] uppercase italic">СВІТОВИЙ СУВЕРЕННИЙ ДИКТАТ</div>
          <div className="text-[12px] text-red-500 uppercase mt-2 font-black tracking-[0.4em] italic drop-shadow-[0_0_10px_red]">МАСШТАБ ІНФРАСТРУКТУРИ: NVIDIA H100 SUPERCLUSTER</div>
          <div className="mt-6 flex items-center justify-end gap-4 bg-red-900/20 px-4 py-2 border border-red-500/30 rounded-lg">
             <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_15px_red] animate-ping" />
             <span className="text-[12px] text-red-400 font-black tracking-[0.4em] uppercase">МЕРЕЖЕВА ЛЕГІТИМНІСТЬ: ПІДТВЕРДЖЕНА</span>
          </div>
          
          <div className="mt-4 text-[11px] text-yellow-600/50 font-mono text-right">
             LAT: 50.4501 | LON: 30.5234 [СУВЕРЕННИЙ ЦЕНТР]<br/>
             РЕСУРС: 12.8 EB (EXABYTE) DATA LAKE<br/>
             ВІДМОВА СТАБІЛЬНОСТІ: 0.000001%
          </div>
        </motion.div>
      </div>

      {/* CORE EXPERIENCE */}
      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div 
            key="logo"
            initial={{ opacity: 0, scale: 0.5, filter: 'blur(50px) brightness(10)', letterSpacing: '-0.2em' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px) brightness(1.2)', letterSpacing: '1.2em' }}
            exit={{ opacity: 0, scale: 2, filter: 'blur(50px) brightness(5)', transition: { duration: 0.5 } }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center z-10"
          >
            <div className="relative mb-28 transform scale-[2.5] xl:scale-[3]">
               <div className="absolute inset-0 bg-red-600 blur-[150px] opacity-60 animate-pulse mix-blend-color-dodge" />
               <GeometricRaptor className="w-64 h-64 filter drop-shadow-[0_0_120px_rgba(255,0,0,0.8)] relative z-10 text-yellow-500" />
            </div>
            
            <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-600 to-red-900 text-[10rem] xl:text-[14rem] font-black uppercase relative italic skew-x-[-6deg] mt-12 drop-shadow-[0_0_80px_rgba(212,175,55,0.6)]">
              PREDATOR
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/50 to-transparent pointer-events-none mix-blend-overlay" />
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-yellow-300 shadow-[0_0_20px_white] mix-blend-overlay" />
            </h1>
            
            <p className="text-red-500 bg-red-950/40 px-12 py-4 border-y-2 border-red-500/50 text-[18px] xl:text-[22px] mt-12 tracking-[1.5em] uppercase font-black italic shadow-[0_0_50px_rgba(220,38,38,0.3)]">
              CYBERNETIC SOVEREIGNTY // GLOBAL INTERCEPT
            </p>
          </motion.div>
        )}

        {phase === 1.5 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {/* AGGRESSIVE TARGET ACQUISITION */}
            <motion.div 
              animate={{ 
                x: [0, 500, -450, 350, -300, 0],
                y: [0, -400, 350, -250, 200, 0]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "anticipate" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="relative">
                {/* Hyper Reticle */}
                <div className="w-[700px] h-[700px] border-[8px] border-red-600/40 rounded-full flex items-center justify-center relative shadow-[0_0_100px_rgba(220,38,38,0.2)]">
                  <div className="w-3 h-32 bg-red-500 absolute top-[-50px] shadow-[0_0_20px_red]" />
                  <div className="w-3 h-32 bg-red-500 absolute bottom-[-50px] shadow-[0_0_20px_red]" />
                  <div className="h-3 w-32 bg-red-500 absolute left-[-50px] shadow-[0_0_20px_red]" />
                  <div className="h-3 w-32 bg-red-500 absolute right-[-50px] shadow-[0_0_20px_red]" />
                  
                  <div className="w-20 h-20 bg-yellow-500 rounded-full animate-ping mix-blend-screen shadow-[0_0_100px_#D4AF37]" />
                  <div className="absolute inset-0 border-[4px] border-dotted border-yellow-500/60 rounded-full animate-spin-reverse" />
                  <div className="absolute inset-12 border-2 border-red-600/50 rounded-full animate-spin-slow" />
                  
                  {/* Crosshairs */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-red-500/30" />
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-red-500/30" />
                </div>
                
                {/* HUD DATA PANEL (Scary fast updates) */}
                <div className="absolute top-20 -right-[500px] bg-black/95 border-[3px] border-red-600 p-8 rounded-tr-3xl rounded-bl-3xl w-[480px] shadow-[0_0_80px_rgba(220,38,38,0.5)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-yellow-500 rounded-sm animate-pulse shadow-[0_0_10px_yellow]" />
                    <div className="text-[16px] text-red-500 font-black tracking-widest uppercase italic">ПЛАНЕТАРНИЙ ПАРСИНГ // ВІДСТЕЖЕННЯ:</div>
                  </div>
                  <div className="text-yellow-400 font-mono text-2xl leading-relaxed italic border-l-[6px] border-red-500 pl-5 py-3 bg-red-900/20 mb-5 text-shadow-glow">
                    {targetLabel}
                    <span className="w-4 h-6 bg-red-500 inline-block animate-ping ml-3 align-middle" />
                  </div>
                  <div className="text-red-400 font-mono text-base leading-snug border-t-2 border-red-900/50 pt-4 space-y-1">
                    <div className="flex justify-between"><span>&gt; ДОСТУП ДО СВІТОВИХ БАНКІВ:</span> <span className="text-yellow-500">100% КОНТРОЛЬ</span></div>
                    <div className="flex justify-between"><span>&gt; АКТИВАЦІЯ ПРОТОКОЛУ ЗАХВАТУ:</span> <span className="text-white">В ВИКОНАННІ</span></div>
                    <div className="flex justify-between"><span>&gt; КОМПРОМЕТАЦІЯ ЗАХИСТУ:</span> <span className="text-red-500 font-bold animate-pulse">ЗНИЩЕНО</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 2 && (
          <div className="w-full max-w-[95vw] flex flex-col items-center gap-16 relative z-10 px-12">
            <div className="text-red-600/80 bg-red-950/40 border border-red-900/50 px-8 py-2 text-[14px] tracking-[3em] uppercase mb-[-60px] font-black rounded-lg shadow-[-20px_0_0_rgba(255,0,0,0.1),20px_0_0_rgba(255,0,0,0.1)]">
               АБСОЛЮТНИЙ ПАРСИНГ РЕЄСТРІВ
            </div>
            
            <div className="w-full grid grid-cols-2 gap-24">
              {/* SOURCE A: RAW DATA CHANNEL */}
              <motion.div 
                initial={{ opacity: 0, x: -300, skewX: 10 }}
                animate={{ opacity: 1, x: 0, skewX: 0 }}
                className="flex-1 border-[4px] border-red-900/60 p-16 bg-[#030000]/95 backdrop-blur-3xl relative group overflow-hidden rounded-[2rem] shadow-[-50px_50px_100px_rgba(255,0,0,0.15)]"
              >
                <div className="absolute top-0 left-0 w-3 h-full bg-red-600/90 shadow-[0_0_30px_#dc2626]" />
                <div className="absolute top-0 right-10 px-8 py-3 bg-red-700 text-white text-[16px] font-black uppercase tracking-[0.5em] italic shadow-2xl skew-x-[-15deg] rounded-b-xl border-x border-b border-red-400">ПОТІК_УРАЗЛИВОСТЕЙ: ГЛОБАЛЬНА МЕРЕЖА</div>
                <div className="text-red-500 text-3xl xl:text-4xl break-all leading-tight h-64 overflow-hidden font-mono font-bold mt-10 tracking-widest drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">
                  {sourceText}
                  <span className="inline-block w-6 h-8 bg-white ml-2 animate-pulse" />
                </div>
              </motion.div>

              {/* REGISTRY CORE: REFERENCE DATABASE */}
              <motion.div 
                initial={{ opacity: 0, x: 300, skewX: -10 }}
                animate={{ opacity: 1, x: 0, skewX: 0 }}
                className="flex-1 border-[4px] border-yellow-700/50 p-16 bg-[#030000]/95 backdrop-blur-3xl relative overflow-hidden rounded-[2rem] shadow-[50px_50px_100px_rgba(212,175,55,0.1)]"
              >
                <div className="absolute top-0 right-0 w-3 h-full bg-yellow-500/90 shadow-[0_0_30px_#d4af37]" />
                <div className="absolute top-0 left-10 px-8 py-3 bg-yellow-600 text-black text-[16px] font-black uppercase tracking-[0.5em] italic shadow-2xl skew-x-[-15deg] rounded-b-xl border-x border-b border-yellow-300">ДЕРЖАВНА БАЗА: SECRET_VAULT_OMEGA</div>
                <div className="text-yellow-400 text-3xl xl:text-4xl break-all leading-tight h-64 overflow-hidden font-mono font-bold italic mt-10 tracking-widest drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]">
                  {registryText}
                  <span className="inline-block w-6 h-8 bg-white ml-2 animate-pulse" />
                </div>
              </motion.div>
            </div>

            {/* HEX CONVERGENCE */}
            <div className="flex gap-4 text-[14px] text-red-500/30 font-mono mt-8 font-bold">
               {[...Array(16)].map((_, i) => (
                 <div key={i} className="animate-pulse bg-red-900/20 px-3 border border-red-900/50 rounded" style={{ animationDelay: `${i * 0.05}s` }}>
                   0x{Math.floor(Math.random()*0xffffffff).toString(16).toUpperCase()}
                 </div>
               ))}
            </div>

            {/* MATCH INDICATOR: FATAL CONVERGENCE */}
            <AnimatePresence>
              {matchLine && (
                <motion.div 
                  initial={{ opacity: 0, y: 200, scale: 0.1 }}
                  animate={{ opacity: 1, y: 0, scale: 1.2 }}
                  transition={{ type: "spring", damping: 10, mass: 1.5 }}
                  className="flex flex-col items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full"
                >
                  <div className="h-40 w-[6px] bg-white shadow-[0_0_50px_#fff,0_0_100px_#f00] mb-8" />
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.02, 1], 
                      backgroundColor: ['rgba(0,0,0,0.95)', 'rgba(50,0,0,0.95)', 'rgba(0,0,0,0.95)'],
                      borderColor: ['#ff0000', '#ffffff', '#ff0000']
                    }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                    className="px-32 py-12 border-[8px] bg-black text-red-500 font-black text-6xl xl:text-7xl tracking-[0.4em] uppercase shadow-[0_0_150px_rgba(255,0,0,1)] backdrop-blur-3xl relative skew-x-[-8deg] flex flex-col items-center"
                  >
                    <span className="text-white mix-blend-difference mb-2">МАТРИЦЯ ОПОРУ ЗЛАМАНА</span>
                    <span className="text-3xl text-yellow-500 tracking-[1em]">ПАТЕРН_ЗАГРОЗИ_ПІДТВЕРДЖЕНО</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {phase === 2.5 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-12 z-[60]"
          >
            <h2 className="text-red-600 text-6xl font-black italic tracking-[0.3em] uppercase mb-8 drop-shadow-[0_0_30px_red] animate-pulse">
              ВИБІР ВЕКТОРА ВПЛИВУ
            </h2>
            
            <div className="grid grid-cols-3 gap-8 w-[1200px]">
              {[
                { id: 'OPERATIONAL', label: 'ОПЕРАТИВНИЙ ДИКТАТ', desc: 'Пряме втручання в митні та банківські шлюзи' },
                { id: 'STRATEGIC', label: 'СТРАТЕГІЧНИЙ ІНТЕЛ', desc: 'Нейронний аналіз геополітичних ризиків Tier-1' },
                { id: 'SIGINT', label: 'SIGINT QUANTUM', desc: 'Глобальне перехоплення зашифрованих сигналів' }
              ].map((m) => (
                <motion.button
                  key={m.id}
                  whileHover={{ scale: 1.05, borderColor: '#fff' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    sfx.playApexMatchFlash();
                    setPhase(3);
                  }}
                  className="bg-black/90 border-2 border-red-700 p-10 flex flex-col items-center text-center gap-6 rounded-2xl hover:bg-red-950/30 transition-all shadow-[0_0_50px_rgba(153,27,27,0.2)]"
                >
                  <div className="w-16 h-16 border-2 border-yellow-500 rotate-45 flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-600 animate-ping" />
                  </div>
                  <div className="text-yellow-500 font-black text-2xl tracking-widest">{m.label}</div>
                  <div className="text-red-400/60 text-sm font-mono leading-relaxed">{m.desc}</div>
                </motion.button>
              ))}
            </div>
            
            <div className="text-white/20 text-xs font-mono tracking-[2em] mt-12">
              AUTO-SELECTION IN 10s...
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div 
            key="final"
            initial={{ opacity: 0, scale: 3, filter: 'brightness(5) contrast(2) invert(1)' }}
            animate={{ opacity: 1, scale: 1, filter: 'brightness(1) contrast(1.2) invert(0)' }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className="flex flex-col items-center"
          >
            <div className="p-32 border-[16px] border-double border-red-700 bg-[#020000] relative shadow-[0_0_250px_rgba(255,0,0,0.8)] overflow-hidden rounded-3xl skew-x-[-5deg]">
              {/* Crazy intense background pulsing */}
              <motion.div 
                animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.1 }}
                className="absolute inset-0 bg-red-600/30 mix-blend-screen"
              />
              <div className="absolute inset-6 border-[4px] border-yellow-500/50" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,0,0.1)_10px,rgba(255,0,0,0.1)_20px)]" />
              
              <h2 className="text-white text-[12rem] xl:text-[16rem] font-black uppercase tracking-tighter relative z-10 leading-none drop-shadow-[0_20px_0px_#991b1b]">
                ДОСТУП
                <br />
                <span className="text-yellow-500 drop-shadow-[0_20px_0px_#78350f]">НАДАНО</span>
              </h2>
            </div>
            
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="mt-20 flex flex-col items-center"
            >
              <p className="text-white font-black tracking-[1.5em] uppercase text-2xl xl:text-3xl animate-pulse italic bg-red-900/50 px-12 py-4 border border-red-500 rounded border-x-[10px]">
                ВСТАНОВЛЕНО ПОЛІТИКУ ДОМІНАЦІЇ
              </p>
              <div className="mt-8 text-yellow-600 text-sm font-mono tracking-widest text-center">
                ПРЕДАТОР <span className="text-red-500 font-bold">ОНЛАЙН</span><br/>
                БОГ З ВАМИ.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BLOOMBERG-STYLE DATA TICKER (SIGINT FLOW) */}
      <div className="absolute bottom-0 w-full bg-black/95 border-t border-red-900/50 h-14 flex items-center overflow-hidden z-[70] shadow-[0_-20px_50px_rgba(0,0,0,1)]">
        <div className="bg-red-700 text-white font-black px-6 h-full flex items-center italic tracking-widest text-sm z-10 border-r border-red-500">
           LIVE_SIGINT_CORE
        </div>
        <div className="flex animate-ticker whitespace-nowrap gap-12 text-yellow-500/80 font-mono text-xs tracking-tighter items-center">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="text-red-500 font-black">[ALERT]</span>
              <span>USD/UAH: ██.██ (SENSITIVE)</span>
              <span className="text-white">—</span>
              <span>UEID: {Math.floor(Math.random()*100000)}-Z : SWIFT INTERCEPT OK</span>
              <span className="text-white">—</span>
              <span>OFFSHORE_FLOW: $1.2B -> CAYMANS (DETECTED)</span>
              <span className="text-white">—</span>
              <span className="text-yellow-300">GEOPOLITICAL_RISK: TIER-1 [CRITICAL]</span>
              <span className="text-white">—</span>
              <span>CARGO: #TRK-9402 [HIGH_PROBABILITY_CONTRABAND]</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
        @keyframes scan-line-fast {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes violent-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-5px, -5px) rotate(-1deg); }
          20% { transform: translate(5px, 5px) rotate(1deg); }
          30% { transform: translate(-8px, 5px) rotate(-2deg); }
          40% { transform: translate(8px, -5px) rotate(2deg); }
          50% { transform: translate(-5px, -5px) rotate(-1deg); }
          60% { transform: translate(5px, 5px) rotate(1deg); }
          70% { transform: translate(-8px, 5px) rotate(-2deg); }
          80% { transform: translate(8px, -5px) rotate(2deg); }
          90% { transform: translate(-5px, 0px) rotate(0deg); }
        }
        
        .animate-scan-line-fast {
          animation: scan-line-fast 3s cubic-bezier(0.8, 0, 0.2, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 8s linear infinite;
        }
        .animate-violent-shake {
          animation: violent-shake 0.3s cubic-bezier(.36,.07,.19,.97) infinite;
        }

        .text-shadow-glow {
          text-shadow: 0 0 20px rgba(220,38,38,0.8), 0 0 40px rgba(255,0,0,0.4);
        }

        /* Intense CRT Scanlines & Grain */
        .fixed::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%), 
                      linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04));
          background-size: 100% 3px, 4px 100%;
          pointer-events: none;
          z-index: 100;
        }
        
        .fixed::after {
            content: "";
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 150px rgba(0,0,0,0.9);
            pointer-events: none;
            z-index: 99;
        }
      `}</style>
    </div>
  );
};

export default BootSequenceWRAITH;
