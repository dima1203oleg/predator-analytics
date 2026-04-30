import codecs

path = '/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/src/components/layout/Sidebar.tsx'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

start_marker = "{/* ── NAVIGATION ── */}"
end_marker = "{/* ── STATUS FOOTER ── */}"

new_nav = """{/* ── NAVIGATION ── */}
      <div className="flex-1 overflow-y-auto pt-4 pb-6 px-3 space-y-4 scrollbar-predator">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.has(group.title) || !isSidebarOpen;
          const filteredItems = group.items.filter(hasAccess);
          if (filteredItems.length === 0) return null;

          return (
            <div key={group.title} className="flex flex-col">
              {/* === ЗАГОЛОВОК СЕКЦІЇ === */}
              {isSidebarOpen ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1.5 rounded-md mb-1.5',
                    'text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group',
                    isGroupExpanded
                      ? (accentColorMap[group.accent ?? 'slate'] ?? 'text-slate-300')
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {/* Індикатор активності групи */}
                    <div className={cn(
                      'w-[3px] h-3.5 rounded-full transition-all duration-300',
                      isGroupExpanded
                        ? (accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-600') + ' shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                        : 'bg-white/5 group-hover:bg-white/20'
                    )} />
                    <span className="drop-shadow-sm">{group.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-300',
                      isGroupExpanded ? 'rotate-0 opacity-80' : '-rotate-90 opacity-40'
                    )}
                  />
                </button>
              ) : (
                <div className="flex justify-center py-2 mb-1">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-600'
                  )} />
                </div>
              )}

              {/* === ЕЛЕМЕНТИ СЕКЦІЇ === */}
              <AnimatePresence initial={false}>
                {isGroupExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1">
                      {filteredItems.map((item) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isOpen = expandedItems.has(item.path) || isSubItemActive(item);
                        const filteredSubItems = item.subItems?.filter(hasAccess) ?? [];
                        const isActivePrimary = location.pathname === item.path || (hasSubItems && isSubItemActive(item));

                        return (
                          <div key={item.path} className="flex flex-col">
                            {/* ГОЛОВНИЙ ПУНКТ */}
                            <div className="relative group">
                              <NavLink
                                to={item.path}
                                title={!isSidebarOpen ? item.name : undefined}
                                className={cn(
                                  'relative flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 border border-transparent',
                                  isActivePrimary
                                    ? 'bg-white/[0.06] border-white/[0.05] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                                    : 'hover:bg-white/[0.03] hover:border-white/[0.02]'
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-8">
                                  {/* Іконка */}
                                  <div className={cn(
                                    'shrink-0 transition-all duration-300',
                                    isActivePrimary
                                      ? (accentActiveMap[group.accent ?? 'slate'] ?? 'text-slate-200')
                                      : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'
                                  )}>
                                    <item.icon className="w-[18px] h-[18px]" strokeWidth={isActivePrimary ? 2.5 : 2} />
                                  </div>

                                  {/* Текст */}
                                  <AnimatePresence mode="wait">
                                    {isSidebarOpen && (
                                      <motion.span
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className={cn(
                                          'text-[13px] font-medium truncate',
                                          isActivePrimary ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                                        )}
                                      >
                                        {item.name}
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Active Vertical Indicator */}
                                {isActivePrimary && (
                                  <motion.div
                                    layoutId="sidebarActiveIndicator"
                                    className={cn(
                                      'absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-md',
                                      accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-500'
                                    )}
                                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                                  />
                                )}
                              </NavLink>

                              {/* Елементи керування (Badges & Chevron) */}
                              {isSidebarOpen && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  {/* Badges */}
                                  <div className="flex items-center gap-1">
                                    {item.premium && (
                                      <div className={cn(
                                        "px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors duration-200",
                                        isActivePrimary ? "bg-amber-500/20 border-amber-500/30" : "bg-amber-500/10 border-amber-500/20"
                                      )}>
                                        <Trophy className="w-2.5 h-2.5 text-amber-500" />
                                        <span className="text-[7px] font-black text-amber-500 tracking-wider">PRO</span>
                                      </div>
                                    )}
                                    {item.role === 'admin' && (
                                      <div className={cn(
                                        "px-1 py-0.5 rounded flex items-center justify-center transition-colors duration-200",
                                        isActivePrimary ? "bg-rose-500/20 border-rose-500/30" : "bg-rose-500/10 border-rose-500/20"
                                      )}>
                                        <Lock className="w-2.5 h-2.5 text-rose-500" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Submenu Chevron */}
                                  {hasSubItems && filteredSubItems.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleItemExpand(item.path);
                                      }}
                                      className={cn(
                                        "p-1 rounded-md transition-colors",
                                        isActivePrimary ? "hover:bg-white/10" : "hover:bg-white/5"
                                      )}
                                    >
                                      <ChevronDown className={cn(
                                        'w-3.5 h-3.5 transition-transform duration-300',
                                        isActivePrimary ? "text-white/80" : "text-slate-500",
                                        isOpen && 'rotate-180'
                                      )} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* === ПІДПУНКТИ (ТРИВИМІРНА ІЄРАРХІЯ) === */}
                            <AnimatePresence initial={false}>
                              {hasSubItems && isOpen && isSidebarOpen && filteredSubItems.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {/* Контейнер підпунктів з лінією зліва для ідентифікації дерева */}
                                  <div className="ml-[22px] mt-1 mb-2 pl-[18px] border-l-2 border-white/[0.05] flex flex-col gap-1 relative">
                                    {filteredSubItems.map((sub, idx) => {
                                      const isLast = idx === filteredSubItems.length - 1;
                                      return (
                                        <NavLink
                                          key={sub.path}
                                          to={sub.path}
                                          className={({ isActive }) => cn(
                                            'group relative flex items-center justify-between px-3 py-[7px] rounded-md transition-all duration-200',
                                            isActive
                                              ? cn(
                                                  'bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]',
                                                  accentColorMap[group.accent ?? 'slate'] ?? 'text-slate-300'
                                                )
                                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                                          )}
                                        >
                                          {({ isActive }) => (
                                            <>
                                              {/* Горизонтальна лінія, що з'єднує гілку */}
                                              <div className={cn(
                                                "absolute left-[-18px] top-1/2 w-[14px] border-t-2 transition-colors duration-300",
                                                isActive
                                                  ? (accentBarMap[group.accent ?? 'slate']?.replace('bg-', 'border-') ?? 'border-slate-500')
                                                  : "border-white/[0.05] group-hover:border-white/20"
                                              )} />

                                              {/* Візуальний маркер (Крапка) */}
                                              <div className={cn(
                                                "w-[5px] h-[5px] rounded-full mr-2.5 transition-all duration-300 shrink-0",
                                                isActive
                                                  ? (accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-400') + " shadow-[0_0_5px_currentColor]"
                                                  : "bg-transparent border border-white/20 group-hover:border-white/50 group-hover:scale-125"
                                              )} />

                                              <span className={cn(
                                                "text-[12px] min-w-0 truncate",
                                                isActive ? "font-semibold" : "font-medium"
                                              )}>
                                                {sub.name}
                                              </span>

                                              {/* Premium Badge для підменю */}
                                              {sub.premium && (
                                                <Trophy className={cn(
                                                  "w-3 h-3 ml-2 shrink-0 transition-colors",
                                                  isActive ? "text-amber-400" : "text-amber-500/50 group-hover:text-amber-400/80"
                                                )} />
                                              )}
                                            </>
                                          )}
                                        </NavLink>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
"""

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_nav + "\n      " + content[end_idx:]
    with codecs.open(path, 'w', 'utf-8') as f:
        f.write(content)
else:
    pass
