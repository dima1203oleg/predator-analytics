import re

with open('/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/DataIngestionTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add API_BASE_URL near state declarations
if 'API_BASE_URL' not in content:
    content = content.replace(
        '  const [newSourceOwner, setNewSourceOwner] = useState<string>(\n    "ШІ Автомат Інтеграції",\n  );',
        '  const [newSourceOwner, setNewSourceOwner] = useState<string>(\n    "ШІ Автомат Інтеграції",\n  );\n\n  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";\n'
    )

# 2. Add polling useEffect
polling_effect = """
  // Poll ETL Status
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        if (!isMounted) return;
        const response = await fetch(`${API_BASE_URL}/etl/status`);
        if (response.ok) {
          const data = await response.json();
          const pipelines = data.pipelines || {};
          
          setSources(prev => prev.map(source => {
            const pipelineStatus = pipelines[source.id];
            if (pipelineStatus) {
              return {
                ...source,
                status: pipelineStatus.status === "running" ? "SYNCING" : "ACTIVE"
              };
            }
            return source;
          }));
        }
      } catch (err) {
        console.error("Failed to fetch ETL status:", err);
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
"""
if 'Poll ETL Status' not in content:
    content = content.replace(
        '  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";\n',
        '  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";\n' + polling_effect
    )

# 3. Add Sync button
sync_button = """
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_BASE_URL}/etl/${selectedSource.id}/sync`, { method: "POST" });
                        if (response.ok) {
                          showToast(`Синхронізація для ${selectedSource.name} успішно запущена`);
                          // Optimistic update
                          setSources(prev => prev.map(s => s.id === selectedSource.id ? { ...s, status: "SYNCING" } : s));
                        } else if (response.status === 409) {
                          showToast(`Синхронізація для ${selectedSource.name} вже працює`, "warn");
                        } else if (response.status === 404) {
                          showToast(`Пайплайн для ${selectedSource.name} не знайдено на сервері`, "error");
                        } else {
                          showToast(`Помилка запуску синхронізації`, "error");
                        }
                      } catch (err) {
                        showToast(`Помилка мережі при запуску синхронізації`, "error");
                      }
                    }}
                    disabled={selectedSource.status === "SYNCING"}
                    className={`px-3 py-1.5 cursor-pointer rounded font-mono font-bold text-xs uppercase transition-all flex items-center gap-1.5 ${selectedSource.status === "SYNCING" ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/50"}`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    {selectedSource.status === "SYNCING" ? "Синхронізується..." : "Запустити Sync"}
                  </button>
"""
if "Запустити Sync" not in content:
    content = content.replace(
        '<div className="flex justify-end gap-2 border-t border-slate-800 pt-3">\n                  {!initialSources.some((s) => s.id === selectedSource.id) && (',
        '<div className="flex justify-end gap-2 border-t border-slate-800 pt-3">\n' + sync_button + '                  {!initialSources.some((s) => s.id === selectedSource.id) && ('
    )

with open('/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/DataIngestionTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

