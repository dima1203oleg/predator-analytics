
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import {
    Search, Sparkles, FileDown, Activity, Check, Scan, BrainCircuit,
    AlertTriangle, AlertOctagon, Share2, Layers, Info, FileText,
    Briefcase, Stethoscope, Leaf, Building2, Radio, Command, Dna, ShieldCheck, MonitorPlay, Code,
    Crosshair, Database, RefreshCw, Calendar, Target, Fingerprint, Siren, Microscope, Users, Clock, MapPin, History
} from 'lucide-react';
import { useGlobalState } from '../context/GlobalContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ReactECharts from 'echarts-for-react';
import { Volume2 } from 'lucide-react';
import { useVoiceControl, InteractionStatus } from '../hooks/useVoiceControl';

// --- FORCE GRAPH IMPORTS ---
type SectorType = 'GOV' | 'BIZ' | 'MED' | 'SCI';

const SECTOR_CONFIG = {
    GOV: { label: 'Держсектор & PEP', icon: <Building2 size={16} />, color: 'blue', accent: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-500', placeholder: "Введіть код ЄДРПОУ або ПІБ посадовця..." },
    BIZ: { label: 'Бізнес & Фінанси', icon: <Briefcase size={16} />, color: 'yellow', accent: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500', placeholder: "Введіть назву компанії або номер транзакції..." },
    MED: { label: 'Медицина & Фарма', icon: <Stethoscope size={16} />, color: 'red', accent: 'text-red-400', border: 'border-red-500', bg: 'bg-red-500', placeholder: "Введіть ID лікаря або номер тендеру..." },
    SCI: { label: 'Екологія & Наука', icon: <Leaf size={16} />, color: 'green', accent: 'text-green-400', border: 'border-green-500', bg: 'bg-green-500', placeholder: "Введіть координати або ID сенсора..." }
};

const RECENT_CASES = [
    { id: 'c1', name: 'ТОВ "Буд-Імперія"', type: 'BIZ', risk: 85, date: '10 хв тому', status: 'CRITICAL', details: 'Офшорні транзакції' },
    { id: 'c2', name: 'Департамент ЖКГ #4', type: 'GOV', risk: 62, date: '32 хв тому', status: 'WARNING', details: 'Завищення цін тендеру' },
    { id: 'c3', name: 'ФОП Ковальчук О.О.', type: 'BIZ', risk: 12, date: '1 год тому', status: 'SAFE', details: 'Планова перевірка' },
    { id: 'c4', name: 'КНП "Міська Лікарня"', type: 'MED', risk: 45, date: '2 год тому', status: 'WATCH', details: 'Закупівля ліків' },
];

const generateTimeline = () => [
    { time: '2023-10-15', event: 'Зміна засновника компанії', risk: 45, detail: 'Новий бенефіціар: Кіпр (Offshore)', type: 'REGISTRY' },
    { time: '2023-10-28', event: 'Великий переказ коштів', risk: 90, detail: 'Сума: $1.2M -> Panama Bank', type: 'SWIFT' },
    { time: '2023-11-02', event: 'Перемога у держтендері', risk: 75, detail: 'Замовник: КП "МіськБуд" (без конкуренції)', type: 'TENDER' },
    { time: 'Вчора, 14:30', event: 'Згадка у кримінальному провадженні', risk: 99, detail: 'Стаття 191 ККУ (Привласнення майна)', type: 'COURT' },
];

// Physics Graph Node Type
interface GraphNode {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    label: string;
    type: 'MAIN' | 'RISK' | 'SAFE' | 'LINK';
    pulseOffset: number;
}

interface GraphLink {
    source: string;
    target: string;
    strength: number;
    packetProgress?: number;
}

const InteractiveForceGraph: React.FC<{ active: boolean }> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingNode = useRef<GraphNode | null>(null);
    const radarAngle = useRef(0);
    const requestRef = useRef<number | null>(null);

    // Initial State stored in ref to persist across renders without causing re-renders
    const nodes = useRef<GraphNode[]>([
        { id: '1', x: 300, y: 300, vx: 0, vy: 0, radius: 40, color: '#3b82f6', label: 'Цільовий Об\'єкт', type: 'MAIN', pulseOffset: 0 },
        { id: '2', x: 200, y: 200, vx: 0, vy: 0, radius: 25, color: '#ef4444', label: 'Офшор Ltd', type: 'RISK', pulseOffset: 10 },
        { id: '3', x: 400, y: 250, vx: 0, vy: 0, radius: 30, color: '#eab308', label: 'КП "ДержЗакупівлі"', type: 'LINK', pulseOffset: 20 },
        { id: '4', x: 350, y: 400, vx: 0, vy: 0, radius: 20, color: '#64748b', label: 'Родич (Дружина)', type: 'SAFE', pulseOffset: 30 },
        { id: '5', x: 150, y: 350, vx: 0, vy: 0, radius: 25, color: '#ef4444', label: 'Фіктивна ФОП', type: 'RISK', pulseOffset: 40 },
    ]);

    const links = useRef<GraphLink[]>([
        { source: '1', target: '2', strength: 0.05, packetProgress: 0 },
        { source: '1', target: '3', strength: 0.03, packetProgress: 0.5 },
        { source: '1', target: '4', strength: 0.08, packetProgress: 0.2 },
        { source: '1', target: '5', strength: 0.02, packetProgress: 0.8 },
        { source: '2', target: '5', strength: 0.1, packetProgress: 0.1 },
    ]);

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            const container = containerRef.current;
            const canvas = canvasRef.current;
            if (!container || !canvas) return;

            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
            }

            // Re-center main node if it hasn't moved much
            const mainNode = nodes.current.find(n => n.type === 'MAIN');
            if (mainNode) {
                // If it's the first run or near initial pos, center it
                if (mainNode.x === 300 && mainNode.y === 300) {
                    mainNode.x = rect.width / 2;
                    mainNode.y = rect.height / 2;
                }
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            if (!active) return; // Stop drawing if not active view

            const width = container.clientWidth;
            const height = container.clientHeight;

            // Clear logic: Reset transform to clear the full buffer, then restore scaling
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            // Physics Update
            const cx = width / 2;
            const cy = height / 2;

            // Repulsion
            for (let i = 0; i < nodes.current.length; i++) {
                for (let j = i + 1; j < nodes.current.length; j++) {
                    const n1 = nodes.current[i];
                    const n2 = nodes.current[j];
                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                    if (dist < 200) {
                        const force = (200 - dist) / 200;
                        const fx = (dx / dist) * force * 2;
                        const fy = (dy / dist) * force * 2;
                        if (n1 !== draggingNode.current) { n1.vx -= fx; n1.vy -= fy; }
                        if (n2 !== draggingNode.current) { n2.vx += fx; n2.vy += fy; }
                    }
                }
            }

            // Attraction (Links)
            links.current.forEach(link => {
                const s = nodes.current.find(n => n.id === link.source);
                const t = nodes.current.find(n => n.id === link.target);
                if (s && t) {
                    const dx = t.x - s.x;
                    const dy = t.y - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 150) * link.strength;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    if (s !== draggingNode.current) { s.vx += fx; s.vy += fy; }
                    if (t !== draggingNode.current) { t.vx -= fx; t.vy -= fy; }

                    if (link.packetProgress !== undefined) {
                        link.packetProgress += 0.01;
                        if (link.packetProgress > 1) link.packetProgress = 0;
                    }
                }
            });

            // Gravity to center
            nodes.current.forEach(n => {
                if (n === draggingNode.current) return;
                const dx = cx - n.x;
                const dy = cy - n.y;
                n.vx += dx * 0.001;
                n.vy += dy * 0.001;

                n.vx *= 0.9; // Friction
                n.vy *= 0.9;

                n.x += n.vx;
                n.y += n.vy;

                // Bounds
                const padding = n.radius;
                n.x = Math.max(padding, Math.min(width - padding, n.x));
                n.y = Math.max(padding, Math.min(height - padding, n.y));
            });

            radarAngle.current += 0.02;

            // --- DRAWING ---

            // Radar Sweep
            try {
                const gradient = ctx.createConicGradient(radarAngle.current, cx, cy);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
                gradient.addColorStop(0.8, 'rgba(59, 130, 246, 0)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cx, cy, Math.min(width, height) * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } catch (e) { /* Fallback for browsers */ }

            // Links
            links.current.forEach(link => {
                const s = nodes.current.find(n => n.id === link.source);
                const t = nodes.current.find(n => n.id === link.target);
                if (s && t) {
                    ctx.beginPath();
                    ctx.moveTo(s.x, s.y);
                    ctx.lineTo(t.x, t.y);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = t.type === 'RISK' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(148, 163, 184, 0.3)';
                    if (t.type === 'RISK') ctx.setLineDash([5, 5]); else ctx.setLineDash([]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Packet
                    if (link.packetProgress !== undefined) {
                        const px = s.x + (t.x - s.x) * link.packetProgress;
                        const py = s.y + (t.y - s.y) * link.packetProgress;

                        ctx.beginPath();
                        ctx.arc(px, py, 3, 0, Math.PI * 2);
                        ctx.fillStyle = t.type === 'RISK' ? '#ef4444' : '#60a5fa';
                        ctx.fill();
                    }
                }
            });

            // Nodes
            nodes.current.forEach(node => {
                const time = Date.now() / 1000;
                const pulse = Math.sin(time * 2 + node.pulseOffset) * 0.5 + 0.5;
                const ringRadius = node.radius + (pulse * 10);

                // Ring
                ctx.beginPath();
                ctx.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
                ctx.strokeStyle = node.color;
                ctx.globalAlpha = 0.3 - (pulse * 0.3);
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Body
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                ctx.fill();
                ctx.fillStyle = node.color + '40';
                ctx.fill();
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Label
                ctx.font = 'bold 10px "JetBrains Mono"';
                const textWidth = ctx.measureText(node.label).width;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(node.x - textWidth / 2 - 4, node.y + node.radius + 5, textWidth + 8, 14);
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText(node.label, node.x, node.y + node.radius + 16);
            });

            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [active]);

    // Interaction Handlers
    const getPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleStart = (e: any) => {
        e.preventDefault();
        const { x, y } = getPos(e.nativeEvent);
        const clicked = nodes.current.find(n => Math.hypot(n.x - x, n.y - y) < n.radius + 10);
        if (clicked) draggingNode.current = clicked;
    };

    const handleMove = (e: any) => {
        if (!draggingNode.current) return;
        e.preventDefault();
        const { x, y } = getPos(e.nativeEvent);
        draggingNode.current.x = x;
        draggingNode.current.y = y;
        draggingNode.current.vx = 0;
        draggingNode.current.vy = 0;
    };

    const handleEnd = () => { draggingNode.current = null; };

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#020617] rounded-lg">
            <canvas
                ref={canvasRef}
                className="block cursor-move touch-none"
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                onMouseMove={handleMove}
                onTouchMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchEnd={handleEnd}
            />
        </div>
    );
};

const IntelligenceTicker = () => (
    <div className="w-full bg-slate-900/90 border-y border-slate-800 h-8 overflow-hidden flex items-center relative select-none backdrop-blur-sm mb-6 panel-3d">
        <div className="flex items-center gap-2 px-3 shrink-0 bg-slate-900 h-full border-r border-slate-800 z-20 text-red-500 font-bold text-[10px] uppercase tracking-wider shadow-xl">
            <Radio size={12} className="animate-pulse" /> LIVE INTEL
        </div>
        <div className="flex items-center gap-12 animate-marquee whitespace-nowrap pl-4">
            <span className="text-slate-400 text-xs font-mono"><span className="text-blue-500">::</span> ДМСУ: Зафіксовано аномальний імпорт електроніки (Одеса)</span>
            <span className="text-slate-400 text-xs font-mono"><span className="text-yellow-500">::</span> ФінМон: Транзакція &gt; 400k UAH без ідентифікації</span>
            <span className="text-slate-400 text-xs font-mono"><span className="text-green-500">::</span> Prozorro: Тендер UA-2023-11-05 оскаржено в АМКУ</span>
            <span className="text-slate-400 text-xs font-mono"><span className="text-purple-500">::</span> DarkWeb: Злив бази клієнтів 'Bank X' (перевірка хешів)</span>
        </div>
    </div>
);

const AnalyticsView: React.FC = () => {
    const { dispatchEvent } = useGlobalState();
    const [currentSector, setCurrentSector] = useState<SectorType>('GOV');
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'GRAPH' | 'TIMELINE' | '3D_TIMELINE'>('GRAPH');
    const [targetLocked, setTargetLocked] = useState(false);

    // Voice
    const [voiceStatus, setVoiceStatus] = useState<InteractionStatus>('IDLE');
    const { speak } = useVoiceControl(voiceStatus, setVoiceStatus, () => { });

    const speakScanResult = () => {
        if (!scanResult) return;
        const text = `Investigation complete for ${scanResult.entity.name}. AI Verdict: ${scanResult.verdict}. Risk Score: ${scanResult.riskScore}. Critical flags detected: ${scanResult.flags.join(', ')}.`;
        speak(text);
    };

    // Investigation State
    const [progress, setProgress] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const logsRef = useRef<HTMLDivElement>(null);
    const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const steps = [
        "Ініціалізація протоколу DeepScan v4.2...",
        "Підключення до реєстрів МінЮсту (ЄДР)...",
        "Аналіз податкових накладних (ДПС API)...",
        "Побудова графа зв'язків (Neo4j Depth=3)...",
        "Перевірка санкційних списків (PEP/NBU)...",
        "Аналіз судових рішень (NLP Processing)...",
        "Генерація фінального звіту (Gemini Pro)..."
    ];

    useEffect(() => {
        if (logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
    }, [logs]);

    // Effect for Target Lock animation reset
    useEffect(() => {
        if (!isScanning) setTargetLocked(false);
    }, [isScanning]);

    const handleScan = () => {
        if (!searchQuery.trim() || isScanning) return;

        // Cleanup any previous interval
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

        // Reset states
        setScanResult(null);
        setProgress(0);
        setActiveStep(0);
        setLogs([]);

        setTargetLocked(true); // Trigger animation

        // Delay slightly for lock animation
        setTimeout(() => {
            setIsScanning(true);
            dispatchEvent('START_SCAN', searchQuery);

            let step = 0;
            scanIntervalRef.current = setInterval(() => {
                if (step >= steps.length) {
                    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                    finishScan();
                    return;
                }

                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[step]}`]);
                setActiveStep(step);
                // Calculate progress based on steps
                setProgress(Math.min(100, Math.round(((step + 1) / steps.length) * 100)));
                step++;
            }, 800);
        }, 600);
    };

    const finishScan = () => {
        const timeline = generateTimeline();

        // Set the result which triggers the UI change
        setScanResult({
            riskScore: 88,
            verdict: 'CRITICAL',
            entity: {
                name: searchQuery,
                id: '33445566',
                registered: '12.03.2019',
                status: 'Active (Risky)',
                address: 'м. Київ, вул. Офшорна, 1'
            },
            timeline,
            flags: [
                "Зв'язок з підсанкційною особою (рівень 2)",
                "Невідповідність доходів та активів",
                "Використання офшорних зон (Кіпр, Панама)"
            ]
        });
        setIsScanning(false);
        dispatchEvent('THREAT_DETECTED', `DeepScan found Critical Risk in ${searchQuery}`);
    };

    const c = SECTOR_CONFIG[currentSector];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto min-h-screen relative">

            <IntelligenceTicker />

            <ViewHeader
                title="DeepScan: Центр Розслідувань"
                icon={<Crosshair size={20} className={`${c.accent} icon-3d`} />}
                breadcrumbs={['INTELLIGENCE', 'DEEP SCAN', c.label]}
                stats={[
                    { label: 'Протокол', value: currentSector, icon: c.icon, color: 'primary' },
                    { label: 'Neural Engine', value: 'GEMINI 3', icon: <BrainCircuit size={14} />, color: 'primary' },
                    { label: 'Джерела Даних', value: '42 REGISTRIES', icon: <Database size={14} />, color: 'success' },
                ]}
            />

            {/* SECTOR TABS */}
            <div className="flex border-b border-slate-800 bg-slate-900/50 rounded-t-lg overflow-x-auto scrollbar-hide panel-3d">
                {(Object.keys(SECTOR_CONFIG) as SectorType[]).map(sector => {
                    const config = SECTOR_CONFIG[sector];
                    const isActive = currentSector === sector;
                    return (
                        <button
                            key={sector}
                            onClick={() => { setCurrentSector(sector); setScanResult(null); setSearchQuery(''); }}
                            className={`flex-1 min-w-[120px] py-4 text-xs font-bold border-b-2 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden group ${isActive
                                ? `${config.border} ${config.accent} bg-slate-800/80`
                                : 'border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                                }`}
                        >
                            <div className={`absolute inset-0 ${config.bg} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                            {config.icon}
                            <span className="uppercase tracking-wider">{config.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* SEARCH BAR (FORENSIC STYLE) */}
            <div className="relative z-10 -mt-6 mx-2 sm:mx-6 group">
                <div className={`
                bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-col sm:flex-row gap-2 items-center panel-3d ring-1 ring-white/5 transition-all duration-300
                ${targetLocked ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-[1.02]' : 'focus-within:border-primary-500 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.3)]'}
            `}>
                    <div className={`hidden sm:flex p-3 rounded-lg bg-slate-800/50 ${c.accent} border border-slate-700 transition-colors ${targetLocked ? 'bg-red-500/20 text-red-500 border-red-500/50' : ''}`}>
                        {targetLocked ? <Crosshair size={24} className="animate-spin" /> : <Search size={24} />}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={c.placeholder}
                        className="w-full sm:flex-1 bg-transparent border-none text-base sm:text-lg text-white placeholder-slate-600 focus:ring-0 outline-none font-medium px-4 py-3 sm:p-0"
                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                        disabled={isScanning}
                    />

                    {/* Target Lock Corners (Visual) */}
                    {targetLocked && (
                        <>
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl animate-target-lock"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr animate-target-lock"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl animate-target-lock"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br animate-target-lock"></div>
                        </>
                    )}

                    <button
                        onClick={handleScan}
                        disabled={isScanning || !searchQuery}
                        className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] btn-3d flex items-center justify-center gap-2 ${isScanning
                            ? 'bg-slate-800 text-slate-500 cursor-wait'
                            : `${c.bg.replace('bg-', 'bg-').replace('500', '600')} hover:${c.bg} text-white shadow-lg`
                            }`}
                    >
                        {isScanning ? <RefreshCw className="animate-spin" /> : <Scan />}
                        {isScanning ? 'АНАЛІЗ...' : 'ЗАПУСТИТИ СКАН'}
                    </button>
                </div>
            </div>

            {/* LOADING STATE */}
            {isScanning && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 animate-in fade-in duration-500">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden panel-3d h-[300px] md:h-[400px]">
                        <div className={`absolute inset-0 ${c.bg} opacity-5 animate-pulse`}></div>
                        <div className="relative w-48 h-48 mb-8">
                            <div className={`absolute inset-0 border-4 ${c.border.replace('border-', 'border-').replace('500', '500/30')} rounded-full animate-ping`}></div>
                            <div className={`absolute inset-0 border-4 border-t-${c.color}-500 border-r-transparent border-b-${c.color}-500 border-l-transparent rounded-full animate-spin`}></div>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="font-mono text-3xl font-bold text-white">{Math.round(progress)}%</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Confidence</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 animate-pulse font-display">ГЛИБИННИЙ АНАЛІЗ</h3>
                        <p className={`${c.accent} font-mono text-xs md:text-sm text-center px-4`}>{steps[activeStep] || 'Processing...'}</p>
                    </div>

                    <div className="bg-black/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-green-400 overflow-hidden h-[300px] md:h-[400px] shadow-inner custom-scrollbar relative flex flex-col">
                        <div className="absolute top-0 left-0 right-0 p-2 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center z-10">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">System Log Output</span>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pt-10 px-2" ref={logsRef}>
                            {logs.map((log, i) => (
                                <div key={i} className="mb-1 border-l-2 border-green-500/30 pl-2 animate-in slide-in-from-left-2 opacity-80 hover:opacity-100 transition-opacity">
                                    <span className="text-green-600 mr-2">➜</span>{log}
                                </div>
                            ))}
                            <div className="animate-pulse text-green-500">_</div>
                        </div>
                    </div>
                </div>
            )}

            {/* DEFAULT STATE: RECENT ACTIVITY */}
            {!isScanning && !scanResult && (
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <History size={16} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Останні Розслідування</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {RECENT_CASES.map(item => (
                            <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:bg-slate-900 hover:border-slate-700 transition-all cursor-pointer group panel-3d">
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg ${item.type === 'GOV' ? 'bg-blue-900/20 text-blue-400' :
                                        item.type === 'BIZ' ? 'bg-yellow-900/20 text-yellow-400' :
                                            'bg-red-900/20 text-red-400'
                                        }`}>
                                        {item.type === 'GOV' ? <Building2 size={16} /> : item.type === 'BIZ' ? <Briefcase size={16} /> : <Stethoscope size={16} />}
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${item.status === 'CRITICAL' ? 'bg-red-900/20 text-red-500 border-red-900/50' :
                                        item.status === 'WARNING' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50' :
                                            'bg-green-900/20 text-green-500 border-green-900/50'
                                        }`}>{item.status}</span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-200 group-hover:text-white mb-1 truncate">{item.name}</h4>
                                <p className="text-[10px] text-slate-500 mb-3">{item.details}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-600 border-t border-slate-800/50 pt-2">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {item.date}</span>
                                    <span className="font-bold">Risk: {item.risk}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RESULTS DASHBOARD */}
            {!isScanning && scanResult && (
                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">

                    {/* 1. TOP ROW: VERDICT & PROFILE */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Entity Profile */}
                        <TacticalCard className="relative overflow-hidden border-l-4 border-l-purple-500 panel-3d bg-slate-900/80">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Fingerprint size={120} />
                            </div>
                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-2">
                                                <Target size={12} className="text-purple-500" /> Ціль Аналізу
                                            </div>
                                            <h2 className="text-2xl font-bold text-white leading-none font-display tracking-wide">{scanResult.entity.name}</h2>
                                        </div>
                                        <div className="px-3 py-1 bg-red-900/20 border border-red-500/50 rounded text-red-500 text-xs font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                            HIGH RISK
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                            <span className="text-slate-500">ЄДРПОУ / ID</span>
                                            <span className="text-slate-300 font-mono select-all">{scanResult.entity.id}</span>
                                        </div>
                                        <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                            <span className="text-slate-500">Дата Реєстрації</span>
                                            <span className="text-slate-300 font-mono">{scanResult.entity.registered}</span>
                                        </div>
                                        <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                            <span className="text-slate-500">Адреса</span>
                                            <span className="text-slate-300 truncate max-w-[150px]">{scanResult.entity.address}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <div className="h-[200px] w-full mt-2">
                                        <ReactECharts
                                            option={{
                                                series: [{
                                                    type: 'gauge',
                                                    startAngle: 180,
                                                    endAngle: 0,
                                                    min: 0,
                                                    max: 100,
                                                    splitNumber: 10,
                                                    itemStyle: { color: '#ef4444' }, // Red
                                                    progress: { show: true, width: 10 },
                                                    pointer: { show: false },
                                                    axisLine: { lineStyle: { width: 10 } },
                                                    axisTick: { show: false },
                                                    splitLine: { length: 6, lineStyle: { width: 1, color: '#999' } },
                                                    axisLabel: { distance: 15, color: '#999', fontSize: 10 },
                                                    anchor: { show: true, showAbove: true, size: 25, itemStyle: { borderWidth: 10 } },
                                                    title: { show: false },
                                                    detail: {
                                                        valueAnimation: true,
                                                        fontSize: 24,
                                                        color: '#fff',
                                                        offsetCenter: [0, '20%'],
                                                        formatter: '{value}'
                                                    },
                                                    data: [{ value: scanResult.riskScore, name: 'Risk' }]
                                                }]
                                            }}
                                            style={{ height: '100%', width: '100%' }}
                                            theme="dark"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TacticalCard>

                        {/* AI Verdict */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 rounded-xl p-6 relative overflow-hidden flex flex-col justify-center panel-3d group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_red]"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-500/20 rounded-full animate-pulse">
                                        <ShieldCheck size={24} className="text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-400 uppercase tracking-widest font-display">Вердикт AI: {scanResult.verdict}</h3>
                                        <p className="text-[10px] text-red-300/70 font-mono">Gemini Pro • Confidence: 98.2%</p>
                                    </div>
                                    <button onClick={speakScanResult} className="ml-auto p-2 text-red-400 hover:text-white bg-red-900/10 hover:bg-red-900/30 rounded-lg transition-colors">
                                        <Volume2 size={24} />
                                    </button>
                                </div>

                                <div className="bg-black/40 p-4 rounded-lg border border-red-500/20 backdrop-blur-sm mb-4">
                                    <p className="text-slate-300 text-sm leading-relaxed font-medium">
                                        <span className="text-red-400 font-bold">УВАГА:</span> Система виявила критичні аномалії, що вказують на високу ймовірність <span className="text-white border-b border-red-500/50">корупційних ризиків</span> або відмивання коштів. Зафіксовано циклічні транзакції з офшорними юрисдикціями та зв'язки з PEP (Політично Значущими Особами).
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {scanResult.flags.map((flag: string, i: number) => (
                                        <span key={i} className="text-[10px] font-bold bg-red-950/80 text-red-200 px-3 py-1.5 rounded border border-red-800 flex items-center gap-2 shadow-sm">
                                            <AlertTriangle size={12} /> {flag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. MIDDLE ROW: VISUALIZATION */}
                    <TacticalCard
                        title="Криміналістична Візуалізація"
                        className="min-h-[500px] panel-3d p-0 overflow-hidden relative"
                        noPadding
                        action={
                            <div className="flex gap-2 bg-slate-900/80 p-1 rounded border border-slate-700">
                                <button onClick={() => setViewMode('GRAPH')} className={`p-1.5 rounded ${viewMode === 'GRAPH' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}><Share2 size={16} /></button>
                                <button onClick={() => setViewMode('TIMELINE')} className={`p-1.5 rounded ${viewMode === 'TIMELINE' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}><Calendar size={16} /></button>
                                <button onClick={() => setViewMode('3D_TIMELINE')} className={`p-1.5 rounded ${viewMode === '3D_TIMELINE' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}><Layers size={16} /></button>
                            </div>
                        }
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_transparent_70%)] opacity-30"></div>
                        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>

                        {viewMode === 'GRAPH' && (
                            <div className="w-full h-full relative bg-slate-950/50 touch-none">
                                {/* Interactive Force Graph Simulation */}
                                <InteractiveForceGraph active={viewMode === 'GRAPH'} />

                                <div className="absolute bottom-4 left-4 bg-slate-900/80 border border-slate-800 p-2 rounded text-[9px] text-slate-400 pointer-events-none">
                                    Drag nodes to rearrange • Physics simulation active
                                </div>
                            </div>
                        )}

                        {viewMode === 'TIMELINE' && (
                            <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
                                <div className="relative pl-8 space-y-8">
                                    <div className="absolute left-11 top-0 bottom-0 w-0.5 bg-slate-800"></div>
                                    {scanResult.timeline.map((event: any, i: number) => (
                                        <div key={i} className="relative flex items-center gap-6 group animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                            {/* Date Bubble */}
                                            <div className="w-24 text-right">
                                                <div className="text-[10px] font-mono text-slate-500">{event.time.split(',')[0]}</div>
                                                <div className="text-xs font-bold text-slate-300">{event.time.split(',')[1] || ''}</div>
                                            </div>

                                            {/* Node Dot */}
                                            <div className={`w-6 h-6 rounded-full border-4 z-10 transition-colors flex items-center justify-center shrink-0 ${event.risk > 80 ? 'border-red-900 bg-red-500 shadow-[0_0_15px_red]' :
                                                event.risk > 50 ? 'border-yellow-900 bg-yellow-500' : 'border-slate-900 bg-slate-600'
                                                }`}></div>

                                            <div className="flex-1 bg-slate-900/50 p-4 rounded border border-slate-800 group-hover:border-slate-600 transition-colors hover:bg-slate-900 cursor-pointer backdrop-blur-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="text-xs font-bold text-slate-200 group-hover:text-primary-400 transition-colors">{event.event}</div>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${event.risk > 80 ? 'text-red-400 border-red-900/50 bg-red-900/20' :
                                                        'text-slate-400 border-slate-700 bg-slate-800'
                                                        }`}>
                                                        {event.type}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                                    <Info size={10} /> {event.detail}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewMode === '3D_TIMELINE' && (
                            <div className="w-full h-full flex items-center justify-center perspective-[1000px] overflow-hidden">
                                <div className="relative w-[60%] h-full transform-style-3d rotate-x-20 rotate-y-[-10deg]">
                                    {scanResult.timeline.map((event: any, i: number) => (
                                        <div
                                            key={i}
                                            className="absolute left-0 right-0 p-4 bg-slate-900/80 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md transform transition-all hover:translate-x-4 hover:scale-105"
                                            style={{
                                                top: `${i * 100 + 50}px`,
                                                transform: `translateZ(${-i * 50}px)`,
                                                opacity: 1 - (i * 0.1)
                                            }}
                                        >
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-white">{event.event}</span>
                                                <span className="text-[10px] text-slate-400">{event.time}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1">{event.detail}</div>
                                        </div>
                                    ))}
                                    {/* Center line */}
                                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500/30 transform -translate-x-1/2 -z-10"></div>
                                </div>
                            </div>
                        )}
                    </TacticalCard>

                    {/* 3. BOTTOM ROW: ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-red-500/50 group transition-all btn-3d relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-red-900/20 text-red-500 rounded group-hover:scale-110 transition-transform">
                                    <Siren size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-200">Подати до Фінмоніторингу</div>
                                    <div className="text-[10px] text-slate-500">Автоматичний звіт (XML)</div>
                                </div>
                            </div>
                        </button>

                        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 group transition-all btn-3d relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-blue-900/20 text-blue-500 rounded group-hover:scale-110 transition-transform">
                                    <FileDown size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-200">Експорт Досьє (PDF)</div>
                                    <div className="text-[10px] text-slate-500">Повний пакет доказів</div>
                                </div>
                            </div>
                        </button>

                        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500/50 group transition-all btn-3d relative overflow-hidden">
                            <div className="absolute inset-0 bg-purple-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-purple-900/20 text-purple-500 rounded group-hover:scale-110 transition-transform">
                                    <Microscope size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-200">Детальний Аудит</div>
                                    <div className="text-[10px] text-slate-500">Запустити агентів рівня 2</div>
                                </div>
                            </div>
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
};

export default AnalyticsView;
