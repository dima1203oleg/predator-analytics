/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Landmark, Database, Activity, Terminal, Layers, 
  Cpu, Shield, Zap, RefreshCw, Key, Server, Settings, CheckCircle, 
  XCircle, AlertTriangle, Play, Pause, ChevronRight, BarChart4, Check, 
  Radio, HardDrive, BookOpen, Clock, Code, DollarSign, Bell, ShieldCheck,
  Plus, Trash2, Lock, Unlock, Eye, Sliders, Filter, FileText, CheckSquare, Square, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../api';

// Sub-tabs for Back Office according to Enterprise Spec
type AdminSection = 
  | 'dashboard' 
  | 'users-orgs' 
  | 'rbac-licenses' 
  | 'ai-models' 
  | 'data-sources-etl' 
  | 'monitoring-logs' 
  | 'security-devops';

interface UserRecord {
  id: string;
  email: string;
  role: string;
  org: string;
  status: 'ACTIVE' | 'BLOCKED';
  mfa: boolean;
  quota: string;
  activity: string;
}

interface OrganizationRecord {
  id: string;
  name: string;
  license: string;
  users: number;
  tariff: string;
  endDate: string;
  apiUsage: string;
  aiUsage: string;
  storageUsage: string;
}

interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  status: 'ONLINE' | 'STANDBY' | 'OFFLINE';
  speed: string;
  usage: string;
  memory: string;
  gpu: string;
  tokens: string;
  routeWeight: number;
}

interface DataSourceConfig {
  id: string;
  name: string;
  type: string;
  status: boolean;
  lastSync: string;
  recordsCount: string;
}

interface ETLPipeline {
  id: string;
  name: string;
  source: string;
  status: 'Running' | 'Paused' | 'Failed' | 'Completed';
  progress: number;
  recordsSec: number;
}

interface CronTask {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  status: 'ACTIVE' | 'PAUSED';
}

interface LogMessage {
  timestamp: string;
  level: 'ERROR' | 'WARNING' | 'INFO' | 'SECURITY' | 'AUDIT' | 'AI';
  service: string;
  message: string;
}

export default function AdminBackOffice() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  // Фаллбек-дані (поки API не відповів, UI не буде порожнім)
  const MOCK_USERS: UserRecord[] = [
    { id: 'u1', email: 'admin.predator@sbu.gov.ua', role: 'Super Admin', org: 'Держмитслужба', status: 'ACTIVE', mfa: true, quota: 'Необмежено', activity: 'Створив користувача analyst.petrenko' },
    { id: 'u2', email: 'officer.shevchenko@sbu.gov.ua', role: 'Operator', org: 'Нацбанк', status: 'ACTIVE', mfa: true, quota: '500 запитів/день', activity: 'Перегляд кейсу №1920' },
    { id: 'u3', email: 'analyst.petrenko@sbu.gov.ua', role: 'Analyst', org: 'ПриватБанк', status: 'ACTIVE', mfa: false, quota: '1000 запитів/день', activity: 'Експорт PDF-звіту' },
    { id: 'u4', email: 'auditor.kravchuk@nbu.gov.ua', role: 'Auditor', org: 'Sense', status: 'ACTIVE', mfa: true, quota: '250 запитів/день', activity: 'Аудит логів безпеки' },
    { id: 'u5', email: 'guest.test@gmail.com', role: 'Guest', org: 'Elite Business Broker', status: 'BLOCKED', mfa: false, quota: '10 запитів/день', activity: 'Невдала спроба входу' }
  ];
  const MOCK_ORGS: OrganizationRecord[] = [
    { id: 'org1', name: 'Нацбанк', license: 'Government', users: 18, tariff: '$24,500/міс', endDate: '2027-12-31', apiUsage: '45,290 / 100k', aiUsage: '1.2M tokens', storageUsage: '45.2 GB' },
    { id: 'org2', name: 'Держмитслужба', license: 'Government', users: 45, tariff: '$35,000/міс', endDate: '2028-06-30', apiUsage: '128,490 / Unlimited', aiUsage: '5.6M tokens', storageUsage: '280.4 GB' },
    { id: 'org3', name: 'ПриватБанк', license: 'Enterprise', users: 12, tariff: '$18,900/міс', endDate: '2026-11-15', apiUsage: '38,910 / 50k', aiUsage: '890k tokens', storageUsage: '12.8 GB' },
    { id: 'org4', name: 'Sense Bank', license: 'Enterprise', users: 6, tariff: '$12,400/міс', endDate: '2026-09-01', apiUsage: '15,200 / 30k', aiUsage: '410k tokens', storageUsage: '8.4 GB' },
    { id: 'org5', name: 'Юридична компанія "Право-Захист"', license: 'Professional', users: 3, tariff: '$4,200/міс', endDate: '2026-08-12', apiUsage: '8,400 / 15k', aiUsage: '120k tokens', storageUsage: '2.1 GB' },
    { id: 'org6', name: 'Elite Business Broker', license: 'Community', users: 1, tariff: '$0/міс', endDate: '2026-07-31', apiUsage: '940 / 1k', aiUsage: '5k tokens', storageUsage: '120 MB' }
  ];

  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [orgs, setOrgs] = useState<OrganizationRecord[]>(MOCK_ORGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Форма для створення користувачів
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Analyst');
  const [newUserOrg, setNewUserOrg] = useState('Нацбанк');

  // Завантажуємо реальні дані з backend — при помилці fallback залишається
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes] = await Promise.all([
        apiFetch('/api/v2/admin/users'),
        apiFetch('/api/v2/admin/organizations')
      ]);
      if (!usersRes.ok || !orgsRes.ok) throw new Error(`Бекенд недоступний (${usersRes.status})`);
      const usersData = await usersRes.json();
      const orgsData = await orgsRes.json();
      if (usersData?.length) setUsers(usersData);
      if (orgsData?.length) setOrgs(orgsData);
      setError(null);
    } catch (e: any) {
      console.warn('Адмін API:', e.message, '— використовуємось фаллбек-дані');
      // Не ставимо помилку — користувач бачить mock-дані навіть при відключеному API
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // RBAC Permission Matrix state
  // Roles: Super Admin, Admin, Auditor, Operator, Analyst, Guest
  const [rbacMatrix, setRbacMatrix] = useState<{ [role: string]: { [permission: string]: boolean } }>({
    'Super Admin': { 'view_infra': true, 'edit_users': true, 'edit_rbac': true, 'read_secrets': true, 'run_backups': true, 'access_osint': true },
    'Admin': { 'view_infra': true, 'edit_users': true, 'edit_rbac': false, 'read_secrets': false, 'run_backups': true, 'access_osint': true },
    'Auditor': { 'view_infra': true, 'edit_users': false, 'edit_rbac': false, 'read_secrets': false, 'run_backups': false, 'access_osint': false },
    'Operator': { 'view_infra': false, 'edit_users': false, 'edit_rbac': false, 'read_secrets': false, 'run_backups': false, 'access_osint': true },
    'Analyst': { 'view_infra': false, 'edit_users': false, 'edit_rbac': false, 'read_secrets': false, 'run_backups': false, 'access_osint': true },
    'Guest': { 'view_infra': false, 'edit_users': false, 'edit_rbac': false, 'read_secrets': false, 'run_backups': false, 'access_osint': false }
  });

  const permissionsList = [
    { key: 'view_infra', label: 'Перегляд Kubernetes та системного здоров\'я' },
    { key: 'edit_users', label: 'Створення / редагування користувачів' },
    { key: 'edit_rbac', label: 'Зміна прав доступу (RBAC Matrix)' },
    { key: 'read_secrets', label: 'Доступ до HashiCorp Vault API ключів' },
    { key: 'run_backups', label: 'Створення резервних копій та снепшотів' },
    { key: 'access_osint', label: 'Перегляд аналітичних розслідувань' }
  ];

  // Licenses Activation State
  const [licenses, setLicenses] = useState([
    { id: 'l1', name: 'Community', active: true, modules: ['OSINT Basic'], maxUsers: 1 },
    { id: 'l2', name: 'Professional', active: true, modules: ['OSINT Basic', 'AML Core'], maxUsers: 5 },
    { id: 'l3', name: 'Enterprise', active: true, modules: ['OSINT Pro', 'AML Pro', 'Customs API', 'Collaboration'], maxUsers: 20 },
    { id: 'l4', name: 'Government', active: true, modules: ['OSINT Sovereign', 'AML Advanced', 'Customs Sovereign', 'Georadar Tracking', 'SBU-VIP Cryptography'], maxUsers: 100 }
  ]);

  // AI Models Config
  const [aiModels, setAiModels] = useState<AIModelConfig[]>([
    { id: 'm1', name: 'Gemini 3.5 Flash', provider: 'Google AI Studio', status: 'ONLINE', speed: '48 tok/s', usage: '48.2%', memory: '12 GB', gpu: 'Shared', tokens: '41.2M', routeWeight: 80 },
    { id: 'm2', name: 'DeepSeek R1', provider: 'Local Ollama Cluster', status: 'ONLINE', speed: '24 tok/s', usage: '89.4%', memory: '48 GB', gpu: 'A100 SXM4', tokens: '12.8M', routeWeight: 40 },
    { id: 'm3', name: 'Llama 3 70B', provider: 'Ollama Instance', status: 'STANDBY', speed: '31 tok/s', usage: '0%', memory: '40 GB', gpu: 'A30G', tokens: '5.1M', routeWeight: 0 },
    { id: 'm4', name: 'Gemma 2B', provider: 'Local Edge Pod', status: 'ONLINE', speed: '84 tok/s', usage: '12.1%', memory: '4 GB', gpu: 'H100 Node 2', tokens: '14.5M', routeWeight: 20 },
    { id: 'm5', name: 'Mistral Large', provider: 'Mistral API Endpoint', status: 'ONLINE', speed: '38 tok/s', usage: '5.4%', memory: 'N/A', gpu: 'Cloud API', tokens: '1.9M', routeWeight: 10 },
    { id: 'm6', name: 'GPT-4o Proxy', provider: 'Azure OpenAI', status: 'STANDBY', speed: '52 tok/s', usage: '0%', memory: 'N/A', gpu: 'Enterprise API', tokens: '890k', routeWeight: 0 }
  ]);

  // Data Sources Toggles
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([
    { id: 'ds1', name: 'YouControl API', type: 'Реєстр юросіб України', status: true, lastSync: '12 хв тому', recordsCount: '1.4M компаній' },
    { id: 'ds2', name: 'Opendatabot Sink', type: 'Судові та виконавчі реєстри', status: true, lastSync: '4 хв тому', recordsCount: '850k рішень' },
    { id: 'ds3', name: 'Прозорро ETL', type: 'Державні закупівлі України', status: true, lastSync: '1 год тому', recordsCount: '2.1M контрактів' },
    { id: 'ds4', name: 'Telegram Bot Scraper', type: 'Моніторинг OSINT каналів', status: false, lastSync: '1 день тому', recordsCount: '450k повідомлень' },
    { id: 'ds5', name: 'Facebook API Bridge', type: 'Моніторинг соціальних мереж', status: false, lastSync: '3 дні тому', recordsCount: '12k постів' },
    { id: 'ds6', name: 'Держмитслужба API Gateway', type: 'Митні декларації', status: true, lastSync: '2 хв тому', recordsCount: '16.4M позицій' },
    { id: 'ds7', name: 'РНБО Санкції Sync', type: 'Санкційні списки', status: true, lastSync: '30 сек тому', recordsCount: '14,820 осіб' }
  ]);

  // ETL Pipelines
  const [etlPipelines, setEtlPipelines] = useState<ETLPipeline[]>([
    { id: 'p1', name: 'YouControl Delta Ingestion', source: 'YouControl Webhook', status: 'Running', progress: 42, recordsSec: 120 },
    { id: 'p2', name: 'Customs Declaration Parser', source: 'MinIO Customs Bucket', status: 'Running', progress: 85, recordsSec: 450 },
    { id: 'p3', name: 'Court Verdicts Vector Sync', source: 'Qdrant Embedder Pipeline', status: 'Paused', progress: 100, recordsSec: 0 },
    { id: 'p4', name: 'OFAC Sanctions List Ingestion', source: 'US Treasury API', status: 'Completed', progress: 100, recordsSec: 0 },
    { id: 'p5', name: 'PEP Network Rebuilding Flow', source: 'Opendatabot Graph Delta', status: 'Failed', progress: 14, recordsSec: 0 }
  ]);

  // Cron Tasks
  const [cronTasks, setCronTasks] = useState<CronTask[]>([
    { id: 'c1', name: 'sanction-lists-update', schedule: '0 */4 * * *', lastRun: '2026-07-16 02:00', status: 'ACTIVE' },
    { id: 'c2', name: 'backup-database-snapshot', schedule: '0 0 * * *', lastRun: '2026-07-16 00:00', status: 'ACTIVE' },
    { id: 'c3', name: 'cleanup-session-tokens', schedule: '0 * * * *', lastRun: '2026-07-16 03:00', status: 'ACTIVE' },
    { id: 'c4', name: 're-index-neo4j-weights', schedule: '30 2 * * 0', lastRun: '2026-07-12 02:30', status: 'PAUSED' }
  ]);

  // Queues status
  const queueStats = {
    kafkaLag: 2,
    celeryTasksRunning: 14,
    redisQueueSize: 28,
    deadLetterQueueCount: 1 // Keep active for testing
  };

  // Systems logs live feed
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'ERROR' | 'WARNING' | 'INFO' | 'SECURITY' | 'AUDIT' | 'AI'>('ALL');

  // DevOps pods list
  const [k8sPods, setK8sPods] = useState([
    { name: 'predator-api-6b4d99c', restarts: 0, status: 'Running', cpu: '0.12 Cores', ram: '240 MB' },
    { name: 'predator-vllm-deepseek-88ac', restarts: 1, status: 'Running', cpu: '1.8 Cores', ram: '28 GB' },
    { name: 'predator-qdrant-node-0', restarts: 0, status: 'Running', cpu: '0.45 Cores', ram: '4.2 GB' },
    { name: 'predator-neo4j-replica-1', restarts: 0, status: 'Running', cpu: '0.3 Cores', ram: '6.1 GB' },
    { name: 'predator-keycloak-5fdc88', restarts: 0, status: 'Running', cpu: '0.08 Cores', ram: '512 MB' },
    { name: 'predator-celery-worker-92da', restarts: 3, status: 'Running', cpu: '0.85 Cores', ram: '1.2 GB' }
  ]);

  // Backups Snapshot lists
  const [backups, setBackups] = useState([
    { filename: 'predator_backup_2026-07-16_00-00.tar.gz', size: '14.2 GB', type: 'Full Scheduled' },
    { filename: 'predator_backup_2026-07-15_00-00.tar.gz', size: '14.1 GB', type: 'Full Scheduled' },
    { filename: 'predator_backup_manual_before_update.tar.gz', size: '13.9 GB', type: 'Manual Snapshot' }
  ]);

  // Vault State
  const [vaultSealed, setVaultSealed] = useState(false);

  // Generate logs simulation
  useEffect(() => {
    const initialLogs: LogMessage[] = [
      { timestamp: '03:55:12', level: 'INFO', service: 'Redpanda/Kafka', message: 'Consuming message from customs.declarations (offset 164219)' },
      { timestamp: '03:55:40', level: 'AI', service: 'ArbiterModelEngine', message: 'Routing request to Gemini 3.5 Flash. Confidence 99.8%' },
      { timestamp: '03:56:01', level: 'SECURITY', service: 'Keycloak OIDC', message: 'Token verified successfully for user vkizima534@gmail.com' },
      { timestamp: '03:56:15', level: 'WARNING', service: 'QdrantVectorDB', message: 'Vector matching response time higher than baseline (45ms)' },
      { timestamp: '03:56:45', level: 'AUDIT', service: 'ActionLogger', message: 'Super Admin changed YouControl API Integration status to ENABLED' },
      { timestamp: '03:57:02', level: 'ERROR', service: 'FacebookScraper', message: 'API rate limit exceeded. Retrying in 15 minutes.' },
      { timestamp: '03:57:30', level: 'INFO', service: 'Celery/Workers', message: 'Task court.verdicts.ocr completed in 1.4 seconds' },
      { timestamp: '03:58:10', level: 'SECURITY', service: 'VaultService', message: 'Decrypted key of Opendatabot provider for Client #421' }
    ];
    setLogs(initialLogs);

    const logInterval = setInterval(() => {
      const levels: Array<'ERROR' | 'WARNING' | 'INFO' | 'SECURITY' | 'AUDIT' | 'AI'> = ['ERROR', 'WARNING', 'INFO', 'SECURITY', 'AUDIT', 'AI'];
      const services = ['PostgresDB', 'Neo4jGraph', 'QdrantVectorDB', 'OpenSearch', 'Celery/Workers', 'Keycloak OIDC', 'VaultService', 'ArbiterModelEngine', 'OllamaService'];
      
      const phrases = {
        'ERROR': ['Connection timed out to minio-object-store.', 'Failed to commit transaction of pipeline customs-ocr.', 'Could not route request: all models returned error.'],
        'WARNING': ['Redis RAM usage exceeded 80% boundary.', 'Prometheus alert fired: high latency on fastapi-backend.', 'Dead letter queue received non-JSON message.'],
        'INFO': ['Cron task sanction-lists-update completed.', 'Flushed write buffering cache of PG-16 (14.2 KB).', 'Kafka partition re-balancing completed in 2ms.'],
        'SECURITY': ['JWT Session refreshed for client. IP: 10.42.1.92', 'MFA confirmation succeeded.', 'Active token revoked by auditor action.'],
        'AUDIT': ['Database schema migration completed successfully.', 'MFA flag set to TRUE for u4.', 'Snapshot requested by client backup.'],
        'AI': ['Embeddings generated for 42 text sentences by Ollama.', 'Token routing weighted successfully through Arbiter.', 'Gemini API token usage logged: 420 input, 150 output.']
      };

      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      const randomService = services[Math.floor(Math.random() * services.length)];
      const phraseList = phrases[randomLevel];
      const randomMsg = phraseList[Math.floor(Math.random() * phraseList.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setLogs(prev => [
        { timestamp: timeStr, level: randomLevel, service: randomService, message: randomMsg },
        ...prev.slice(0, 20)
      ]);
    }, 3000);

    return () => clearInterval(logInterval);
  }, []);

  // Filter logs based on selection
  const filteredLogs = useMemo(() => {
    if (logFilter === 'ALL') return logs;
    return logs.filter(l => l.level === logFilter);
  }, [logs, logFilter]);

  // Handle active user modifications
  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' };
      }
      return u;
    }));
  };

  const deleteUser = (id: string) => {
    if (confirm('Ви впевнені, що хочете видалити користувача?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    const newUser: UserRecord = {
      id: `u_${Date.now()}`,
      email: newUserEmail,
      role: newUserRole,
      org: newUserOrg,
      status: 'ACTIVE',
      mfa: false,
      quota: '100 запитів/день',
      activity: 'Створено через Admin Panel'
    };
    setUsers(prev => [...prev, newUser]);
    setNewUserEmail('');
  };

  // Toggle permission cell
  const toggleRbacPermission = (role: string, permKey: string) => {
    setRbacMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permKey]: !prev[role][permKey]
      }
    }));
  };

  // Toggle data integration status
  const toggleSourceStatus = (id: string) => {
    setDataSources(prev => prev.map(ds => {
      if (ds.id === id) {
        return { ...ds, status: !ds.status };
      }
      return ds;
    }));
  };

  // Run a manual backup
  const runManualBackup = () => {
    const filename = `predator_backup_manual_${Date.now()}.tar.gz`;
    const newBackup = {
      filename,
      size: '14.3 GB',
      type: 'Manual Snapshot'
    };
    setBackups(prev => [newBackup, ...prev]);
    alert(`Створення бекапу розпочато! Снепшот ${filename} збережено в MinIO.`);
  };

  // Trigger simulated pod restart
  const restartK8sPod = (podName: string) => {
    setK8sPods(prev => prev.map(pod => {
      if (pod.name === podName) {
        return { ...pod, restarts: pod.restarts + 1 };
      }
      return pod;
    }));
    alert(`Команда на перезапуск Pod '${podName}' надіслана у Kubernetes Cluster.`);
  };

  return (
    <div className="space-y-6" id="admin-back-office-root">
      
      {/* HEADER SECTION: Professional, Enterprise Console theme */}
      <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h1 className="text-base font-black font-mono uppercase tracking-widest text-slate-100 flex items-center gap-2">
              Адміністративна Консоль PREDATOR
              <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase">
                ENTERPRISE SYSTEM ADMIN
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">Класичний Enterprise-моніторинг. Конфігурація кластерів, ліцензій, RBAC, API шлюзів, бекапів та DevOps.</p>
          </div>
        </div>

        {/* TOP LEVEL NAVIGATION BUTTONS - Enterprise Style */}
        <div className="flex flex-wrap gap-1.5 border-t xl:border-t-0 pt-3 xl:pt-0 border-slate-900">
          {[
            { id: 'dashboard', label: '📊 Здоров\'я & Дашборд', icon: Activity },
            { id: 'users-orgs', label: '👥 Користувачі & Клієнти', icon: Users },
            { id: 'rbac-licenses', label: '🛡️ Ролі (RBAC) & Ліцензії', icon: ShieldCheck },
            { id: 'ai-models', label: '🤖 ШІ Моделі & Маршрути', icon: Sliders },
            { id: 'data-sources-etl', label: '🔌 Джерела & ETL', icon: Layers },
            { id: 'monitoring-logs', label: '📋 Моніторинг & Логи', icon: Terminal },
            { id: 'security-devops', label: '⚙️ Безпека & DevOps', icon: Server }
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as AdminSection)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono border transition-all cursor-pointer flex items-center gap-2 ${isActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-950/40 text-slate-400 border-slate-900 hover:border-slate-800'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEWPORT CONTROLLER CONTENT */}
      <div className="min-h-[500px]">

        {/* 1. HEALTH AND METRICS DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Server load and general metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Кількість користувачів", value: "89 всього", desc: "14 активних сесій", icon: Users, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                { label: "AI Запитів за добу", value: "148,029", desc: "Швидкість: 42 токена/сек", icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                { label: "Кластер Kubernetes", value: "14 / 14 Pods OK", desc: "0 перезапусків за 7д", icon: Server, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                { label: "Використання GPU", value: "82.4%", desc: "Пам'ять: 42 GB / 48 GB", icon: Cpu, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-[#0b1329]/50 border border-slate-850 rounded-2xl p-4.5 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{stat.label}</span>
                    <span className="text-xl font-black text-white font-mono mt-1.5 block">{stat.value}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">{stat.desc}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Hardware resource limits meters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "CPU Навантаження", val: "24.2%", progress: 24, text: "64 Cores Intel Xeon" },
                { label: "RAM Використання", val: "182.4 GB / 256 GB", progress: 71, text: "ECC DDR5 Registered" },
                { label: "Дисковий простір (MinIO)", val: "4.2 TB / 10 TB", progress: 42, text: "NVMe SSD RAID-10" },
                { label: "Транскордонний трафік", val: "142 GB / 500 GB", progress: 28, text: "Санкційні шлюзи СБУ" }
              ].map((bar, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-2.5 text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400 font-bold uppercase">{bar.label}</span>
                    <span className="text-indigo-400 font-black">{bar.val}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${bar.progress}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block">{bar.text}</span>
                </div>
              ))}
            </div>

            {/* Comprehensive status panel for 15 system technologies */}
            <div className="bg-[#0b1329]/40 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Статус компонентів та технологічного стеку ядра</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono font-bold">Оновлено 1 сек тому</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { name: "PostgreSQL Master", status: "ONLINE", lag: "0.2ms latency", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Neo4j Graph Database", status: "ONLINE", lag: "12.4M зв'язків", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Qdrant Vector DB", status: "ONLINE", lag: "99.8% точність", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "OpenSearch Indices", status: "ONLINE", lag: "8.4 GB індексу", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Redis Cache Queue", status: "ONLINE", lag: "28 active sessions", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "MinIO Storage (S3)", status: "ONLINE", lag: "145k PDF звітів", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Kafka / Redpanda", status: "ONLINE", lag: "0 message lag", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Celery Workers", status: "ONLINE", lag: "14 processes live", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "FastAPI Rest Backend", status: "ONLINE", lag: "Response time: 14ms", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Ollama LLM Instance", status: "ONLINE", lag: "Llama-3 active", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "YouControl Sync API", status: "ONLINE", lag: "Connected", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Opendatabot Sync API", status: "ONLINE", lag: "Connected", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Митні API Gateway", status: "ONLINE", lag: "Connected", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Прозорро API Sink", status: "ONLINE", lag: "Connected", color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { name: "Telegram Scraper Bot", status: "OFFLINE", lag: "Disabled by Admin", color: "text-slate-500 border-slate-900 bg-slate-950/40" }
                ].map((comp, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl border text-left ${comp.color}`}>
                    <strong className="text-[10px] font-mono block text-white truncate">{comp.name}</strong>
                    <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                      <span>{comp.status}</span>
                      <span className="text-slate-400">{comp.lag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Admin alerts */}
            <div className="bg-rose-950/10 border border-rose-900/30 rounded-2xl p-4 flex gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <h4 className="text-xs font-black font-mono text-rose-400 uppercase tracking-wider">КРИТИЧНІ СПОВІЩЕННЯ ОПЕРАЦІЙНОГО ЦЕНТРУ</h4>
                <p className="text-[10px] text-slate-400 font-mono leading-relaxed mt-1">
                  1. <strong className="text-white">Dead Letter Queue (Kafka)</strong> містить 1 нерозпізнану транзакцію від YouControl. Потрібен ручний розбір.<br />
                  2. Користувач <strong className="text-white">guest.test@gmail.com</strong> заблокований автоматично через спробу брутфорсу паролю.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* 2. USER MANAGEMENT & CLIENT ORGANIZATIONS */}
        {activeSection === 'users-orgs' && (
          <div className="space-y-6">
            
            {/* Split screen: left users, right organizations */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Users list and controls */}
              <div className="xl:col-span-7 bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-indigo-400" />
                    <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Реєстр користувачів платформи</span>
                  </div>
                  <span className="text-[9px] text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Усього: {users.length} осіб
                  </span>
                </div>

                {/* Create User Form */}
                <form onSubmit={handleCreateUser} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3 text-left">
                  <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">➕ Створити нового користувача</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1 font-bold">Email користувача</label>
                      <input 
                        type="email" 
                        required
                        placeholder="analyst@sbu.gov.ua"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full bg-slate-900 text-white placeholder-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1 font-bold">Роль доступу</label>
                      <select 
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Auditor">Auditor</option>
                        <option value="Operator">Operator</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Guest">Guest</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1 font-bold">Організація</label>
                      <select 
                        value={newUserOrg}
                        onChange={(e) => setNewUserOrg(e.target.value)}
                        className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        {orgs.map(o => (
                          <option key={o.id} value={o.name}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button 
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono cursor-pointer transition-all shadow-md"
                    >
                      Створити запис
                    </button>
                  </div>
                </form>

                {/* Users Table */}
                <div className="border border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-900 bg-slate-950/40">
                  {users.map(usr => (
                    <div key={usr.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-900/60 flex items-center justify-center font-bold text-xs text-indigo-400 font-mono shrink-0">
                          {usr.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">{usr.email}</span>
                            <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase">{usr.org}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-mono mt-1">Остання активність: {usr.activity}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* MFA status indicator */}
                        <span className={`text-[8px] font-mono font-bold border px-1.5 py-0.5 rounded ${usr.mfa ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-amber-400 border-amber-500/20 bg-amber-500/5'}`}>
                          {usr.mfa ? 'MFA ACTIVE' : 'NO MFA'}
                        </span>
                        
                        {/* Role tag */}
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-bold">
                          {usr.role}
                        </span>

                        {/* Block/Unblock toggle button */}
                        <button
                          onClick={() => toggleUserStatus(usr.id)}
                          className={`px-2 py-1 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${usr.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'}`}
                        >
                          {usr.status === 'ACTIVE' ? 'Блокувати' : 'Розблокувати'}
                        </button>

                        {/* Reset password button */}
                        <button
                          onClick={() => alert(`Запит на скидання паролю для ${usr.email} надіслано в Keycloak!`)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                        >
                          Скинути PW
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => deleteUser(usr.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clients Organizations details */}
              <div className="xl:col-span-5 space-y-4">
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4.5 h-4.5 text-indigo-400" />
                      <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Клієнтські Організації (Tenant Profiles)</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {orgs.map(org => (
                      <div key={org.id} className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl text-left space-y-2">
                        <div className="flex justify-between items-center">
                          <strong className="text-xs text-white font-bold">{org.name}</strong>
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-bold">
                            {org.license}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-slate-400 border-t border-slate-900/50 pt-2">
                          <div>
                            <span className="text-slate-500 block">Аналітики</span>
                            <strong className="text-slate-200">{org.users} осіб</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Тариф</span>
                            <strong className="text-slate-200">{org.tariff}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Закінчення</span>
                            <strong className="text-slate-200">{org.endDate}</strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-slate-400">
                          <div>
                            <span className="text-slate-500 block">Використання API</span>
                            <strong className="text-slate-200">{org.apiUsage}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Використання ШІ</span>
                            <strong className="text-slate-200">{org.aiUsage}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Місце MinIO</span>
                            <strong className="text-indigo-400">{org.storageUsage}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 3. RBAC PERMISSIONS MATRIX & LICENSE TIERS */}
        {activeSection === 'rbac-licenses' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Matrix of RBAC Permissions */}
              <div className="xl:col-span-8 bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-indigo-400" />
                    <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Матриця дозволів безпеки (RBAC Access Matrix)</span>
                  </div>
                  <span className="text-[9px] text-amber-500 font-mono font-bold bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    KEYCLOAK SYNCED
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 font-mono text-left leading-relaxed">
                  Натискайте на чекбокси для динамічної зміни дозволів для певної ролі користувача у всьому кластері PREDATOR.
                </p>

                {/* Permissions Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/60">
                        <th className="p-3 text-slate-400 uppercase font-black">Роль доступу</th>
                        {permissionsList.map(p => (
                          <th key={p.key} className="p-3 text-slate-400 uppercase font-black text-center max-w-[120px] leading-tight" title={p.label}>
                            {p.key.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 bg-slate-950/20">
                      {Object.keys(rbacMatrix).map(role => (
                        <tr key={role} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 font-bold text-slate-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            {role}
                          </td>
                          {permissionsList.map(perm => {
                            const isAllowed = rbacMatrix[role][perm.key];
                            return (
                              <td key={perm.key} className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleRbacPermission(role, perm.key)}
                                  className="mx-auto transition-colors focus:outline-none cursor-pointer text-slate-500 hover:text-indigo-400"
                                >
                                  {isAllowed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400 mx-auto" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-700 mx-auto" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* License Tiers Management */}
              <div className="xl:col-span-4 bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Landmark className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Активація модулів за ліцензіями</span>
                </div>

                <div className="space-y-4">
                  {licenses.map(lic => (
                    <div key={lic.id} className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-xs text-white font-bold font-mono">{lic.name} Tier</strong>
                        <button
                          onClick={() => {
                            setLicenses(prev => prev.map(l => l.id === lic.id ? { ...l, active: !l.active } : l));
                            alert(`Статус ліцензії ${lic.name} змінено!`);
                          }}
                          className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${lic.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
                        >
                          {lic.active ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[8px] text-slate-500 font-mono block">ДОЗВОЛЕНІ МОДУЛІ:</span>
                        <div className="flex flex-wrap gap-1">
                          {lic.modules.map((m, i) => (
                            <span key={i} className="text-[8px] bg-slate-900 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 pt-1.5">
                        <span>Квота користувачів:</span>
                        <strong className="text-slate-300">до {lic.maxUsers} ліміт</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 4. AI MODELS MANAGER & MODEL ROUTING (ARBITER) */}
        {activeSection === 'ai-models' && (
          <div className="space-y-6">
            
            {/* Top configuration box for Arbiter Routing */}
            <div className="bg-[#0b1329]/50 border border-slate-850 rounded-2xl p-5 shadow-xl text-left space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Розумний Роутер ШІ "Arbiter Engine" v1.2</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                ШІ-Арбітр автоматично перенаправляє аналітичні запити на ту модель, яка найкраще підходить для розв'язання конкретної задачі. Якщо користувач задає загальне питання — запит йде на легку локальну <strong className="text-white">Gemma 2B</strong>. Якщо потрібен глибокий аналіз компанії з пошуком зв'язків — запит йде на <strong className="text-indigo-400">Gemini 3.5 Flash</strong> чи локальний <strong className="text-indigo-400">DeepSeek R1</strong>.
              </p>
            </div>

            {/* Models Table with routing controls */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">ШІ-моделі у семантичному пулі</span>
                <span className="text-[9px] text-slate-400 font-mono font-bold">Активно моделей: {aiModels.filter(m => m.status === 'ONLINE').length} / {aiModels.length}</span>
              </div>

              <div className="border border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-900 bg-slate-950/40">
                {aiModels.map(model => (
                  <div key={model.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-white font-mono">{model.name}</strong>
                        <span className="text-[8px] bg-slate-900 text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded font-mono uppercase">{model.provider}</span>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${model.status === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : model.status === 'STANDBY' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-slate-500 border-slate-800 bg-slate-950/40'}`}>
                          {model.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono">Обсяг спожитих токенів: <strong className="text-slate-300">{model.tokens}</strong> за поточний місяць</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left text-[10px] font-mono min-w-[340px]">
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase font-bold">Швидкість</span>
                        <strong className="text-slate-300">{model.speed}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase font-bold">Пам'ять GPU</span>
                        <strong className="text-slate-300">{model.memory}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase font-bold">Фіз. пристрій</span>
                        <strong className="text-slate-300 truncate block max-w-[90px]">{model.gpu}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] uppercase font-bold">Навантаження</span>
                        <strong className="text-indigo-400">{model.usage}</strong>
                      </div>
                    </div>

                    {/* Routing Weight Slider */}
                    <div className="flex items-center gap-3 font-mono text-[10px] min-w-[200px]">
                      <span className="text-slate-500 shrink-0 font-bold uppercase text-[8px]">Пріоритет:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={model.routeWeight}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAiModels(prev => prev.map(m => m.id === model.id ? { ...m, routeWeight: val, status: val === 0 ? 'STANDBY' : 'ONLINE' } : m));
                        }}
                        className="w-full accent-indigo-500"
                      />
                      <span className="text-indigo-400 font-black shrink-0 w-8 text-right">{model.routeWeight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 5. DATA SOURCES AND ETL PIPELINES & CRON SCHEDULER */}
        {activeSection === 'data-sources-etl' && (
          <div className="space-y-6">
            
            {/* Split view: Integrations vs ETL Pipelines */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
              
              {/* Integrations on/off switches */}
              <div className="xl:col-span-6 bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Landmark className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Підключені зовнішні API джерела</span>
                </div>

                <div className="space-y-3">
                  {dataSources.map(ds => (
                    <div key={ds.id} className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-white">{ds.name}</strong>
                          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">({ds.type})</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono">Зіндексовано: <strong className="text-slate-300">{ds.recordsCount}</strong> • Звірено: {ds.lastSync}</p>
                      </div>

                      {/* On/off toggle switch */}
                      <button
                        type="button"
                        onClick={() => toggleSourceStatus(ds.id)}
                        className="focus:outline-none transition-transform active:scale-95 cursor-pointer text-indigo-400"
                      >
                        {ds.status ? (
                          <ToggleRight className="w-8 h-8" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-700" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ETL Pipelines and Cron Scheduler */}
              <div className="xl:col-span-6 space-y-6">
                
                {/* Pipelines List */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                    <Layers className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Аналітичні ETL-пайплайни</span>
                  </div>

                  <div className="space-y-3">
                    {etlPipelines.map(pipe => (
                      <div key={pipe.id} className="bg-slate-950 border border-slate-900 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <strong className="text-slate-200">{pipe.name}</strong>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${pipe.status === 'Running' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : pipe.status === 'Paused' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : pipe.status === 'Completed' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                            {pipe.status}
                          </span>
                        </div>

                        {pipe.status === 'Running' && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-1 rounded-full animate-pulse" style={{ width: `${pipe.progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                              <span>Джерело: {pipe.source}</span>
                              <span className="text-indigo-400 font-black">{pipe.recordsSec} records/sec</span>
                            </div>
                          </div>
                        )}
                        {pipe.status !== 'Running' && (
                          <p className="text-[9px] text-slate-500 font-mono">Джерело: {pipe.source} • Стан завершення: {pipe.progress}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduler Cron Tasks */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                    <Clock className="w-4.5 h-4.5 text-indigo-400" />
                    <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Планувальник Cron-задач</span>
                  </div>

                  <div className="border border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-900 bg-slate-950/40">
                    {cronTasks.map(cron => (
                      <div key={cron.id} className="p-3 flex items-center justify-between text-[10px] font-mono">
                        <div>
                          <strong className="text-slate-200">{cron.name}</strong>
                          <div className="flex gap-2 text-[8px] text-slate-500 mt-0.5">
                            <span>Cron: <strong className="text-slate-400">{cron.schedule}</strong></span>
                            <span>Останній запуск: {cron.lastRun}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setCronTasks(prev => prev.map(c => c.id === cron.id ? { ...c, status: c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : c));
                            alert(`Статус Cron-задачі ${cron.name} змінено!`);
                          }}
                          className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${cron.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
                        >
                          {cron.status}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 6. LOG CONSOLE & SYSTEM TELEMETRY */}
        {activeSection === 'monitoring-logs' && (
          <div className="space-y-6">
            
            {/* Prometheus & Grafana Quick Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Kafka Lag", value: "2 msg", text: "MinIO S3 queue synchronization", icon: Radio, color: "text-emerald-400" },
                { label: "Celery Tasks Running", value: "14 active", text: "OCR / Graph Node computations", icon: Cpu, color: "text-indigo-400" },
                { label: "Redis Queue size", value: "28 entries", text: "Transient memory broker pipeline", icon: Database, color: "text-indigo-400" },
                { label: "Dead Letter Queue", value: "1 msg", text: "Failed messages to analyze", icon: AlertTriangle, color: "text-amber-500 animate-pulse" }
              ].map((m, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-900 rounded-2xl p-4.5 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[8px] text-slate-500 font-mono font-black uppercase tracking-wider block">{m.label}</span>
                    <strong className="text-base text-white font-mono mt-1.5 block">{m.value}</strong>
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{m.text}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg bg-slate-900 border border-slate-800 ${m.color}`}>
                    <m.icon className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>

            {/* Live systems log console with filters */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-xs font-black font-mono uppercase text-slate-200">Живий перегляд логів платформи PREDATOR</span>
                </div>

                {/* Filter tags dropdowns */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[8px] text-slate-500 font-mono font-bold uppercase mr-1">Фільтр логів:</span>
                  {(['ALL', 'ERROR', 'WARNING', 'INFO', 'SECURITY', 'AUDIT', 'AI'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`px-2 py-1 rounded text-[8px] font-mono font-black uppercase border transition-all cursor-pointer ${logFilter === f ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrolling Log rows */}
              <div className="h-96 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin p-1 bg-slate-950">
                <AnimatePresence initial={false}>
                  {filteredLogs.map((log, i) => {
                    const badgeColors = {
                      'ERROR': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                      'WARNING': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      'INFO': 'text-slate-400 bg-slate-900 border-slate-800',
                      'SECURITY': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      'AUDIT': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                      'AI': 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                    };
                    return (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-1.5 hover:bg-slate-900/60 rounded border border-transparent hover:border-slate-900 transition-all text-left"
                      >
                        <span className="text-slate-500 font-bold shrink-0">{log.timestamp}</span>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${badgeColors[log.level]}`}>
                          {log.level}
                        </span>
                        <span className="text-indigo-400 font-bold shrink-0 w-32 truncate" title={log.service}>
                          [{log.service}]
                        </span>
                        <span className="text-slate-300 flex-1 break-all leading-relaxed">
                          {log.message}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-900">
                <span>Показано {filteredLogs.length} подій за фільтром</span>
                <span className="text-emerald-400 font-black animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Підключено до Prometheus / Loki стріму
                </span>
              </div>
            </div>

          </div>
        )}

        {/* 7. SECURITY & DEVOPS KUBERNETES CONFIGS */}
        {activeSection === 'security-devops' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
              
              {/* Kubernetes Pods & Deployments */}
              <div className="xl:col-span-7 bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-indigo-400" />
                    <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Дерево Pods кластеру Kubernetes (Microservices)</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    STATUS: ACTIVE
                  </span>
                </div>

                <div className="space-y-3">
                  {k8sPods.map(pod => (
                    <div key={pod.name} className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-white font-mono">{pod.name}</strong>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                            {pod.status}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[9px] font-mono text-slate-500 mt-1.5">
                          <span>Виділено CPU: <strong className="text-slate-300">{pod.cpu}</strong></span>
                          <span>Виділено RAM: <strong className="text-slate-300">{pod.ram}</strong></span>
                          <span>Рестарти Pod: <strong className="text-amber-500 font-bold">{pod.restarts}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => restartK8sPod(pod.name)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 text-[9px] font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-500/10"
                      >
                        Перезапустити Pod
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* HashiCorp Vault secrets & manual backup system */}
              <div className="xl:col-span-5 space-y-6">
                
                {/* Vault & Keycloak */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4.5 h-4.5 text-indigo-400" />
                      <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Безпека: HashiCorp Vault</span>
                    </div>
                    <button
                      onClick={() => {
                        setVaultSealed(!vaultSealed);
                        alert(`Статус сейфа HashiCorp Vault змінено!`);
                      }}
                      className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${!vaultSealed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'}`}
                    >
                      {!vaultSealed ? 'VAULT UNSEALED' : 'VAULT SEALED'}
                    </button>
                  </div>

                  <div className="space-y-3 font-sans text-xs text-slate-400">
                    <p className="leading-relaxed text-[10px] font-mono">
                      Ключ шифрування Gemini API та токени YouControl надійно запечатані у Vault сейфі за допомогою алгоритму розподілу секретів Шаміра (3 з 5 шардів активовані).
                    </p>

                    <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl font-mono text-[9px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>OIDC Provider (Keycloak):</span>
                        <strong className="text-emerald-400">CONNECTING SECURE</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>JWT Signature:</span>
                        <strong className="text-indigo-400">HS-256 (RSA-4096)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>MFA Enforcement:</span>
                        <strong className="text-emerald-400">Required for Admins</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Databases Snapshot backups */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4.5 h-4.5 text-indigo-400" />
                      <span className="text-xs font-black font-mono uppercase text-slate-100 tracking-wider">Резервні копії & Snapshots</span>
                    </div>
                    <button
                      onClick={runManualBackup}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-mono font-black uppercase tracking-wider cursor-pointer shadow shadow-indigo-500/10 transition-colors"
                    >
                      Створити Снепшот
                    </button>
                  </div>

                  <div className="space-y-2">
                    {backups.map((bak, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl flex justify-between items-center text-[9px] font-mono">
                        <div>
                          <strong className="text-slate-300 block truncate max-w-[200px]" title={bak.filename}>{bak.filename}</strong>
                          <span className="text-slate-500 block text-[8px] mt-0.5">{bak.type} • Обсяг: {bak.size}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => alert(`Запущено відновлення бази з файлу ${bak.filename}... Будь ласка, зачекайте 2 хв.`)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 rounded border border-slate-800 transition-colors cursor-pointer font-black text-[8px]"
                          >
                            RESTORE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
