import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewHeader } from '@/components/ViewHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/utils/cn';
import { Download, Factory, Plus, Search, Settings2, UserCheck } from 'lucide-react';

type SRStatus = 'АКТИВНИЙ' | 'ЧЕ� НЕТКА' | 'П� ИЗУПИНЕНО';

type SellerRecord = {
  id: string;
  edrpou: string;
  name: string;
  platform: string;
  status: SRStatus;
  createdAt: string; // ISO
};

const STORAGE_KEY = 'predator-sr-registry-v1';
const SETTINGS_KEY = 'predator-sr-settings-v1';

type SRSettings = {
  statusFilter: 'УСІ' | SRStatus;
  showPlatform: boolean;
  showStatus: boolean;
  showCreatedAt: boolean;
  sort: 'НОВІ_СПОЧАТКУ' | 'СТА� І_СПОЧАТКУ';
};

const defaultSettings: SRSettings = {
  statusFilter: 'УСІ',
  showPlatform: true,
  showStatus: true,
  showCreatedAt: true,
  sort: 'НОВІ_СПОЧАТКУ',
};

const loadRegistry = (): SellerRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SellerRecord[];
  } catch {
    return [];
  }
};

const saveRegistry = (items: SellerRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Без падіння UI, якщо сховище недоступне
  }
};

const loadSettings = (): SRSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<SRSettings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
};

const saveSettings = (settings: SRSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Без падіння UI, якщо сховище недоступне
  }
};

const nowIso = () => new Date().toISOString();

const SRView: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SRSettings>(() => loadSettings());

  const [registry, setRegistry] = useState<SellerRecord[]>(() => {
    const existing = loadRegistry();
    if (existing.length > 0) return existing;
    const seed: SellerRecord[] = [
      { id: 'SR-0001', edrpou: '00000000', name: 'Приклад продавця', platform: 'Маркетплейс', status: 'ЧЕ� НЕТКА', createdAt: nowIso() },
    ];
    saveRegistry(seed);
    return seed;
  });

  const [draft, setDraft] = useState<{ edrpou: string; name: string; platform: string }>({
    edrpou: '',
    name: '',
    platform: '',
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byText = (!q ? registry : registry.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.edrpou.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.platform.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    ));

    const byStatus = settings.statusFilter === 'УСІ'
      ? byText
      : byText.filter(r => r.status === settings.statusFilter);

    const sorted = [...byStatus].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return settings.sort === 'НОВІ_СПОЧАТКУ' ? db - da : da - db;
    });

    return sorted;
  }, [query, registry, settings.sort, settings.statusFilter]);

  const createSeller = () => {
    const edrpou = draft.edrpou.trim();
    const name = draft.name.trim();
    const platform = draft.platform.trim();
    if (!edrpou || !name) return;

    const nextId = `SR-${String(registry.length + 1).padStart(4, '0')}`;
    const item: SellerRecord = {
      id: nextId,
      edrpou,
      name,
      platform: platform || '—',
      status: 'ЧЕ� НЕТКА',
      createdAt: nowIso(),
    };
    const next = [item, ...registry];
    setRegistry(next);
    saveRegistry(next);
    setDraft({ edrpou: '', name: '', platform: '' });
    setIsCreateOpen(false);
  };

  const toggleStatus = (id: string) => {
    const next = registry.map(r => {
      if (r.id !== id) return r;
      const status: SRStatus = r.status === 'АКТИВНИЙ' ? 'П� ИЗУПИНЕНО' : 'АКТИВНИЙ';
      return { ...r, status };
    });
    setRegistry(next);
    saveRegistry(next);
  };

  const updateSettings = (patch: Partial<SRSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const exportCsv = () => {
    const headers: string[] = ['ID', 'ЄД� ПОУ', 'Назва'];
    if (settings.showPlatform) headers.push('Платформа');
    if (settings.showStatus) headers.push('Статус');
    if (settings.showCreatedAt) headers.push('Створено');

    const rows = filtered.map((r) => {
      const base: string[] = [r.id, r.edrpou, r.name];
      if (settings.showPlatform) base.push(r.platform);
      if (settings.showStatus) base.push(r.status);
      if (settings.showCreatedAt) base.push(new Date(r.createdAt).toISOString());
      return base;
    });

    const esc = (v: string) => `"${String(v).replaceAll('"', '""')}"`;
    const csv = [headers.map(esc).join(','), ...rows.map(row => row.map(esc).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sr-reiestr-prodavtsiv-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="SR — � еєстр Продавців"
        icon={<UserCheck className="w-6 h-6" />}
        breadcrumbs={['Дані', 'SR']}
        stats={[
          { label: 'Записів', value: String(registry.length), color: 'primary' },
          { label: 'Активних', value: String(registry.filter(r => r.status === 'АКТИВНИЙ').length), color: 'success' },
        ]}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[320px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук за ID, ЄД� ПОУ, назвою…"
                className="pl-9 bg-slate-950/40 border-slate-700/60"
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <Select
                value={settings.statusFilter}
                onChange={(e) => updateSettings({ statusFilter: e.target.value as SRSettings['statusFilter'] })}
              >
                <SelectItem value="УСІ">Усі статуси</SelectItem>
                <SelectItem value="АКТИВНИЙ">Активні</SelectItem>
                <SelectItem value="ЧЕ� НЕТКА">Чернетки</SelectItem>
                <SelectItem value="П� ИЗУПИНЕНО">Призупинені</SelectItem>
              </Select>
            </div>
            <Button onClick={() => setIsCreateOpen(v => !v)} className="gap-2">
              <Plus className="w-4 h-4" />
              Додати
            </Button>
            <Button variant="outline" onClick={exportCsv} className="gap-2 bg-slate-950/40 border-slate-700/60">
              <Download className="w-4 h-4" />
              Експорт CSV
            </Button>
            <Button variant="outline" onClick={() => setIsSettingsOpen(v => !v)} className="gap-2 bg-slate-950/40 border-slate-700/60">
              <Settings2 className="w-4 h-4" />
              Колонки
            </Button>
            <Button variant="secondary" onClick={() => navigate('/factory')} className="gap-2">
              <Factory className="w-4 h-4" />
              Відкрити Завод
            </Button>
          </div>
        }
      />

      <div className={cn(
        'glass-ultra rounded-xl border border-slate-800/60 p-5 space-y-4',
        isCreateOpen ? 'ring-1 ring-primary-500/30' : ''
      )}>
        {isSettingsOpen && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-xl border border-white/5 bg-slate-950/30 p-4">
            <div className="md:col-span-4 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-200">Платформа</div>
              <Switch checked={settings.showPlatform} onCheckedChange={(v) => updateSettings({ showPlatform: v })} />
            </div>
            <div className="md:col-span-4 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-200">Статус</div>
              <Switch checked={settings.showStatus} onCheckedChange={(v) => updateSettings({ showStatus: v })} />
            </div>
            <div className="md:col-span-4 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-200">Створено</div>
              <Switch checked={settings.showCreatedAt} onCheckedChange={(v) => updateSettings({ showCreatedAt: v })} />
            </div>
            <div className="md:col-span-12 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="text-xs text-slate-400">Налаштування зберігаються локально.</div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-400">Сортування:</div>
                <Select
                  value={settings.sort}
                  onChange={(e) => updateSettings({ sort: e.target.value as SRSettings['sort'] })}
                  className="py-1"
                >
                  <SelectItem value="НОВІ_СПОЧАТКУ">Нові спочатку</SelectItem>
                  <SelectItem value="СТА� І_СПОЧАТКУ">Старі спочатку</SelectItem>
                </Select>
              </div>
            </div>
          </div>
        )}
        {isCreateOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-3 space-y-2">
              <Label htmlFor="sr-edrpou">ЄД� ПОУ</Label>
              <Input
                id="sr-edrpou"
                value={draft.edrpou}
                onChange={(e) => setDraft(s => ({ ...s, edrpou: e.target.value }))}
                placeholder="12345678"
                className="bg-slate-950/40 border-slate-700/60"
              />
            </div>
            <div className="lg:col-span-5 space-y-2">
              <Label htmlFor="sr-name">Назва продавця</Label>
              <Input
                id="sr-name"
                value={draft.name}
                onChange={(e) => setDraft(s => ({ ...s, name: e.target.value }))}
                placeholder="ТОВ «…»"
                className="bg-slate-950/40 border-slate-700/60"
              />
            </div>
            <div className="lg:col-span-3 space-y-2">
              <Label htmlFor="sr-platform">Платформа (опційно)</Label>
              <Input
                id="sr-platform"
                value={draft.platform}
                onChange={(e) => setDraft(s => ({ ...s, platform: e.target.value }))}
                placeholder="Маркетплейс / сайт / інше"
                className="bg-slate-950/40 border-slate-700/60"
              />
            </div>
            <div className="lg:col-span-1 flex items-end">
              <Button
                onClick={createSeller}
                disabled={!draft.edrpou.trim() || !draft.name.trim()}
                className="w-full"
              >
                Створити
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-white/5">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-white/5 bg-slate-950/40">
                <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500 py-4">ID</TableHead>
                <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500">ЄД� ПОУ</TableHead>
                <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500">Назва</TableHead>
                {settings.showPlatform && (
                  <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500">Платформа</TableHead>
                )}
                {settings.showStatus && (
                  <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500">Статус</TableHead>
                )}
                {settings.showCreatedAt && (
                  <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500">Створено</TableHead>
                )}
                <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500 text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-mono text-sm">{r.id}</TableCell>
                  <TableCell className="font-mono">{r.edrpou}</TableCell>
                  <TableCell className="font-semibold">{r.name}</TableCell>
                  {settings.showPlatform && <TableCell className="text-slate-300">{r.platform}</TableCell>}
                  {settings.showStatus && (
                    <TableCell>
                      <Badge variant={r.status === 'АКТИВНИЙ' ? 'default' : r.status === 'П� ИЗУПИНЕНО' ? 'destructive' : 'secondary'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  )}
                  {settings.showCreatedAt && (
                    <TableCell className="font-mono text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString('uk-UA', { hour12: false })}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(r.id)}>
                      {r.status === 'АКТИВНИЙ' ? 'Призупинити' : 'Активувати'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow className="border-white/5">
                  <TableCell colSpan={4 + (settings.showPlatform ? 1 : 0) + (settings.showStatus ? 1 : 0) + (settings.showCreatedAt ? 1 : 0)} className="py-10 text-center text-slate-400">
                    Нічого не знайдено за цим запитом.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-slate-400">
          SR зберігає робочі записи локально (у браузері) до підключення бекенду. Для встановлення/підвʼязки інтеграцій використовуйте «Завод Самовдосконалення».
        </div>
      </div>
    </div>
  );
};

export default SRView;
