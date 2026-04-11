/**
 * 📋 Report Builder Component
 * Drag-and-drop интерфейс для побудови кастомних звітів
 * Экспорт в PDF, Excel, PowerPoint
 */

import React, { useState, useCallback } from 'react';
import { Plus, Download, Save, Eye, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ReportSection {
  id: string;
  type: 'title' | 'kpi' | 'chart' | 'table' | 'text' | 'page_break';
  content: any;
  order: number;
}

interface Report {
  id: string;
  name: string;
  sections: ReportSection[];
  template?: string;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────
// Components Library
// ──────────────────────────────────────────────────────────────

const AVAILABLE_SECTIONS = [
  { id: 'title', name: '📌 Заголовок', icon: '📌' },
  { id: 'kpi', name: '📊 KPI Карточка', icon: '📊' },
  { id: 'chart', name: '📈 Графік', icon: '📈' },
  { id: 'table', name: '📋 Таблиця', icon: '📋' },
  { id: 'text', name: '📝 Текст', icon: '📝' },
  { id: 'page_break', name: '📄 Розрив сторінки', icon: '📄' }
];

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export const ReportBuilder: React.FC = () => {
  const [report, setReport] = useState<Report>({
    id: 'report_' + Date.now(),
    name: 'Новий звіт',
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────

  const addSection = useCallback((type: string) => {
    const newSection: ReportSection = {
      id: 'section_' + Date.now(),
      type: type as any,
      content: getDefaultContent(type),
      order: report.sections.length
    };

    setReport(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      updatedAt: new Date().toISOString()
    }));
  }, [report.sections.length]);

  const removeSection = useCallback((sectionId: string) => {
    setReport(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const updateSection = useCallback((sectionId: string, content: any) => {
    setReport(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, content } : s
      ),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const exportReport = useCallback((format: 'pdf' | 'xlsx' | 'pptx') => {
    // Mock export
    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.${format === 'pdf' ? 'pdf' : format === 'xlsx' ? 'xlsx' : 'pptx'}`;
    a.click();
  }, [report]);

  const saveReport = useCallback(() => {
    // Mock save
    console.log('Saving report:', report);
    alert('✅ Звіт збережено!');
  }, [report]);

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">📋 Report Builder</h1>
          <p className="text-gray-400 mt-1">Побудуйте кастомний звіт за кілька кліків</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold flex items-center gap-2"
          >
            <Eye size={18} /> {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={saveReport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold flex items-center gap-2"
          >
            <Save size={18} /> Save
          </button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <div className="space-y-6">
          <Card className="p-8 bg-white text-black">
            <h1 className="text-4xl font-bold mb-6">{report.name}</h1>

            {report.sections.map((section) => (
              <div key={section.id} className="mb-8">
                {section.type === 'title' && (
                  <h2 className="text-3xl font-bold text-black">{section.content}</h2>
                )}
                {section.type === 'text' && (
                  <p className="text-gray-700">{section.content}</p>
                )}
                {section.type === 'kpi' && (
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <h3 className="font-bold text-lg">{section.content.title}</h3>
                    <p className="text-3xl font-bold text-blue-600">{section.content.value}</p>
                  </div>
                )}
                {section.type === 'page_break' && (
                  <div className="page-break my-12 border-t-4 border-dashed border-gray-300" />
                )}
              </div>
            ))}

            <div className="mt-12 text-sm text-gray-500">
              <p>Згенеровано: {new Date(report.updatedAt).toLocaleString('uk-UA')}</p>
            </div>
          </Card>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold"
            >
              📥 Download as PDF
            </button>
            <button
              onClick={() => exportReport('xlsx')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
            >
              📥 Download as Excel
            </button>
            <button
              onClick={() => exportReport('pptx')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-bold"
            >
              📥 Download as PowerPoint
            </button>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Components Panel */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-bold text-white mb-4">🧩 Компоненти</h2>
              <div className="space-y-2">
                {AVAILABLE_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => addSection(section.id)}
                    className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-left text-white text-sm font-bold flex items-center gap-2 transition"
                  >
                    <Plus size={16} /> {section.name}
                  </button>
                ))}
              </div>
            </Card>

            {/* Templates */}
            <Card className="p-4 mt-4">
              <h2 className="text-lg font-bold text-white mb-4">📚 Шаблони</h2>
              <div className="space-y-2">
                {[
                  { name: '🏢 Company Profile', id: 'company' },
                  { name: '📊 Financial Report', id: 'financial' },
                  { name: '⚠️ Risk Assessment', id: 'risk' },
                  { name: '🔍 Due Diligence', id: 'dd' }
                ].map((template) => (
                  <button
                    key={template.id}
                    className="w-full px-3 py-2 bg-indigo-900 hover:bg-indigo-800 rounded text-left text-white text-sm transition"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card className="p-6 min-h-screen">
              <h2 className="text-lg font-bold text-white mb-4">📄 Вмст Звіту</h2>

              {report.sections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Додайте компоненти із лівої панелі</p>
                  <p className="text-gray-500 text-sm mt-2">або виберіть шаблон</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {report.sections.map((section) => (
                    <div
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedSection === section.id
                          ? 'bg-indigo-700 border-2 border-indigo-400'
                          : 'bg-slate-700 border-2 border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-300">
                            {AVAILABLE_SECTIONS.find(s => s.id === section.type)?.icon}
                            {AVAILABLE_SECTIONS.find(s => s.id === section.type)?.name}
                          </p>
                          {section.type === 'title' && (
                            <input
                              type="text"
                              value={section.content}
                              onChange={(e) => updateSection(section.id, e.target.value)}
                              className="mt-2 w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                              placeholder="Enter title..."
                            />
                          )}
                          {section.type === 'text' && (
                            <textarea
                              value={section.content}
                              onChange={(e) => updateSection(section.id, e.target.value)}
                              className="mt-2 w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                              placeholder="Enter text..."
                              rows={3}
                            />
                          )}
                        </div>
                        <button
                          onClick={() => removeSection(section.id)}
                          className="ml-4 p-2 bg-red-600 hover:bg-red-700 rounded text-white"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function getDefaultContent(type: string) {
  const defaults: Record<string, any> = {
    title: 'Заголовок звіту',
    text: 'Введіть текст тут...',
    kpi: { title: 'KPI', value: '0' },
    chart: { type: 'line', data: [] },
    table: { headers: [], rows: [] },
    page_break: ''
  };
  return defaults[type] || '';
}

export default ReportBuilder;

