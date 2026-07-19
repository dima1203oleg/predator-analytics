/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, Terminal, FileText, Send, Sparkles, MessageSquare, Bot, AlertTriangle, ShieldCheck, Database, Zap, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SkeManifesto from './SkeManifesto';

interface PredefinedQA {
  question: string;
  category: string;
  answer: string;
  codeSnippet?: string;
}

const FAQ_ITEMS: PredefinedQA[] = [
  {
    question: "Як правильно інтегрувати Neo4j та BBOT без ризику зараження GPL-3.0 ліцензією?",
    category: "Ліцензії",
    answer: "Пряма лінковка або імпорт бібліотек під ліцензією GPL-3.0 у комерційний пропрієтарний софт створює ефект 'зараження' (копілефт). Щоб повністю нейтралізувати цей ризик, використовуйте шаблон Microservice Isolation (Ізоляція мікросервісу). Запустіть BBOT або Neo4j в окремому Docker-контейнері під управлінням Kubernetes. Зв’язуйтеся з ними виключно через мережеві протоколи — HTTP REST API, gRPC або Bolt protocol у випадку Neo4j. Мережева взаємодія між незалежними процесами НЕ вважається лінкуванням коду за трактуванням Free Software Foundation (FSF), що гарантує юридичну безпеку закритих джерел платформи PREDATOR.",
    codeSnippet: `# Приклад безпечної архітектурної ізоляції у FastAPI Core
import httpx

class BBOTWorkerClient:
    def __init__(self, endpoint_url: str):
        self.endpoint_url = endpoint_url

    async def trigger_scan(self, target_domain: str) -> dict:
        # Безпечний мережевий виклик без лінкування бібліотеки!
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.endpoint_url}/api/v1/scan",
                json={"target": target_domain},
                headers={"Authorization": "Bearer SECURE_TOKEN"}
            )
            return response.json()
`
  },
  {
    question: "Який стек та алгоритми вибрати для злиття дублікатів (Entity Resolution Engine)?",
    category: "Алгоритми",
    answer: "Для Entity Resolution (дедуплікації та деанонімізації) в українському OSINT-контексті немає готових open-source рішень через специфіку транслітерації, відмінків та форматів записів. Рекомендований стек:\n1. Текстове зближення: Використання алгоритмів відносної схожості рядків (відстань Левенштейна, Джаро-Вінклера) для імен та прізвищ на українській мові.\n2. Семантичне зближення: Генерація embeddings за допомогою ШІ (наприклад, Cohere чи локальної Sentence-Transformers моделі) та збереження у Qdrant для семантичного порівняння описів компаній чи кримінальних справ.\n3. Графовий зв’язок: Побудова транзитивних зв'язків у Neo4j (якщо Іванов І.І. має спільну адресу та телефон з Івановим І.І. у базі санкцій, вага злиття зростає).",
    codeSnippet: `# Приклад концепту об'єднання двох персон у Python за вагами
def calculate_match_score(entity_a, entity_b):
    # Порівняння імені
    name_similarity = jaro_winkler_similarity(entity_a['name'], entity_b['name'])
    
    # Спільний телефон чи ІПН дає миттєве злиття (вага = 1.0)
    if entity_a.get('inn') and entity_a['inn'] == entity_b.get('inn'):
        return 1.0
        
    # Спільна адреса чи пов'язані особи додають ваги
    address_match = 0.3 if entity_a.get('address') == entity_b.get('address') else 0.0
    
    total_score = (name_similarity * 0.5) + address_match
    return total_score # Якщо score > 0.85 -> виконуємо злиття сутностей
`
  },
  {
    question: "Як побудувати стійку до блокувань систему збору даних з державних реєстрів?",
    category: "Збір даних",
    answer: "Державні реєстри України (ЄДР, судові рішення, Prozorro) часто обмежують ліміти запитів, використовують Cloudflare та блокують закордонні пули IP. Для надійності впровадьте:\n1. Ротацію українських residential проксі-серверів для розподілу навантаження.\n2. Кешування: Побудуйте локальну проміжну копію реєстрів у PostgreSQL/MinIO, оновлюючи її раз на добу або за допомогою офіційних зліпків з Data.gov.ua, замість живих (on-the-fly) запитів.\n3. Асинхронність: Черги повідомлень у Kafka. Якщо один з держреєстрів 'ліг' або заблокував воркер, завдання залишається в черзі та буде виконано повторно після відновлення проксі.",
    codeSnippet: `# Схема стійкого воркера в FastAPI / Celery
@app.task(bind=True, max_retries=5, default_retry_delay=60)
def fetch_registry_data_task(self, company_code: str):
    try:
        proxy = get_next_residential_ukrainian_proxy()
        data = call_government_api(company_code, proxy=proxy)
        save_to_postgres_and_cache(company_code, data)
    except httpx.HTTPStatusError as exc:
        # У разі блокування чи 429 - відправляємо в чергу на повтор з іншим проксі!
        raise self.retry(exc=exc)
`
  },
  {
    question: "Чому Elasticsearch замінено на OpenSearch в архітектурі PREDATOR?",
    category: "Інфраструктура",
    answer: "Elasticsearch змінив ліцензію з вільної Apache 2.0 на обмежувальні SSPL (Server Side Public License) та Elastic License. Це створює серйозний ризик при комерціалізації PREDATOR як хмарної SaaS-платформи, оскільки SSPL забороняє надавати Elasticsearch як сервіс або використовувати його у закритих комерційних ланцюжках SaaS без придбання дорогої комерційної ліцензії.\nOpenSearch є чистим, повністю відкритим форком Elasticsearch під ліцензією Apache 2.0, яка підтримується AWS та Linux Foundation. Це дає PREDATOR 100% юридичну свободу, сумісність з існуючим кодом Elasticsearch та K8s-native зрілість без жодних фінансових чи ліцензійних зобов’язань перед Elastic Co.",
    codeSnippet: `# docker-compose конфіг для OpenSearch замість Elasticsearch
services:
  opensearch-node:
    image: opensearchproject/opensearch:2.12.0
    container_name: predator-search-node
    environment:
      - cluster.name=predator-cluster
      - node.name=opensearch-node
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - 9200:9200
`
  },
  {
    question: "Які вимоги до розміщення ШІ та моделей vLLM в On-premise (Air-gapped) контурі?",
    category: "Штучний інтелект",
    answer: "Для розгортання PREDATOR в ізольованому військовому чи державному контурі (Air-gapped mode, Phase 5) без доступу до Інтернету:\n1. Локальні ваги моделей: Моделі (Llama 3, Mistral) повинні бути завантажені заздалегідь у форматі ваг HuggingFace (safetensors) та збережені у локальному реєстрі MinIO S3.\n2. Локальний сервер vLLM: vLLM розгортається на локальних серверах з GPU (напр., RTX A6000 або A100) та забезпечує OpenAI-сумісний API всередині Kubernetes кластера.\n3. Офлайн Ембедінги: Модель генерації векторів (наприклад, text-embedding-ada-002 еквіваленти на кшталт BGE-M3) повинна виконуватися на локальному воркері, а вектори зберігатися в локальний Qdrant.",
    codeSnippet: `# Запуск локального vLLM контейнера в закритому контурі
# vLLM підвантажує ваги з локального змонтонаного диска
docker run --gpus all \\
  -v /mnt/local_storage/llama3-weights:/models \\
  -p 8000:8000 \\
  vllm/vllm-openai:latest \\
  --model /models/Llama-3-8B-Instruct \\
  --tensor-parallel-size 1 \\
  --max-model-len 4096
`
  }
];

export default function AdvisorTab() {
  const [activeTab, setActiveTab] = useState<'ske' | 'architecture'>('ske');
  const [selectedQA, setSelectedQA] = useState<PredefinedQA | null>(FAQ_ITEMS[0]);
  const [chatInput, setChatInput] = useState('');
  
  // Simulated interactive chat logs
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string; code?: string }>>([
    {
      sender: 'bot',
      text: "Вітаю! Я — ШІ-консультант платформи PREDATOR Analytics. Я володію вичерпними знаннями про ліцензування, сумісність open-source технологій, розробку конекторів та інфраструктурні аспекти впровадження платформи. Оберіть одне з технічних питань ліворуч, або запитайте мене безпосередньо!"
    }
  ]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: userText, 
          history: chatHistory.map(h => ({ role: h.sender === "user" ? "user" : "model", text: h.text })),
          fast: true
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setChatHistory(prev => [...prev, { sender: "bot", text: data.text }]);
    } catch (error: any) {
      setChatHistory(prev => [...prev, { sender: "bot", text: "Помилка зв'язку з ШІ: " + error.message }]);
    }
  };

  const handleSelectPredefined = (item: PredefinedQA) => {
    setSelectedQA(item);
    setChatHistory(prev => [
      ...prev,
      { sender: 'user', text: item.question },
      { sender: 'bot', text: item.answer, code: item.codeSnippet }
    ]);
  };

  return (
    <div className="space-y-6" id="advisor-tab-root">
      
      {/* Sub navigation buttons */}
      <div className="flex border-b border-indigo-500/10 pb-1 gap-1" id="advisor-subnav">
        <button
          type="button"
          onClick={() => setActiveTab('ske')}
          className={`px-4 py-2 text-xs font-mono font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'ske' 
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          } rounded-t-xl`}
        >
          ✦ THE GENESIS CANVAS (SKE PHILOSOPHY)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 text-xs font-mono font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'architecture' 
              ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          } rounded-t-xl`}
        >
          ⚙️ ТЕХНІЧНИЙ ШІ-АРХІТЕКТОР (FAQ)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ske' ? (
          <motion.div
            key="ske-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <SkeManifesto />
          </motion.div>
        ) : (
          <motion.div
            key="architecture-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Intro Header */}
            <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl p-6 backdrop-blur-md">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-indigo-400" id="advisor-title-icon" />
                Інтерактивний ШІ-Архітектор PREDATOR
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Отримайте детальні технічні відповіді на найскладніші виклики архітектури та інтеграції open-source систем від нашого вбудованого експертного консультанта. Оберіть питання зі списку або задайте власне у чаті.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Common Dilemmas / FAQ selection */}
              <div className="lg:col-span-1 space-y-4" id="faq-dilemmas-list">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1">
                  Ключові архітектурні дилеми
                </h3>

                <div className="space-y-2.5">
                  {FAQ_ITEMS.map((item, idx) => {
                    const isSelected = selectedQA?.question === item.question;
                    return (
                      <button
                        key={idx}
                        id={`faq-item-btn-${idx}`}
                        type="button"
                        onClick={() => handleSelectPredefined(item)}
                        className={`w-full text-left p-4 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-3 ${isSelected ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.04)] text-white' : 'bg-slate-900/40 border-slate-850 hover:border-indigo-500/10 text-slate-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          <HelpCircle className="w-4 h-4 text-slate-500" />
                        </div>
                        
                        <span className="font-semibold leading-normal">
                          {item.question}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Conversational Advisor Console */}
              <div className="lg:col-span-2 flex flex-col justify-center items-center bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 rounded-2xl p-10 text-center h-[620px]">
                <Bot className="w-16 h-16 text-indigo-400/50 mb-4" />
                <h3 className="text-lg font-bold text-slate-200 mb-2">Глобальний ШІ-Асистент MARIARTI</h3>
                <p className="text-sm text-slate-300 max-w-md">
                  Чат-бот архітектора інтегровано в єдиний глобальний комунікаційний модуль PREDATOR (внизу праворуч). 
                  Використовуйте плаваючий віджет для текстового та голосового спілкування з MARIARTI з будь-какого екрану.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
