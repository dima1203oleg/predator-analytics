import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, Figma, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFigmaBridge } from '@/hooks/useFigmaBridge';

interface FigmaDesignBridgeProps {
  readonly variant?: 'chip' | 'panel';
  readonly className?: string;
}

const statusTone: Record<string, string> = {
  connected: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  partial: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
  disconnected: 'border-white/10 bg-white/[0.04] text-slate-200',
  error: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
};

const statusDotTone: Record<string, string> = {
  connected: 'bg-emerald-300',
  partial: 'bg-amber-300',
  disconnected: 'bg-slate-500',
  error: 'bg-rose-300',
};

const copyToClipboard = async (value: string): Promise<void> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(value);
};

const formatPageCountLabel = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} сторінка`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} сторінки`;
  }

  return `${count} сторінок`;
};

export const FigmaDesignBridge: React.FC<FigmaDesignBridgeProps> = ({ variant = 'panel', className }) => {
  const bridge = useFigmaBridge();
  const isReady = bridge.status === 'connected';
  const externalUrl = bridge.fileUrl ?? null;
  const hasAssignedFile = Boolean(bridge.fileKey || bridge.fileUrl);
  const fileName = hasAssignedFile ? bridge.fileName : 'Макет ще не задано';
  const [draftUrl, setDraftUrl] = useState('');
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    setDraftUrl(bridge.fileUrl ?? '');
    setDraftName(hasAssignedFile ? bridge.fileName : '');
  }, [bridge.fileName, bridge.fileUrl, hasAssignedFile]);

  const handleSave = async (): Promise<void> => {
    const normalizedUrl = draftUrl.trim();
    const normalizedName = draftName.trim();

    if (!normalizedUrl) {
      return;
    }

    await bridge.saveConfig({
      fileUrl: normalizedUrl,
      fileName: normalizedName || undefined,
    });
  };

  const handleClear = async (): Promise<void> => {
    setDraftUrl('');
    setDraftName('');
    await bridge.clearConfig();
  };

  if (variant === 'chip') {
    const chipContent = (
      <span
        className={cn(
          'inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors',
          statusTone[bridge.status],
          className,
        )}
      >
        <span className={cn('h-2.5 w-2.5 rounded-full', statusDotTone[bridge.status])} />
        <Figma className="h-3.5 w-3.5" />
        <span className="truncate">{bridge.statusLabel}</span>
        {hasAssignedFile && <span className="max-w-[180px] truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300/85">· {fileName}</span>}
      </span>
    );

    if (!externalUrl) {
      return <div className={className}>{chipContent}</div>;
    }

    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noreferrer"
        title="Відкрити Figma-макет"
        className={className}
      >
        {chipContent}
      </a>
    );
  }

  return (
    <section
      className={cn(
        'rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(7,18,31,0.96),rgba(4,12,22,0.96))] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.3)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Figma → дизайн-система</div>
          <h3 className="mt-2 text-2xl font-black text-white">Канонічний макет як джерело правди</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Shell використовує локальні токени, а Figma виступає візуальним контрактом для композиції, відступів і станів.
          </p>
        </div>
        <div className={cn('rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]', statusTone[bridge.status])}>
          {bridge.statusLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Макет</div>
          <div className="mt-2 text-base font-bold text-white">{fileName}</div>
          <div className="mt-1 text-sm text-slate-400">
            {bridge.fileKey ? `Ключ файлу: ${bridge.fileKey}` : 'Ключ файлу ще не прив’язано.'}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Синхронізація</div>
          <div className="mt-2 text-base font-bold text-white">
            {bridge.syncedAtLabel ?? (bridge.isLoading ? 'Оновлення...' : 'Поки що не задано')}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {bridge.tokenValidated ? `Обліковий запис: ${bridge.accountLabel ?? 'підтверджено'}` : bridge.message}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          Чому це підключення важливе
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Цей блок синхронізує візуальну систему з Figma, але не виносить секрети в UI. Сервер перевіряє токен окремо і віддає лише безпечні метадані.
        </p>
        <div className="mt-3 text-sm leading-6 text-slate-300">
          {bridge.message}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
        <div className="text-sm font-bold text-white">Прив’язка Figma-файлу</div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Вставте URL конкретного Figma-файлу. Сервер збереже ключ у runtime-конфіг і відразу перевірить доступність макета.
        </p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">URL макета</span>
            <input
              type="url"
              value={draftUrl}
              onChange={(event) => setDraftUrl(event.target.value)}
              placeholder="https://www.figma.com/design/..."
              className="h-12 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/30 focus:bg-white/[0.06]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Назва макета</span>
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Predator Analytics Design System"
              className="h-12 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/30 focus:bg-white/[0.06]"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!draftUrl.trim() || bridge.isSaving}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition',
              !draftUrl.trim() || bridge.isSaving
                ? 'bg-emerald-500/40 text-slate-900/70'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
            )}
          >
            <Figma className="h-4 w-4" />
            {bridge.isSaving ? 'Підключаємо...' : 'Підключити файл'}
          </button>
          <button
            type="button"
            onClick={() => void handleClear()}
            disabled={!hasAssignedFile || bridge.isSaving}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
              hasAssignedFile && !bridge.isSaving
                ? 'border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]'
                : 'border-white/[0.08] bg-white/[0.03] text-slate-500',
            )}
          >
            <Trash2 className="h-4 w-4" />
            Очистити прив’язку
          </button>
          <button
            type="button"
            onClick={() => void bridge.refresh()}
            disabled={bridge.isLoading || bridge.isSaving}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
              !bridge.isLoading && !bridge.isSaving
                ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15'
                : 'border-white/[0.08] bg-white/[0.03] text-slate-500',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', bridge.isLoading && 'animate-spin')} />
            Оновити статус
          </button>
        </div>

        {bridge.error && (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
            Не вдалося завершити прив’язку: {bridge.error}
          </div>
        )}
      </div>

      {bridge.pages.length > 0 && (
        <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-white">Структура макета</div>
            <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
              {formatPageCountLabel(bridge.pageCount)}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {bridge.pages.map((page) => (
              <div key={page.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-white">{page.name}</div>
                  <div className="text-xs text-slate-400">
                    {page.frameCount} фреймів • {page.sectionCount} секцій
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <ExternalLink className="h-4 w-4" />
            Відкрити Figma
          </a>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 opacity-70"
            disabled
          >
            <ExternalLink className="h-4 w-4" />
            Макет не задано
          </button>
        )}
        <button
          type="button"
          onClick={() => externalUrl && void copyToClipboard(externalUrl)}
          disabled={!externalUrl}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
            externalUrl
              ? 'border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-500',
          )}
        >
          <Copy className="h-4 w-4" />
          Скопіювати лінк
        </button>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-400">
          <RefreshCw className={cn('h-4 w-4', bridge.isLoading && 'animate-spin text-cyan-300')} />
          {bridge.isLoading ? 'Оновлюємо статус...' : 'Статус синхронізації оновлено'}
        </div>
      </div>

      {!isReady && (
        <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          Для повноцінного підключення потрібен лінк на Figma-макет у локальному середовищі.
        </div>
      )}
    </section>
  );
};

export default FigmaDesignBridge;
