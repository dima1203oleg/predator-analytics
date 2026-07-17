/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LICENSE_MATRIX } from './data';
import { ShieldCheck, ShieldAlert, AlertOctagon, HelpCircle, FileText, CheckCircle, Info, GitFork, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LicenseTab() {
  const [selectedSourceLicense, setSelectedSourceLicense] = useState('GPL v3 (Neo4j, BBOT)');
  const [integrationMethod, setIntegrationMethod] = useState('microservice'); // direct, microservice, dynamic, raw
  const [deploymentModel, setDeploymentModel] = useState('saas'); // saas, internal, airgapped

  // License advisor engine based on selections
  const getSimulatedRisk = () => {
    if (selectedSourceLicense.startsWith('MIT')) {
      return {
        level: 'Низький',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        infectious: false,
        text: 'Сумісно без обмежень. Сміливо лінкуйте або імпортуйте.',
        advice: 'Ви можете закрити свій код та продавати сервіс як комерційний SaaS. Жодних умов по відкриттю коду немає.'
      };
    }

    if (selectedSourceLicense.startsWith('GPL v3')) {
      if (integrationMethod === 'direct') {
        return {
          level: 'Критичний (Зараження коду)',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          infectious: true,
          text: 'Ліцензійна сумісність порушена! Ваше закрите ядро "інфікується" GPL-3.0.',
          advice: 'Імпортування GPL-бібліотеки в закрите ядро FastAPI змусить вас відкрити весь код PREDATOR під GPL v3! Терміново переключіть інтеграцію на "Окремий мікросервіс" через REST/gRPC API.'
        };
      } else {
        return {
          level: 'Безпечно (При дотриманні ізоляції)',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          infectious: false,
          text: 'Архітектурне рішення прийнятне. Мережевий API обхід працює.',
          advice: 'Оскільки ви викликаєте BBOT або Neo4j через REST API або Bolt protocol, ліцензія GPL-3.0 не поширюється на ваш закритий код. Це дозволена практика для SaaS.'
        };
      }
    }

    if (selectedSourceLicense.startsWith('AGPL v3')) {
      if (deploymentModel === 'saas') {
        return {
          level: 'Високий (AGPL SaaS обмеження)',
          color: 'text-red-400 bg-red-500/10 border-red-500/20',
          infectious: true,
          text: 'Загроза порушення ліцензії в хмарі! Навіть мережевий доступ вимагає відкриття коду.',
          advice: 'AGPLv3 закриває "SaaS-шпарину". Будь-який користувач, який отримує доступ через мережу до цієї служби, має право вимагати повний сирцевий код платформи! Уникайте у SaaS, або використовуйте повністю ізольовані сторонні сервіси без модифікацій.'
        };
      } else {
        return {
          level: 'Середній (Допустимо offline)',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          infectious: false,
          text: 'Дозволено для внутрішнього використання або Air-gapped.',
          advice: 'При локальному розгортанні (Internal/On-premise) без надання зовнішнього публічного доступу до SaaS, вимоги AGPL щодо відкриття коду користувачам мережі не активуються.'
        };
      }
    }

    if (selectedSourceLicense.startsWith('ELv2')) {
      if (deploymentModel === 'saas' && integrationMethod === 'raw') {
        return {
          level: 'Високий (Комерційний конфлікт)',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          infectious: false,
          text: 'Конфлікт інтересів з розробником Airbyte чи Elastic.',
          advice: 'Ви не можете створювати керований сервіс (SaaS), який конкурує напряму з Airbyte. Проте використання його як внутрішнього інструменту для перекачування реєстрів у PREDATOR є повністю легальним.'
        };
      } else {
        return {
          level: 'Низький / Безпечно',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          infectious: false,
          text: 'Ліцензійно сумісне внутрішнє використання.',
          advice: 'Використання як приватного фонового ETL-процесу для потреб платформи не порушує умови Elastic License v2 або Server Side Public License.'
        };
      }
    }

    // Commercial
    if (deploymentModel === 'saas') {
      return {
        level: 'Фінансовий / Комерційний договір',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        infectious: false,
        text: 'Потребує укладення B2B договору та оплати роялті.',
        advice: 'Для некомерційного використання (MVP, дослідження) дані OpenSanctions безкоштовні. Для запуску SaaS платформи потрібно придбати Enterprise Data License, інакше є ризик позовів.'
      };
    } else {
      return {
        level: 'Середній (MVP)',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        infectious: false,
        text: 'Потребує перевірки цілей використання.',
        advice: 'При локальних тестах діє некомерційна ліцензія (CC BY-NC 4.0). Для комерційного on-premise розгортання в державних установах також знадобиться комерційне ліцензування.'
      };
    }
  };

  const currentRisk = getSimulatedRisk();

  return (
    <div className="space-y-6" id="license-tab-root">
      {/* Overview Intro */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" id="license-title-icon" />
          Матриця сумісності ліцензій (License Compliance Matrix)
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Сумісність ліцензій є критичним аспектом для PREDATOR Analytics. Використання копілефт-рішень (GPL, AGPL) або Source Available продуктів (ELv2) в хмарі несе приховані ризики інтелектуальній власності, які необхідно нейтралізувати на рівні архітектурного проектування.
        </p>
      </div>

      {/* Main Sandbox & Static Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Compliance Simulator */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-5" id="license-simulator">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              Симулятор ліцензійних ризиків
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Choose License */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                1. Ліцензія стороннього ПЗ
              </label>
              <select
                id="source-license-selector"
                value={selectedSourceLicense}
                onChange={(e) => setSelectedSourceLicense(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {LICENSE_MATRIX.map((item) => (
                  <option key={item.license} value={item.license}>
                    {item.license}
                  </option>
                ))}
              </select>
            </div>

            {/* Integration Method */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                2. Метод архітектурної інтеграції
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-850 cursor-pointer hover:border-slate-800">
                  <input
                    type="radio"
                    name="integration_method"
                    value="direct"
                    checked={integrationMethod === 'direct'}
                    onChange={() => setIntegrationMethod('direct')}
                    className="mt-0.5 accent-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-300 block text-[11px]">Direct Import (Прямий імпорт)</span>
                    <span className="text-[10px] text-slate-500">Бібліотека імпортується прямо в Python код ядра FastAPI.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-850 cursor-pointer hover:border-slate-800">
                  <input
                    type="radio"
                    name="integration_method"
                    value="microservice"
                    checked={integrationMethod === 'microservice'}
                    onChange={() => setIntegrationMethod('microservice')}
                    className="mt-0.5 accent-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-300 block text-[11px]">Microservice (Ізольований мікросервіс)</span>
                    <span className="text-[10px] text-slate-500">Запуск у контейнері, комунікація через REST API / gRPC.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-850 cursor-pointer hover:border-slate-800">
                  <input
                    type="radio"
                    name="integration_method"
                    value="raw"
                    checked={integrationMethod === 'raw'}
                    onChange={() => setIntegrationMethod('raw')}
                    className="mt-0.5 accent-indigo-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-300 block text-[11px]">Raw Platform-as-a-Service (Реселлінг)</span>
                    <span className="text-[10px] text-slate-500">Перепродаж API інструменту кінцевим SaaS користувачам.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Deployment Model */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                3. Модель розгортання платформи
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="deploy-saas-button"
                  type="button"
                  onClick={() => setDeploymentModel('saas')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${deploymentModel === 'saas' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                >
                  Комерційний SaaS
                </button>
                <button
                  id="deploy-internal-button"
                  type="button"
                  onClick={() => setDeploymentModel('internal')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all ${deploymentModel === 'internal' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                >
                  On-Premise (Локально)
                </button>
              </div>
            </div>
          </div>

          {/* SIMULATION RESULT */}
          <div className={`border rounded-xl p-4 space-y-3 transition-all ${currentRisk.color}`} id="simulation-result-box">
            <div className="flex items-center gap-2">
              {currentRisk.infectious ? (
                <AlertOctagon className="w-5 h-5 flex-shrink-0 animate-pulse text-red-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              )}
              <div>
                <span className="text-[10px] uppercase font-mono block tracking-wider">Рівень загрози</span>
                <span className="text-sm font-bold font-mono uppercase">{currentRisk.level}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold leading-normal">{currentRisk.text}</p>
              <p className="text-[11px] text-slate-300/90 leading-relaxed border-t border-slate-800/30 pt-2">
                <strong>Рішення / Обхід:</strong> {currentRisk.advice}
              </p>
            </div>
          </div>
        </div>

        {/* Static Database & Analysis Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            Результати юридичного аудиту ліцензій
          </h3>

          <div className="space-y-4" id="license-cards-container">
            {LICENSE_MATRIX.map((item) => (
              <div
                key={item.license}
                className={`bg-slate-900/30 border rounded-xl p-5 space-y-3 transition-colors ${selectedSourceLicense === item.license ? 'border-indigo-500/40 bg-slate-900/50' : 'border-slate-800/80 hover:border-slate-700/50'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {item.license}
                  </h4>
                  <span className={`text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                    item.riskLevel === 'Низький' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    item.riskLevel === 'Середній' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    item.riskLevel === 'Високий' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    Ризик: {item.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs border-y border-slate-800/60 py-3 text-slate-400">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">SaaS Використання</span>
                    <span className="text-slate-200 text-[11px] font-medium block mt-0.5">{item.saasUsage}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Модифікація коду</span>
                    <span className="text-slate-200 text-[11px] font-medium block mt-0.5">{item.modification}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Динамічна лінковка</span>
                    <span className="text-slate-200 text-[11px] font-medium block mt-0.5">{item.dynamicLinking}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-wide block">Офіційний вердикт та обхід:</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                    {item.solution}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Info className="w-3.5 h-3.5" />
                  <span>{item.details}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
