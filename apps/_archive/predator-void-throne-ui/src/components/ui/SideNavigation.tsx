import { Database, Network, Search, Settings, ShieldAlert } from "lucide-react";

export function SideNavigation() {
  const navItems = [
    { id: "ingestion", icon: Database, label: "Ingestion Core" },
    { id: "risk", icon: ShieldAlert, label: "Risk Engine" },
    { id: "graph", icon: Network, label: "Graph Analysis" },
    { id: "search", icon: Search, label: "Deep Search" },
    { id: "settings", icon: Settings, label: "System Config" },
  ];

  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 glass-panel py-6 rounded-r-2xl flex flex-col items-center gap-8 z-50 transition-all duration-300 hover:w-48 overflow-hidden group">
      {navItems.map((item) => (
        <button key={item.id} className="relative flex items-center w-full px-4 py-2 text-white/50 hover:text-red-500 transition-colors group/btn">
          <item.icon size={24} className="shrink-0" />
          <span className="absolute left-14 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-mono tracking-widest uppercase">
            {item.label}
          </span>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-red-500 transition-all group-hover/btn:h-full rounded-r-full"></div>
        </button>
      ))}
    </div>
  );
}
