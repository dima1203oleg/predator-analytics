import React, { useState } from 'react';
import { Database, ExternalLink } from 'lucide-react';

export const OpenSearch: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
         <div className="flex items-center gap-2 text-white font-bold">
            <Database className="text-blue-500" size={18} />
            OpenSearch Dashboards
         </div>
         <a
           href="http://194.177.1.240:5601"
           target="_blank"
           rel="noreferrer"
           className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
         >
           Відкрити в новому вікні <ExternalLink size={12} />
         </a>
      </div>

      <div className="flex-1 relative bg-black">
        {isLoading && (
           <div className="absolute inset-0 flex items-center justify-center text-slate-500 gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Завантаження інтерфейсу...
           </div>
        )}
        <iframe
          src="http://194.177.1.240:5601/app/dashboards"
          className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity"
          onLoad={() => setIsLoading(false)}
          title="OpenSearch Dashboards"
        />
      </div>
    </div>
  );
};
