import { apiClient, v45Client } from './config';

export const systemApi = {
    getHealth: async () => {
        return (await apiClient.get('/health')).data;
    },
    getStatus: async () => {
        return (await v45Client.get('/system/status')).data;
    },
    getStats: async () => {
        return (await apiClient.get('/system/stats')).data;
    },
    getConfig: async () => {
        return (await apiClient.get('/system/config')).data;
    },
    saveConfig: async (config: any) => {
        return (await apiClient.post('/system/config', config)).data;
    },
    restartServices: async () => {
        return (await v45Client.post('/system/restart')).data;
    },
    lockdown: async () => {
        return (await v45Client.post('/system/lockdown')).data;
    },
    getLogs: async () => {
        return (await v45Client.get('/system/status')).data;
    }
};
