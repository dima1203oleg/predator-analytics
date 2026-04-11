/**
 * ✅ Due Diligence Checklist
 * Multi-step company verification workflow
 * Автоматичні перевірки + manual sign-off
 */

import React, { useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Clock, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'legal' | 'financial' | 'compliance' | 'operational';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  evidence?: string;
  comment?: string;
  auto?: boolean;
}

interface DiligenceReport {
  ueid: string;
  companyName: string;
  startDate: string;
  items: ChecklistItem[];
  riskScore: number; // 0-100
}

// ──────────────────────────────────────────────────────────────
// Default Checklist
// ──────────────────────────────────────────────────────────────

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Legal
  {
    id: 'legal_1',
    title: '🏢 Перевірка реєстрації',
    description: 'Компанія зареєстрована в CERS',
    category: 'legal',
    status: 'pending',
    auto: true
  },
  {
    id: 'legal_2',
    title: '📋 Перевірка статусу',
    description: 'Компанія має активний статус (не ліквідована)',
    category: 'legal',
    status: 'pending',
    auto: true
  },
  {
    id: 'legal_3',
    title: '⚠️ Перевірка санкцій РНБО',
    description: 'Компанія не в санкційному списку',
    category: 'compliance',
    status: 'pending',
    auto: true
  },
  {
    id: 'legal_4',
    title: '🔒 Перевірка судових справ',
    description: 'Перевірка наявності активних судових справ',
    category: 'legal',
    status: 'pending',
    auto: true
  },

  // Financial
  {
    id: 'financial_1',
    title: '💰 Перевірка фінансових звітів',
    description: 'Наявність актуальних фінансових звітів',
    category: 'financial',
    status: 'pending',
    auto: true
  },
  {
    id: 'financial_2',
    title: '🏦 Перевірка податкових боргів',
    description: 'Розрахунки з податками та митницею',
    category: 'financial',
    status: 'pending',
    auto: true
  },
  {
    id: 'financial_3',
    title: '📊 Аналіз рентабельності',
    description: 'Manual: перевірка прибутків за 3 роки',
    category: 'financial',
    status: 'pending',
    auto: false
  },

  // Compliance
  {
    id: 'compliance_1',
    title: '🔍 Anti-Money Laundering (AML)',
    description: 'AML screening та перевірка UBO',
    category: 'compliance',
    status: 'pending',
    auto: true
  },
  {
    id: 'compliance_2',
    title: '🤝 Перевірка пов\'язаних осіб',
    description: 'Перевірка пов\'язаних сторін та конфліктів інтересів',
    category: 'compliance',
    status: 'pending',
    auto: false
  },

  // Operational
  {
    id: 'operational_1',
    title: '👥 Перевірка персоналу',
    description: 'Керівництво та ключовий персонал',
    category: 'operational',
    status: 'pending',
    auto: false
  },
  {
    id: 'operational_2',
    title: '🏭 Перевірка операцій',
    description: 'Відвідування та оцінка операцій',
    category: 'operational',
    status: 'pending',
    auto: false
  },
];

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export const DueDiligence: React.FC<{ ueid?: string; companyName?: string }> = ({
  ueid = '12345678',
  companyName = 'АТ Укрнафта'
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);

  // ──────────────────────────────────────────────────────────────
  // Calculations
  // ──────────────────────────────────────────────────────────────

  const completedCount = items.filter(i => i.status === 'completed').length;
  const failedCount = items.filter(i => i.status === 'failed').length;
  const progressPercent = (completedCount / items.length) * 100;
  const riskScore = calculateRiskScore(items);

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────

  const updateItemStatus = useCallback((id: string, status: ChecklistItem['status']) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status } : item
      )
    );
  }, []);

  const updateItemComment = useCallback((id: string, comment: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, comment } : item
      )
    );
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  const categories = ['legal', 'financial', 'compliance', 'operational'] as const;
  const categoryNames = {
    legal: '⚖️ Юридичні',
    financial: '💰 Фінансові',
    compliance: '✅ Compliance',
    operational: '🏭 Операційні'
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          ✅ Due Diligence Checklist
        </h1>
        <p className="text-gray-400 mt-1">
          {companyName} ({ueid})
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Прогрес</p>
          <p className="text-3xl font-bold text-white">{progressPercent.toFixed(0)}%</p>
          <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>

        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Завершено</p>
          <p className="text-3xl font-bold text-green-400">{completedCount}/{items.length}</p>
        </Card>

        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Проблеми</p>
          <p className="text-3xl font-bold text-red-400">{failedCount}</p>
        </Card>

        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Risk Score</p>
          <p className={`text-3xl font-bold ${
            riskScore < 30 ? 'text-green-400' :
            riskScore < 70 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {riskScore}
          </p>
        </Card>
      </div>

      {/* Risk Alert */}
      {riskScore >= 70 && (
        <Alert
          type="error"
          title="🔴 HIGH RISK"
          message={`Risk score ${riskScore}/100. Потрібна подальша перевірка перед затвердженням.`}
        />
      )}

      {/* Checklist by Category */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryItems = items.filter(i => i.category === category);
          return (
            <Card key={category} className="p-4">
              <h2 className="text-lg font-bold text-white mb-4">
                {categoryNames[category]}
              </h2>

              <div className="space-y-2">
                {categoryItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      selectedItem?.id === item.id
                        ? 'bg-indigo-700 border-2 border-indigo-400'
                        : 'bg-slate-700 border-2 border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className="pt-1">
                        {item.status === 'completed' && (
                          <CheckCircle size={20} className="text-green-400" />
                        )}
                        {item.status === 'failed' && (
                          <AlertCircle size={20} className="text-red-400" />
                        )}
                        {item.status === 'in_progress' && (
                          <Clock size={20} className="text-yellow-400" />
                        )}
                        {item.status === 'pending' && (
                          <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <p className="font-bold text-white">{item.title}</p>
                        <p className="text-sm text-gray-300">{item.description}</p>
                        {item.auto && (
                          <span className="text-xs text-blue-300 mt-1">🤖 Auto-check</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Item Details */}
      {selectedItem && (
        <Card variant="highlight" className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">{selectedItem.title}</h2>
          <p className="text-gray-300 mb-4">{selectedItem.description}</p>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-300 mb-2">Статус</p>
              <div className="flex gap-2">
                {(['pending', 'in_progress', 'completed', 'failed'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => updateItemStatus(selectedItem.id, status)}
                    className={`px-3 py-1 rounded text-sm font-bold ${
                      selectedItem.status === status
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-gray-300'
                    }`}
                  >
                    {status === 'completed' && '✅'}
                    {status === 'in_progress' && '⏳'}
                    {status === 'failed' && '❌'}
                    {status === 'pending' && '⭕'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-300 mb-2">Коментар</p>
              <textarea
                value={selectedItem.comment || ''}
                onChange={(e) => updateItemComment(selectedItem.id, e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                placeholder="Додайте коментар про результат перевірки..."
                rows={3}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Approval Section */}
      <Card variant="highlight" className="p-6">
        <h2 className="text-lg font-bold text-white mb-4">📝 Финальне затвердження</h2>
        <div className="space-y-3">
          <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold">
            ✅ Затвердити (Due Diligence успішно завершено)
          </button>
          <button className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold">
            ❌ Відхилити (Виявлені критичні проблеми)
          </button>
        </div>
      </Card>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function calculateRiskScore(items: ChecklistItem[]): number {
  const failedCount = items.filter(i => i.status === 'failed').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const total = items.length;

  // Risk calculation: failed=40 points, pending=10 points each
  const failedScore = (failedCount / total) * 40;
  const pendingScore = (pendingCount / total) * 10;

  return Math.round(failedScore + pendingScore);
}

export default DueDiligence;

