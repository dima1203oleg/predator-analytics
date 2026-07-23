// @ts-nocheck

import { useToast } from './ToastProvider';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext,  useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Users,
  Briefcase,
  Car,
  Home,
  ShieldAlert,
  TrendingUp,
  Coins,
  Terminal,
  Activity,
  ChevronRight,
  Download,
  AlertTriangle,
  Search,
  Building,
  ArrowRightLeft,
  Award,
  FileText,
  Layers,
  Heart,
  UserCheck,
  Percent,
  CheckCircle,
  Play,
  FileDown,
  Printer,
  ChevronDown
, Database} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';

// --- DATA STRUCTURES ---

export interface ProfilerAsset {
  id: string;
  type: 'real_estate' | 'vehicle' | 'business' | 'crypto' | 'offshore' | 'cash';
  name: string;
  value: string;
  valueNum: number; // in USD
  registeredToId: string;
  registeredToName: string;
  relationType: string;
  isNominee: boolean;
  legalIncomeDisparity: boolean;
  details: string;
}

export interface ProfilerPerson {
  id: string;
  name: string;
  role: string;
  age: number;
  dob: string;
  passport: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  riskScore: number;
  status: 'SUSPICIOUS' | 'SANCTIONED' | 'ACTIVE';
  isNomineeProxy: boolean;
  psychoProfile: {
    riskTolerance: string;
    travelPattern: string;
    spendingHabits: string;
    unexplainedWealthRatio: number; // 0-100%
  };
  sourcesOfWealth: {
    officialSalary: string;
    unofficialIncomeEst: string;
    dividends: string;
    foreignTransfers: string;
  };
  narrative: string;
}

// --- FULL EXTENSIVE DATASET ---

const PROFILER_PEOPLE: ProfilerPerson[] = [
  {
    id: 'kovalenko-ihor',
    name: 'Коваленко Ігор Вікторович',
    role: 'Екс-чиновник / Головний бенефіціар ТОВ "СпецТехПостач" (PEP)',
    age: 47,
    dob: '14.05.1979',
    passport: 'КМ 482910',
    taxId: '2938401923',
    address: 'смт Козин, вул. Старокиївська, буд. 72 (Обухівський р-н, Київська обл.)',
    phone: '+380 (50) 443-21-99',
    email: 'kovalenko.i@spectech.ua',
    riskScore: 85,
    status: 'SUSPICIOUS',
    isNomineeProxy: false,
    psychoProfile: {
      riskTolerance: 'Дуже висока. Активно використовує офшорні юрисдикції, номінальних директорів та довірених осіб для структурування капіталу.',
      travelPattern: 'Регулярні вильоти до Монако, Швейцарії, Кіпру та Сінгапуру. Останній зафіксований перетин кордону - березень 2026 року через пункт пропуску "Рава-Руська".',
      spendingHabits: 'Купівля елітної нерухомості за кордоном, елітний спорткар Porsche та обслуговування автопарку преміум-класу через водіїв.',
      unexplainedWealthRatio: 78
    },
    sourcesOfWealth: {
      officialSalary: '45,000 UAH / місяць (ТОВ "СпецТехПостач")',
      unofficialIncomeEst: '~$180,000 / місяць (незадекларовані відкати від тіньових митних схем та обходу санкцій)',
      dividends: 'Офіційно відсутні або заблоковані санкціями РНБО',
      foreignTransfers: 'Приховані перекази через офшор Vanguard Holdings Ltd на загальну суму $2.4 млн за останні 3 роки'
    },
    narrative: 'Колишній посадовець Департаменту держзакупівель, після звільнення заснував ТОВ "СпецТехПостач". Фігурант кримінальних проваджень щодо фінансування сепаратизму та обходу міжнародних санкцій через посередників. Більшість виявлених активів зареєстровано на дружину, тестя та водія-охоронця з метою уникнення арешту майна та спецконфіскації.'
  },
  {
    id: 'petrenko-olha',
    name: 'Петренко Ольга Сергіївна',
    role: 'Дружина / Офіційний номінал закордонних холдингів',
    age: 43,
    dob: '22.11.1983',
    passport: 'КМ 920194',
    taxId: '3129402843',
    address: 'Київська обл., смт Козин, вул. Старокиївська, буд. 72',
    phone: '+380 (67) 505-12-88',
    email: 'olga.petrenko@vanguard.io',
    riskScore: 68,
    status: 'SUSPICIOUS',
    isNomineeProxy: true,
    psychoProfile: {
      riskTolerance: 'Середня. Повністю довіряє фінансове структурування чоловіку, виступаючи номінальним власником та кінцевим бенефіціаром офшорних рахунків.',
      travelPattern: 'Проживання в Марбельї (Іспанія) протягом 6 місяців на рік, сезонні подорожі на гірськолижні курорти Франції (Куршевель).',
      spendingHabits: 'Купівля люксових брендів одягу, коштовностей Cartier, фінансування приватних шкіл для дітей в Іспанії.',
      unexplainedWealthRatio: 99.8
    },
    sourcesOfWealth: {
      officialSalary: '0 UAH (Офіційно є безробітною / домогосподаркою)',
      unofficialIncomeEst: '~$45,000 / місяць (надходження від офшорних структур чоловіка)',
      dividends: 'Тіньові дивіденди від Vanguard Holdings Ltd ($120,000 на рік)',
      foreignTransfers: 'SWIFT-перекази на іспанську компанію Sol Del Sur SL для фінансування купівлі вілли'
    },
    narrative: 'Дружина Ігоря Коваленка. Не веде активної підприємницької діяльності в Україні. Виявлена як бенефіціар компанії Vanguard Holdings Ltd (Беліз), якій належить 49% у ТОВ "СпецТехПостач", та іспанської фірми Sol Del Sur SL, на яку оформлено розкішну віллу в Іспанії вартістю 3.4 млн євро.'
  },
  {
    id: 'kharchenko-dmytro',
    name: 'Харченко Дмитро Петрович',
    role: 'Особистий водій / Номінальний власник логістичного бізнесу',
    age: 38,
    dob: '05.09.1988',
    passport: 'КН 192840',
    taxId: '2849104829',
    address: 'м. Київ, вул. Академіка Заболотного, буд. 142, кв. 58',
    phone: '+380 (93) 112-99-44',
    email: 'dmytro.kharchenko@logistic-plus.com.ua',
    riskScore: 75,
    status: 'SUSPICIOUS',
    isNomineeProxy: true,
    psychoProfile: {
      riskTolerance: 'Низька. Виконує прямі накази Ігоря Коваленка. Отримує матеріальну вигоду за надання своїх персональних даних для реєстрації активів.',
      travelPattern: 'Переважно внутрішні поїздки по території України на автомобілях преміум-класу, зрідка - відрядження у Польщу на вантажівках ТОВ "Логістик-Плюс".',
      spendingHabits: 'Помірний спосіб життя. Користується елітною технікою та елітним авто за дорученням, проте проживає у спальному районі Києва.',
      unexplainedWealthRatio: 100
    },
    sourcesOfWealth: {
      officialSalary: '15,000 UAH / місяць (водій у ТОВ "СпецТехПостач")',
      unofficialIncomeEst: '~$1,500 / місяць (фінансова винагорода від Коваленка за номінальне утримання бізнесу)',
      dividends: '0 UAH (Офіційні прибутки ТОВ "Логістик-Плюс" переготівковуються через фіктивні акти закупівлі товарів)',
      foreignTransfers: 'Перекази відсутні'
    },
    narrative: 'Особистий водій-охоронець Ігоря Коваленка. У 2023 році став єдиним засновником ТОВ "Логістик-Плюс", яке володіє парком з 12 вантажівок і здійснює логістичні контракти для ТОВ "СпецТехПостач". Також на нього оформлено особистий автомобіль Range Rover Vogue, яким де-факто користується сам Коваленко.'
  },
  {
    id: 'petrenko-serhiy',
    name: 'Петренко Сергій Леонідович',
    role: 'Тесть / Пенсіонер / Номінал елітної нерухомості',
    age: 69,
    dob: '01.03.1957',
    passport: 'КМ 204819',
    taxId: '1928401924',
    address: 'Житомирська обл., Коростенський р-н, с. Полянка, вул. Лісна, буд. 12',
    phone: '+380 (97) 222-11-00',
    email: 'serhiy.petrenko@forest-com.ua',
    riskScore: 55,
    status: 'ACTIVE',
    isNomineeProxy: true,
    psychoProfile: {
      riskTolerance: 'Дуже низька. Пенсіонер, колишній лісничий Житомирського держлісгоспу. Навряд чи повністю усвідомлює фінансово-кримінальні ризики оформленого на нього майна.',
      travelPattern: 'Виключно поїздки між Коростенським районом та Києвом.',
      spendingHabits: 'Стандартні витрати пенсіонера, не користується предметами розкоші, які де-юре йому належать.',
      unexplainedWealthRatio: 98.5
    },
    sourcesOfWealth: {
      officialSalary: 'Пенсія 4,200 UAH / місяць',
      unofficialIncomeEst: '0 UAH',
      dividends: '0 UAH',
      foreignTransfers: '0 UAH'
    },
    narrative: 'Тесть Ігоря Коваленка. Весь життєвий дохід та пенсійне забезпечення унеможливлюють придбання будь-якої комерційної чи елітної нерухомості. Проте у 2025 році на нього було оформлено пентхаус у престижному ЖК "PecherSky" у м. Києві площею 210 кв.м., придбаний за готівку за вказівкою зятя.'
  },
  {
    id: 'kovalenko-oleksandr',
    name: 'Коваленко Олександр Вікторович',
    role: 'Брат / ФОП "Консалтинг" / Співавтор схем виведення коштів',
    age: 43,
    dob: '18.10.1982',
    passport: 'КМ 501928',
    taxId: '2940291048',
    address: 'м. Львів, вул. Личаківська, буд. 110, кв. 14',
    phone: '+380 (50) 123-45-67',
    email: 'oleksandr@kovalenko-consult.lviv.ua',
    riskScore: 65,
    status: 'SUSPICIOUS',
    isNomineeProxy: false,
    psychoProfile: {
      riskTolerance: 'Висока. Має вищу економічну освіту. Консультує групу компаній Коваленка щодо податкової оптимізації та виведення коштів у закордонні юрисдикції.',
      travelPattern: 'Часті подорожі в Польщу, Латвію та Естонію. Відповідає за комунікацію з банками Прибалтики.',
      spendingHabits: 'Регулярне відвідування елітних ресторанів у Львові, володіє Porsche Cayenne GTS (хоча юридично ФОП заробляє скромно).',
      unexplainedWealthRatio: 72
    },
    sourcesOfWealth: {
      officialSalary: 'Дохід ФОП 3-ї групи - 1.2 млн UAH / рік',
      unofficialIncomeEst: '~$15,000 / місяць (комісії за транзитні схеми)',
      dividends: 'Тіньові доходи від надання консультаційних послуг ТОВ "СпецТехПостач"',
      foreignTransfers: 'Зарахування на рахунки у Luminor Bank (Латвія) на суму EUR 420,000 за фіктивні IT-консультації'
    },
    narrative: 'Рідний брат Ігоря Коваленка. Оформлений як ФОП, надає послуги "інформаційного та фінансового консалтингу". Де-факто бере участь у розподілі фінансових потоків ТОВ "СпецТехПостач". Використовує латвійські рахунки для акумуляції валютного капіталу брата. На нього оформлено Porsche Cayenne GTS.'
  }
];

const PROFILER_ASSETS: ProfilerAsset[] = [
  // Kovalenko direct assets
  {
    id: 'asset-kozin-house',
    type: 'real_estate',
    name: 'Елітний особняк, Козин (840 кв.м.)',
    value: '$2,100,000',
    valueNum: 2100000,
    registeredToId: 'kovalenko-ihor',
    registeredToName: 'Коваленко Ігор Вікторович',
    relationType: 'Пряме володіння',
    isNominee: false,
    legalIncomeDisparity: true,
    details: 'Триповерховий маєток із власним виходом до річки Козинка. Офіційно задекларований, проте сукупні офіційні доходи за все життя покривають менше 20% поточної ринкової вартості будівлі та ділянки.'
  },
  {
    id: 'asset-s500',
    type: 'vehicle',
    name: 'Mercedes-Benz S500 Long (2023)',
    value: '$160,000',
    valueNum: 160000,
    registeredToId: 'kovalenko-ihor',
    registeredToName: 'Коваленко Ігор Вікторович',
    relationType: 'Пряме володіння',
    isNominee: false,
    legalIncomeDisparity: true,
    details: 'Автомобіль представницького класу, придбаний новим у автосалоні. Зареєстрований на самого Коваленка І.В.'
  },
  {
    id: 'asset-spectech',
    type: 'business',
    name: '51% у ТОВ "СпецТехПостач"',
    value: '$100,000 (Статутний капітал)',
    valueNum: 100000,
    registeredToId: 'kovalenko-ihor',
    registeredToName: 'Коваленко Ігор Вікторович',
    relationType: 'Пряма частка / Контроль',
    isNominee: false,
    legalIncomeDisparity: false,
    details: 'Мажоритарна частка в компанії-імпортері. Наразі діяльність та рахунки компанії під обмеженнями через санкції РНБО України.'
  },
  // Nominee assets - Wife Olha
  {
    id: 'asset-marbella-villa',
    type: 'real_estate',
    name: 'Вілла в Марбельї, Іспанія (340 кв.м.)',
    value: '$3,400,000',
    valueNum: 3400000,
    registeredToId: 'petrenko-olha',
    registeredToName: 'Петренко Ольга Сергіївна (Дружина)',
    relationType: 'Номінальний власник через Sol Del Sur SL',
    isNominee: true,
    legalIncomeDisparity: true,
    details: 'Розкішна вілла у престижному районі Коста-дель-Соль. Оформлена на іспанську компанію-пустушку, де 100% засновником є дружина Ольга Петренко. Джерела коштів на покупку мають очевидне походження з рахунків ТОВ "СпецТехПостач".'
  },
  {
    id: 'asset-vanguard-offshore',
    type: 'offshore',
    name: 'Vanguard Holdings Ltd (Беліз)',
    value: '$1,800,000 (Активи на рахунках)',
    valueNum: 1800000,
    registeredToId: 'petrenko-olha',
    registeredToName: 'Петренко Ольга Сергіївна (Дружина)',
    relationType: 'Номінальний бенефіціар',
    isNominee: true,
    legalIncomeDisparity: true,
    details: 'Офшорний холдинг, зареєстрований у Белізі. Володіє рахунками у Bank of Cyprus. Цій фірмі офіційно належить 49% у ТОВ "СпецТехПостач", що використовується для трансфертного ціноутворення та уникнення сплати податків.'
  },
  // Nominee assets - Driver Dmytro
  {
    id: 'asset-driver-range',
    type: 'vehicle',
    name: 'Range Rover Vogue (2023)',
    value: '$180,000',
    valueNum: 180000,
    registeredToId: 'kharchenko-dmytro',
    registeredToName: 'Харченко Дмитро Петрович (Водій)',
    relationType: 'Номінальний власник',
    isNominee: true,
    legalIncomeDisparity: true,
    details: 'Позашляховик преміум-класу, д.н. AA 7777 XX. Оформлений на водія Харченка Д.П. Проте за результатами супутникового OSINT та трекінгу мобільних стільників, автомобіль щоденно обслуговує виключно Коваленка І.В.'
  },
  {
    id: 'asset-logistic-plus',
    type: 'business',
    name: '100% у ТОВ "Логістик-Плюс" (Флот 12 фур)',
    value: '$520,000 (Ринкова оцінка флоту)',
    valueNum: 520000,
    registeredToId: 'kharchenko-dmytro',
    registeredToName: 'Харченко Дмитро Петрович (Водій)',
    relationType: 'Номінальний засновник',
    isNominee: true,
    legalIncomeDisparity: true,
    details: 'Логістична компанія, зареєстрована на водія. Володіє 12 магістральними тягачами DAF, які на пільгових умовах обслуговують доставку мікросхем подвійного призначення для ТОВ "СпецТехПостач".'
  },
  // Nominee assets - Father in law Sergiy
  {
    id: 'asset-pechersky-penthouse',
    type: 'real_estate',
    name: 'Пентхаус у ЖК "PecherSky", Київ (210 кв.м.)',
    value: '$1,200,000',
    valueNum: 1200000,
    registeredToId: 'petrenko-serhiy',
    registeredToName: 'Петренко Сергій Леонідович (Тесть)',
    relationType: 'Номінальний власник',
    isNominee: true,
    legalIncomeDisparity: true,
    details: 'Елітна дворівнева квартира в центрі Печерська з авторським дизайном та панорамними вікнами. Оформлена на тестя-пенсіонера у 2025 році за готівковий розрахунок.'
  },
  // Nominee assets - Brother Oleksandr
  {
    id: 'asset-porsche-cayenne',
    type: 'vehicle',
    name: 'Porsche Cayenne GTS (2024)',
    value: '$140,000',
    valueNum: 140000,
    registeredToId: 'kovalenko-oleksandr',
    registeredToName: 'Коваленко Олександр Вікторович (Брат)',
    relationType: 'Номінальний власник / Співкористувач',
    isNominee: true,
    legalIncomeDisparity: true,
    details: 'Новий спортивний кросовер, зареєстрований на ФОП брата. Офіційні задекларовані прибутки ФОП Олександра Коваленка не дозволяють придбати таке авто без залучення стороннього капіталу.'
  },
  {
    id: 'asset-latvia-accounts',
    type: 'crypto',
    name: 'Рахунки у Luminor Bank (Латвія, Рига)',
    value: '$450,000',
    valueNum: 450000,
    registeredToId: 'kovalenko-oleksandr',
    registeredToName: 'Коваленко Олександр Вікторович (Брат)',
    relationType: 'Управління рахунками в інтересах брата',
    isNominee: true,
    legalIncomeDisparity: true,
    details: 'Конфіденційні валютні рахунки у країні ЄС. Використовуються для швидкого транзиту та накопичення євро-капіталу в обхід фінансового моніторингу України.'
  }
];

export default function PersonProfiler() {
  const { showToast } = useToast();
  const [selectedPersonId, setSelectedPersonId] = useState<string>('kovalenko-ihor');
  const [activeTab, setActiveTab] = useState<'profile' | 'assets' | 'nominees' | 'audit'>('profile');
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [customSearchName, setCustomSearchName] = useState<string>('');
  const [isAiSearching, setIsAiSearching] = useState<boolean>(false);
  const [aiSearchLog, setAiSearchLog] = useState<string[]>([]);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [dossierProgress, setDossierProgress] = useState(0);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const selectedPerson = PROFILER_PEOPLE.find(p => p.id === selectedPersonId) || PROFILER_PEOPLE[0];

  // Filter assets related to the selected person
  const directAssets = PROFILER_ASSETS.filter(a => a.registeredToId === selectedPerson.id);
  
  // Find assets registered to relatives/nominees where the REAL beneficiary is Kovalenko Ihor
  const linkedAssets = selectedPerson.id === 'kovalenko-ihor' 
    ? PROFILER_ASSETS.filter(a => a.registeredToId !== 'kovalenko-ihor')
    : [];

  const allAssetsForView = [...directAssets, ...linkedAssets];

  const totalDirectValue = directAssets.reduce((sum, a) => sum + a.valueNum, 0);
  const totalNomineeValue = linkedAssets.reduce((sum, a) => sum + a.valueNum, 0);
  const totalAggregateValue = totalDirectValue + totalNomineeValue;

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [auditLog, aiSearchLog]);

  // Run AI Audit Engine Simulation
  const runAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(0);
    setAuditLog([]);
    
    const logs = [
      `[INIT] Запуск ШІ-аудиту майна та доходів для особи: ${selectedPerson.name}...`,
      `[SCAN] Підключення до бази даних Державної податкової служби України (ДПС)...`,
      `[SCAN] Отримання довідки про задекларовані доходи особи з 2012 по 2025 роки...`,
      `[AUDIT] Офіційні задекларовані накопичення: ${(selectedPerson.id === 'kovalenko-ihor' ? '1.8 млн UAH' : selectedPerson.id === 'petrenko-olha' ? '0 UAH' : '220 тис. UAH')}.`,
      `[SCAN] Запит до Державного реєстру речових прав на нерухоме майно (ДРРП)...`,
      `[SCAN] Запит до Єдиного державного реєстру транспортних засобів МВС...`,
      `[AUDIT] Оцінка ринкової вартості зареєстрованих активів прямого володіння...`,
      `[ALERT] Виявлено невідповідність (Disparity)! Вартість майна у прямому володінні перевищує офіційні доходи у ${selectedPerson.id === 'kovalenko-ihor' ? '12 разів' : '150 разів'}!`,
      `[CONNECT] Аналіз споріднених зв'язків першого ступеня (дружина, батьки, діти, брати/сестри)...`,
      `[AUDIT] Запуск перехресного моніторингу доходів родичів та наявного у них майна...`,
      selectedPerson.id === 'kovalenko-ihor' 
        ? `[ALERT] Петренко О. С. (дружина): Задекларований дохід: 0 UAH. Володіння: Вілла в Іспанії ($3.4M), Vanguard Ltd (Беліз). Індикатор номінального володіння: 99.8%! Активи класифіковано як ТІНЬОВИЙ КАПІТАЛ об'єкта.`
        : `[ALERT] Виявлено, що особа є дружиною PEP Коваленка І.В. Маєток в Іспанії придбано за кошти незрозумілого походження. Ознаки легалізації через закордонні компанії.`,
      `[CONNECT] Пошук пов'язаних фізичних осіб за трудовими договорами та корпоративними реєстрами...`,
      selectedPerson.id === 'kovalenko-ihor'
        ? `[ALERT] Харченко Д. П. (особистий водій): Офіційний оклад 15,000 UAH. Володіння: Range Rover Vogue ($180K), ТОВ "Логістик-Плюс" ($520K). Індикатор проксі-тримання: 100%! Де-факто бенефіціаром компанії є Коваленко І.В.`
        : `[ALERT] Особу класифіковано як номінального проксі-утримувача активів Коваленка Ігоря Вікторовича. Ризик відкриття кримінальної справи за статтею 209 ККУ (відмивання грошей).`,
      selectedPerson.id === 'kovalenko-ihor'
        ? `[ALERT] Петренко С. Л. (тесть, пенсіонер): Офіційний дохід: пенсія 4,200 UAH. Володіння: Пентхаус у ЖК "PecherSky", Київ ($1.2M). Індикатор номінального володіння: 98.5%! Активи класифіковано як приховані активи об'єкта.`
        : `[ALERT] Майно (пентхаус) придбано за кошти зятя в обхід фінмоніторингу. Рекомендовано арешт майна за процедурою спецконфіскації.`,
      `[CYBER_INTEL] Аналіз транскордонних переказів та крипто-активності...`,
      `[SCAN] Перевірка блокчейн-транзакцій гаманця bc1qxy... (пов'язаний з ТОВ "СпецТехПостач"). Баланс: 14.2 BTC.`,
      `[CONCLUSION] ШІ-Аудит завершено. Сформовано "Портрет прихованого капіталу" з точністю 98.7%.`,
      `[RECOMMENDATION] Надіслати зібране досьє до НАЗК та ДБР. Накласти арешт на активи номінальних утримувачів.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logs.length) {
        setAuditLog(prev => [...prev, logs[currentStep]]);
        setAuditProgress(Math.min(100, Math.round(((currentStep + 1) / logs.length) * 100)));
        currentStep++;
      } else {
        clearInterval(interval);
        setIsAuditing(false);
      }
    }, 850);
  };

  // Run Custom Person AI Search Simulation

  const handleGenerateDossier = () => {
    setIsGeneratingDossier(true);
    setDossierProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsGeneratingDossier(false);
          // Show some kind of success or open PDF here in a real app
        }, 1000);
      }
      setDossierProgress(Math.min(currentProgress, 100));
    }, 400);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchName.trim() || isAiSearching) return;
    
    setIsAiSearching(true);
    setAiSearchLog([]);
    
    const searchLogs = [
      `[OSINT] Ініційовано ШІ-пошук по базах даних для особи: "${customSearchName}"...`,
      `[DATABASE] Сканування бази паспортів МВС та прикордонної служби...`,
      `[DATABASE] Пошук збігів у базах ДПС (Декларації, доходи, родинні зв'язки)...`,
      `[DARKNET] Пошук у витоках баз даних Нова Пошта, ПриватБанк, КМДА (2020-2024)...`,
      `[RECORDS] Сканування судового реєстру та санкційних списків РНБО/OFAC...`,
      `[LINK_ANALYSIS] Побудова первинного графу зв'язків з бенефіціарами та засновниками компаній...`,
      `[SYNTHESIS] Аналіз завершено. Створено динамічний профіль у реєстрі OSINT Workbench.`,
      `[УСПІХ] Профіль особи "${customSearchName}" успішно завантажено в інтерактивний профайлер.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < searchLogs.length) {
        setAiSearchLog(prev => [...prev, searchLogs[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsAiSearching(false);
        
        // Add a virtual person to selection or just update narrative
        const newPersonId = `virtual-${Date.now()}`;
        const newPerson: ProfilerPerson = {
          id: newPersonId,
          name: customSearchName,
          role: 'Об\'єкт ШІ-синтезу (Результати розвідки)',
          age: 41,
          dob: '29.08.1985',
          passport: 'КМ 102948',
          taxId: '3129401824',
          address: 'м. Київ, вул. Шота Руставелі, буд. 22, кв. 14',
          phone: '+380 (50) 998-12-34',
          email: `${customSearchName.toLowerCase().replace(/ /g, '.')}@gmail.com`,
          riskScore: 65,
          status: 'SUSPICIOUS',
          isNomineeProxy: true,
          psychoProfile: {
            riskTolerance: 'Середня. Є номінальним утримувачем 3 офшорних компаній та об\'єктом інтересу у схемах конвертації валюти.',
            travelPattern: 'Регулярні виїзди за кордон через шлях волонтерства, переважно - Варшава, Відень.',
            spendingHabits: 'Купівля криптовалюти великими обсягами (P2P-платформи), недекларовані капіталовкладення в елітні заклади.',
            unexplainedWealthRatio: 85
          },
          sourcesOfWealth: {
            officialSalary: '18,500 UAH / місяць',
            unofficialIncomeEst: '~$8,500 / місяць',
            dividends: '0 UAH',
            foreignTransfers: 'Транзитні перекази криптовалюти на суму понад $120,000 на місяць'
          },
          narrative: `Фізична особа, виявлена в ході автоматичного ШІ-сканування мережі зв'язків ТОВ "СпецТехПостач". Виступає номінальним утримувачем криптоактивів в інтересах Ігоря Коваленка та бенефіціаром тіньової фірми у сфері логістики.`
        };

        PROFILER_PEOPLE.push(newPerson);
        
        // Also mock adding 2 assets for them
        PROFILER_ASSETS.push({
          id: `asset-virtual-car-${Date.now()}`,
          type: 'vehicle',
          name: 'BMW X5 M-Sport (2022)',
          value: '$85,000',
          valueNum: 85000,
          registeredToId: newPersonId,
          registeredToName: customSearchName,
          relationType: 'Пряме володіння',
          isNominee: true,
          legalIncomeDisparity: true,
          details: 'Автомобіль виявлено у володінні ФОП, доходи якого не відповідають вартості покупки.'
        });
        
        setSelectedPersonId(newPersonId);
        setCustomSearchName('');
      }
    }, 700);
  };

  // Source of Wealth chart data
  const wealthChartData = [
    { name: 'Офіційний дохід', сума: selectedPerson.id === 'kovalenko-ihor' ? 540000 : selectedPerson.id === 'petrenko-olha' ? 0 : 180000 },
    { name: 'Тіньові схеми', сума: selectedPerson.id === 'kovalenko-ihor' ? 8200000 : selectedPerson.id === 'petrenko-olha' ? 1400000 : 2400000 },
    { name: 'Закордонні рахунки', сума: selectedPerson.id === 'kovalenko-ihor' ? 12000000 : selectedPerson.id === 'petrenko-olha' ? 4200000 : 800000 }
  ];

  return (
    <div className="space-y-6 relative" id="person-profiler-root">
    
      <AnimatePresence>
        {isGeneratingDossier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm"
          >
            <div className="glass-panel-premium border border-slate-800 p-4 rounded-2xl max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${dossierProgress}%` }} />
              
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-12 rounded-full bg-indigo-500/20 border border-slate-800 flex items-center justify-center animate-pulse">
                  <Database className="w-8 h-8 text-indigo-400" />
                </div>
                
                <h3 className="text-base font-display text-white tracking-wide">Генерація комплексного досьє</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Агрегація даних: {selectedPerson.name}
                </p>
                
                <div className="w-full space-y-3 mt-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${dossierProgress > 10 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={dossierProgress > 10 ? 'text-slate-200' : 'text-slate-600'}>Збір з державних реєстрів...</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${dossierProgress > 30 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={dossierProgress > 30 ? 'text-slate-200' : 'text-slate-600'}>Скарпінг соцмереж та новин...</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${dossierProgress > 50 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={dossierProgress > 50 ? 'text-slate-200' : 'text-slate-600'}>Складання психологічного портрету...</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${dossierProgress > 70 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={dossierProgress > 70 ? 'text-slate-200' : 'text-slate-600'}>Аналіз активів та пов'язаних осіб...</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${dossierProgress > 90 ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={dossierProgress > 90 ? 'text-slate-200' : 'text-slate-600'}>Формування зведеного звіту...</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* Top Banner: Navigation / Target Selection */}
      <div className="bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 p-2 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider font-sans">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Центр Глибокого Профілювання & Трасування Номіналів</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Аналіз психо-фінансових портретів фіз. осіб, перевірка легальності доходів, виявлення підставних тримачів майна (Nominees)
            </p>
          </div>

          <button
            onClick={handleGenerateDossier} disabled={isGeneratingDossier}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-slate-800 text-xs font-bold text-indigo-300 hover:text-white font-mono uppercase tracking-wider cursor-pointer transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {isGeneratingDossier ? <span>Генерація... {Math.round(dossierProgress)}%</span> : <span>Все про особу (OSINT + Реєстри)</span>}
          </button>
          
          <button
            onClick={() => showToast('Запуск глибинного пошуку компрометуючих матеріалів...', 'info')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600 border border-slate-800 text-xs font-bold text-rose-400 hover:text-white font-mono uppercase tracking-wider cursor-pointer transition-all shrink-0 shadow-lg shadow-rose-950/20"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Компромат</span>
          </button>
          
          {/* AI Search input for custom people lookup */}
          <form onSubmit={handleCustomSearch} className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-2xl border border-slate-800 max-w-md w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 ml-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Новий ШІ-пошук особи (напр. 'Харченко')..."
              value={customSearchName}
              onChange={(e) => setCustomSearchName(e.target.value)}
              disabled={isAiSearching}
              className="bg-transparent text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none py-1 px-2 w-full"
            />
            <button
              type="submit"
              disabled={isAiSearching || !customSearchName.trim()}
              className="px-3 py-1.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-xs font-bold text-white font-mono uppercase tracking-wider cursor-pointer transition-all shrink-0"
            >
              {isAiSearching ? 'Аналіз...' : 'Знайти'}
            </button>
          </form>
        </div>

        {/* Horizontal scroll target selection */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {PROFILER_PEOPLE.map((p) => {
            const isSelected = p.id === selectedPersonId;
            const riskColor = p.riskScore >= 75 ? 'text-rose-400 border-slate-800 bg-rose-500/5' : p.riskScore >= 50 ? 'text-amber-400 border-slate-800 bg-amber-500/5' : 'text-emerald-400 border-slate-800 bg-emerald-500/5';
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersonId(p.id)}
                className={`flex flex-col text-left p-2.5 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isSelected 
                    ? 'border-slate-800 bg-blue-500/10 shadow-2xl shadow-black/40 shadow-blue-950/40 scale-[1.02]' 
                    : 'border-slate-800/60 bg-black/30 hover:bg-black/40 hover:shadow-2xl shadow-black/40 transition-all duration-300 hover:border-slate-800'
                }`}
              >
                {isSelected && (
                  <span className="absolute left-0 top-2 bottom-3 w-1 rounded-r bg-blue-500" />
                )}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded border ${riskColor}`}>
                    RISK {p.riskScore}%
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 truncate w-full" title={p.name}>
                  {p.name.split(' ').slice(0, 2).join(' ')}
                </h4>
                <p className="text-xs text-slate-500 truncate w-full font-mono mt-0.5">
                  {p.role.split('/')[0]}
                </p>
                
                {p.isNomineeProxy && (
                  <span className="mt-1.5 text-xs font-mono font-bold uppercase tracking-tight text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                    <span>NOMINEE утримувач</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Search terminal simulation banner when running */}
      <AnimatePresence>
        {isAiSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl font-mono text-xs space-y-1 bg-gradient-to-br from-slate-950 to-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
                <span className="text-blue-400 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 animate-spin" />
                  SHI-OSINT SCAN IN PROGRESS...
                </span>
                <span className="text-slate-600">SYSTEM: OK</span>
              </div>
              <div className="space-y-1 max-h-[120px] overflow-y-auto custom-scrollbar">
                {aiSearchLog.map((log, i) => (
                  <div key={i} className="text-slate-400">
                    <span className="text-blue-600 mr-2">&gt;&gt;</span>
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Core Section: Left-Side Dossier Bento / Right-Side interactive visualizers */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
        
        {/* Left Column (xl:col-span-7): Bento Dossier */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Section Selector */}
          <div className="flex items-center gap-1.5 border-b border-slate-800/60 pb-px">
            {(['profile', 'assets', 'nominees', 'audit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer relative ${
                  activeTab === tab 
                    ? 'border-blue-500 text-blue-400 bg-slate-950/20' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'profile' && 'Огляд & Портрет'}
                {tab === 'assets' && 'Портфель Активів'}
                {tab === 'nominees' && 'Схема Тримачів'}
                {tab === 'audit' && 'ШІ-Аудит & Декларації'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="tab-profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Profile Card & Info */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 justify-between border-b border-slate-800/60 pb-4 mb-4">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-slate-950/80 border border-slate-800 rounded-2xl text-blue-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white font-sans">{selectedPerson.name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">{selectedPerson.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPerson.isNomineeProxy && (
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-slate-800 text-amber-500 text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>НОМІНАЛ / ПРОКСІ</span>
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider ${
                        selectedPerson.riskScore >= 75 ? 'text-rose-400 border-slate-800 bg-rose-500/10' : 'text-amber-400 border-slate-800 bg-amber-500/10'
                      }`}>
                        RISK: {selectedPerson.riskScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Personal Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-black/40 border border-slate-800 p-2 rounded-2xl space-y-2">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5 text-xs">
                        <span className="text-slate-500">Дата народження:</span>
                        <span className="text-slate-300 font-bold">{selectedPerson.dob} ({selectedPerson.age} років)</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5 text-xs">
                        <span className="text-slate-500">Індивідуальний код (ІПН):</span>
                        <span className="text-slate-300 font-bold">{selectedPerson.taxId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Серія/Номер паспорта:</span>
                        <span className="text-slate-300 font-bold">{selectedPerson.passport}</span>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-slate-800 p-2 rounded-2xl space-y-2">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5 text-xs">
                        <span className="text-slate-500">Контактний телефон:</span>
                        <span className="text-slate-300 font-bold">{selectedPerson.phone}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5 text-xs">
                        <span className="text-slate-500">Електронна пошта:</span>
                        <span className="text-slate-300 font-bold">{selectedPerson.email}</span>
                      </div>
                      <div className="flex justify-between text-xs items-start">
                        <span className="text-slate-500">Реєстрація:</span>
                        <span className="text-slate-300 font-bold text-right truncate w-[160px]" title={selectedPerson.address}>{selectedPerson.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Biography Narrative */}
                  <div className="mt-4 space-y-1">
                    <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Оперативне досьє / ШІ-Оцінка</span>
                    <p className="text-slate-300 text-xs leading-relaxed bg-black/40 p-2.5 rounded-2xl border border-slate-800">
                      {selectedPerson.narrative}
                    </p>
                  </div>
                </div>

                {/* Psycho-Behavioral Profiling Bento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  
                  {/* Behavioral profile card */}
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                      <Activity className="w-4.5 h-4.5 text-blue-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Психолого-поведінковий портрет</h4>
                    </div>
                    <div className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 font-mono uppercase tracking-wider block">Схильність до ризику:</span>
                        <p className="text-slate-300 text-xs font-sans leading-relaxed">{selectedPerson.psychoProfile.riskTolerance}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 font-mono uppercase tracking-wider block">Географічні патерни (Авіа):</span>
                        <p className="text-slate-300 text-xs font-sans leading-relaxed">{selectedPerson.psychoProfile.travelPattern}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 font-mono uppercase tracking-wider block">Витратні патерни (Lifestyle):</span>
                        <p className="text-slate-300 text-xs font-sans leading-relaxed">{selectedPerson.psychoProfile.spendingHabits}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Disparity Audit */}
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4.5 h-4.5 text-rose-400" />
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Джерела Доходів vs Активи</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400 px-2 py-1 bg-rose-500/10 border border-slate-800 rounded">
                        НЕЗБІГ: {selectedPerson.psychoProfile.unexplainedWealthRatio}%
                      </span>
                    </div>

                    <div className="space-y-3 text-xs font-mono">
                      <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Офіційна з/п (Декларація):</span>
                        <span className="text-emerald-400 font-bold">{selectedPerson.sourcesOfWealth.officialSalary}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Тіньові надходження (ШІ-Оцінка):</span>
                        <span className="text-rose-400 font-bold">{selectedPerson.sourcesOfWealth.unofficialIncomeEst}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Дивіденди (Офшори):</span>
                        <span className="text-blue-400 font-bold">{selectedPerson.sourcesOfWealth.dividends}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800 flex justify-between items-start text-xs">
                        <span className="text-slate-500 shrink-0">Перекази з-за кордону:</span>
                        <span className="text-slate-300 font-bold text-right truncate w-[140px]" title={selectedPerson.sourcesOfWealth.foreignTransfers}>{selectedPerson.sourcesOfWealth.foreignTransfers}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {activeTab === 'assets' && (
              <motion.div
                key="tab-assets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Aggregate Asset Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2">
                    <span className="text-xs text-slate-500 font-mono uppercase block mb-1">Зареєстровано Прямо</span>
                    <p className="text-base font-bold text-slate-200">${totalDirectValue.toLocaleString()}</p>
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle className="w-2.5 h-2.5" /> Легальний титул
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2">
                    <span className="text-xs text-slate-500 font-mono uppercase block mb-1">Зареєстровано на Номіналів (Проксі)</span>
                    <p className="text-base font-bold text-amber-500">${totalNomineeValue.toLocaleString()}</p>
                    <span className="text-xs font-mono text-rose-400 flex items-center gap-1 mt-1 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" /> Ризик приховування капіталу
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2">
                    <span className="text-xs text-slate-500 font-mono uppercase block mb-1">Сукупна Ринкова Вартість (Активи)</span>
                    <p className="text-base font-bold text-blue-400">${totalAggregateValue.toLocaleString()}</p>
                    <span className="text-xs font-mono text-slate-400 block mt-1">З точністю ШІ-моделювання 97.4%</span>
                  </div>
                </div>

                {/* Assets List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Повний реєстр виявленого майна та корпоративних часток</span>
                  </h4>

                  <div className="space-y-3">
                    {allAssetsForView.map((asset) => {
                      const assetIcon = asset.type === 'real_estate' ? <Home className="w-4 h-4 text-emerald-400" />
                        : asset.type === 'vehicle' ? <Car className="w-4 h-4 text-blue-400" />
                        : asset.type === 'business' ? <Building className="w-4 h-4 text-purple-400" />
                        : asset.type === 'offshore' ? <Award className="w-4 h-4 text-amber-500" />
                        : <Coins className="w-4 h-4 text-yellow-400" />;

                      return (
                        <div 
                          key={asset.id} 
                          className={`bg-slate-900/40 border rounded-2xl p-2 flex flex-col md:flex-row md:items-center justify-between gap-2 transition-all hover:bg-black/40 transition-colors ${
                            asset.isNominee ? 'border-slate-800' : 'border-slate-800/60'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                              {assetIcon}
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                <span>{asset.name}</span>
                                {asset.isNominee && (
                                  <span className="text-xs font-mono font-bold px-2 py-1 bg-amber-500/10 text-amber-500 border border-slate-800 rounded uppercase">
                                    Номінальний утримувач
                                  </span>
                                )}
                              </h5>
                              <p className="text-xs text-slate-400">{asset.details}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 mt-1">
                                <span>Реєстратор: <strong className="text-slate-300">{asset.registeredToName}</strong></span>
                                <span>•</span>
                                <span>Тип: <strong className="text-slate-300">{asset.relationType}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end justify-center font-mono shrink-0">
                            <span className="text-xs font-bold text-white">{asset.value}</span>
                            {asset.legalIncomeDisparity && (
                              <span className="text-xs text-rose-400 font-bold uppercase tracking-tight flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 animate-pulse" />
                                Незбіг з доходом утримувача
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'nominees' && (
              <motion.div
                key="tab-nominees"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2"
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Розслідування зв'язків та переписаних активів
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        Аналіз фінансового дисбалансу та приховування майна через підставних осіб
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {PROFILER_PEOPLE.filter(p => p.id !== 'kovalenko-ihor').map((rel) => {
                    // Find assets registered to this relative
                    const assetsRegistered = PROFILER_ASSETS.filter(a => a.registeredToId === rel.id);
                    const totalAssetVal = assetsRegistered.reduce((sum, a) => sum + a.valueNum, 0);

                    return (
                      <div key={rel.id} className="bg-black/40 border border-slate-800 rounded-2xl p-2 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{rel.name}</span>
                                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-slate-800 px-2 py-1 rounded uppercase">
                                  {rel.role.split('/')[1]?.trim() || 'НОМІНАЛ'}
                                </span>
                              </h5>
                              <span className="text-xs font-mono text-slate-500">{rel.role.split('/')[0]}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-xs">
                            <div className="text-right">
                              <span className="text-slate-500 uppercase block text-xs">Активи на суму:</span>
                              <strong className="text-amber-500 font-bold">${totalAssetVal.toLocaleString()}</strong>
                            </div>
                            <div className="px-2 py-1 bg-rose-500/10 border border-slate-800 rounded text-rose-400 font-bold flex flex-col items-center">
                              <span className="text-xs text-rose-500/80 uppercase font-mono tracking-widest leading-none mb-0.5">Незбіг</span>
                              <span className="leading-none">{rel.psychoProfile.unexplainedWealthRatio}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Relative Assets List */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Оформлене майно:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                            {assetsRegistered.map((a) => (
                              <div key={a.id} className="bg-black/30 border border-slate-800/60 p-2 rounded-2xl flex items-center justify-between gap-1">
                                <span className="text-slate-300 truncate w-[160px]" title={a.name}>{a.name}</span>
                                <strong className="text-white shrink-0">{a.value}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Disparity Justification */}
                        <div className="bg-rose-500/5 border border-slate-800 rounded-2xl p-2.5 flex items-start gap-2.5 text-xs leading-relaxed">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="text-rose-400 font-bold uppercase block text-xs mb-0.5 font-mono">ШІ-Дисбаланс & Номінальний аналіз:</span>
                            <span className="text-slate-300">
                              Офіційна зарплата {rel.name.split(' ')[0]} становить <strong className="text-emerald-400">{rel.sourcesOfWealth.officialSalary}</strong>. Ринкова вартість оформленого на нього майна складає <strong className="text-rose-400">${totalAssetVal.toLocaleString()}</strong>. Зв'язок з головним об'єктом та нульовий/мінімальний підтверджений дохід є безумовними ознаками використання особи як номінального тримача.
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div
                key="tab-audit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        ШІ-Модуль Співвідношення Доходів та Декларацій
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        Автоматизована верифікація легальності придбання активів та номінального тримання
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={runAudit}
                    disabled={isAuditing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-xs font-mono font-bold uppercase text-white cursor-pointer transition-all active:scale-95 shadow-2xl shadow-black/40 shadow-blue-950/50 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isAuditing ? 'Аудит запущено...' : 'Запустити ШІ-Аудит'}</span>
                  </button>
                </div>

                {isAuditing && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-500">
                      <span>Верифікація декларацій...</span>
                      <span>{auditProgress}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-500" 
                        animate={{ width: `${auditProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {/* Audit Terminal Log */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2 font-mono text-xs h-[260px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 bg-gradient-to-b from-slate-950 to-slate-900 relative">
                  {auditLog.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center space-y-2">
                      <Terminal className="w-8 h-8 text-slate-800" />
                      <p className="max-w-xs text-xs uppercase tracking-wider leading-relaxed">
                        Термінал готовий до запуску аудиту. Натисніть кнопку вище для симуляції перехресного аналізу декларацій.
                      </p>
                    </div>
                  ) : (
                    <>
                      {auditLog.map((log, i) => {
                        let colorClass = 'text-slate-400';
                        if (log.includes('[ALERT]')) colorClass = 'text-rose-400 font-bold';
                        else if (log.includes('[CONCLUSION]')) colorClass = 'text-emerald-400 font-bold';
                        else if (log.includes('[INIT]')) colorClass = 'text-blue-400 font-bold border-b border-slate-800 pb-1 mb-1';
                        else if (log.includes('[RECOMMENDATION]')) colorClass = 'text-blue-300 font-bold mt-1';
                        
                        return (
                          <div key={i} className={`flex items-start gap-1 leading-relaxed ${colorClass}`}>
                            <span className="text-slate-600 shrink-0">[{i+1}]</span>
                            <span>{log}</span>
                          </div>
                        );
                      })}
                      <div ref={terminalEndRef} />
                    </>
                  )}
                </div>

                {/* Download PDF Audit Report toolbar */}
                {auditLog.length > 0 && !isAuditing && (
                  <div className="bg-black/40 border border-slate-800 rounded-2xl p-2 flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      АУДИТ УСПІШНО ЗГЕНЕРОВАНО (S-091)
                    </span>
                    <button
                      onClick={() => showToast('Формується PDF-досьє фізичної особи із повним графом номінальних тримачів...')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-slate-800 rounded-2xl text-xs font-bold uppercase transition-all duration-300"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Скачати досьє (PDF)
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Column (xl:col-span-5): Interactive Diagrams and Visualizations */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* SVG Connection Graph specifically mapping Kovalenko and Nominees */}
          <div className="bg-black/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-2 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4.5 h-4.5 text-blue-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                  Схема номіналів та приховування майна
                </h4>
              </div>
              <span className="px-2 py-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded text-xs font-mono text-slate-500">
                2D Interactive Map
              </span>
            </div>

            {/* Interactive SVG Network mapping exact nominee relationships */}
            <div className="relative w-full h-[360px] bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              
              <svg className="w-full h-full" viewBox="0 0 500 360">
                {/* Connective lines with risk markers */}
                <g stroke="#334155" strokeWidth="1.5">
                  {/* Kovalenko (250, 180) to Olga Wife (110, 90) */}
                  <line x1="250" y1="180" x2="110" y2="90" stroke="#f59e0b" strokeDasharray="4 4" className="animate-pulse" />
                  {/* Kovalenko to Sergiy Father-in-law (110, 270) */}
                  <line x1="250" y1="180" x2="110" y2="270" stroke="#3b82f6" strokeDasharray="4 4" />
                  {/* Kovalenko to Driver Dmytro (390, 90) */}
                  <line x1="250" y1="180" x2="390" y2="90" stroke="#f43f5e" strokeDasharray="4 4" className="animate-pulse" />
                  {/* Kovalenko to Brother Oleksandr (390, 270) */}
                  <line x1="250" y1="180" x2="390" y2="270" stroke="#3b82f6" strokeDasharray="4 4" />
                </g>

                {/* Connective line asset text labels */}
                <g fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  <rect x="135" y="115" width="90" height="12" rx="4" fill="#0f172a" stroke="#f59e0b" strokeOpacity="0.4" />
                  <text x="180" y="123" fill="#fbbf24">Вілла Марбелья $3.4M (100%)</text>

                  <rect x="135" y="225" width="90" height="12" rx="4" fill="#0f172a" stroke="#3b82f6" strokeOpacity="0.4" />
                  <text x="180" y="233" fill="#60a5fa">ЖК PecherSky $1.2M (98%)</text>

                  <rect x="275" y="115" width="90" height="12" rx="4" fill="#0f172a" stroke="#f43f5e" strokeOpacity="0.4" />
                  <text x="320" y="123" fill="#f87171">Range Rover $180K (100%)</text>

                  <rect x="275" y="225" width="90" height="12" rx="4" fill="#0f172a" stroke="#3b82f6" strokeOpacity="0.4" />
                  <text x="320" y="233" fill="#60a5fa">Porsche Cay $140K (72%)</text>
                </g>

                {/* Nodes group */}
                {/* Central main Node (Ihor Kovalenko) */}
                <g className="cursor-pointer" onClick={() => setSelectedPersonId('kovalenko-ihor')}>
                  <circle cx="250" cy="180" r="26" fill="#020617" stroke="#3b82f6" strokeWidth="2.5" className={selectedPersonId === 'kovalenko-ihor' ? 'stroke-blue-400' : 'opacity-80'} />
                  <text x="250" y="183" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace">ПЕП</text>
                  <text x="250" y="220" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">І. В. Коваленко</text>
                </g>

                {/* Wife Olga Node */}
                <g className="cursor-pointer" onClick={() => setSelectedPersonId('petrenko-olha')}>
                  <circle cx="110" cy="90" r="18" fill="#020617" stroke="#f59e0b" strokeWidth="2" className={selectedPersonId === 'petrenko-olha' ? 'stroke-amber-400' : 'opacity-80'} />
                  <text x="110" y="93" textAnchor="middle" fill="#fbbf24" fontSize="7" fontWeight="bold" fontFamily="monospace">ДРУЖИНА</text>
                  <text x="110" y="120" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">О. С. Петренко</text>
                </g>

                {/* Father-in-law Sergiy Node */}
                <g className="cursor-pointer" onClick={() => setSelectedPersonId('petrenko-serhiy')}>
                  <circle cx="110" cy="270" r="18" fill="#020617" stroke="#3b82f6" strokeWidth="2" className={selectedPersonId === 'petrenko-serhiy' ? 'stroke-blue-400' : 'opacity-80'} />
                  <text x="110" y="273" textAnchor="middle" fill="#60a5fa" fontSize="7" fontWeight="bold" fontFamily="monospace">ТЕСТ</text>
                  <text x="110" y="300" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">С. Л. Петренко</text>
                </g>

                {/* Driver Dmytro Node */}
                <g className="cursor-pointer" onClick={() => setSelectedPersonId('kharchenko-dmytro')}>
                  <circle cx="390" cy="90" r="18" fill="#020617" stroke="#f43f5e" strokeWidth="2" className={selectedPersonId === 'kharchenko-dmytro' ? 'stroke-rose-400' : 'opacity-80'} />
                  <text x="390" y="93" textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="bold" fontFamily="monospace">ПРОКСІ</text>
                  <text x="390" y="120" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">Д. П. Харченко</text>
                </g>

                {/* Brother Oleksandr Node */}
                <g className="cursor-pointer" onClick={() => setSelectedPersonId('kovalenko-oleksandr')}>
                  <circle cx="390" cy="270" r="18" fill="#020617" stroke="#3b82f6" strokeWidth="2" className={selectedPersonId === 'kovalenko-oleksandr' ? 'stroke-blue-400' : 'opacity-80'} />
                  <text x="390" y="273" textAnchor="middle" fill="#60a5fa" fontSize="7" fontWeight="bold" fontFamily="monospace">БРАТ</text>
                  <text x="390" y="300" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">О. В. Коваленко</text>
                </g>
              </svg>

              {/* Interconnectivity note overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800/60 px-2 py-1 rounded text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Виявлено 4 номінальних проксі-утримувачів</span>
              </div>
            </div>
          </div>

          {/* Source of wealth charts (official vs shadow) */}
          <div className="bg-black/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-2 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-rose-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                  Порівняння легального та оціненого доходу (10 років)
                </h4>
              </div>
            </div>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wealthChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '10px' }}
                    itemStyle={{ color: '#ffffff' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  />
                  <Bar dataKey="сума" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {wealthChartData.map((entry, index) => {
                      const color = index === 0 ? '#10b981' : index === 1 ? '#f43f5e' : '#f59e0b';
                      return <cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <p className="text-xs text-slate-500 font-mono text-center leading-relaxed">
              * Співвідношення офіційного доходу (зелений) до незадекларованих тіньових потоків (червоний) та накопичень у закордонних банках (жовтий).
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
