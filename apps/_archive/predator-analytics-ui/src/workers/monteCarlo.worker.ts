/// <reference lib="webworker" />

export interface MonteCarloParams {
  iterations: number;
  baseLiquidity: number;
  monthlyBurnRate: number;
  monthlyRevenueAvg: number;
  revenueVolatility: number; // 0.0 to 1.0
  monthsToSimulate: number;
  activeAnomalies: { id: string; riskMultiplier: number }[];
}

export interface MonteCarloResult {
  successRate: number;
  bankruptcyRate: number;
  averageEndLiquidity: number;
  worstCaseLiquidity: number;
  bestCaseLiquidity: number;
  simulatedPaths: number[][]; // A sample of paths to draw on the chart
}

self.onmessage = (e: MessageEvent<MonteCarloParams>) => {
  const params = e.data;
  
  let bankruptcies = 0;
  let totalEndLiquidity = 0;
  let worstCase = Infinity;
  let bestCase = -Infinity;
  const samplePaths: number[][] = [];
  
  // Calculate total risk multiplier from anomalies
  const globalRiskMultiplier = params.activeAnomalies.reduce((acc, anom) => acc * anom.riskMultiplier, 1.0);

  for (let i = 0; i < params.iterations; i++) {
    let currentLiquidity = params.baseLiquidity;
    const path = [currentLiquidity];
    let isBankrupt = false;

    for (let month = 1; month <= params.monthsToSimulate; month++) {
      // Gaussian random generator (Box-Muller transform)
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      
      // Calculate revenue for this month using volatility and risk multiplier
      const revenueFluctuation = params.monthlyRevenueAvg * params.revenueVolatility * z0;
      // If there are high risk anomalies, they pull the mean revenue down slightly
      const adjustedRevenue = Math.max(0, (params.monthlyRevenueAvg + revenueFluctuation) / globalRiskMultiplier);
      
      currentLiquidity = currentLiquidity + adjustedRevenue - params.monthlyBurnRate;
      path.push(currentLiquidity);

      if (currentLiquidity <= 0) {
        isBankrupt = true;
      }
    }

    if (isBankrupt) {
      bankruptcies++;
    }
    
    totalEndLiquidity += currentLiquidity;
    if (currentLiquidity < worstCase) worstCase = currentLiquidity;
    if (currentLiquidity > bestCase) bestCase = currentLiquidity;
    
    // Save up to 50 sample paths for visualization
    if (samplePaths.length < 50) {
      samplePaths.push(path);
    }
  }

  const successRate = ((params.iterations - bankruptcies) / params.iterations) * 100;
  const bankruptcyRate = (bankruptcies / params.iterations) * 100;
  const averageEndLiquidity = totalEndLiquidity / params.iterations;

  const result: MonteCarloResult = {
    successRate,
    bankruptcyRate,
    averageEndLiquidity,
    worstCaseLiquidity: worstCase,
    bestCaseLiquidity: bestCase,
    simulatedPaths: samplePaths,
  };

  self.postMessage(result);
};
