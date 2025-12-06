
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agent, CyclePhase } from '../types';

// Initial State Configuration - UPDATED FOR MAS v4.0 (Expert Report)
const INITIAL_AGENTS: Agent[] = [
    // --- CORE SYSTEM AGENTS ---
    { id: 'ORCH-01', name: 'Оркестратор', clan: 'ARCHITECT', type: 'Координатор', status: 'ACTIVE', efficiency: 100, lastAction: 'Система Ініціалізована' },
    { id: 'REV-01', name: 'Рев\'юер', clan: 'ARCHITECT', type: 'Інтерфейс', status: 'ACTIVE', efficiency: 100, lastAction: 'Очікування вводу' },
    
    // --- MAS v4.0 GOVERNANCE ---
    { id: 'SKEPTIC-01', name: 'Скептик', clan: 'SYSTEM', type: 'Валідатор', status: 'IDLE', efficiency: 99, lastAction: 'Очікування' },
    { id: 'ARB-01', name: 'Арбітр', clan: 'SYSTEM', type: 'Суддя', status: 'IDLE', efficiency: 100, lastAction: 'Очікування' },

    // --- DEVOPS SQUAD ---
    { id: 'CODE-01', name: 'Код Аналітик', clan: 'DEVOPS', type: 'Аудит', status: 'IDLE', efficiency: 98, lastAction: 'Очікування' },
    { id: 'TEST-01', name: 'QA Генератор', clan: 'DEVOPS', type: 'QA', status: 'IDLE', efficiency: 92, lastAction: 'Очікування' },
    { id: 'FIX-01', name: 'Фіксер', clan: 'DEVOPS', type: 'Розробник', status: 'IDLE', efficiency: 95, lastAction: 'Очікування' },
    { id: 'SEC-01', name: 'Сек\'юріті', clan: 'DEVOPS', type: 'SecOps', status: 'IDLE', efficiency: 100, lastAction: 'Очікування' },
    { id: 'PR-01', name: 'Авто-PR', clan: 'DEVOPS', type: 'GitOps', status: 'IDLE', efficiency: 99, lastAction: 'Очікування' },
    
    // --- SECTOR EXPERTS (NEW) ---
    { id: 'MED-01', name: 'Гіппократ', clan: 'INVESTIGATION', type: 'Медичний ШІ', status: 'WORKING', efficiency: 94, lastAction: 'Аналіз кластерів пацієнтів' },
    { id: 'FIN-01', name: 'Гордон', clan: 'INVESTIGATION', type: 'Фін. Аналітик', status: 'WORKING', efficiency: 97, lastAction: 'Моніторинг SWIFT логів' },
    { id: 'ECO-01', name: 'Гайя', clan: 'INVESTIGATION', type: 'Еко Науковець', status: 'IDLE', efficiency: 91, lastAction: 'Очікування' },
    
    // --- DATA OPS ---
    { id: 'DQ-01', name: 'Якість Даних', clan: 'DATA', type: 'Аудитор', status: 'IDLE', efficiency: 91, lastAction: 'Очікування' },
];

interface AgentContextType {
    agents: Agent[];
    cyclePhase: CyclePhase;
    logs: string[];
    activePR: { id: number, title: string } | null;
    startCycle: () => void;
    advanceCycle: () => void;
    approvePR: () => void;
    rejectPR: () => void;
    addLog: (msg: string) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [cyclePhase, setCyclePhase] = useState<CyclePhase>('IDLE');
    const [activePR, setActivePR] = useState<{ id: number, title: string } | null>(null);
    const [logs, setLogs] = useState<string[]>([
        "[СИСТЕМА] MAS Оркестратор ініціалізовано (v4.0).",
        "[СИСТЕМА] Агенти СКЕПТИК та АРБІТР підключені.",
        "[СИСТЕМА] G-01 Протокол (Git-Only) активовано.",
        "[ORCH-01] Завантажено модулі секторів: GOV, MED, BIZ, SCI."
    ]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const startCycle = useCallback(() => {
        if (cyclePhase !== 'IDLE') return;
        setCyclePhase('SCANNING');
        addLog("[ORCH-01] Ініціалізація циклу самовдосконалення (MAS v4.0)...");
        setAgents(prev => prev.map(a => a.id === 'CODE-01' ? { ...a, status: 'WORKING', lastAction: 'Сканування репозиторію...' } : a));
    }, [cyclePhase, addLog]);

    const approvePR = useCallback(() => {
        addLog(`[REV-01] PR #${activePR?.id} ЗАТВЕРДЖЕНО Оператором.`);
        setActivePR(null);
        setCyclePhase('CI_CD');
        setAgents(prev => prev.map(a => a.id === 'PR-01' ? { ...a, status: 'WORKING', lastAction: 'Деплой через ArgoCD' } : a));
    }, [activePR, addLog]);

    const rejectPR = useCallback(() => {
        addLog("[REV-01] PR Відхилено. Скидання циклу.");
        setCyclePhase('IDLE');
        setActivePR(null);
        setAgents(prev => prev.map(a => ({ ...a, status: 'IDLE', lastAction: 'Очікування' })));
    }, [addLog]);

    // Cycle Logic State Machine - UPDATED FOR MAS v4.0
    const advanceCycle = useCallback(() => {
        switch (cyclePhase) {
            case 'SCANNING':
                addLog("[CODE-01] Сканування завершено. Знайдено кандидатів на оптимізацію.");
                setAgents(prev => prev.map(a => a.id === 'CODE-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'REF-01' ? { ...a, status: 'WORKING', lastAction: 'Планування архітектури рефакторингу' } : a));
                setCyclePhase('PLANNING');
                break;
            case 'PLANNING':
                addLog("[REF-01] План згенеровано: 'Оптимізація Regex у парсері митниці'.");
                setAgents(prev => prev.map(a => a.id === 'REF-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'FIX-01' ? { ...a, status: 'WORKING', lastAction: 'Генерація Python коду' } : a));
                setCyclePhase('CODING');
                break;
            case 'CODING':
                addLog("[FIX-01] Патч застосовано до локальної гілки.");
                setAgents(prev => prev.map(a => a.id === 'FIX-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'TEST-01' ? { ...a, status: 'WORKING', lastAction: 'Запуск PyTest набору' } : a));
                setCyclePhase('TESTING');
                break;
            case 'TESTING':
                addLog("[TEST-01] Тести пройдено. Передача Скептику.");
                setAgents(prev => prev.map(a => a.id === 'TEST-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'SKEPTIC-01' ? { ...a, status: 'WORKING', lastAction: 'Змагальна валідація коду' } : a));
                setCyclePhase('SKEPTIC_REVIEW');
                break;
            case 'SKEPTIC_REVIEW':
                addLog("[SKEPTIC-01] Валідація успішна. Галюцинацій не виявлено.");
                setAgents(prev => prev.map(a => a.id === 'SKEPTIC-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'ARB-01' ? { ...a, status: 'WORKING', lastAction: 'Розрахунок оцінки довіри' } : a));
                setCyclePhase('ARBITRATION');
                break;
            case 'ARBITRATION':
                addLog("[ARB-01] Розрахунок мультивекторного скорингу довіри...");
                // Simulate weighing based on history and authority
                addLog("[ARB-01] Вага авторитету джерел: SKEPTIC (Висока), KNOWLEDGE_GRAPH (Критична).");
                addLog("[ARB-01] Аналіз історичної точності: Агент SEC-01 (99.9% успіху).");
                addLog("[ARB-01] Розрахунок завершено. Композитний бал: 0.992. Вердикт: ДОВІРЕНО.");
                
                setAgents(prev => prev.map(a => a.id === 'ARB-01' ? { ...a, status: 'IDLE' } : a));
                setAgents(prev => prev.map(a => a.id === 'PR-01' ? { ...a, status: 'WORKING', lastAction: 'Відкриття Pull Request' } : a));
                setCyclePhase('PR_REVIEW');
                break;
            case 'PR_REVIEW':
                if (!activePR) {
                    const newPrId = Math.floor(Math.random() * 1000) + 100;
                    setActivePR({ id: newPrId, title: 'fix(etl): optimize customs regex parser' });
                    
                    setTimeout(() => {
                        addLog("[SEC-01] Сканування безпеки: ПРОЙДЕНО (Впевненість 99.8%).");
                    }, 1000);
                    setTimeout(() => {
                        addLog(`[ORCH-01] Цикл призупинено. Очікування схвалення оператора для PR #${newPrId}.`);
                    }, 2000);

                    setAgents(prev => prev.map(a => a.id === 'PR-01' ? { ...a, status: 'IDLE' } : a));
                }
                // Cycle halts here until approvePR is called
                break;
            case 'CI_CD':
                addLog("[PR-01] ArgoCD Sync запущено. Перевірка метрик...");
                setCyclePhase('DEPLOYED');
                break;
            case 'DEPLOYED':
                addLog("[ORCH-01] Цикл завершено. Систему оптимізовано.");
                setAgents(prev => prev.map(a => ({ ...a, status: 'IDLE', lastAction: 'Очікування' })));
                setCyclePhase('IDLE');
                break;
        }
    }, [cyclePhase, addLog, activePR]);

    // Auto-advance timer
    useEffect(() => {
        if (cyclePhase === 'IDLE' || cyclePhase === 'PR_REVIEW') return;

        const durations: Record<string, number> = {
            'SCANNING': 4000,
            'PLANNING': 3000,
            'CODING': 5000,
            'TESTING': 3000,
            'SKEPTIC_REVIEW': 3000,
            'ARBITRATION': 4000, // Increased for detailed scoring
            'CI_CD': 6000,
            'DEPLOYED': 3000
        };

        const timer = setTimeout(() => {
            advanceCycle();
        }, durations[cyclePhase] || 2000);

        return () => clearTimeout(timer);
    }, [cyclePhase, advanceCycle]);

    // Independent Loop for Sector Agents (to make them look busy without Cycle)
    useEffect(() => {
        const interval = setInterval(() => {
            setAgents(prev => prev.map(agent => {
                if (agent.clan === 'INVESTIGATION' && Math.random() > 0.7) {
                    const actions = agent.id === 'MED-01' 
                        ? ['Індексація DICOM файлів', 'Звірка з ICD-10', 'Оновлення графа Нульового Пацієнта'] 
                        : agent.id === 'FIN-01'
                        ? ['Сканування SWIFT транзакцій', 'Розрахунок волатильності ринку', 'Маркування AML ризиків']
                        : ['Читання телеметрії супутника', 'Калібрування AQI сенсорів', 'Прогнозування векторів повені'];
                    
                    return { ...agent, status: 'WORKING', lastAction: actions[Math.floor(Math.random() * actions.length)] };
                } else if (agent.clan === 'INVESTIGATION' && agent.status === 'WORKING') {
                     return { ...agent, status: 'IDLE', lastAction: 'Очікування' };
                }
                return agent;
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AgentContext.Provider value={{
            agents,
            cyclePhase,
            logs,
            activePR,
            startCycle,
            advanceCycle,
            approvePR,
            rejectPR,
            addLog
        }}>
            {children}
        </AgentContext.Provider>
    );
};

export const useAgents = () => {
    const context = useContext(AgentContext);
    if (context === undefined) {
        throw new Error('useAgents must be used within an AgentProvider');
    }
    return context;
};
