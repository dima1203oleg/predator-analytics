/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SOLUTIONS } from '../data';
import { OpenSourceSolution } from '../types';
import { Search, Info, Shield, CheckCircle2, AlertTriangle, Cpu, HelpCircle, Sliders, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CatalogTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLicenseType, setSelectedLicenseType] = useState<string>('all');
  const [selectedSolution, setSelectedSolution] = useState<OpenSourceSolution | null>(null);

  // Dynamic compatibility simulator state
  const [weights, setWeights] = useState({
    functional: 30,
    security: 20,
    license: 25,
    stack: 15,
    community: 10,
  });

  const categories = ['all', ...Array.from(new Set(SOLUTIONS.map(s => s.category)))];
  const licenseTypes = ['all', ...Array.from(new Set(SOLUTIONS.map(s => s.licenseType)))];

  const handleResetWeights = () => {
    setWeights({
      functional: 30,
      security: 20,
      license: 25,
      stack: 15,
      community: 10,
    });
  };

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => {
      const updated = { ...prev, [key]: value };
      const total = (Object.values(updated) as number[]).reduce((a, b) => a + b, 0);
      return updated;
    });
  };

  // Recalculate compatibility score dynamically based on user weights
  const getDynamicScore = (solution: OpenSourceSolution) => {
    // Determine base ratings out of 10
    const funcBase = solution.id === 'opensanctions' || solution.id === 'qdrant' || solution.id === 'vllm' || solution.id === 'doctr' ? 10 : 9;
    const secBase = solution.securityRating === 'A' ? 10 : 8;
    const licBase = solution.licenseType === 'Permissive' ? 10 : solution.licenseType === 'Commercial' ? 7 : solution.licenseType === 'Weak Copyleft' ? 8 : 6;
    const stackBase = solution.id === 'qdrant' || solution.id === 'bbot' || solution.id === 'vllm' ? 10 : 9;
    const commBase = solution.id === 'neo4j' || solution.id === 'opensearch' || solution.id === 'airbyte' ? 10 : 8;

    const totalWeight = weights.functional + weights.security + weights.license + weights.stack + weights.community;
    if (totalWeight === 0) return 0;

    const calculated = 
      (funcBase * weights.functional + 
       secBase * weights.security + 
       licBase * weights.license + 
       stackBase * weights.stack + 
       commBase * weights.community) / (totalWeight / 10);

    return Math.round(calculated * 10) / 10;
  };

  const filteredSolutions = SOLUTIONS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesLicense = selectedLicenseType === 'all' || s.licenseType === selectedLicenseType;
    return matchesSearch && matchesCategory && matchesLicense;
  });

  const getSecurityBadgeColor = (rating: 'A' | 'B' | 'C' | 'D') => {
    switch (rating) {
      case 'A': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'B': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'C': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const getLicenseBadgeColor = (type: string) => {
    switch (type) {
      case 'Permissive': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Weak Copyleft': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Strong Copyleft': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Source Available': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="space-y-6" id="catalog-tab-root">
      {/* Header and Explainer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-indigo-400" id="catalog-title-icon" />
          Глобальний каталог Open Source рішень для PREDATOR Analytics
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Професійний каталог перевірених технологій, оптимізованих для K8s-native архітектури та високопродуктивних пайплайнів збору OSINT, векторного пошуку, розпізнавання ШІ та побудови графів зв’язків. Скористайтеся інтерактивними інструментами, щоб оцінити та змоделювати їхню сумісність.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side Filters & Dynamic Compatibility Weighting Simulator */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filtering Card */}
          <div className="glass-panel/80 rounded-xl p-5 space-y-4" id="filters-container">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Пошук та Фільтри</h3>
            
            {/* Search Query */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 text-slate-500" />
              <input
                id="solution-search-input"
                type="text"
                placeholder="Пошук рішення..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
              />
            </div>

            {/* Categories filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Категорія</label>
              <select
                id="category-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Усі домени ({SOLUTIONS.length})</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Licenses filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Тип ліцензії</label>
              <select
                id="license-filter-select"
                value={selectedLicenseType}
                onChange={(e) => setSelectedLicenseType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Усі ліцензії</option>
                {licenseTypes.filter(l => l !== 'all').map(lic => (
                  <option key={lic} value={lic}>{lic}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Weight Simulator Card */}
          <div className="glass-panel/80 rounded-xl p-5 space-y-4" id="weight-simulator-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Ваги сумісності
              </h3>
              <button
                id="reset-weights-button"
                onClick={handleResetWeights}
                className="text-[10px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                title="Скинути ваги до стандартних"
              >
                <RefreshCw className="w-3 h-3" />
                скинути
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Змінюйте пріоритет критеріїв оцінки, щоб перерахувати рейтинг сумісності для PREDATOR в реальному часі.
            </p>

            <div className="space-y-3 pt-2">
              {/* Functional Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Зрілість функцій</span>
                  <span className="text-emerald-400 font-medium">{weights.functional}%</span>
                </div>
                <input
                  id="weight-functional-slider"
                  type="range"
                  min="0"
                  max="50"
                  value={weights.functional}
                  onChange={(e) => handleWeightChange('functional', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Security Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Безпека & Стійкість</span>
                  <span className="text-emerald-400 font-medium">{weights.security}%</span>
                </div>
                <input
                  id="weight-security-slider"
                  type="range"
                  min="0"
                  max="50"
                  value={weights.security}
                  onChange={(e) => handleWeightChange('security', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* License Friendliness Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Юридична свобода (Ліцензія)</span>
                  <span className="text-emerald-400 font-medium">{weights.license}%</span>
                </div>
                <input
                  id="weight-license-slider"
                  type="range"
                  min="0"
                  max="50"
                  value={weights.license}
                  onChange={(e) => handleWeightChange('license', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Tech Stack Fit Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Відповідність стеку (K8s/Py)</span>
                  <span className="text-emerald-400 font-medium">{weights.stack}%</span>
                </div>
                <input
                  id="weight-stack-slider"
                  type="range"
                  min="0"
                  max="50"
                  value={weights.stack}
                  onChange={(e) => handleWeightChange('stack', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Community Support Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Екосистема & Підтримка</span>
                  <span className="text-emerald-400 font-medium">{weights.community}%</span>
                </div>
                <input
                  id="weight-community-slider"
                  type="range"
                  min="0"
                  max="50"
                  value={weights.community}
                  onChange={(e) => handleWeightChange('community', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="bg-slate-950 rounded-lg p-2.5 text-center text-[11px] border border-slate-800/60">
                <span className="text-slate-500">Загальна сума коефіцієнтів: </span>
                <span className="text-slate-300 font-mono font-bold">
                  {weights.functional + weights.security + weights.license + weights.stack + weights.community}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Solutions Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Знайдено <span className="text-indigo-400 font-mono font-semibold">{filteredSolutions.length}</span> рішень
            </p>
          </div>

          {filteredSolutions.length === 0 ? (
            <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-xl p-12 text-center" id="no-results-view">
              <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Нічого не знайдено</p>
              <p className="text-slate-600 text-xs mt-1">Спробуйте змінити фільтри пошуку або критерії</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="solutions-grid">
              {filteredSolutions.map((sol) => {
                const dynamicScore = getDynamicScore(sol);
                return (
                  <motion.div
                    key={sol.id}
                    layoutId={`sol-card-${sol.id}`}
                    onClick={() => setSelectedSolution(sol)}
                    className="group bg-slate-900/40 hover:glass-panel/80 hover:border-slate-700/80 rounded-xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                    whileHover={{ y: -2 }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            {sol.category}
                          </span>
                          <h3 className="text-base font-bold text-slate-100 group-hover:text-white mt-1.5 flex items-center gap-1.5">
                            {sol.name}
                            {sol.productionReady.startsWith('Tak') && (
                              <span title="Production Ready"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>
                            )}
                          </h3>
                        </div>
                        
                        {/* Dynamic Score Indicator */}
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Сумісність</span>
                          <span className={`text-lg font-mono font-bold ${dynamicScore >= 90 ? 'text-emerald-400' : dynamicScore >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                            {dynamicScore}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">/100</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {sol.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/50">
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className={`border px-2 py-0.5 rounded-md ${getLicenseBadgeColor(sol.licenseType)}`}>
                          {sol.license}
                        </span>
                        <span className={`border px-2 py-0.5 rounded-md ${getSecurityBadgeColor(sol.securityRating)}`}>
                          Безпека: {sol.securityRating}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 group-hover:text-slate-400">
                        <span className="truncate max-w-[200px]">Стек: <code className="text-[10px] text-slate-400 font-mono">{sol.techStack}</code></span>
                        <span className="text-indigo-400 font-medium group-hover:underline flex items-center gap-0.5 text-xs">
                          Детальніше &rarr;
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details Modal via AnimatePresence */}
      <AnimatePresence>
        {selectedSolution && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" id="solution-modal-container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {selectedSolution.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${getLicenseBadgeColor(selectedSolution.licenseType)}`}>
                      {selectedSolution.licenseType}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
                    {selectedSolution.name}
                    <span className="text-xs font-normal text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {selectedSolution.license}
                    </span>
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block font-mono">Сум. (з урахуванням ваг)</span>
                  <span className="text-2xl font-mono font-bold text-indigo-400">
                    {getDynamicScore(selectedSolution)}
                  </span>
                  <span className="text-xs text-slate-600 font-mono"> /100</span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto text-sm text-slate-300">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    Опис призначення
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-900">
                    {selectedSolution.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-slate-500 font-medium tracking-wide">Роль у PREDATOR</span>
                    <p className="text-xs text-slate-200 bg-slate-900/20 p-2.5 rounded border border-slate-900">{selectedSolution.role}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-slate-500 font-medium tracking-wide">Технічний стек</span>
                    <p className="text-xs text-slate-200 font-mono bg-slate-900/20 p-2.5 rounded border border-slate-900">{selectedSolution.techStack}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Advantages List */}
                  <div className="space-y-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Переваги / Плюси
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedSolution.advantages.map((adv, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold mt-0.5">•</span>
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Disadvantages / Risks List */}
                  <div className="space-y-2 bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Ризики & Недоліки
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedSolution.disadvantages.map((dis, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold mt-0.5">•</span>
                          <span>{dis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Architecture Recommendation based on License / Production Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    Рекомендація архітектора
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedSolution.licenseType === 'Strong Copyleft' ? (
                      <span className="text-amber-400/90 font-medium">
                        Увага: ліцензія GPL-3.0 вимагає жорсткої мікросервісної ізоляції! Не підключайте бібліотеку прямим імпортом в ядро FastAPI. Спілкуйтеся виключно за допомогою мережевих REST/gRPC викликів або черги повідомлень (Kafka).
                      </span>
                    ) : selectedSolution.licenseType === 'Commercial' ? (
                      <span className="text-rose-400/95 font-medium">
                        Увага: некомерційна ліцензія обмежує безкоштовне використання у SaaS-платформі. На етапі MVP допускається завантаження обмежених зліпків даних, проте для повноцінного комерційного продажу необхідно укласти комерційну угоду.
                      </span>
                    ) : (
                      <span>
                        Компонент володіє високим рівнем сумісності та комерційної свободи (Apache 2.0 / MIT). Допускається впровадження безпосередньо у бізнес-логику, розгортання як окремого мікросервісу або пряма лінковка бібліотек.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-900 border-t border-slate-800/80 flex justify-end">
                <button
                  id="close-solution-modal-button"
                  onClick={() => setSelectedSolution(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  Закрити вікно
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
