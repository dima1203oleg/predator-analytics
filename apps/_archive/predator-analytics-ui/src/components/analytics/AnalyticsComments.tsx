import React from 'react';
import Giscus from '@giscus/react';

export const AnalyticsComments: React.FC<{
  repo?: `${string}/${string}`;
  repoId?: string;
  category?: string;
  categoryId?: string;
}> = ({
  repo = "dima1203oleg/predator-analytics",
  repoId = "R_kgDOMN4OaA",
  category = "Analytics Discussions",
  categoryId = "DIC_kwDOMN4OaM4CggF1"
}) => {
  return (
    <div className="mt-8 p-6 bg-slate-900/80 rounded-xl border border-cyan-500/20 shadow-[0_0_20px_rgba(0,229,255,0.05)]">
      <h3 className="text-xl font-rajdhani font-bold text-white mb-6 tracking-wide">
        SOCIAL <span className="text-cyan-400">ANALYTICS</span>
      </h3>
      <Giscus
        id="comments"
        repo={repo}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="transparent_dark"
        lang="uk"
        loading="lazy"
      />
    </div>
  );
};
