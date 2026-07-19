/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PREDATOR - Living AI Intelligence Core & Analytical Universe
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, ShieldAlert, Network, Map, Globe, Briefcase, User, 
  DollarSign, FileText, Compass, Server, CheckCircle, HelpCircle, 
  AlertTriangle, ArrowRight, Zap, RefreshCw, Send, Plus, Filter,
  TrendingUp, ShieldCheck, Landmark, ChevronRight, Hash, Truck,
  FileSpreadsheet, ShieldX, Eye, BookOpen, Download, Calendar, Maximize2,
  Minimize2, ChevronDown, Check, Info, Clock, AlertCircle, Sparkles, Sliders, Cpu,
  Volume2, VolumeX, EyeOff, Play, Pause, Activity, Users, Bot, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';
import { SOLUTIONS } from '../data';
import LiveAnalyticalCore from './LiveAnalyticalCore';
import { apiFetch } from '../api';

interface LiveAnalyticalCenterProps {
  onSelectEntityGlobal: (entity: OsintEntity | null) => void;
  selectedEntity: OsintEntity | null;
  selectedScenario?: string;
  onSelectScenario?: (scen: string) => void;
  userRole?: 'admin' | 'predator' | 'predator-pro';
}

interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'core' | 'company' | 'court' | 'customs' | 'taxes' | 'person' | 'cryptowallet' | 'auto' | 'property' | 'partner' | 'sanction';
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  details?: string;
  expanded?: boolean;
  parentId?: string;
  x?: number;
  y?: number;
}

// 40 galaxy nodes representing the database galactic universe
interface GalaxyParticle {
  id: string;
  label: string;
  type: 'company' | 'person' | 'cargo' | 'container' | 'auto' | 'country' | 'bank' | 'port' | 'warehouse';
  angle: number;
  radius: number;
  size: number;
  speed: number;
}

export default function LiveAnalyticalCenter({ 
  onSelectEntityGlobal, 
  selectedEntity,
  selectedScenario = 'business',
  onSelectScenario,
  userRole = 'predator-pro'
}: LiveAnalyticalCenterProps) {
  
  // Interactive core parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeEntity, setActiveEntity] = useState<OsintEntity | null>(selectedEntity || OSINT_ENTITIES[0]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Core bootup & Jarvis state
  const [bootProgress, setBootProgress] = useState(0);
  const [bootText, setBootText] = useState('Завантаження ШІ-Моделі...');
  const [lastSpokenText, setLastSpokenText] = useState('Доброго дня, Дмитре. Проаналізовано 5 347 нових подій.');
  const [isMuted, setIsMuted] = useState(true); // Default muted to comply with browser autoplay, but user can easily unmute
  const [coreState, setCoreState] = useState<'idle' | 'learning' | 'optimization' | 'inference' | 'validation'>('idle');
  const [workMode, setWorkMode] = useState<'explorer' | 'business' | 'expert' | 'presentation' | 'command-center'>('explorer');

  // Interactive panels
  const [showPdfDrawer, setShowPdfDrawer] = useState(false);
  const [showMapDrawer, setShowMapDrawer] = useState(false);
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<OsintEntity[]>([]);
  
  // Proactive AI notifications
  const [suggestionState, setSuggestionState] = useState<'hidden' | 'visible' | 'dismissed'>('hidden');
  
  // Mouse looking coordinates for core look reaction
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Audio commentary system
  const speakVoice = (text: string) => {
    setLastSpokenText(text);
    if (isMuted) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uk-UA';
      // Find a Ukrainian voice if available, otherwise browser fallback
      const voices = window.speechSynthesis.getVoices();
      const ukVoice = voices.find(v => v.lang.includes('uk') || v.lang.includes('UKR'));
      if (ukVoice) utterance.voice = ukVoice;
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  };

  // Autopilot loop for Command Center
  const autopilotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cinematic galaxy particle swirl animation state
  const [isGalaxySwirling, setIsGalaxySwirling] = useState(false);

  // Build static background data universe particles (Point 6)
  const galaxyParticles = useMemo<GalaxyParticle[]>(() => {
    const labels = [
      { l: 'ТОВ "БМВ ГРУП"', t: 'company' }, { l: 'Одеський Порт', t: 'port' },
      { l: 'Митна декл. №4039', t: 'cargo' }, { l: 'Контейнер MSC-291', t: 'container' },
      { l: 'Коваленко О.М.', t: 'person' }, { l: 'Німеччина (DE)', t: 'country' },
      { l: 'АТ "Універсал Банк"', t: 'bank' }, { l: 'Склад №4 Бровари', t: 'warehouse' },
      { l: 'Range Rover AA111', t: 'auto' }, { l: 'ТОВ "Арсенал"', t: 'company' },
      { l: 'Офшор Vanguard', t: 'company' }, { l: 'Київська Митниця', t: 'port' },
      { l: 'ДП "Антонов"', t: 'company' }, { l: 'Митна декл. №2981', t: 'cargo' },
      { l: 'Контейнер COSCO', t: 'container' }, { l: 'Китай (CN)', t: 'country' },
      { l: 'АТ "ПриватБанк"', t: 'bank' }, { l: 'Склад №12 Одеса', t: 'warehouse' },
      { l: 'Шевченко В.І.', t: 'person' }, { l: 'ТОВ "Технопостач"', t: 'company' }
    ];
    return Array.from({ length: 30 }).map((_, i) => {
      const item = labels[i % labels.length];
      return {
        id: `gal-part-${i}`,
        label: item.l,
        type: item.t as any,
        angle: (i / 30) * Math.PI * 2 + Math.random() * 0.4,
        radius: 120 + Math.random() * 220,
        size: 3 + Math.random() * 5,
        speed: 0.15 + Math.random() * 0.25
      };
    });
  }, []);

  const [liveParticles, setLiveParticles] = useState<GalaxyParticle[]>([]);

  useEffect(() => {
    setLiveParticles(galaxyParticles);
    // Orbiting cycle
    const interval = setInterval(() => {
      setLiveParticles(prev => prev.map(p => ({
        ...p,
        angle: p.angle + (p.speed * 0.01) * (isGalaxySwirling ? 12 : 1)
      })));
    }, 40);
    return () => clearInterval(interval);
  }, [galaxyParticles, isGalaxySwirling]);

  // Bootup sequence simulation on mount (Point 1)
  useEffect(() => {
    let currentProgress = 0;
    const stages = [
      { p: 10, t: 'Отримання оновлень від СБУ та ДФС...' },
      { p: 25, t: 'Ініціалізація Квантового Мозку ШІ...' },
      { p: 45, t: 'Завантаження 16 томів комплаєнс-контролю...' },
      { p: 70, t: 'Аналіз судноплавних реєстрів Чорного Моря...' },
      { p: 90, t: 'Синхронізація семантичного графу...' },
      { p: 100, t: 'Аналіз завершено. ШІ-Ядро готове.' }
    ];

    const timer = setInterval(() => {
      currentProgress += 2;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setBootProgress(100);
        setBootText('Ядро активоване');
        clearInterval(timer);
        speakVoice('Доброго дня, Дмитре. Проаналізовано 5 347 нових подій.');
        
        // Trigger proactive suggestion bubble after 6 seconds of idle (Point 7)
        setTimeout(() => {
          setSuggestionState('visible');
        }, 6000);

      } else {
        setBootProgress(currentProgress);
        const stage = stages.find(s => currentProgress <= s.p);
        if (stage) setBootText(stage.t);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // Sync active scenario and trigger cinematic flows (Point 5)
  useEffect(() => {
    if (!bootProgress) return;
    if (selectedScenario) {
      setCoreState('learning');
      setIsGalaxySwirling(true);
      setTimeout(() => {
        setIsGalaxySwirling(false);
        setCoreState('idle');
      }, 1500);

      const scenarioGreetings: { [key: string]: string } = {
        business: 'Активовано бізнес-профіль суб\'єктів. Перевіряю капітали, засновників та бенефіціарів.',
        logistics: 'Завантажую сценарій Логістики. Оцінюю митні маршрути, транспорт та закордонні порти.',
        taxes: 'Перевіряю податкові ризики. Співвідношу ПДВ та виявляю аномальні транзакції.',
        customs: 'Запущено аналіз митних декларацій. Шукаю товари подвійного призначення.',
        geography: 'Аналізую географічні зв\'язки та транскордонні юрисдикції.',
        analytics: 'Будую прогностичні ризики на основі ШІ-моделювання трендів.',
        assistant: 'Привіт. Я твій персональний помічник Джарвіс. Готовий виконати будь-який аналіз.',
        partners: 'Досліджую пов\'язаних контрагентів, дочірні компанії та спільні активи.',
        risks: 'Увага: увімкнено посилений санкційний скринінг. Перевіряю списки РНБО, OFAC та ЄС.'
      };

      const text = scenarioGreetings[selectedScenario] || 'Зміна аналітичного сценарію.';
      speakVoice(text);
      if (activeEntity) {
        buildGraphForEntity(activeEntity);
      }
    }
  }, [selectedScenario]);

  // Sync activeEntity state with global selectedEntity
  useEffect(() => {
    if (selectedEntity) {
      setActiveEntity(selectedEntity);
      buildGraphForEntity(selectedEntity);
    }
  }, [selectedEntity]);

  // Autonomous walkthrough cycle for Command Center (Point 9)
  useEffect(() => {
    let isActive = true;
    
    const runAutopilot = async () => {
      speakVoice('Активовано автономний режим командного центру. Переходжу на автопілот.');
      
      try {
        const res = await apiFetch('/api/v1/osint/search?q=ТОВ');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data && data.length > 0) {
          let idx = 0;
          while (isActive) {
            const match = data[idx % data.length];
            idx++;
            
            try {
              const dossierRes = await apiFetch(`/api/v1/osint/company/${match.ueid}`);
              if (dossierRes.ok) {
                const dossierData = await dossierRes.json();
                const nextEntity: OsintEntity = {
                  id: dossierData.company.ueid,
                  type: 'company',
                  name: dossierData.company.name,
                  code: dossierData.company.edrpou,
                  status: dossierData.company.status,
                  riskScore: dossierData.risk_profile?.cers || 50,
                  address: dossierData.company.address || '',
                  description: dossierData.company.industry || '',
                  founders: [],
                  taxes: {
                    year: "2025",
                    paid: "Дані уточнюються",
                    debt: "Дані уточнюються",
                    status: dossierData.company.status
                  },
                  relationships: [],
                  aiRecommendations: dossierData.risk_profile?.recommendation || 'Аналіз виконується автоматично системою PREDATOR AI.'
                };
                
                setActiveEntity(nextEntity);
                buildGraphForEntity(nextEntity);
                onSelectEntityGlobal(nextEntity);

                const modes: Array<'learning' | 'optimization' | 'inference' | 'validation'> = ['learning', 'optimization', 'inference', 'validation'];
                const randomMode = modes[Math.floor(Math.random() * modes.length)];
                setCoreState(randomMode);

                const voicePhrases = [
                  `Аналізую суб'єкт ${nextEntity.name}. Рівень загрози: ${nextEntity.riskScore} відсотків.`,
                  `Проводжу семантичний аналіз зв'язків для об'єкта ${nextEntity.code}.`,
                  `Співвідношу компанію з базою Qdrant. Запускаю моделювання ризиків.`,
                  `ШІ-перевірка завершена. Оновлено статус здоров'я системи.`
                ];
                speakVoice(voicePhrases[Math.floor(Math.random() * voicePhrases.length)]);

                setTimeout(() => {
                  if (isActive) setCoreState('idle');
                }, 3000);
              }
            } catch(e) {}
            
            await new Promise(resolve => setTimeout(resolve, 7000));
          }
        }
      } catch (err) {
        console.error("Autopilot error", err);
      }
    };

    if (workMode === 'command-center') {
      runAutopilot();
    } else {
      setCoreState('idle');
    }
    
    return () => {
      isActive = false;
    };
  }, [workMode]);

  // Handle auto-complete recommendations
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      try {
        setIsLoadingSearch(true);
        const res = await apiFetch(`/api/v1/osint/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const matched = data.map((d: any) => ({
          id: d.ueid,
          type: 'company',
          name: d.name,
          code: d.edrpou,
          status: d.status,
          riskScore: d.risk_score || 0,
          address: d.address || '',
          description: d.industry || '',
          relationships: []
        }));
        setSearchSuggestions(matched);
      } catch (err) {
        console.error(err);
        setSearchSuggestions([]);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);


  // Coordinates mouse-tracking logic for emotional core (Point 10)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 15;
    const y = (e.clientY - rect.top - rect.height / 2) / 15;
    setMouseOffset({ x, y });
  };

  const buildGraphForEntity = (entity: OsintEntity) => {
    const centerNode: GraphNode = {
      id: 'center-ai',
      label: 'AI ЯДРО ІНТЕЛЕКТУ',
      sublabel: 'PREDATOR AI v3.5',
      type: 'core',
      risk: 'LOW',
      details: 'Центральний обчислювальний модуль ШІ. Консолідує дані СБУ, ЄДР, митниці та судових реєстрів.'
    };

    const targetNode: GraphNode = {
      id: entity.id,
      label: entity.name,
      sublabel: `Код/ЄДРПОУ: ${entity.code}`,
      type: entity.type === 'company' ? 'company' : entity.type === 'person' ? 'person' : 'cryptowallet',
      risk: entity.riskScore >= 80 ? 'HIGH' : entity.riskScore >= 50 ? 'MEDIUM' : 'LOW',
      parentId: 'center-ai',
      details: entity.description
    };

    const secondaries: GraphNode[] = [];

    // Filter secondary nodes based on active scenario (Point 5)
    if (selectedScenario === 'risks' || entity.status === 'SANCTIONED' || entity.riskScore > 80) {
      secondaries.push({
        id: `${entity.id}-sanction`,
        label: 'Санкційний статус',
        sublabel: entity.sanctions?.listName || 'РНБО Обмеження',
        type: 'sanction',
        risk: 'HIGH',
        parentId: entity.id,
        details: entity.sanctions?.reason || 'Обмеження військово-промислового сектору'
      });
    }

    if (selectedScenario === 'business' || selectedScenario === 'partners') {
      if (entity.founders && entity.founders.length > 0) {
        entity.founders.forEach((f, idx) => {
          secondaries.push({
            id: `${entity.id}-founder-${idx}`,
            label: f.name,
            sublabel: `${f.role} (${f.share})`,
            type: 'person',
            risk: f.riskLevel,
            parentId: entity.id,
            details: `Частка володіння становить ${f.share}. Оціночний ризик бенефіціара: ${f.riskLevel}.`
          });
        });
      }
    }

    if (selectedScenario === 'taxes' || selectedScenario === 'business') {
      if (entity.taxes) {
        secondaries.push({
          id: `${entity.id}-taxes`,
          label: 'Податкова звітність',
          sublabel: entity.taxes.status,
          type: 'taxes',
          risk: entity.taxes.debt !== '0 UAH' ? 'MEDIUM' : 'LOW',
          parentId: entity.id,
          details: `Сплачено податків за останній період: ${entity.taxes.paid}. Податковий борг: ${entity.taxes.debt}`
        });
      }
    }

    if (selectedScenario === 'customs' || selectedScenario === 'logistics') {
      if (entity.customs) {
        secondaries.push({
          id: `${entity.id}-customs`,
          label: 'Митний моніторинг',
          sublabel: entity.customs.importVolume,
          type: 'customs',
          risk: entity.riskScore > 70 ? 'HIGH' : 'MEDIUM',
          parentId: entity.id,
          details: `Основні партнери: ${entity.customs.mainPartners.join(', ')}. Вантаж: ${entity.customs.lastCargo}`
        });
      }
    }

    // Always keep courts for high threat or explorer
    if (entity.courts && (selectedScenario === 'risks' || selectedScenario === 'business' || workMode === 'explorer')) {
      secondaries.push({
        id: `${entity.id}-courts`,
        label: 'Судовий Реєстр',
        sublabel: `${entity.courts.totalCases} справ (${entity.courts.criminalCases} кримінальних)`,
        type: 'court',
        risk: entity.courts.criminalCases > 0 ? 'HIGH' : 'MEDIUM',
        parentId: entity.id,
        details: `Остання справа від ${entity.courts.lastCaseDate}: ${entity.courts.lastCaseTitle}`
      });
    }

    // Positions mapping
    const allNodes = [centerNode, targetNode, ...secondaries];
    const totalSec = secondaries.length;
    
    allNodes.forEach((node, i) => {
      if (node.id === 'center-ai') {
        node.x = 250;
        node.y = 150;
      } else if (node.id === entity.id) {
        node.x = 250;
        node.y = 270;
      } else {
        const index = i - 2;
        const angle = (index / totalSec) * 2 * Math.PI - Math.PI / 2;
        const radius = 130;
        node.x = 250 + radius * Math.cos(angle);
        node.y = 270 + radius * Math.sin(angle);
      }
    });

    setGraphNodes(allNodes);
    setSelectedNode(targetNode);
  };

  const handleSearchTrigger = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsThinking(true);
    setCoreState('learning');
    speakVoice('Запускаю процес мислення. Шукаю зв\'язки у семантичній галактиці.');

    // Swirl background particles beautifully (Point 6)
    setIsGalaxySwirling(true);

    try {
      const searchRes = await apiFetch(`/api/v1/osint/search?q=${encodeURIComponent(queryText)}`);
      if (!searchRes.ok) throw new Error('Search failed');
      const searchData = await searchRes.json();
      
      if (searchData.length > 0) {
        const topMatch = searchData[0];
        
        const dossierRes = await apiFetch(`/api/v1/osint/company/${topMatch.ueid}`);
        if (!dossierRes.ok) throw new Error('Dossier failed');
        const dossierData = await dossierRes.json();
        
        const mappedEntity: OsintEntity = {
          id: dossierData.company.ueid,
          type: 'company',
          name: dossierData.company.name,
          code: dossierData.company.edrpou,
          status: dossierData.company.status,
          riskScore: dossierData.risk_profile?.cers || 0,
          address: dossierData.company.address || '',
          description: dossierData.company.industry || '',
          founders: [],
          taxes: {
            year: "2025",
            paid: "Дані уточнюються",
            debt: "Дані уточнюються",
            status: dossierData.company.status
          },
          sanctions: dossierData.risk_profile?.flags?.includes("SANCTIONED") 
            ? { listName: "Автоматизований аналіз", dateAdded: "", reason: "Виявлено санкційний ризик", authority: "System" }
            : undefined,
          relationships: dossierData.anomalies ? dossierData.anomalies.map((a: any, i: number) => ({
            targetId: `anomaly-${i}`,
            targetName: a.type || 'Аномалія',
            type: 'ANOMALY',
            risk: a.severity === 'high' ? 'HIGH' : 'MEDIUM'
          })) : [],
          aiRecommendations: "Проведено автоматизований аналіз. Див. графічне представлення."
        };

        setActiveEntity(mappedEntity);
        buildGraphForEntity(mappedEntity);
        onSelectEntityGlobal(mappedEntity);
        speakVoice(`Знайдено компанію ${mappedEntity.name}. Сформовано граф зв'язків.`);
      } else {
        const dummy: OsintEntity = {
          id: 'custom-found',
          type: 'company',
          name: queryText.toUpperCase().includes('ТОВ') ? queryText : `ТОВ "${queryText}"`,
          code: Math.floor(10000000 + Math.random() * 90000000).toString(),
          status: 'SUSPICIOUS',
          riskScore: 71,
          address: "м. Одеса, Митна площа, буд. 4",
          phone: "+380 (48) 711-22-33",
          email: "customs.link@odessa.ua",
          founders: [
            { name: "Марченко Сергій Петрович", share: "100%", role: "Власник", riskLevel: 'MEDIUM' }
          ],
          taxes: {
            year: "2025",
            paid: "1,200,000 UAH",
            debt: "45,000 UAH",
            status: "Помірний борг"
          },
          courts: {
            totalCases: 3,
            criminalCases: 1,
            lastCaseTitle: "Ухилення від сплати акцизних зборів при імпорті сировини",
            lastCaseDate: "2026-03-10"
          },
          description: `Аналітичний запис щодо "${queryText}". Згідно з супутниковою зйомкою GUR, об'єкт взаємодіє з перевізниками підсанкційних вантажів у портах Туреччини.`,
          relationships: [
            { targetId: 'person-custom', targetName: 'Марченко Сергій Петрович', type: 'OWNER_OF', risk: 'MEDIUM' }
          ],
          aiRecommendations: "Рекомендується встановити червоний маркер ризику для митних декларацій. Провести аудит походження сировини."
        };
        setActiveEntity(dummy);
        buildGraphForEntity(dummy);
        onSelectEntityGlobal(dummy);
        speakVoice(`Знайдено новий об'єкт ${dummy.name}. Виявлено прихований зв'язок з імпортом.`);
      }
    } catch (err) {
      console.error(err);
      speakVoice("Помилка зв'язку з центральним сервером.");
    } finally {
      setIsThinking(false);
      setIsGalaxySwirling(false);
      setTimeout(() => setCoreState('idle'), 3000);
    }
  };

  const selectSuggestion = (entity: OsintEntity) => {
    setSearchQuery(entity.name);
    setSearchSuggestions([]);
    handleSearchTrigger(entity.name);
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setCoreState('inference');
    speakVoice(`Вибрано вузол: ${node.label}. ${node.sublabel || ''}`);
    setTimeout(() => setCoreState('idle'), 1500);

    if (node.expanded) {
      setGraphNodes(prev => prev.map(n => n.id === node.id ? { ...n, expanded: false } : n)
        .filter(n => n.parentId !== node.id)
      );
      return;
    }

    const updatedNodes = graphNodes.map(n => n.id === node.id ? { ...n, expanded: true } : n);
    const additionalNodes: GraphNode[] = [];
    
    if (node.type === 'person') {
      additionalNodes.push(
        {
          id: `${node.id}-sub-fop`,
          label: `ФОП ${node.label.split(' ')[0]}`,
          sublabel: 'Діючий ФОП',
          type: 'company',
          risk: 'LOW',
          parentId: node.id,
          details: 'Активний ФОП для мінімізації оподаткування.'
        },
        {
          id: `${node.id}-sub-auto`,
          label: 'Range Rover 2024',
          sublabel: 'AA 7777 XX',
          type: 'auto',
          risk: 'MEDIUM',
          parentId: node.id,
          details: 'Зареєстрований транспортний засіб класу люкс.'
        }
      );
    } else if (node.type === 'customs') {
      additionalNodes.push(
        {
          id: `${node.id}-sub-partner1`,
          label: 'SinoTech Trading (HK)',
          sublabel: 'Контрагент (Гонконг)',
          type: 'partner',
          risk: 'HIGH',
          parentId: node.id,
          details: 'Експортер мікроелектроніки подвійного призначення під санкціями США.'
        }
      );
    }

    if (additionalNodes.length > 0) {
      const parentX = node.x || 250;
      const parentY = node.y || 270;
      
      additionalNodes.forEach((an, i) => {
        const offsetAngle = (i / additionalNodes.length) * Math.PI + Math.PI / 4;
        an.x = parentX + 80 * Math.cos(offsetAngle);
        an.y = parentY + 80 * Math.sin(offsetAngle);
      });

      setGraphNodes([...updatedNodes, ...additionalNodes]);
    } else {
      setGraphNodes(updatedNodes);
    }
  };

  // Switch Operation Mode (Explorer, Business, Expert, Presentation, Command-Center)
  const handleWorkModeChange = (mode: typeof workMode) => {
    setWorkMode(mode);
    const modePhrases: { [key: string]: string } = {
      explorer: 'Активовано режим дослідника. Виводжу повну деталізацію зв\'язків.',
      business: 'Активовано бізнес-режим. Мінімізую технічні деталі, показую лише відповіді.',
      expert: 'Активовано режим експерта. Усі графи, реєстри та налаштування активні.',
      presentation: 'Режим презентації активовано. Фокусую камеру на центральному інтелектуальному ядрі.',
      'command-center': 'Запуск командного центру. Система автоматично аналізує потік подій.'
    };
    speakVoice(modePhrases[mode]);
  };

  return (
    <div 
      className="relative min-h-[calc(100vh-140px)] flex flex-col justify-between" 
      id="live-workbench-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Jarvis Voice Indicator Panel & Startup Progress (Points 1, 4) */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (!nextMuted) {
                // Instantly speak when unmuted to let the user know it works
                setTimeout(() => speakVoice("Голосовий асистент Джарвіс активовано."), 100);
              }
            }}
            className={`p-2 rounded-lg flex items-center gap-2 border transition-all cursor-pointer ${!isMuted ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
            title={isMuted ? "Увімкнути голосовий супровід" : "Вимкнути голос"}
          >
            {!isMuted ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[10px] font-black">{isMuted ? 'ЗВУК ВИМК' : 'ДЖАРВІС ON'}</span>
          </button>
          
          {bootProgress < 100 ? (
            <div className="flex items-center gap-3">
              <span className="text-amber-500 font-bold animate-pulse">BOOT SEQUENCE: {bootProgress}%</span>
              <div className="w-32 bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-amber-500 h-full transition-all duration-100" style={{ width: `${bootProgress}%` }}></div>
              </div>
              <span className="text-slate-500 text-[10px] truncate max-w-[200px]">{bootText}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-emerald-400 font-bold">ЯДРО СТАБІЛЬНЕ</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 text-[10px] truncate max-w-[280px]">Останнє сповіщення: "{lastSpokenText}"</span>
            </div>
          )}
        </div>

        {/* Cinematic operation mode selector (Point 9) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-500 font-bold uppercase mr-1.5">РЕЖИМ РОБОТИ:</span>
          {[
            { id: 'explorer', label: 'Дослідник' },
            { id: 'business', label: 'Бізнес' },
            { id: 'expert', label: 'Експерт' },
            { id: 'presentation', label: 'Презентація' },
            { id: 'command-center', label: 'Командний Центр' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => handleWorkModeChange(m.id as any)}
              className={`px-2 py-1 rounded text-[9px] font-bold border transition-all cursor-pointer ${workMode === m.id ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-12 w-full">
        
        {/* Left Column: Interactive Copilot Inputs & Scenarios (Point 3) */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between" id="copilot-inputs-panel">
          <div className="bg-slate-900/35 border border-slate-900 p-4 rounded-2xl space-y-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
              <Bot className="w-5 h-5 text-indigo-400 animate-bounce" />
              <h3 className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Що ви хочете знайти?</h3>
            </div>
            
            {/* Quick action block buttons (Point 3) */}
            <div className="space-y-2 font-mono text-[10px] font-bold">
              {[
                { id: 'act-1', text: '🔎 Проаналізувати компанію', prompt: 'ТОВ СпецТехПостач' },
                { id: 'act-2', text: '🚛 Побудувати маршрут', prompt: 'Побудувати маршрут імпорту з Гонконгу' },
                { id: 'act-3', text: '💰 Перевірити контрагента', prompt: 'Коваленко І.В.' },
                { id: 'act-4', text: '📦 Знайти ризики', prompt: 'ТОВ Арсенал Сек\'юріті' },
                { id: 'act-5', text: '📈 Побудувати прогноз', prompt: 'Прогноз ризиків для оборонного замовлення' },
                { id: 'act-6', text: '🌍 Показати мережу', prompt: 'Показати мережу офшорів бенефіціара' },
                { id: 'act-7', text: '📄 Пояснити документ', prompt: 'Пояснити 16 томів комплаєнсу' }
              ].map((act) => (
                <button
                  key={act.id}
                  onClick={() => {
                    setSearchQuery(act.prompt);
                    handleSearchTrigger(act.prompt);
                  }}
                  className="w-full text-left bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-300 p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer group"
                >
                  <span>{act.text}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Active recommendations widget */}
          <div className="bg-indigo-950/10 border border-indigo-900/20 p-4 rounded-2xl shadow-inner text-left space-y-2">
            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-indigo-400 block">ШІ-ПОРАДА КОНСПЕКТ</span>
            <p className="text-[11px] text-indigo-200 leading-relaxed font-sans">
              "Для детального комплаєнсу рекомендується перевірити транскордонні митні декларації постачальників через <strong>Томи ТЗ 12</strong>. Особливу увагу зверніть на зв'язки в офшорних юрисдикціях."
            </p>
          </div>
        </div>

        {/* Center Column: The Living AI Brain Core & Galaxy canvas (Point 1, 6, 10) */}
        <div className="lg:col-span-6 bg-slate-950/20 border border-slate-900/60 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[480px] shadow-2xl" id="living-brain-canvas-zone">
          
          {/* Proactive AI Alert (Point 7) */}
          <AnimatePresence>
            {suggestionState === 'visible' && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-3 left-4 right-4 z-40 bg-indigo-950 border border-indigo-500/30 p-3.5 rounded-2xl flex items-center justify-between shadow-2xl gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <span className="text-[8px] font-mono font-black text-indigo-400 block tracking-widest uppercase">ШІ АКТИВНІСТЬ</span>
                    <p className="text-xs font-semibold text-slate-100">Я знайшов три цікаві закономірності у зв'язках об'єкта.</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 text-[10px] font-mono font-black">
                  <button
                    onClick={() => {
                      setSuggestionState('dismissed');
                      setCoreState('validation');
                      speakVoice('Вивожу виявлені аномалії на граф. Зверніть увагу на червоні санкційні вузли.');
                      if (activeEntity) {
                        // High-risk focus
                        const nodes = [...graphNodes];
                        nodes.forEach(n => {
                          if (n.risk === 'HIGH') {
                            n.expanded = true;
                          }
                        });
                        setGraphNodes(nodes);
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Показати
                  </button>
                  <button
                    onClick={() => setSuggestionState('dismissed')}
                    className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Пізніше
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core mode state controller HUD inside canvas */}
          <div className="flex justify-center gap-1 bg-slate-900/60 border border-slate-850 p-1 rounded-xl self-center z-30 font-mono text-[9px] font-bold">
            {[
              { id: 'idle', label: 'Спокій' },
              { id: 'learning', label: 'Навчання' },
              { id: 'optimization', label: 'Оптимізація' },
              { id: 'inference', label: 'Висновок' },
              { id: 'validation', label: 'Валідація' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setCoreState(s.id as any);
                  const stateGreetings: { [key: string]: string } = {
                    idle: 'Переводжу ядро в режим очікування.',
                    learning: 'Починаю процес навчання. Перебудовую нейронні ваги.',
                    optimization: 'Проводжу оптимізацію мережі зв\'язків. Видаляю зайві вузли.',
                    inference: 'Виконую висновок. Будую логічні взаємозв\'язки.',
                    validation: 'Запускаю валідацію. Перевіряю комплаєнс умов.'
                  };
                  speakVoice(stateGreetings[s.id]);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${coreState === s.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Central Stage Container */}
          <div className="flex-1 flex items-center justify-center relative min-h-[300px]">
            
            {/* Background Data Star Galactic Elements (Point 6) */}
            <div className="absolute inset-0 pointer-events-none">
              {liveParticles.map(p => {
                const px = 250 + Math.cos(p.angle) * p.radius;
                const py = 200 + Math.sin(p.angle) * p.radius;
                return (
                  <motion.div
                    key={p.id}
                    style={{ left: px, top: py, width: p.size, height: p.size }}
                    className={`absolute rounded-full transition-opacity duration-300 ${isGalaxySwirling ? 'bg-indigo-400 opacity-90' : 'bg-slate-700/40 opacity-40'}`}
                  >
                    {p.size > 5 && !isGalaxySwirling && (
                      <span className="absolute left-full ml-1 text-[7px] text-slate-500 font-mono scale-95 whitespace-nowrap block">
                        {p.label}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Radar Circular background lines */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <svg className="w-full h-full" viewBox="0 0 500 400">
                <circle cx="250" cy="200" r="180" stroke="#818cf8" strokeWidth="0.5" strokeDasharray="4 4" fill="none" />
                <circle cx="250" cy="200" r="110" stroke="#818cf8" strokeWidth="0.5" fill="none" />
                <circle cx="250" cy="200" r="50" stroke="#818cf8" strokeWidth="0.5" fill="none" />
              </svg>
            </div>

            {/* SVG Linking Lines */}
            {graphNodes.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minHeight: '380px' }}>
                <defs>
                  <linearGradient id="glow-high" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="glow-medium" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="glow-low" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {graphNodes.map((node) => {
                  if (!node.parentId) return null;
                  const parent = graphNodes.find(p => p.id === node.parentId);
                  if (!parent) return null;
                  
                  const isLineActive = coreState === 'inference' || coreState === 'validation';
                  const strokeCol = node.risk === 'HIGH' ? 'url(#glow-high)' : node.risk === 'MEDIUM' ? 'url(#glow-medium)' : 'url(#glow-low)';
                  
                  return (
                    <g key={`l-${node.id}`}>
                      <motion.line
                        x1={parent.id === 'center-ai' ? parent.x! + mouseOffset.x : parent.x}
                        y1={parent.id === 'center-ai' ? parent.y! + mouseOffset.y : parent.y}
                        x2={node.x}
                        y2={node.y}
                        stroke={strokeCol}
                        strokeWidth={node.risk === 'HIGH' ? '2' : '1.2'}
                        className={isLineActive ? 'animate-pulse' : ''}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8 }}
                      />
                      
                      {/* Energy particles flowing along paths (Point 1 - inference, learning) */}
                      <circle r={node.risk === 'HIGH' ? '3.5' : '2'} fill={node.risk === 'HIGH' ? '#f43f5e' : '#6366f1'}>
                        <animateMotion
                          path={`M ${parent.id === 'center-ai' ? parent.x! + mouseOffset.x : parent.x} ${parent.id === 'center-ai' ? parent.y! + mouseOffset.y : parent.y} L ${node.x} ${node.y}`}
                          dur={coreState === 'learning' ? "1.2s" : "2.8s"}
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Core & Node Renderings (Points 1, 10) */}
            {graphNodes.map((node) => {
              const isCenterAI = node.type === 'core';
              const xPos = isCenterAI ? node.x! + mouseOffset.x : node.x!;
              const yPos = isCenterAI ? node.y! + mouseOffset.y : node.y!;

              if (isCenterAI) {
                // Determine color mapping based on Core State
                const coreColors: { [key: string]: string } = {
                  idle: 'from-indigo-900 via-indigo-700 to-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.55)]',
                  learning: 'from-emerald-900 via-emerald-700 to-emerald-500 shadow-[0_0_45px_rgba(16,185,129,0.7)] border-emerald-400',
                  optimization: 'from-cyan-900 via-cyan-700 to-cyan-500 shadow-[0_0_35px_rgba(6,182,212,0.6)]',
                  inference: 'from-amber-900 via-amber-700 to-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.7)] border-amber-400',
                  validation: 'from-purple-900 via-purple-700 to-purple-500 shadow-[0_0_45px_rgba(168,85,247,0.6)] border-purple-400'
                };

                return (
                  <div
                    key={node.id}
                    style={{ left: xPos, top: yPos }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300"
                  >
                    {/* Floating Speech bubble (Point 4) */}
                    <AnimatePresence>
                      {lastSpokenText && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-indigo-500/30 text-[10px] font-mono text-indigo-300 px-3 py-1.5 rounded-xl whitespace-nowrap shadow-2xl max-w-xs text-center leading-snug"
                        >
                          <span className="text-emerald-400 font-bold block text-[8px] uppercase tracking-widest mb-0.5">JARVIS: SPEAKING</span>
                          "{lastSpokenText.slice(0, 50)}..."
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Glowing breath rings */}
                    <motion.div 
                      animate={{ scale: coreState === 'optimization' ? [0.85, 0.95, 0.85] : [1, 1.12, 1] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="absolute inset-0 bg-indigo-500/10 rounded-full pointer-events-none" 
                    />
                    
                    {/* Rotating rings (Validation mode) */}
                    {coreState === 'validation' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                        className="absolute -inset-4 border border-dashed border-purple-400/40 rounded-full pointer-events-none"
                      />
                    )}

                    {/* 3D Intelligence Core Sphere Canvas */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <LiveAnalyticalCore state={coreState} mouseOffset={mouseOffset} />
                    </div>

                    {/* Central Core Orb */}
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className={`w-20 h-20 rounded-full bg-gradient-to-tr p-0.5 border border-indigo-400/30 flex flex-col items-center justify-center text-center cursor-pointer relative ${coreColors[coreState] || coreColors.idle}`}
                    >
                      <Cpu className="w-7 h-7 text-white animate-pulse" />
                      <span className="text-[7px] text-white font-mono font-black uppercase tracking-widest mt-1">
                        {coreState.toUpperCase()}
                      </span>
                    </motion.div>

                    {/* Activity flag below orb */}
                    <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-500/20 whitespace-nowrap">
                      🧠 AI BRAIN: REACTIVE
                    </span>
                  </div>
                );
              }

              // Secondary nodes rendering
              return (
                <motion.div
                  key={node.id}
                  style={{ left: xPos, top: yPos }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                  onClick={() => handleNodeClick(node)}
                  whileHover={{ scale: 1.08 }}
                >
                  <div className={`p-2 rounded-xl border flex items-center gap-2 max-w-[170px] bg-slate-950/90 backdrop-blur-md transition-all ${
                    node.risk === 'HIGH' ? 'border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 
                    node.risk === 'MEDIUM' ? 'border-amber-500/30 text-amber-400' : 'border-indigo-500/20 text-indigo-400'
                  } ${selectedNode?.id === node.id ? 'ring-1 ring-indigo-400 ring-offset-2 ring-offset-slate-950' : ''}`}>
                    <div className={`p-1 rounded shrink-0 ${node.risk === 'HIGH' ? 'bg-rose-500/15' : node.risk === 'MEDIUM' ? 'bg-amber-500/15' : 'bg-indigo-500/15'}`}>
                      {node.type === 'company' && <Briefcase className="w-3 h-3" />}
                      {node.type === 'person' && <User className="w-3 h-3" />}
                      {node.type === 'court' && <ShieldCheck className="w-3 h-3" />}
                      {node.type === 'customs' && <Truck className="w-3 h-3" />}
                      {node.type === 'taxes' && <Landmark className="w-3 h-3" />}
                      {node.type === 'cryptowallet' && <Hash className="w-3 h-3" />}
                      {node.type === 'sanction' && <ShieldAlert className="w-3 h-3 text-rose-500 animate-pulse" />}
                      {node.type === 'auto' && <Truck className="w-3 h-3" />}
                      {node.type === 'property' && <Globe className="w-3 h-3" />}
                    </div>
                    <div className="text-left overflow-hidden">
                      <h4 className="text-[9px] font-black tracking-tight text-white truncate max-w-[100px]">{node.label}</h4>
                      <p className="text-[7px] text-slate-500 truncate max-w-[100px] font-mono">{node.sublabel}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

          </div>

          {/* Search box built in the center page (Point 3) */}
          <div className="w-full max-w-lg mx-auto relative z-30">
            <div className="bg-slate-950/95 border border-slate-900 rounded-2xl flex items-center p-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
              <div className="pl-3 text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Запит ШІ: Назва ТОВ, ПІБ, ЄДРПОУ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchTrigger(searchQuery);
                }}
                className="w-full bg-transparent px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-2 text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                >
                  CLEAR
                </button>
              )}
              {isLoadingSearch && <div className="px-2 text-indigo-400"><RefreshCw className="w-4 h-4 animate-spin" /></div>}
              <button
                onClick={() => handleSearchTrigger(searchQuery)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] uppercase px-4 py-2 rounded-xl transition-all flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Аналізувати
              </button>
            </div>

            {/* Suggestions Overlay */}
            <AnimatePresence>
              {searchSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl divide-y divide-slate-900/60 z-50 text-left"
                >
                  {searchSuggestions.slice(0, 3).map((ent) => (
                    <button
                      key={ent.id}
                      onClick={() => selectSuggestion(ent)}
                      className="w-full text-left px-3.5 py-2 hover:bg-indigo-950/20 transition-all flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-200">{ent.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">Код: {ent.code} • {ent.address.slice(0, 30)}</p>
                      </div>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${ent.riskScore >= 80 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {ent.riskScore}% RISK
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Column: AI Health Monitor & User-focused metrics (Points 2, 8) */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between" id="ai-health-metrics-panel">
          
          {/* AI Qualitative Readiness & Parameters (Point 2) */}
          <div className="bg-slate-900/35 border border-slate-900 p-4 rounded-2xl space-y-4 shadow-lg backdrop-blur-sm text-left">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400 animate-spin" />
              <h3 className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Параметри Системи</h3>
            </div>
            
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-900/50">
                <span className="text-slate-400">🟢 AI готовність</span>
                <span className="text-emerald-400 font-black">99.8% READY</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-900/50">
                <span className="text-slate-400">🧠 Рівень аналізу</span>
                <span className="text-indigo-400 font-black">ГЛИБОКИЙ ШІ</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-900/50">
                <span className="text-slate-400">📈 Достовірність</span>
                <span className="text-emerald-400 font-black">98.4% HIGH</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-900/50">
                <span className="text-slate-400">⚡ Швидкість відповіді</span>
                <span className="text-indigo-400 font-black">1.2 СЕКУНДИ</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-900/50">
                <span className="text-slate-400">🔍 Активність</span>
                <span className="text-indigo-400 font-black">АКТИВНИЙ СКРИНІНГ</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-900/50">
                <span className="text-slate-400">🎯 Якість прогнозу</span>
                <span className="text-emerald-400 font-black">КЛАС А++</span>
              </div>
            </div>
          </div>

          {/* AI Health Dashboard Widget (Point 8) */}
          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-3 shadow-md text-left">
            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-500 block">ЗДОРОВ'Я ШІ (AI HEALTH)</span>
            
            <div className="space-y-2 text-[11px] font-medium font-sans">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Система працює стабільно</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>{coreState === 'idle' ? 'Аналіз успішно завершено' : 'Триває обчислення моделі...'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Опрацьовано 12.4 млн записів</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>Точність нейромережі 98.4%</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Час транзакцій: 1.2s</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Активні дослідження: 4</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Slide-out Info-Panel, Documents, Maps, Timelines */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-6 items-start relative z-10 w-full text-left">
        
        {/* Left half: AI briefing */}
        <div className="xl:col-span-8 bg-slate-900/30 border border-slate-900 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
                ШІ-Стислий аналітичний висновок Jarvis
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Check className="w-3 h-3" />
              Оновлено в реальному часі
            </div>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {selectedNode?.details || activeEntity?.description || "Оберіть будь-який сценарій або вузол на інтерактивному ШІ-графі вище, щоб моментально вивести контекст комплаєнсу, ризики закордонного імпорту або судові приписи."}
          </p>

          <div className="pt-2 flex items-center justify-between text-[9px] text-slate-500 font-mono border-t border-slate-900/60">
            <span>Вплив санкцій: <strong className={activeEntity?.status === 'SANCTIONED' ? 'text-red-400 font-bold' : 'text-slate-300 font-bold'}>{activeEntity?.status || 'Н/Д'}</strong></span>
            <span>Клас ризику: <strong className="text-rose-400 font-bold">CLASS A HIGH COMPLIANCE</strong></span>
            <span>Джерело даних: СБУ / ЄДРПОУ / КИЇВ МИТНИЦЯ</span>
          </div>
        </div>

        {/* Right half: Detailed interactive actions card */}
        <div className="xl:col-span-4 bg-slate-900/40 border border-slate-900 rounded-2xl p-4 space-y-4 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[8px] text-indigo-400 font-mono font-bold uppercase tracking-widest block">АКТИВНИЙ ОБ'ЄКТ</span>
              <h3 className="text-sm font-black text-slate-100 tracking-tight mt-0.5 truncate max-w-[200px]">
                {activeEntity?.name || "Не обрано"}
              </h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Код: {activeEntity?.code || "—"}</p>
            </div>
            
            <div className={`px-2 py-1 rounded-xl border text-center ${activeEntity?.riskScore && activeEntity.riskScore >= 80 ? 'border-rose-500/20 bg-rose-500/5 text-rose-500' : 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400'}`}>
              <span className="text-[7px] font-mono block font-bold leading-none uppercase">РИЗИК</span>
              <span className="text-base font-mono font-black tracking-tight leading-none block mt-1">{activeEntity?.riskScore || 0}%</span>
            </div>
          </div>

          {userRole === 'predator' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-start gap-2 text-[9px] text-amber-400 leading-normal">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span>
                <strong>Обмежений доступ (Level 1):</strong> Скринінг чутливих зв'язків та бенефіціарів заблоковано. Увімкніть <strong>PREDATOR PRO</strong>.
              </span>
            </div>
          )}

          <div className="space-y-2 border-y border-slate-900 py-3 text-xs font-sans">
            <div className="flex justify-between">
              <span className="text-slate-500">Адреса:</span>
              <span className="text-slate-300 truncate max-w-[160px] text-right font-medium">{activeEntity?.address || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Статус:</span>
              <span className={`font-mono text-[9px] font-bold ${activeEntity?.status === 'SANCTIONED' ? 'text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'}`}>
                {activeEntity?.status || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Бенефіціар:</span>
              <span className="text-slate-300 font-medium">
                {userRole === 'predator' ? "🔒 [ДОСТУП ОБМЕЖЕНО]" : (activeEntity?.founders?.[0]?.name || "Невідомо")}
              </span>
            </div>
          </div>

          {/* Core Actions launching slide-out drawers */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold">
            <button
              onClick={() => {
                setShowPdfDrawer(true);
                setShowMapDrawer(false);
                setShowTimelineDrawer(false);
                speakVoice("Завантажую повний аналітичний PDF-звіт на 16 томів.");
              }}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-300 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Звіт (PDF)
            </button>

            <button
              onClick={() => {
                setShowMapDrawer(true);
                setShowPdfDrawer(false);
                setShowTimelineDrawer(false);
                speakVoice("Перемикаю на тактичну географічну карту постачання.");
              }}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-300 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Map className="w-3.5 h-3.5 text-emerald-400" />
              Гео-Карта
            </button>

            <button
              onClick={() => {
                setShowTimelineDrawer(!showTimelineDrawer);
                speakVoice("Візуалізую історичний хронологічний таймлайн подій.");
              }}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-300 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer col-span-2"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Історичний Таймлайн (Timeline)
            </button>
          </div>
        </div>

      </div>

      {/* DYNAMIC TIMELINE TRAY */}
      <AnimatePresence>
        {showTimelineDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-900 bg-slate-950/95 backdrop-blur-md p-4 rounded-t-2xl mt-4 space-y-3.5 z-30 relative text-left"
          >
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold font-mono uppercase text-slate-200">Хронологічний Таймлайн (Події об'єкта)</h4>
              </div>
              <button 
                onClick={() => setShowTimelineDrawer(false)}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono font-bold uppercase"
              >
                Закрити [X]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1 font-sans">
              {[
                { date: "2021-03-12", title: "Заснування підприємства", desc: "Реєстрація юрособи у м.Київ. Засновник — Коваленко І.В.", risk: "LOW" },
                { date: "2023-08-15", title: "Офшорний Акціонер", desc: "Передача 49% акцій Vanguard Holdings Ltd (Беліз).", risk: "MEDIUM" },
                { date: "2024-11-04", title: "Збіг санкцій США", desc: "Узгодження списків OFAC. Попередження системи.", risk: "HIGH" },
                { date: "2025-04-12", title: "Кримінальне провадження", desc: "Справа СБУ №42024. Обшуки, вилучення документації.", risk: "HIGH" },
                { date: "2026-05-10", title: "Санкції РНБО України", desc: "Офіційне внесення до санкційних списків.", risk: "HIGH" }
              ].map((evt, idx) => (
                <div key={idx} className={`p-3 rounded-xl border bg-slate-900/50 space-y-1 relative ${evt.risk === 'HIGH' ? 'border-rose-500/20' : 'border-slate-850'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-indigo-400">{evt.date}</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${evt.risk === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : evt.risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                      {evt.risk}
                    </span>
                  </div>
                  <h5 className="text-[10px] font-black text-slate-200 mt-1">{evt.title}</h5>
                  <p className="text-[9px] text-slate-400 leading-normal">{evt.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRAWERS (PDF / MAP) */}
      <AnimatePresence>
        {showPdfDrawer && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-[68px] right-0 bottom-[36px] w-full max-w-lg bg-slate-950 border-l border-slate-900 shadow-2xl p-5 overflow-y-auto z-45 flex flex-col justify-between text-left font-sans"
          >
            <div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-rose-500" />
                  <span className="text-xs font-black font-mono tracking-widest uppercase text-white">АНАЛІТИЧНИЙ ЗВІТ PREDATOR</span>
                </div>
                <button 
                  onClick={() => setShowPdfDrawer(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded text-[10px] font-mono font-bold"
                >
                  ЗАКРИТИ [X]
                </button>
              </div>

              <div className="border border-dashed border-rose-500/40 bg-rose-500/5 p-3 rounded-xl text-center space-y-1 mb-5">
                <span className="text-[10px] font-mono font-black tracking-widest text-rose-500 uppercase">ЦІЛКОМ ТАЄМНО / CLASSIFIED</span>
                <p className="text-[8px] text-slate-400 font-mono">ДОСТУП ДОЗВОЛЕНО ТІЛЬКИ ОРГАНАМ БЕЗПЕКИ УКРАЇНИ ТА ФІНАНСОВОМУ МОНІТОРИНГУ</p>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div>
                  <h4 className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-wider mb-1">1. ІДЕНТИФІКАЦІЙНІ ДАНІ</h4>
                  <div className="bg-slate-900/50 rounded-xl p-3 space-y-1.5 font-mono text-[10px]">
                    <div className="flex justify-between"><span>Назва:</span><strong className="text-slate-100">{activeEntity?.name}</strong></div>
                    <div className="flex justify-between"><span>Код ЄДРПОУ:</span><strong className="text-slate-100">{activeEntity?.code}</strong></div>
                    <div className="flex justify-between"><span>Адреса:</span><strong className="text-slate-100">{activeEntity?.address}</strong></div>
                    <div className="flex justify-between"><span>Бенефіціар:</span><strong className="text-slate-100">{activeEntity?.founders?.[0]?.name || "—"}</strong></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-wider mb-1">2. 16 ТОМІВ ТЕХНІЧНОГО КОМПЛАЄНСУ</h4>
                  <div className="bg-slate-900/50 rounded-xl p-3 space-y-2">
                    <p className="leading-relaxed">ШІ-алгоритм звірив контрактну документацію фірми із 16 томами вимог комплаєнсу експортного контролю ЄС:</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold">
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2 rounded flex items-center gap-1.5">
                        <ShieldX className="w-3.5 h-3.5" />
                        Том 3: Порушено
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Том 8: Бездоганно
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-wider mb-1">3. ШІ-ВИСНОВОК JARVIS</h4>
                  <div className="bg-indigo-950/15 border border-indigo-900/40 p-3 rounded-xl leading-relaxed italic text-indigo-200">
                    "{activeEntity?.aiRecommendations}"
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3 mt-4 flex items-center gap-2">
              <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/15">
                <Download className="w-4 h-4" />
                Завантажити PDF
              </button>
              <button 
                onClick={() => setShowPdfDrawer(false)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 py-2.5 px-4 rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Закрити
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMapDrawer && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-[68px] right-0 bottom-[36px] w-full max-w-lg bg-slate-950 border-l border-slate-900 shadow-2xl p-5 overflow-y-auto z-45 flex flex-col justify-between text-left font-sans"
          >
            <div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Map className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="text-xs font-black font-mono tracking-widest uppercase text-white">ТАКТИЧНА КАРТА КАНАЛІВ ПОСТАЧАННЯ</span>
                </div>
                <button 
                  onClick={() => setShowMapDrawer(false)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded text-[10px] font-mono font-bold"
                >
                  ЗАКРИТИ [X]
                </button>
              </div>

              <div className="w-full h-[240px] bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center mb-4">
                <svg className="absolute inset-0 w-full h-full opacity-45" viewBox="0 0 300 200">
                  <path d="M10 100 Q 80 50 150 120 T 290 80" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6 3" className="animate-pulse" />
                  <circle cx="10" cy="100" r="4" fill="#38bdf8" />
                  <text x="15" y="105" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">Shenzhen (CN)</text>
                  
                  <circle cx="150" cy="120" r="4" fill="#f59e0b" />
                  <text x="155" y="115" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">Istanbul (TR)</text>

                  <circle cx="290" cy="80" r="4" fill="#ef4444" className="animate-ping" />
                  <circle cx="290" cy="80" r="3" fill="#ef4444" />
                  <text x="230" y="75" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">Kyiv (UA)</text>
                </svg>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <h4 className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-wider">ГЕОГРАФІЧНІ КООРДИНАТИ ТРАНЗИТУ</h4>
                <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                    <span className="text-slate-500">Пункт вильоту / Порт:</span>
                    <strong className="text-slate-200">Гонконг Термінал 4</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                    <span className="text-slate-500">Транзитний хаб:</span>
                    <strong className="text-amber-400">Стамбул (TR)</strong>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">Кінцевий Отримувач:</span>
                    <strong className="text-red-400">{activeEntity?.name}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3 mt-4 flex items-center gap-2">
              <button 
                onClick={() => setShowMapDrawer(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/15"
              >
                ПОВЕРНУТИСЬ ДО ГРАФУ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
