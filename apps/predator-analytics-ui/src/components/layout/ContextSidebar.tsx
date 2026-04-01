import React, { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  FileText,
  Link2,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getNavigationContext } from '../../config/navigation';
import { useUser } from '../../context/UserContext';
import { getRoleDescription, getRoleDisplayName } from '../../config/roles';
import { useBackendStatus } from '../../hooks/useBackendStatus';

interface ContextTab {
  id: 'actions' | 'analytics' | 'links' | 'documents' | 'risks' | 'insights';
  label: string;
  icon: React.ReactNode;
}

const tabs: ContextTab[] = [
  { id: 'actions', label: 'Дії', icon: <ArrowRight size={14} /> },
  { id: 'analytics', label: 'Аналітика', icon: <BarChart3 size={14} /> },
  { id: 'links', label: 'Зв’язки', icon: <Link2 size={14} /> },
  { id: 'documents', label: 'Документи', icon: <FileText size={14} /> },
  { id: 'risks', label: 'Ризики', icon: <ShieldAlert size={14} /> },
  { id: 'insights', label: 'ШІ-інсайти', icon: <Sparkles size={14} /> },
];

const defaultEntityTitle = 'Контекст сутності';
const contextCacheKey = (entityType: string, entityId: string): string => `predator-context:${entityType}:${entityId}`;

const readCachedContext = (entityType: string | null, entityId: string | null): string | null => {
  if (!entityType || !entityId || typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(contextCacheKey(entityType, entityId));
  } catch {
    return null;
  }
};

export const ContextSidebar: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canonicalRole, canonicalTier } = useUser();
  const backendStatus = useBackendStatus();
  const { item } = getNavigationContext(location.pathname, canonicalRole, canonicalTier);
  const entityId = searchParams.get('context');
  const entityType = searchParams.get('type');
  const [activeTab, setActiveTab] = useState<ContextTab['id']>('actions');

  const visible = Boolean(entityId || item);

  const title = useMemo(() => {
    if (entityType === 'client') return 'Клієнт';
    if (entityType === 'supplier') return 'Постачальник';
    if (entityType === 'vessel') return 'Судно';
    if (entityType === 'product') return 'Товар';
    if (entityType === 'company') return 'Компанія';
    if (item) return item.label;
    return defaultEntityTitle;
  }, [entityType, item]);

  const cachedContext = useMemo(() => readCachedContext(entityType, entityId), [entityType, entityId]);

  if (!visible) {
    return null;
  }

  const closePanel = (): void => {
    searchParams.delete('context');
    searchParams.delete('type');
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <aside className="hidden xl:flex xl:w-[380px] xl:flex-col xl:border-l xl:border-white/[0.06] xl:bg-[#04111d]/92 xl:backdrop-blur-2xl">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Права контекстна панель</div>
            <h2 className="mt-2 text-lg font-black text-white">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Швидкі дії, аналітика, зв’язки, ризики та документи для поточного контексту.
            </p>
            {cachedContext && (
              <p className="mt-2 text-[11px] leading-5 text-amber-200/80">
                Показано кешований контекст для цієї сутності.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-slate-500 transition-colors hover:text-white"
            title="Закрити панель"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-4 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Роль</div>
              <div className="mt-1 text-sm font-black text-white">{getRoleDisplayName(canonicalRole)}</div>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
              {canonicalTier}
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">{getRoleDescription(canonicalRole)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Режим</div>
              <div className={cn('mt-1 font-bold', backendStatus.isOffline ? 'text-rose-200' : 'text-emerald-200')}>
                {backendStatus.statusLabel}
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Джерело</div>
              <div className="mt-1 truncate font-bold text-slate-200">{backendStatus.sourceLabel}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition-colors',
                activeTab === tab.id
                  ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/[0.06] bg-white/[0.03] text-slate-400 hover:text-white',
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <section className="rounded-2xl border border-cyan-400/10 bg-cyan-500/5 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">Швидкий контекст</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Поточний екран визначає, які дії мають сенс саме зараз. Це панель для швидких рішень, а не для декоративної статистики.
          </p>
        </section>

        {activeTab === 'actions' && (
          <section className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
              <Search size={12} /> Швидкі дії
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <button className="w-full rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2 text-left transition-colors hover:bg-emerald-500/10 hover:text-white">Запустити сценарій закупівель</button>
              <button className="w-full rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2 text-left transition-colors hover:bg-emerald-500/10 hover:text-white">Перевірити контрагента</button>
              <button className="w-full rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2 text-left transition-colors hover:bg-emerald-500/10 hover:text-white">Відкрити білінг і ліміти</button>
            </div>
          </section>
        )}

        {activeTab === 'analytics' && (
          <section className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
              <BarChart3 size={12} /> Аналітика
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                <div className="text-slate-500">Значення</div>
                <div className="mt-1 text-white font-bold">Вплив на економію</div>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                <div className="text-slate-500">Ризик</div>
                <div className="mt-1 text-white font-bold">Пояснений фактор</div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'links' && (
          <section className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
              <Link2 size={12} /> Зв’язки
            </div>
            <p className="text-sm leading-6 text-slate-400">Бенефіціари, афілійовані особи та пов’язані компанії відображаються тут після підключення джерела даних.</p>
            {entityType === 'vessel' && (
              <p className="mt-3 text-xs leading-5 text-emerald-200/80">Для судна підтягуємо рейси, операторів, порти заходу й страхові події.</p>
            )}
            {entityType === 'product' && (
              <p className="mt-3 text-xs leading-5 text-emerald-200/80">Для товару підтягуємо історію цін, маршрути та митні аномалії.</p>
            )}
          </section>
        )}

        {activeTab === 'documents' && (
          <section className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
              <FileText size={12} /> Документи
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2">Остання декларація</div>
              <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2">Супровідний інвойс</div>
              <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2">Підтвердження економії</div>
            </div>
          </section>
        )}

        {activeTab === 'risks' && (
          <section className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
              <AlertTriangle size={12} /> Ризики
            </div>
            <p className="text-sm leading-6 text-slate-400">Санкції, судові справи та червоні прапорці з поясненнями будуть підвантажуватися з відповідного API.</p>
          </section>
        )}

        {activeTab === 'insights' && (
          <section className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
              <BrainCircuit size={12} /> ШІ-інсайти
            </div>
            <p className="text-sm leading-6 text-slate-400">ШІ-підсумок доцільності співпраці, топ-фактори ризику та наступні дії зʼявляться після підключення джерела контексту.</p>
          </section>
        )}
      </div>
    </aside>
  );
};

export default ContextSidebar;
