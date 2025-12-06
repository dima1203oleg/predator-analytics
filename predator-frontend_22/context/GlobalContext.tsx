import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

interface GlobalState {
    systemVersion: string;
    defconLevel: 1 | 2 | 3 | 4 | 5; // 1 is critical
    cpuLoad: number;
    networkTraffic: number;
    activeThreats: number;
    isMaintenanceMode: boolean;
    globalLogs: string[];
}

interface GlobalContextType {
    state: GlobalState;
    dispatchEvent: (type: string, payload?: any) => void;
    updateLoad: (cpuDelta: number, netDelta: number) => void;
    upgradeSystem: (newVersion: string) => void;
    setDefcon: (level: 1 | 2 | 3 | 4 | 5) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [state, setState] = useState<GlobalState>({
        systemVersion: 'v20.0.0', // SINGULARITY EDITION
        defconLevel: 3,
        cpuLoad: 15,
        networkTraffic: 24, // MB/s
        activeThreats: 0,
        isMaintenanceMode: false,
        globalLogs: []
    });

    // Decay effect: Return CPU/Network to baseline over time
    useEffect(() => {
        const interval = setInterval(() => {
            setState(prev => ({
                ...prev,
                cpuLoad: Math.max(15, prev.cpuLoad - 2), // Decay to 15%
                networkTraffic: Math.max(10, prev.networkTraffic - 5) // Decay to 10MB/s
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const updateLoad = useCallback((cpuDelta: number, netDelta: number) => {
        setState(prev => ({
            ...prev,
            cpuLoad: Math.min(100, prev.cpuLoad + cpuDelta),
            networkTraffic: prev.networkTraffic + netDelta
        }));
    }, []);

    const upgradeSystem = useCallback((newVersion: string) => {
        setState(prev => ({ ...prev, systemVersion: newVersion }));
        toast.success("System Upgraded", `Kernel updated to ${newVersion}`);
    }, [toast]);

    const setDefcon = useCallback((level: 1 | 2 | 3 | 4 | 5) => {
        setState(prev => ({ ...prev, defconLevel: level }));
        if (level === 1) toast.error("DEFCON 1", "Maximum Security Protocols Engaged!");
    }, [toast]);

    const dispatchEvent = useCallback((type: string, payload?: any) => {
        const timestamp = new Date().toLocaleTimeString();
        let logMsg = `[SYSTEM] Event: ${type}`;

        switch (type) {
            case 'START_SCAN':
                updateLoad(40, 150); // Massive spike
                logMsg = `[ANALYTICS] Deep Scan initiated on ${payload}`;
                toast.info("Process Started", "Allocating heavy compute resources...");
                break;
            case 'DEPLOY_START':
                updateLoad(20, 50);
                setState(prev => ({ ...prev, isMaintenanceMode: true }));
                logMsg = `[DEVOPS] Deployment pipeline triggered: ${payload}`;
                break;
            case 'DEPLOY_SUCCESS':
                setState(prev => ({ ...prev, isMaintenanceMode: false }));
                upgradeSystem(payload);
                logMsg = `[DEVOPS] Deployment successful. Version: ${payload}`;
                break;
            case 'THREAT_DETECTED':
                setState(prev => ({ ...prev, activeThreats: prev.activeThreats + 1, defconLevel: 2 }));
                logMsg = `[SECURITY] CRITICAL THREAT DETECTED: ${payload}`;
                toast.warning("Security Alert", "Threat detection systems triggered.");
                break;
            case 'THREAT_RESOLVED':
                setState(prev => ({ ...prev, activeThreats: Math.max(0, prev.activeThreats - 1), defconLevel: 3 }));
                logMsg = `[SECURITY] Threat neutralized: ${payload}`;
                break;
        }

        setState(prev => ({ ...prev, globalLogs: [logMsg, ...prev.globalLogs].slice(0, 50) }));
    }, [updateLoad, upgradeSystem, toast]);

    return (
        <GlobalContext.Provider value={{ state, dispatchEvent, updateLoad, upgradeSystem, setDefcon }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalState = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobalState must be used within a GlobalProvider');
    }
    return context;
};