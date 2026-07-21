/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GAP_ITEMS } from '../data';
import { HelpCircle, AlertOctagon, CheckCircle, Flame, ArrowUpRight, Wrench, ShieldX, Database, Calculator, Calendar, DollarSign, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function GapAnalysisTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Custom estimator calculator states
  const [complexity, setComplexity] = useState({
    connectors: 2, // 1: Low, 2: Medium, 3: High, 4: Critical
    entityResolution: 3,
    ontology: 2
  });
  const [teamSize, setTeamSize] = useState(3);
  const [developerRate, setDeveloperRate] = useState(65); // USD/hour

  const getComplexityLabel = (val: number) => {
    switch (val) {
      case 1: return 'Низька';
      case 2: return 'Середня';
      case 3: return 'Висока';
      default: return 'Критична';
    }
  };

  const getComplexityColor = (val: number) => {
    switch (val) {
      case 1: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 2: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 3: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  // Calculate project estimates dynamically
  // 1 complexity point ~ 40 hours of development
  const getDynamicEstimates = () => {
    const totalComplexityPoints = complexity.connectors + complexity.entityResolution + complexity.ontology;
    
    // Total estimated hours of engineering work
    const totalHours = totalComplexityPoints * 80; // say 80 hours per complexity point
    const developerMonths = Math.round((totalHours / 160) * 10) / 10; // 160h = 1 developer month
    
    // Calendar months based on team size
    const calendarMonths = Math.max(1, Math.round((developerMonths / teamSize) * 10) / 10);
    
    // Financial cost
    const totalCost = totalHours * developerRate;

    return {
      hours: totalHours,
      devMonths: developerMonths,
      calendarMonths: calendarMonths,
      cost: totalCost
    };
  };

  const estimates = getDynamicEstimates();

  const filteredGapItems = selectedCategory === 'all' 
    ? GAP_ITEMS 
    : GAP_ITEMS.filter(item => item.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'direct':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'adapt':
        return <Wrench className="w-5 h-5 text-blue-400" />;
      case 'replace':
        return <ArrowUpRight className="w-5 h-5 text-indigo-400" />;
      case 'not_recommended':
        return <ShieldX className="w-5 h-5 text-red-500 animate-pulse" />;
      default:
        return <Database className="w-5 h-5 text-amber-400" />;
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Легка': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Середня': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Висока': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  return (
    <div className="space-y-6" id="gap-analysis-tab-root">
      {/* Intro section */}
      <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl p-6 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-2">
          <Wrench className="w-5 h-5 text-amber-400" id="gap-title-icon" />
          Gap Analysis (Аналіз прогалин та кастомна розробка)
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Аналіз відповідності вимогам open-source продуктів та розрахунок ресурсів на створення внутрішньої унікальної інтелектуальної власності PREDATOR Analytics. Визначте, які компоненти вимагають адаптації, заміни чи розробки з нуля.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Categories & Dynamic Cost Estimator */}
        <div className="lg:col-span-1 space-y-6">
          {/* Action Category Filters */}
          <div className="bg-slate-900/40 border border-indigo-500/10 rounded-xl p-5 space-y-3" id="gap-filters">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Категорії інтеграції</h3>
            <div className="space-y-1.5 text-xs">
              <button
                id="gap-all-filter"
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between ${selectedCategory === 'all' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-semibold' : 'bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-slate-850 text-slate-300 hover:text-slate-200'}`}
              >
                <span>Усі категорії ({GAP_ITEMS.length})</span>
                <span className="text-[10px] bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] px-1.5 py-0.5 rounded border border-indigo-500/10">Все</span>
              </button>
              {GAP_ITEMS.map(item => (
                <button
                  key={item.id}
                  id={`gap-filter-${item.id}`}
                  onClick={() => setSelectedCategory(item.category)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between ${selectedCategory === item.category ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-semibold' : 'bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-slate-850 text-slate-300 hover:text-slate-200'}`}
                >
                  <span className="truncate">{item.categoryLabel}</span>
                  <span className="text-[10px] bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] px-1.5 py-0.5 rounded border border-indigo-500/10 uppercase font-mono">{item.difficulty}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Estimator Card */}
          <div className="bg-slate-900/40 border border-indigo-500/10 rounded-xl p-5 space-y-5" id="dynamic-estimator">
            <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-3">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Калькулятор власної розробки
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-normal">
              Оцінка ресурсів для створення <strong>Власної експертизи (з нуля)</strong>: Конекторів до реєстрів України, Entity Resolution Engine та онтології даних.
            </p>

            {/* Sliders for components */}
            <div className="space-y-4 pt-2">
              {/* Connectors Complexity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Конектори до реєстрів</span>
                  <span className={`px-1.5 py-0.5 rounded font-medium text-[9px] border ${getComplexityColor(complexity.connectors)}`}>
                    {getComplexityLabel(complexity.connectors)}
                  </span>
                </div>
                <input
                  id="complexity-connectors-slider"
                  type="range"
                  min="1"
                  max="4"
                  value={complexity.connectors}
                  onChange={(e) => setComplexity(prev => ({ ...prev, connectors: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Entity Resolution Engine */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Entity Resolution (ШІ-злиття)</span>
                  <span className={`px-1.5 py-0.5 rounded font-medium text-[9px] border ${getComplexityColor(complexity.entityResolution)}`}>
                    {getComplexityLabel(complexity.entityResolution)}
                  </span>
                </div>
                <input
                  id="complexity-resolution-slider"
                  type="range"
                  min="1"
                  max="4"
                  value={complexity.entityResolution}
                  onChange={(e) => setComplexity(prev => ({ ...prev, entityResolution: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Data Ontology mapping */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Єдина онтологія даних</span>
                  <span className={`px-1.5 py-0.5 rounded font-medium text-[9px] border ${getComplexityColor(complexity.ontology)}`}>
                    {getComplexityLabel(complexity.ontology)}
                  </span>
                </div>
                <input
                  id="complexity-ontology-slider"
                  type="range"
                  min="1"
                  max="4"
                  value={complexity.ontology}
                  onChange={(e) => setComplexity(prev => ({ ...prev, ontology: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Team Size */}
              <div className="space-y-1 pt-2 border-t border-indigo-500/10/60">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Кількість розробників</span>
                  <span className="text-indigo-400 font-bold font-mono">{teamSize} чол.</span>
                </div>
                <input
                  id="team-size-slider"
                  type="range"
                  min="1"
                  max="10"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Hourly Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Погодинна ставка розробника</span>
                  <span className="text-emerald-400 font-bold font-mono">${developerRate}/год</span>
                </div>
                <input
                  id="dev-rate-slider"
                  type="range"
                  min="30"
                  max="150"
                  step="5"
                  value={developerRate}
                  onChange={(e) => setDeveloperRate(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* DYNAMIC CALCULATIONS RESULT PANEL */}
            <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-xl p-4 border border-indigo-500/10 space-y-3" id="estimator-results">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Результати моделювання</h4>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                  <Clock className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                  <span className="text-[9px] text-slate-500 uppercase block">Робота команди</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{estimates.devMonths} л/м</span>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                  <Calendar className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                  <span className="text-[9px] text-slate-500 uppercase block">Термін (Time-to-market)</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{estimates.calendarMonths} міс.</span>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-center">
                <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[9px] text-slate-500 uppercase block">Бюджет розробки</span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  ${estimates.cost.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">на основі {estimates.hours} годин кодування</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Action Item Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Планування технологічного розриву
            </h3>
            <span className="text-xs text-slate-500">Показано {filteredGapItems.length} блоків аналізу</span>
          </div>

          <div className="space-y-4" id="gap-cards-container">
            {filteredGapItems.map(item => (
              <div
                key={item.id}
                className="bg-slate-900/30 border border-indigo-500/10/80 rounded-xl p-5 space-y-4 hover:border-slate-700/60 transition-colors"
              >
                {/* Card Title Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-lg border border-slate-850">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">Категорія: {item.categoryLabel}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full font-mono block ${getDifficultyColor(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">Оцінка: {item.timeEstimate}</span>
                  </div>
                </div>

                {/* Card Description */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-indigo-500/5/60">
                  {item.description}
                </p>

                {/* Sub-items actions */}
                <div className="space-y-2">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Конкретні кроки & завдання:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {item.actionItems.map((action, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/80 border border-indigo-500/5 p-2.5 rounded-lg flex items-start gap-2.5"
                      >
                        <span className="text-indigo-500 font-bold text-xs mt-0.5">[{idx + 1}]</span>
                        <p className="text-xs text-slate-300 leading-normal">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
