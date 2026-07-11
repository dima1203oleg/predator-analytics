/**
 * AnalyticsComments — PREDATOR Analytics v63.0-ELITE
 *
 * Система коментарів на базі GitHub Discussions (Giscus).
 * Дозволяє команді обговорювати аналітичні дашборди.
 */
import React, { type FC, lazy, Suspense } from 'react';

// Lazy-load Giscus для мінімального впливу на початковий бандл
const GiscusWidget = lazy(() =>
  import('@giscus/react').then((m) => ({ default: m.default }))
);

interface AnalyticsCommentsProps {
  /** Заголовок сторінки для mapping на GitHub Discussion */
  pageTitle?: string;
  /** Додатковий клас */
  className?: string;
  /** GitHub репозиторій для коментарів (формат: "owner/repo") */
  repo?: string;
  /** ID репозиторію (з налаштувань Giscus) */
  repoId?: string;
  /** Категорія обговорень */
  category?: string;
  /** ID категорії */
  categoryId?: string;
}

/**
 * Секція коментарів для аналітичних сторінок
 */
export const AnalyticsComments: FC<AnalyticsCommentsProps> = ({
  pageTitle,
  className = '',
  // Значення за замовчуванням — placeholder, які потрібно замінити на реальні
  repo = 'dima1203oleg/predator-discussions',
  repoId = '',
  category = 'Аналітика',
  categoryId = '',
}) => {
  // Використовуємо заголовок сторінки або fallback
  const mappingTitle = pageTitle || document.title;

  return (
    <div className={`mt-8 rounded-xl border border-white/[0.06] bg-slate-900/30 p-6 ${className}`}>
      {/* Заголовок секції */}
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-300">
          Обговорення
        </h3>
        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
          GitHub
        </span>
      </div>

      {/* Giscus Widget */}
      {repoId && categoryId ? (
        <Suspense
          fallback={
            <div className="flex h-32 items-center justify-center text-xs text-slate-600">
              Завантаження коментарів...
            </div>
          }
        >
          <GiscusWidget
            repo={repo as `${string}/${string}`}
            repoId={repoId}
            category={category}
            categoryId={categoryId}
            mapping="specific"
            term={mappingTitle}
            strict="1"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="top"
            theme="transparent_dark"
            lang="uk"
            loading="lazy"
          />
        </Suspense>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-900/50 p-6 text-center">
          <p className="text-xs text-slate-500">
            Для активації коментарів необхідно створити публічний GitHub-репозиторій
            та налаштувати Giscus.
          </p>
          <a
            href="https://giscus.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-cyan-500 hover:text-cyan-400"
          >
            Налаштувати Giscus →
          </a>
        </div>
      )}
    </div>
  );
};
