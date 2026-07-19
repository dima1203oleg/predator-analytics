/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OsintEntity {
  id: string;
  type: 'company' | 'person' | 'cryptowallet' | 'auto';
  name: string;
  code: string; // EDRPOU, IPN, Passport, or Wallet Address
  status: 'ACTIVE' | 'LIQUIDATED' | 'SANCTIONED' | 'SUSPICIOUS';
  riskScore: number; // 0-100
  address: string;
  phone?: string;
  email?: string;
  founders?: { name: string; share: string; role: string; riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  taxes?: { year: string; paid: string; debt: string; status: string };
  customs?: { importVolume: string; exportVolume: string; mainPartners: string[]; lastCargo: string };
  courts?: { totalCases: number; criminalCases: number; lastCaseTitle: string; lastCaseDate: string };
  sanctions?: { listName: string; dateAdded: string; reason: string; authority: string };
  description: string;
  relationships: { targetId: string; targetName: string; type: string; risk: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  aiRecommendations: string;
  lastActivityDate?: string; // YYYY-MM-DD
  // Розширений профіль фізичної особи (Person)
  familyTies?: { name: string; relation: string; status: string; risk: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  assets?: { type: string; description: string; estimatedValue: string; ownership: string }[];
  psychologicalPortrait?: { characteristics: string[]; vulnerabilities: string[]; summary: string };
  medicalProfile?: { coprogram: string; wormEggsCount: number; lastCheckup: string; summary: string };
  // Deep OSINT fields
  cyber?: { ip: string; openPorts: number[]; vulnerabilities: string[]; darknetMentions: number; hasOnionLinks: boolean };
  interpol?: { isWanted: boolean; noticeType?: 'RED' | 'YELLOW'; charge?: string; country?: string };
  leaks?: { totalBreaches: number; exposedData: string[]; sources: string[]; compromisedPasswords: boolean };
  compromat?: Array<{
    date: string;
    source: string;
    summary: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    details: string;
  }>;
}

export const OSINT_ENTITIES: OsintEntity[] = [
  {
    id: 'comp-1',
    type: 'company',
    name: "ТОВ 'СпецТехПостач'",
    code: '38294012',
    status: 'SANCTIONED',
    riskScore: 94,
    address: "м. Київ, вул. Михайла Грушевського, буд. 15, офіс 412",
    phone: "+380 (44) 255-12-34",
    email: "info@spectechpostach.ua",
    founders: [
      { name: "Коваленко Ігор Вікторович", share: "51%", role: "Засновник / Директор", riskLevel: 'HIGH' },
      { name: "Vanguard Holdings Ltd (Belize)", share: "49%", role: "Офшорний акціонер", riskLevel: 'HIGH' }
    ],
    taxes: {
      year: "2025",
      paid: "1,240,000 UAH",
      debt: "340,000 UAH",
      status: "Податковий борг / Перевірка"
    },
    customs: {
      importVolume: "$4.2M (Обладнання подвійного призначення)",
      exportVolume: "$120K (Комплектуючі)",
      mainPartners: ["SinoTech Trading (HK)", "Neva Electron Ltd (RU via TR)"],
      lastCargo: "Електронні інтегральні схеми, датчики тиску"
    },
    courts: {
      totalCases: 14,
      criminalCases: 5,
      lastCaseTitle: "Кримінальне провадження № 4202400000000123 по статті 110-2 ККУ (Фінансування дій з метою зміни меж території)",
      lastCaseDate: "2026-04-12"
    },
    sanctions: {
      listName: "РНБО України (Указ №214/2026)",
      dateAdded: "2026-05-10",
      reason: "Постачання електронних компонентів подвійного призначення підприємствам ВПК РФ через турецькі компанії-посередники.",
      authority: "Служба безпеки України"
    },
    description: "Українське торговельне підприємство, що спеціалізується на імпорті мікроелектроніки та промислового обладнання. Було внесено до санкційних списків РНБО за результатами розслідування СБУ щодо поставок підсанкційних компонентів через Туреччину.",
    relationships: [
      { targetId: 'person-1', targetName: 'Коваленко Ігор Вікторович', type: 'DIRECTOR_OF', risk: 'HIGH' },
      { targetId: 'comp-2', targetName: 'ТОВ "Арсенал Сек\'юріті"', type: 'SUBSIDIARY_OF', risk: 'MEDIUM' },
      { targetId: 'wallet-1', targetName: 'BTC Wallet (0x38ac...d831)', type: 'TRANSFERS_TO', risk: 'HIGH' }
    ],
    aiRecommendations: "Рекомендується негайне заморожування всіх активів та рахунків. Заборонити проведення будь-яких експортно-імпортних операцій. Передати зібраний граф зв'язків до Департаменту контррозвідувального захисту інтересів держави у сфері інформаційної безпеки (ДКІБ) СБУ.",
    lastActivityDate: "2026-05-10"
  },
  {
    id: 'person-1',
    type: 'person',
    name: "Коваленко Ігор Вікторович",
    code: '2938401923',
    status: 'SUSPICIOUS',
    riskScore: 82,
    address: "Київська обл., Обухівський р-н, смт Козин, вул. Старокиївська, буд. 72",
    phone: "+380 (50) 443-21-99",
    email: "kovalenko.i@spectech.ua",
    founders: [],
    taxes: {
      year: "2025",
      paid: "450,000 UAH",
      debt: "0 UAH",
      status: "Розраховано повністю"
    },
    courts: {
      totalCases: 3,
      criminalCases: 2,
      lastCaseTitle: "Підозра у державній зраді та сприянні діяльності терористичної організації",
      lastCaseDate: "2026-05-15"
    },
    cyber: {
      ip: "194.177.1.55",
      openPorts: [22, 80, 443, 3389],
      vulnerabilities: ["CVE-2021-34527", "CVE-2023-23397"],
      darknetMentions: 12,
      hasOnionLinks: true
    },
    interpol: {
      isWanted: false
    },
    leaks: {
      totalBreaches: 4,
      exposedData: ["Email", "Password", "IP Address", "Phone"],
      sources: ["LinkedIn (2012)", "Canva (2019)", "BreachCompilation"],
      compromisedPasswords: true
    },
    description: "Громадянин України, бізнесмен, бенефіціарний власник компаній у сфері торгівлі та логістики. Фігурує у розслідуваннях щодо фінансування сепаратизму та обходу міжнародних санкцій через офшорні юрисдикції.",
    relationships: [
      { targetId: 'comp-1', targetName: 'ТОВ "СпецТехПостач"', type: 'BENEFICIARY_OF', risk: 'HIGH' },
      { targetId: 'person-2', targetName: 'Петренко Ольга Сергіївна (Дружина)', type: 'FAMILY_RELATION', risk: 'LOW' },
      { targetId: 'wallet-1', targetName: 'BTC Wallet (0x38ac...d831)', type: 'OWNER_OF', risk: 'HIGH' }
    ],
    aiRecommendations: "Провести повний фінансовий моніторинг рахунків дружини (Петренко О. С.) на предмет легалізації активів, отриманих злочинним шляхом. Встановити прикордонний моніторинг пересування особи.",
    lastActivityDate: "2026-05-15"
  },
  {
    id: 'comp-2',
    type: 'company',
    name: "ТОВ 'Арсенал Сек'юріті'",
    code: '41092834',
    status: 'ACTIVE',
    riskScore: 45,
    address: "м. Львів, вул. Героїв УПА, буд. 73, корп. 2",
    phone: "+380 (32) 235-90-80",
    email: "office@arsenalsec.lviv.ua",
    founders: [
      { name: "Коваленко Ігор Вікторович", share: "20%", role: "Міноритарний акціонер", riskLevel: 'HIGH' },
      { name: "Лисенко Петро Андрійович", share: "80%", role: "Мажоритарний власник / Керівник", riskLevel: 'LOW' }
    ],
    taxes: {
      year: "2025",
      paid: "3,890,000 UAH",
      debt: "0 UAH",
      status: "Платник ПДВ без заборгованості"
    },
    customs: {
      importVolume: "$450K (Засоби захисту, бронежилети)",
      exportVolume: "0 UAH",
      mainPartners: ["EuroArmor GmbH (DE)", "Security Solutions Corp (PL)"],
      lastCargo: "Кевларові каски, захисні пластини класу 4"
    },
    courts: {
      totalCases: 2,
      criminalCases: 0,
      lastCaseTitle: "Господарський спір про стягнення орендної плати за приміщення",
      lastCaseDate: "2025-11-04"
    },
    description: "Львівська компанія у сфері охоронних послуг та постачання ліцензованих засобів індивідуального захисту. Охоронна діяльність здійснюється на підставі ліцензії МВС України № 10294 від 2021 року.",
    relationships: [
      { targetId: 'person-1', targetName: 'Коваленко Ігор Вікторович', type: 'SHAREHOLDER_IN', risk: 'HIGH' },
      { targetId: 'comp-1', targetName: 'ТОВ "СпецТехПостач"', type: 'CONTRACTOR_OF', risk: 'MEDIUM' }
    ],
    aiRecommendations: "Через міноритарну частку підсанкційної особи Коваленка І.В. (20%), компанія ТОВ 'Арсенал Сек'юріті' підпадає под підвищений комплаєнс-моніторинг. Проте, пряме блокування за правилом '50%' США/ЄС не застосовується. Рекомендується перегляд контрактів для уникнення ризиків.",
    lastActivityDate: "2025-11-04"
  },
  {
    id: 'wallet-1',
    type: 'cryptowallet',
    name: "BTC Wallet (0x38ac...d831)",
    code: 'bc1qxy2kg3ut7wvufgz7h0df30097h42831d831',
    status: 'SUSPICIOUS',
    riskScore: 89,
    address: "Blockhain Ledger Network (Bitcoin Core)",
    description: "Криптовалютний гаманець, зафіксований у транзакціях із транзитними крипто-міксерами (Tornado Cash аналогами) та пов'язаний із виведенням коштів з рахунків ТОВ 'СпецТехПостач' без сплати податків.",
    relationships: [
      { targetId: 'person-1', targetName: 'Коваленко Ігор Вікторович', type: 'CONTROLLED_BY', risk: 'HIGH' },
      { targetId: 'comp-1', targetName: 'ТОВ "СпецТехПостач"', type: 'RECEIVED_FUNDS_FROM', risk: 'HIGH' }
    ],
    aiRecommendations: "Внести адресу гаманця до чорних списків AML-фільтрів корпоративних криптобірж України та ЄС. Запустити моніторинг вихідних транзакцій за допомогою Chainalysis / Crystal Blockchain.",
    lastActivityDate: "2026-06-20"
  }
];
