export const factoryApi = {
  executeRun: async (data?: any) => ({ id: "run_1", status: "success" }),
  getRuns: async () => [],
  getPatterns: async () => [],
  getMetrics: async () => ({ total_patterns: 12, gold_patterns: 5, avg_score: 94.5, total_runs: 48 }),
  getHealth: async () => ({ status: "healthy", activeModel: "Qwen-2.5-Coder", progress: 100 }),
  getStatus: async () => ({ active: true }),
};

export const useFactoryApi = () => factoryApi;