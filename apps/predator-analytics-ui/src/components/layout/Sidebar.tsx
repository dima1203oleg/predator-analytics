import { motion } from 'framer-motion';
import {
  Activity,
  Archive,
  Bot,
  Boxes,
  BrainCircuit,
  Command,
  Database,
  Factory,
  FileCheck,
  FileSearch,
  Globe,
  Layers,
  LayoutDashboard,
  Library,
  Lock,
  Network,
  Radio,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Ship,
  TrendingUp,
  Trophy,
  Radar,
  Zap,

  DollarSign,
  AlertCircle,
  BarChart,
  Map,
  ShoppingBag,
  Cpu,
  Smartphone,
  BookOpen,
  PieChart,
  Repeat,
  Shield,
  Eye,
  FileText,
  ZapOff,
  Crosshair,
  Coffee,
  MessageSquare,
  Target,
  Layout,
  Waves,
  Landmark,
  Building2,
  Scale
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useSystemMetrics } from '../../hooks/useSystemMetrics';
import { premiumLocales } from '../../locales/uk/premium';
import { useAppStore } from '../../store/useAppStore';
import { UserRole } from '../../config/roles';
import { cn } from '../../utils/cn';

export const Sidebar = () => {
  const { isSidebarOpen, userRole } = useAppStore();
  const metrics = useSystemMetrics();

  // --- ULTIMATE V55 NAVIGATION (100% UKRAINIAN) ---
  interface NavItem {
    name: string;
    path: string;
    icon: any;
    premium?: boolean;
    role?: 'admin' | 'client' | 'premium';
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: 'МЕНЕДЖЕР АГЕНТІВ',
      items: [
        { name: 'Флот AI Агентів', path: '/agents', icon: Bot },
        { name: 'Оркестратор (Pipeline)', path: '/pipeline', icon: Activity },
        { name: 'Контроль Автономності', path: '/autonomy', icon: ShieldCheck, role: 'admin' },
        { name: 'Мовна Модель (LLM)', path: '/llm', icon: MessageSquare, premium: true },
      ]
    },
    {
      title: 'СТУДІЯ ФАБРИКИ',
      items: [
        { name: 'Студія Факторів', path: '/factory-studio', icon: Factory, role: 'admin' },
        { name: 'Мапа Знань (Knowledge)', path: '/factory', icon: BrainCircuit },
        { name: 'Студія Датасетів', path: '/datasets', icon: Boxes },
        { name: 'Аналітика Двигунів', path: '/engines', icon: Waves },
      ]
    },
    {
      title: 'ІНФРА ТА МОНІТОРИНГ',
      items: [
        { name: 'Моніторинг Нод', path: '/monitoring', icon: Activity, role: 'admin' },
        { name: 'Деплоймент (K8s)', path: '/deployment', icon: Layers, role: 'admin' },
        { name: 'Бази Даних', path: '/databases', icon: Database, role: 'admin' },
        { name: 'Інджестинг Даних', path: '/ingestion', icon: Zap },
      ]
    },
    {
      title: 'ДОКУМЕНТИ ТА OSINT',
      items: [
        { name: 'Глобальний Пошук', path: '/search-v2', icon: FileSearch },
        { name: 'OSINT UA (Prozorro)', path: '/tenders', icon: Landmark },
        { name: 'ДержДані API', path: '/datagov', icon: Library },
        { name: 'Архів Документів', path: '/documents', icon: Archive },
        { name: 'Морська Розвідка', path: '/maritime', icon: Ship },
      ]
    },
    {
      title: 'КЛІЄНТИ',
      items: [
        { name: 'Огляд Сегментів', path: '/clients', icon: Layout },
        { name: 'Бізнес-Корпорації', path: '/clients/business', icon: Building2 },
      ]
    },
    {
      title: 'АНАЛІТИКА',
      items: [
        { name: 'Ризик-Скоринг', path: '/risk-scoring', icon: AlertCircle, premium: true },
        { name: 'AML Аналізатор', path: '/aml', icon: ShieldAlert },
        { name: 'Налаштування', path: '/settings', icon: Settings },
      ]
    }
  ];

  const hasAccess = (item: any) => {
    if (item.role === 'admin' && userRole !== UserRole.ADMIN) return false;
    if (item.premium && userRole === UserRole.CLIENT_BASIC) return false;
    return true;
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarOpen ? 260 : 80,
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
      }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-white/10 bg-[#020617]/90 backdrop-blur-3xl",
        "shadow-[20px_0_50px_-20px_rgba(0,0,0,0.9)]"
      )}
    >
      {/* --- LOGO SECTION --- */}
      <div className="h-20 flex items-center px-6 relative overflow-hidden group border-b border-white/5">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-all duration-500">
            <Zap className="text-white w-6 h-6 fill-white/20" />
          </div>

          <div className={cn("transition-all duration-300", isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden")}>
            <div className="flex flex-col">
              <span className="text-[16px] font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 tracking-tighter leading-none">
                PREDATOR v55
              </span>
              <span className="text-[9px] font-bold text-indigo-400 tracking-[0.2em] uppercase mt-1">
                Суверенний ШІ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- NAVIGATION --- */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-hide">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {isSidebarOpen && (
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] px-4 mb-3"
              >
                {group.title}
              </motion.h3>
            )}

            <div className="space-y-1">
              {group.items.filter(hasAccess).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isSidebarOpen ? item.name : undefined}
                  className={({ isActive }) => cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden border border-transparent",
                    isActive
                      ? "bg-indigo-500/10 text-white shadow-[0_0_20px_rgba(79,70,229,0.1)] border-white/10 sidebar-active"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "relative z-10 transition-all duration-300 group-hover:scale-110 shrink-0",
                        isActive ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" : "text-slate-400 group-hover:text-slate-200"
                      )}>
                        <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      </div>

                      <span className={cn(
                        "whitespace-nowrap font-bold text-[13px] transition-all duration-300 origin-left relative z-10",
                        isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 w-0 overflow-hidden"
                      )}>
                        {item.name}
                      </span>

                      {/* Active Indicator & Hover Glow */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}

                      {/* Badges */}
                      {item.premium && isSidebarOpen && (
                        <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md shrink-0">
                          <Trophy className="w-2.5 h-2.5 text-amber-500" />
                          <span className="text-[8px] font-black text-amber-500 uppercase">PRO</span>
                        </div>
                      )}

                      {item.role === 'admin' && isSidebarOpen && (
                        <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md shrink-0">
                          <Lock className="w-2.5 h-2.5 text-rose-500" />
                          <span className="text-[8px] font-black text-rose-500 uppercase">МАС</span>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- FOOTER STATUS --- */}
      <div className="p-4 border-t border-white/5 bg-black/40">
        <div className={cn("flex items-center gap-3 transition-all", isSidebarOpen ? "justify-between" : "justify-center")}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 blur-md opacity-50 animate-pulse" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">СИСТЕМА ОНЛАЙН</span>
                <span className="text-emerald-500/60 font-mono text-[8px] mt-1 tracking-tighter">v55.0.1_SOVEREIGN</span>
              </div>
            )}
          </div>
        </div>

        {isSidebarOpen && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1">ЛІЦЕНЗІЯ v55</div>
            <div className="text-[10px] text-slate-300 font-bold truncate">Кізима Дмитро Миколайович</div>
            <div className="text-[8px] text-indigo-400 font-mono mt-1 opacity-50 italic">Статус: Повністю Функціональний</div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

// Internal icon for the graph - since Lucide Share2 is sometimes generic
const Share2Icon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
