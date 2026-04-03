import { apiClient } from './config';

export interface UploadResponse {
    job_id: string;
    status: string;
    file_size_bytes: number;
    estimated_rows: number | null;
    chunks: number;
    progress_url: string;
    estimated_completion_seconds: number | null;
}

export interface JobStatusResponse {
    job_id: string;
    status: string;
    file_name: string | null;
    total_records: number | null;
    successful_records: number;
    failed_records: number;
    progress_pct: number;
    created_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    error_summary: string | null;
}

export const ingestionApi = {
    /**
     * Завантаження файлу для інгестування (v56.1.4 API)
     */
    uploadFile: async (file: File, datasetName?: string, description?: string): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        if (datasetName) formData.append('dataset_name', datasetName);
        if (description) formData.append('description', description);

        return (await apiClient.post('/ingestion/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })).data;
    },

    /**
     * Отримання прогресу job
     */
    getJobProgress: async (jobId: string): Promise<JobStatusResponse> => {
        return (await apiClient.get(`/ingestion/progress/${jobId}`)).data;
    },

    /**
     * Список останніх jobs
     */
    getJobs: async (limit: number = 20): Promise<JobStatusResponse[]> => {
        const res = await apiClient.get(`/ingestion/jobs?limit=${limit}`);
        return Array.isArray(res.data) ? res.data : res.data?.items || [];
    },

    /**
     * Статус активних пайплайнів
     */
    getStatus: async (): Promise<{ active_jobs: number }> => {
        return (await apiClient.get('/ingestion/status')).data;
    },

    /**
     * Тригер запуску пайплайну
     */
    trigger: async (source: string): Promise<{ status: string; source: string }> => {
        return (await apiClient.post('/ingestion/trigger', null, { params: { source } })).data;
    },

    // Legacy endpoints (для сумісності)
    startJob: async (config: any) => {
        return (await apiClient.post('/ingest/job', config)).data;
    },
    getJobStatus: async (id: string) => {
        return (await apiClient.get(`/ingest/job/${id}`)).data;
    },
    getFeed: async (type: string = 'all') => {
        return (await apiClient.get(`/ingest/feed?type=${type}`)).data;
    }
};
