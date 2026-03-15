/**
 * PREDATOR Analytics - Mock API Server v2
 * ========================================
 * ПРИНЦИП: Дані проходять повний пайплайн і зберігаються в пам'яті.
 * AI-запити ЗАЧІПАЮТЬ реальні дані з "бази".
 * 
 * Архітектура розподілу:
 *   Excel → Parser → Normalization → Routing Engine →
 *     PostgreSQL (факти) | GraphDB (зв'язки) | OpenSearch (пошук) | Qdrant (вектори) | MinIO (оригінал) | Redis (стан)
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 9080;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Multer for audio uploads
const upload = multer({ dest: 'uploads/' });

// Google Cloud Clients - Using the correct TTS key from Predator_50 or GOOGLE_CLOUD_API_KEY
const GOOGLE_KEY_PATH = './Predator_50/secrets/google-tts-key.json';
const googleOptions = process.env.GOOGLE_CLOUD_API_KEY
  ? { apiKey: process.env.GOOGLE_CLOUD_API_KEY }
  : { keyFilename: GOOGLE_KEY_PATH };

const speechClient = new speech.SpeechClient(googleOptions);
const ttsClient = new textToSpeech.TextToSpeechClient(googleOptions);

// Remote Ollama Configuration (NVIDIA Server)
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Gemini Keys for Stealth Routing
const GEMINI_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
  process.env.GEMINI_KEY_6,
  process.env.GEMINI_KEY_7,
  process.env.GOOGLE_CLOUD_API_KEY
].filter(Boolean);

let currentKeyIndex = 0;
function getNextGeminiKey() {
  const key = GEMINI_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
  return key;
}

// =============================================
// 📦 IN-MEMORY DATABASE (імітація розподіленого сховища)
// =============================================

// PostgreSQL (факти)
const DB_FACTS = [];

// Graph DB (зв'язки)
const DB_GRAPH = { nodes: [], edges: [] };

// OpenSearch (повнотекстовий пошук)
const DB_SEARCH_INDEX = [];

// Qdrant (вектори/семантика)
const DB_VECTORS = [];

// MinIO (оригінали)
const DB_FILES = [];

// Redis (стан пайплайнів)
const DB_PIPELINE_STATE = {};

// Telegram PostgreSQL (Факти)
const DB_TELEGRAM_EVENTS = [];
const DB_TELEGRAM_ENTITIES = [];


// ETL Jobs
let etlJobs = [];

// Pipeline Events Log
const PIPELINE_EVENTS = [];

// =============================================
// 🔧 РЕАЛІСТИЧНІ ДАНІ МИТНИХ ДЕКЛАРАЦІЙ
// =============================================

const COMPANIES = [
  { name: 'ТОВ "ТехноІмпорт"', edrpou: '12345678', risk: 'high' },
  { name: 'ПрАТ "ГлобалТрейд"', edrpou: '23456789', risk: 'low' },
  { name: 'ТОВ "Альфа-Комерс"', edrpou: '34567890', risk: 'high' },
  { name: 'ФОП Петренко І.В.', edrpou: '45678901', risk: 'medium' },
  { name: 'ТОВ "ЄвроЛогістик"', edrpou: '56789012', risk: 'low' },
  { name: 'ПрАТ "СхідТранс"', edrpou: '67890123', risk: 'medium' },
  { name: 'ТОВ "МегаОпт"', edrpou: '78901234', risk: 'low' },
  { name: 'ТОВ "БетаЕкспрес"', edrpou: '89012345', risk: 'high' },
];

const HS_CODES = [
  { code: '8471300000', desc: 'Портативні комп\'ютери масою не більше 10 кг', category: 'Електроніка' },
  { code: '8517120000', desc: 'Телефони мобільні', category: 'Електроніка' },
  { code: '8528720000', desc: 'Телевізори кольорові', category: 'Електроніка' },
  { code: '7208510000', desc: 'Прокат плоский з нелегованої сталі', category: 'Метал' },
  { code: '3004900000', desc: 'Лікарські засоби', category: 'Фармацевтика' },
  { code: '6110200000', desc: 'Светри трикотажні', category: 'Текстиль' },
  { code: '0805100000', desc: 'Апельсини свіжі', category: 'Продовольство' },
  { code: '2710192100', desc: 'Бензин моторний', category: 'Паливо' },
];

const COUNTRIES = ['КИТАЙ', 'ТУРЕЧЧИНА', 'НІМЕЧЧИНА', 'ПОЛЬЩА', 'ІНДІЯ', 'ІТАЛІЯ', 'США', 'ЯПОНІЯ'];
const CUSTOMS_OFFICES = ['Київська митниця', 'Одеська митниця', 'Львівська митниця', 'Харківська митниця'];

function generateDeclarations(count, sourceFile) {
  const declarations = [];
  for (let i = 0; i < count; i++) {
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    const hsCode = HS_CODES[Math.floor(Math.random() * HS_CODES.length)];
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const office = CUSTOMS_OFFICES[Math.floor(Math.random() * CUSTOMS_OFFICES.length)];
    const weight = Math.floor(Math.random() * 50000) + 100;
    const value = Math.floor(Math.random() * 500000) + 1000;
    const day = Math.floor(Math.random() * 28) + 1;

    declarations.push({
      id: `UA${String(400000 + i).padStart(6, '0')}/${day.toString().padStart(2, '0')}`,
      declaration_number: `UA${400000 + i}`,
      date: `2024-03-${day.toString().padStart(2, '0')}`,
      company_name: company.name,
      company_edrpou: company.edrpou,
      company_risk: company.risk,
      hs_code: hsCode.code,
      goods_description: hsCode.desc,
      goods_category: hsCode.category,
      country_origin: country,
      customs_office: office,
      weight_kg: weight,
      customs_value_usd: value,
      currency: 'USD',
      operation_type: Math.random() > 0.3 ? 'Імпорт' : 'Експорт',
      status: ['Оформлена', 'Оформлена', 'На перевірці', 'Відмовлено'][Math.floor(Math.random() * 4)],
      risk_score: company.risk === 'high' ? 70 + Math.floor(Math.random() * 30) :
        company.risk === 'medium' ? 40 + Math.floor(Math.random() * 30) :
          Math.floor(Math.random() * 40),
      source_file: sourceFile,
      ingested_at: new Date().toISOString(),
    });
  }
  return declarations;
}

// =============================================
// 🚀 PIPELINE ENGINE - Повний 6-фазний пайплайн
// =============================================

function emitEvent(jobId, event, details) {
  const entry = {
    job_id: jobId,
    event,
    details,
    timestamp: new Date().toISOString()
  };
  PIPELINE_EVENTS.push(entry);
  console.log(`[PIPELINE] ${event}: ${details}`);
}

function runPipeline(jobId, sourceFile) {
  const TOTAL_RECORDS = 1247;
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  // ========= PHASE 1: UPLOAD → MinIO (The Core Bucket) =========
  emitEvent(jobId, 'UPLOAD_STARTED', `Завантаження ${sourceFile} в MinIO (raw-buffer)...`);
  job.state = 'UPLOAD';
  job.progress = { ...job.progress, stage: 'UPLOAD', details: 'Збереження оригіналу в MinIO [Object Storage]', percent: 5 };

  setTimeout(() => {
    DB_FILES.push({ id: jobId, filename: sourceFile, size_bytes: 2457600, uploaded_at: new Date().toISOString() });
    emitEvent(jobId, 'FILE_STORED_MINIO', `Файл збережено у MinIO: bucket=customs-raw`);
    job.progress = { ...job.progress, stage: 'PARSE', percent: 15, details: 'Оригінал зафіксовано. Активація роутера...' };

    // ========= PHASE 2: PARSE (Structure Extraction) =========
    emitEvent(jobId, 'PARSING_STARTED', `Розщеплення структури Excel: виявлення колонок...`);
    job.state = 'PARSE';
    job.progress = { ...job.progress, stage: 'PARSE', percent: 25, details: 'Вилучення метаданих та рядків...' };

    setTimeout(() => {
      const declarations = generateDeclarations(TOTAL_RECORDS, sourceFile);
      job.progress = { ...job.progress, percent: 35, records_total: TOTAL_RECORDS, details: `Розпарсено ${TOTAL_RECORDS} рядків. Перехід до валідації...` };
      emitEvent(jobId, 'PARSING_COMPLETE', `Структуру розщеплено: ${TOTAL_RECORDS} записів знайдено`);

      // ========= PHASE 3: VALIDATION (DQ Core) =========
      emitEvent(jobId, 'VALIDATION_STARTED', 'Запуск DQ Core: перевірка цілісності даних...');
      job.state = 'VALIDATE';
      job.progress = { ...job.progress, stage: 'VALIDATE', percent: 45, details: 'DQ Check: валідація HS-кодів та ЄДРПОУ...' };

      setTimeout(() => {
        const rejected = 4;
        const valid = declarations.filter((_, i) => i >= rejected);
        emitEvent(jobId, 'VALIDATION_COMPLETE', `Валідація ОК: ${valid.length} пройшло, ${rejected} відхилено`);
        job.progress = { ...job.progress, percent: 52, details: `Дані очищено. Початок маршрутизації...` };

        // ========= PHASE 4: NORMALIZE (Canonical Model) =========
        emitEvent(jobId, 'NORMALIZE_STARTED', 'Нормалізація до Канонічної Моделі...');
        job.state = 'NORMALIZE';
        job.progress = { ...job.progress, stage: 'NORMALIZE', percent: 60, details: 'Мапування на схему Predator Core...' };

        setTimeout(() => {
          emitEvent(jobId, 'NORMALIZE_COMPLETE', 'Дані нормалізовано до єдиного стандарту');

          // ========= PHASE 5: MULTI-DB ROUTING: POSTGRES (Facts) =========
          emitEvent(jobId, 'STORE_POSTGRES_STARTED', 'Маршрутизація фактів у PostgreSQL [Relational]...');
          job.state = 'LOAD_SQL';
          job.progress = { ...job.progress, stage: 'LOAD_SQL', percent: 68, details: 'Запис транзакційних фактів у PostgreSQL...' };

          setTimeout(() => {
            DB_FACTS.push(...valid);
            emitEvent(jobId, 'DECLARATION_STORED_POSTGRES', `${valid.length} фактів зафіксовано в SQL`);
            job.progress = { ...job.progress, percent: 75, records_processed: valid.length, details: 'SQL заповнено ✓. Побудова зв\'язків у GraphDB...' };

            // ========= PHASE 6: GRAPH (Relations) =========
            emitEvent(jobId, 'GRAPH_LINKING_STARTED', 'Побудова реляційного графу: Company ↔ Declaration...');
            job.state = 'BUILD_GRAPH';
            job.progress = { ...job.progress, stage: 'BUILD_GRAPH', percent: 82, details: 'Neural Graph: створення вузлів та ребер...' };

            setTimeout(() => {
              // (Graph build logic remains identical but events are aligned)
              const uniqueCompanies = [...new Set(valid.map(d => d.company_name))];
              uniqueCompanies.forEach((cn, i) => {
                const existing = DB_GRAPH.nodes.find(n => n.label === cn);
                if (!existing) {
                  const comp = COMPANIES.find(c => c.name === cn) || {};
                  DB_GRAPH.nodes.push({ id: `comp-${DB_GRAPH.nodes.length}`, label: cn, type: 'Company', edrpou: comp.edrpou, risk: comp.risk });
                }
              });
              const uniqueCountries = [...new Set(valid.map(d => d.country_origin))];
              uniqueCountries.forEach((country, idx) => {
                const existing = DB_GRAPH.nodes.find(n => n.label === country && n.type === 'Country');
                if (!existing) {
                  DB_GRAPH.nodes.push({ id: `country-${DB_GRAPH.nodes.length}`, label: country, type: 'Country' });
                }
              });
              // Зв'язки
              valid.slice(0, 50).forEach(d => {
                const compNode = DB_GRAPH.nodes.find(n => n.label === d.company_name);
                const countryNode = DB_GRAPH.nodes.find(n => n.label === d.country_origin && n.type === 'Country');
                if (compNode && countryNode) {
                  DB_GRAPH.edges.push({ from: compNode.id, to: countryNode.id, label: 'Торгує з', declaration: d.declaration_number });
                }
              });
              emitEvent(jobId, 'DECLARATION_GRAPH_LINKED', `Граф оновлено: +${uniqueCompanies.length} вузлів зв\'язків`);
              job.progress = { ...job.progress, percent: 88, details: 'Граф ✓. Індексація в OpenSearch...' };

              // ========= PHASE 7: SEARCH (Context) =========
              emitEvent(jobId, 'INDEXING_STARTED', 'Індексація повнотекстового пошуку [OpenSearch]...');
              job.state = 'INDEX_SEARCH';
              job.progress = { ...job.progress, stage: 'INDEX_SEARCH', percent: 92, details: 'Створення інвертованих індексів...' };

              setTimeout(() => {
                valid.forEach(d => {
                  DB_SEARCH_INDEX.push({
                    id: d.id,
                    text: `${d.goods_description} ${d.company_name} ${d.country_origin} ${d.customs_office} ${d.hs_code} ${d.date}`,
                    declaration: d,
                  });
                });
                emitEvent(jobId, 'DECLARATION_INDEXED', `${valid.length} записів додано в пошуковий індекс`);
                job.progress = { ...job.progress, percent: 96, details: 'OpenSearch ✓. Генерація векторів Qdrant...' };

                // ========= PHASE 8: VECTORIZE (Semantic) =========
                emitEvent(jobId, 'VECTORIZATION_STARTED', 'Генерація ембедингів: перетворення в Llama-3-Vector...');
                job.state = 'VECTORIZE';
                job.progress = { ...job.progress, stage: 'VECTORIZE', percent: 98, details: 'Запис у Qdrant [Vector Space]...' };

                setTimeout(() => {
                  valid.forEach(d => DB_VECTORS.push({ id: d.id, text: `${d.goods_description} від ${d.company_name} з ${d.country_origin}`, vector: Array(384).fill(0).map(() => Math.random()) }));
                  emitEvent(jobId, 'DECLARATION_VECTORIZED', `Векторизація завершена: ${valid.length} ембедингів`);

                  // ========= READY =========
                  job.state = 'READY';
                  job.progress = {
                    ...job.progress,
                    stage: 'READY',
                    percent: 100,
                    records_total: TOTAL_RECORDS,
                    records_processed: valid.length,
                    records_indexed: valid.length,
                    details: `✅ АЛХІМІЯ ДАНІВ ЗАВЕРШЕНА. ${valid.length} декларацій розщеплено по 6 базах.`
                  };
                  DB_PIPELINE_STATE[jobId] = 'COMPLETED';
                  emitEvent(jobId, 'PIPELINE_COMPLETED', `Повний 4D-розподіл завершено: [Facts, Relations, Search, Vectors]`);

                  console.log(`\n✅ PIPELINE DONE: ${valid.length} records distributed across 6 databases`);
                  console.log(`   📦 MinIO: 1 file | 🐘 PostgreSQL: ${DB_FACTS.length} facts | 🕸 Graph: ${DB_GRAPH.nodes.length} nodes | 🔍 OpenSearch: ${DB_SEARCH_INDEX.length} docs | 🧠 Qdrant: ${DB_VECTORS.length} vectors\n`);
                }, 1500);
              }, 1200);
            }, 1200);
          }, 1200);
        }, 1200);
      }, 2000);
    }, 1500);
  }, 1000);
}



function runTelegramPipeline(jobId, url) {
  const username = (url || '').split('/').filter(Boolean).slice(-1)[0]?.replace('@', '') || 'unknown';
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = [
    'AUTH',
    'FETCH',
    'RAW_STORAGE',
    'NORMALIZE',
    'NLP_EXTRACTION',
    'ROUTING_SQL',
    'ROUTING_GRAPH',
    'ROUTING_SEARCH',
    'ROUTING_VECTOR',
    'READY'
  ];
  let currentStageIndex = 0;

  // Real execution with simulation fallback
  const runScraper = () => {
    emitEvent(jobId, 'FETCH_STARTED', `Запуск парсера для @${username}...`);

    // Check if scraper exists, otherwise simulate
    const scraperPath = '/Users/dima-mac/Documents/Predator_21/scraper_sandbox.py';
    if (!fs.existsSync(scraperPath)) {
      console.log(`[PIPELINE] Scraper not found. Running simulation for @${username}`);
      emitEvent(jobId, 'FETCH_SIMULATION', `Симуляція отримання даних з @${username}...`);

      // Generate realistic mock Telegram data
      const mockMessages = [
        { message_id: 1001, date: new Date().toISOString(), text: `⚠️ На Одеській митниці затримано контрабандну партію тютюнових виробів на суму 2.5 млн грн. ДБР порушило справу.` },
        { message_id: 1002, date: new Date().toISOString(), text: `Львівська митниця: перевірка вантажу з Польщі виявила невідповідність декларацій. Заявлена вартість — $5000, реальна — $45000.` },
        { message_id: 1003, date: new Date().toISOString(), text: `СБУ спільно з Держмитслужбою викрили схему ухилення від сплати мита на імпорт електроніки через фіктивні компанії.` },
        { message_id: 1004, date: new Date().toISOString(), text: `Волинська митниця: Зафіксовано спробу незаконного ввезення 150 кг меду без сертифікатів якості.` },
        { message_id: 1005, date: new Date().toISOString(), text: `Закарпатська митниця повідомляє про збільшення потоку вантажних автомобілів на 23% за останній тиждень.` },
        { message_id: 1006, date: new Date().toISOString(), text: `Суд виніс вирок у справі про контрабанду цигарок через Одеський порт. Збитки державі — 12 млн грн.` },
        { message_id: 1007, date: new Date().toISOString(), text: `Київська митниця: затримано підозрілий вантаж хімічних речовин. Проводиться експертиза.` },
        { message_id: 1008, date: new Date().toISOString(), text: `Нові правила декларування товарів набувають чинності з 1 квітня. Митні брокери проходять перепідготовку.` }
      ];

      // Save simulated data
      try {
        fs.mkdirSync('/Users/dima-mac/Documents/Predator_21/.antigravity_tmp', { recursive: true });
        fs.writeFileSync('/Users/dima-mac/Documents/Predator_21/.antigravity_tmp/channel_data.json', JSON.stringify(mockMessages, null, 2));
      } catch (e) { console.warn('Could not save simulated data:', e); }

      job.progress.records_total = mockMessages.length;
      console.log(`[PIPELINE] Simulated ${mockMessages.length} messages for @${username}`);
      currentStageIndex++; // Moving to RAW_STORAGE
      processNextStage();
      return;
    }

    exec(`TARGET_CHANNEL=${username} /Users/dima-mac/Documents/Predator_21/.venv/bin/python ${scraperPath}`,
      { cwd: '/Users/dima-mac/Documents/Predator_21' },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`[PIPELINE] Scraper error: ${error.message}`);
          job.state = 'FAILED';
          job.errors.push(error.message);
          emitEvent(jobId, 'PIPELINE_FAILED', error.message);
          return;
        }
        console.log(`[PIPELINE] Scraper finished. Continuing full OMNISCIENCE pipeline.`);
        currentStageIndex++; // Moving to RAW_STORAGE
        processNextStage();
      });
  };

  const processNextStage = () => {
    const stage = stages[currentStageIndex];
    job.state = stage;
    const percent = Math.round(((currentStageIndex + 1) / stages.length) * 100);

    let details = '';
    switch (stage) {
      case 'AUTH': details = 'Авторизація через Telethon API...'; break;
      case 'FETCH': details = `Отримання повідомлень з @${username}...`; break;
      case 'RAW_STORAGE': details = 'Phase 2 (MinIO): Збереження оригіналів у MinIO...'; break;
      case 'NORMALIZE': details = 'Phase 3 (Normalize): Перетворення на Канонічну Модель...'; break;
      case 'NLP_EXTRACTION': details = 'Phase 4 (NLP): Видобуття сутностей (митниці, компанії, ризики)...'; break;
      case 'ROUTING_SQL': details = 'Phase 5 (PostgreSQL): Запис структурованих фактів (telegram_events)...'; break;
      case 'ROUTING_GRAPH': details = 'Phase 5 (GraphDB): Формування графу зв\'язків подій та сутностей...'; break;
      case 'ROUTING_SEARCH': details = 'Phase 5 (OpenSearch): Повнотекстова індексація...'; break;
      case 'ROUTING_VECTOR': details = 'Phase 5 (Qdrant): Семантична Llama-3 векторизація...'; break;
      case 'READY': details = `✅ Моніторинг @${username} активовано. Дані розщеплено по 4 базах.`; break;
    }

    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    let delay = 1000;

    if (stage === 'AUTH') {
      delay = 800;
      setTimeout(() => { currentStageIndex++; processNextStage(); }, delay);
    }
    else if (stage === 'FETCH') {
      runScraper();
    }
    else if (stage === 'RAW_STORAGE') {
      DB_FILES.push({ id: jobId, filename: `telegram_${username}.json`, size_bytes: 157925, uploaded_at: new Date().toISOString() });
      setTimeout(() => { currentStageIndex++; processNextStage(); }, 800);
    }
    else if (stage === 'NORMALIZE') {
      try {
        const rawData = JSON.parse(fs.readFileSync('/Users/dima-mac/Documents/Predator_21/.antigravity_tmp/channel_data.json', 'utf8'));
        const messages = rawData.filter(m => m.text && m.text.length > 10);
        job.tempContext = { messages };
        emitEvent(jobId, 'MESSAGES_NORMALIZED', `Нормалізовано ${messages.length} значущих повідомлень`);
      } catch (e) {
        console.warn("Could not read channel_data.json", e);
        job.tempContext = { messages: [] };
      }
      setTimeout(() => { currentStageIndex++; processNextStage(); }, 1200);
    }
    else if (stage === 'NLP_EXTRACTION') {
      const messages = job.tempContext?.messages || [];
      const extracted = messages.map(msg => {
        const text = msg.text.toLowerCase();
        const entities = [];
        let risk_score = 0;
        let event_type = "Інформаційне повідомлення";

        if (text.includes('дбр')) entities.push({ type: 'Authority', value: 'ДБР' });
        if (text.includes('сбу')) entities.push({ type: 'Authority', value: 'СБУ' });
        if (text.includes('митниц')) entities.push({ type: 'Authority', value: 'Держмитслужба' });

        if (text.includes('контрабанд')) { risk_score += 40; event_type = "Контрабанда"; }
        if (text.includes('наркотик')) { risk_score += 50; event_type = "Наркотрафік"; }
        if (text.includes('хабар') || text.includes('зловживання')) { risk_score += 45; event_type = "Корупція"; }
        if (text.includes('суд') || text.includes('вирок')) risk_score += 15;

        ['одеськ', 'львівськ', 'волинськ', 'закарпатськ', 'київськ'].forEach(reg => {
          if (text.includes(reg)) entities.push({ type: 'CustomsOffice', value: reg.charAt(0).toUpperCase() + reg.slice(1) + 'а митниця' });
        });

        return {
          id: `tg-${msg.message_id}`,
          date: msg.date,
          channel: username,
          original_text: msg.text,
          summary: msg.text.substring(0, 150) + '...',
          risk_score: Math.min(risk_score, 100),
          event_type,
          entities
        };
      });
      job.tempContext.extracted = extracted;
      emitEvent(jobId, 'NLP_EXTRACTION_COMPLETE', `LLM вилучила ${extracted.reduce((s, e) => s + e.entities.length, 0)} сутностей`);
      setTimeout(() => { currentStageIndex++; processNextStage(); }, 1500);
    }
    else if (stage === 'ROUTING_SQL') {
      const extracted = job.tempContext?.extracted || [];
      extracted.forEach(item => {
        DB_TELEGRAM_EVENTS.push({
          event_id: item.id,
          channel: item.channel,
          date: item.date,
          summary: item.summary,
          event_type: item.event_type,
          risk_score: item.risk_score
        });
        item.entities.forEach(ent => {
          DB_TELEGRAM_ENTITIES.push({
            entity_name: ent.value,
            entity_type: ent.type,
            reference_event_id: item.id
          });
        });
      });
      emitEvent(jobId, 'ROUTED_POSTGRES', `Збережено у PostgreSQL таблиці telegram_events та extracted_entities`);
      setTimeout(() => { currentStageIndex++; processNextStage(); }, 800);
    }
    else if (stage === 'ROUTING_GRAPH') {
      const extracted = job.tempContext?.extracted || [];
      const chanNodeId = `chan-${username}`;
      if (!DB_GRAPH.nodes.find(n => n.id === chanNodeId)) {
        DB_GRAPH.nodes.push({ id: chanNodeId, label: `@${username}`, type: 'Channel' });
      }

      let edgesCount = 0;
      extracted.forEach(item => {
        if (item.risk_score > 0) {
          DB_GRAPH.nodes.push({ id: item.id, label: item.event_type, type: 'Event', risk: item.risk_score });
          DB_GRAPH.edges.push({ from: chanNodeId, to: item.id, label: 'PUBLISHED' });
          edgesCount++;

          item.entities.forEach(ent => {
            const entId = `ent-${ent.type}-${ent.value.replace(/\s+/g, '')}`;
            if (!DB_GRAPH.nodes.find(n => n.id === entId)) {
              DB_GRAPH.nodes.push({ id: entId, label: ent.value, type: ent.type });
            }
            DB_GRAPH.edges.push({ from: item.id, to: entId, label: 'MENTIONS' });
            edgesCount++;
          });
        }
      });
      emitEvent(jobId, 'ROUTED_GRAPH', `GraphDB: Інтегровано ${edgesCount} нових зв'язків (Events → Entities)`);
      setTimeout(() => { currentStageIndex++; processNextStage(); }, 1000);
    }
    else if (stage === 'ROUTING_SEARCH') {
      const extracted = job.tempContext?.extracted || [];
      extracted.forEach(item => {
        DB_SEARCH_INDEX.push({
          id: item.id,
          text: item.original_text,
          declaration: {
            id: item.id,
            declaration_number: `TG-${item.id.split('-')[1]}`,
            company_name: `@${item.channel}`,
            goods_description: item.summary,
            country_origin: 'TELEGRAM',
            customs_office: 'N/A',
            customs_value_usd: 0,
            date: item.date,
            risk_score: item.risk_score
          }
        });
      });
      emitEvent(jobId, 'ROUTED_SEARCH', `OpenSearch: Проіндексовано ${extracted.length} документів`);
      setTimeout(() => { currentStageIndex++; processNextStage(); }, 800);
    }
    else if (stage === 'ROUTING_VECTOR') {
      const extracted = job.tempContext?.extracted || [];
      extracted.forEach(item => {
        DB_VECTORS.push({
          id: item.id,
          text: item.summary,
          vector: Array(384).fill(0).map(() => Math.random())
        });
      });
      emitEvent(jobId, 'ROUTED_QDRANT', `Qdrant: Згенеровано ${extracted.length} семантичних векторів`);
      setTimeout(() => { currentStageIndex++; processNextStage(); }, 1200);
    }
    else if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';

      const totalItems = job.tempContext?.extracted?.length || 0;
      job.progress.records_indexed = totalItems;
      job.progress.records_total = totalItems;
      job.progress.records_processed = totalItems;

      emitEvent(jobId, 'OMNISCIENCE_COMPLETED', `[OMNISCIENCE] ${totalItems} Telegram-подій стали багатовимірними фактами системи`);

      delete job.tempContext;
    }
  };

  processNextStage();
}

// =============================================
// 📄 PDF PIPELINE — Quantum Document Stack
// =============================================
function runPdfPipeline(jobId, filename) {
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'OCR', 'EXTRACT_CONTENT', 'CHUNK', 'VECTORIZE', 'INDEX_SEARCH', 'READY'];
  let idx = 0;

  const next = () => {
    const stage = stages[idx];
    const percent = Math.round(((idx + 1) / stages.length) * 100);
    const details = {
      CREATED: 'Ініціалізація Quantum Document Stack...',
      UPLOAD: `Завантаження ${filename} у буфер обробки...`,
      INGEST_MINIO: 'Збереження оригіналу PDF у MinIO [Object Storage]...',
      OCR: 'Розпізнавання тексту — Tesseract OCR v5 + CRAFT детектор...',
      EXTRACT_CONTENT: 'Витягнення структурованого контенту: таблиці, заголовки, параграфи...',
      CHUNK: 'Семантична сегментація: розбиття на 512-токенні чанки з перекриттям...',
      VECTORIZE: 'Генерація Llama-3 ембедингів — 384-вимірний простір...',
      INDEX_SEARCH: 'Індексація в OpenSearch — створення інвертованих індексів...',
      READY: `✅ PDF оброблено. ${filename} — розщеплено на знання.`
    }[stage];

    job.state = stage;
    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    if (stage === 'INGEST_MINIO') {
      DB_FILES.push({ id: jobId, filename, size_bytes: 1024000, uploaded_at: new Date().toISOString(), type: 'pdf' });
    }
    if (stage === 'OCR') {
      const pages = 12 + Math.floor(Math.random() * 30);
      const ocrText = `Митна декларація №UA-${Math.floor(Math.random() * 999999)}. Товар: Обладнання промислове. Вартість: $${(Math.random() * 500000).toFixed(0)}. Країна: Німеччина.`;
      job.tempContext = { pages, ocrText, chunks: [] };
      emitEvent(jobId, 'OCR_COMPLETE', `Розпізнано ${pages} сторінок документа`);
    }
    if (stage === 'EXTRACT_CONTENT') {
      const entities = [
        { type: 'Company', value: 'ТОВ "ТехноГруп"' },
        { type: 'Amount', value: '$245,000' },
        { type: 'HSCode', value: '8471.30' },
        { type: 'Country', value: 'Німеччина' }
      ];
      job.tempContext.entities = entities;
      emitEvent(jobId, 'CONTENT_EXTRACTED', `Знайдено ${entities.length} сутностей у документі`);
    }
    if (stage === 'CHUNK') {
      const chunkCount = 8 + Math.floor(Math.random() * 20);
      for (let i = 0; i < chunkCount; i++) {
        job.tempContext.chunks.push({ id: `chunk-${jobId}-${i}`, text: `Chunk ${i}: ${job.tempContext.ocrText.substring(0, 100)}...`, page: Math.floor(i / 3) + 1 });
      }
      emitEvent(jobId, 'CHUNKING_COMPLETE', `Документ розбито на ${chunkCount} семантичних чанків`);
    }
    if (stage === 'VECTORIZE') {
      (job.tempContext.chunks || []).forEach(chunk => {
        DB_VECTORS.push({ id: chunk.id, text: chunk.text, vector: Array(384).fill(0).map(() => Math.random()), source: 'pdf', source_file: filename });
      });
      emitEvent(jobId, 'VECTORS_GENERATED', `${job.tempContext.chunks.length} векторів згенеровано`);
    }
    if (stage === 'INDEX_SEARCH') {
      (job.tempContext.chunks || []).forEach(chunk => {
        DB_SEARCH_INDEX.push({
          id: chunk.id,
          text: chunk.text,
          declaration: { id: chunk.id, declaration_number: `PDF-${jobId.slice(-6)}`, company_name: 'PDF Document', goods_description: chunk.text.slice(0, 80), country_origin: 'PDF', customs_office: 'N/A', customs_value_usd: 0, date: new Date().toISOString(), risk_score: 0 }
        });
      });
      DB_FACTS.push({
        id: `pdf-${jobId}`, declaration_number: `PDF-${jobId.slice(-6)}`, date: new Date().toISOString().split('T')[0],
        company_name: 'PDF Document', goods_description: `PDF: ${filename}`, goods_category: 'Документ',
        country_origin: 'СИСТЕМА', customs_office: 'Digital', weight_kg: 0, customs_value_usd: 0,
        risk_score: 10, source_file: filename, ingested_at: new Date().toISOString(),
        metadata: { pages: job.tempContext.pages, chunks: job.tempContext.chunks.length, entities: job.tempContext.entities }
      });
      emitEvent(jobId, 'INDEXED_OPENSEARCH', `${job.tempContext.chunks.length} чанків проіндексовано`);
    }
    if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';
      job.progress.records_total = job.tempContext?.chunks?.length || 0;
      job.progress.records_processed = job.tempContext?.chunks?.length || 0;
      job.progress.records_indexed = job.tempContext?.chunks?.length || 0;
      emitEvent(jobId, 'PDF_PIPELINE_COMPLETED', `PDF повністю оброблено: ${job.tempContext?.pages} сторінок → ${job.tempContext?.chunks?.length} чанків → векторизовано`);
      delete job.tempContext;
      return;
    }

    idx++;
    setTimeout(next, 800 + Math.random() * 600);
  };
  next();
}

// =============================================
// 📝 WORD PIPELINE — Text Analysis Stack
// =============================================
function runWordPipeline(jobId, filename) {
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'PARSE', 'CHUNK', 'VECTORIZE', 'READY'];
  let idx = 0;

  const next = () => {
    const stage = stages[idx];
    const percent = Math.round(((idx + 1) / stages.length) * 100);
    const details = {
      CREATED: 'Ініціалізація Text Analysis Stack...',
      UPLOAD: `Завантаження ${filename}...`,
      INGEST_MINIO: 'Збереження .docx в MinIO...',
      PARSE: 'Парсинг структури Word: секції, таблиці, параграфи...',
      CHUNK: 'Розбиття на семантичні блоки...',
      VECTORIZE: 'Llama-3 векторизація параграфів...',
      READY: `✅ Word документ оброблено: ${filename}`
    }[stage];

    job.state = stage;
    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    if (stage === 'INGEST_MINIO') {
      DB_FILES.push({ id: jobId, filename, size_bytes: 512000, uploaded_at: new Date().toISOString(), type: 'word' });
    }
    if (stage === 'PARSE') {
      const paragraphs = 15 + Math.floor(Math.random() * 40);
      const tables = Math.floor(Math.random() * 5);
      job.tempContext = { paragraphs, tables, chunks: [] };
      emitEvent(jobId, 'WORD_PARSED', `Виявлено ${paragraphs} параграфів, ${tables} таблиць`);
    }
    if (stage === 'CHUNK') {
      const count = job.tempContext.paragraphs;
      for (let i = 0; i < count; i++) {
        job.tempContext.chunks.push({ id: `wchunk-${jobId}-${i}`, text: `Параграф ${i + 1}: Аналіз торгових операцій та митних процедур...` });
      }
      emitEvent(jobId, 'WORD_CHUNKED', `${count} блоків створено`);
    }
    if (stage === 'VECTORIZE') {
      job.tempContext.chunks.forEach(chunk => {
        DB_VECTORS.push({ id: chunk.id, text: chunk.text, vector: Array(384).fill(0).map(() => Math.random()), source: 'word', source_file: filename });
      });
      DB_SEARCH_INDEX.push({
        id: `word-${jobId}`, text: job.tempContext.chunks.map(c => c.text).join(' '),
        declaration: { id: `word-${jobId}`, declaration_number: `WORD-${jobId.slice(-6)}`, company_name: filename, goods_description: 'Word Document', country_origin: 'СИСТЕМА', customs_office: 'N/A', customs_value_usd: 0, date: new Date().toISOString(), risk_score: 0 }
      });
      emitEvent(jobId, 'WORD_VECTORIZED', `${job.tempContext.chunks.length} ембедингів згенеровано`);
    }
    if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';
      job.progress.records_total = job.tempContext?.chunks?.length || 0;
      job.progress.records_processed = job.tempContext?.chunks?.length || 0;
      job.progress.records_indexed = job.tempContext?.chunks?.length || 0;
      delete job.tempContext;
      return;
    }

    idx++;
    setTimeout(next, 700 + Math.random() * 500);
  };
  next();
}

// =============================================
// 🖼️ IMAGE PIPELINE — Vision Analysis Layer
// =============================================
function runImagePipeline(jobId, filename) {
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = ['CREATED', 'UPLOAD', 'OCR', 'VECTORIZE', 'READY'];
  let idx = 0;

  const next = () => {
    const stage = stages[idx];
    const percent = Math.round(((idx + 1) / stages.length) * 100);
    const details = {
      CREATED: 'Ініціалізація Vision Analysis Layer...',
      UPLOAD: `Завантаження зображення ${filename}...`,
      OCR: 'OCR + Computer Vision: CRAFT + Tesseract + YOLO v8 object detection...',
      VECTORIZE: 'CLIP ембединги: мультимодальна векторизація (текст + візуальне)...',
      READY: `✅ Зображення оброблено: ${filename}`
    }[stage];

    job.state = stage;
    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    if (stage === 'UPLOAD') {
      DB_FILES.push({ id: jobId, filename, size_bytes: 2048000, uploaded_at: new Date().toISOString(), type: 'image' });
    }
    if (stage === 'OCR') {
      const labels = ['Митна печатка', 'QR-код', 'Штрих-код', 'Підпис', 'Штамп'];
      const detectedLabels = labels.slice(0, 2 + Math.floor(Math.random() * 3));
      const ocrText = `Виявлено: ${detectedLabels.join(', ')}. Текст: Декларація №UA-${Math.floor(Math.random() * 999999)}`;
      job.tempContext = { ocrText, labels: detectedLabels, objects: detectedLabels.length };
      emitEvent(jobId, 'IMAGE_OCR_COMPLETE', `OCR: ${ocrText.slice(0, 80)}... | Objects: ${detectedLabels.length}`);
    }
    if (stage === 'VECTORIZE') {
      DB_VECTORS.push({
        id: `img-${jobId}`, text: job.tempContext.ocrText,
        vector: Array(384).fill(0).map(() => Math.random()),
        source: 'image', source_file: filename, labels: job.tempContext.labels
      });
      DB_FACTS.push({
        id: `img-${jobId}`, declaration_number: `IMG-${jobId.slice(-6)}`, date: new Date().toISOString().split('T')[0],
        company_name: 'Image Analysis', goods_description: `OCR: ${job.tempContext.ocrText.slice(0, 60)}`, goods_category: 'Зображення',
        country_origin: 'VISION', customs_office: 'Digital', weight_kg: 0, customs_value_usd: 0,
        risk_score: 5, source_file: filename, ingested_at: new Date().toISOString(),
        metadata: { objects: job.tempContext.objects, labels: job.tempContext.labels }
      });
      emitEvent(jobId, 'IMAGE_VECTORIZED', 'CLIP мультимодальний ембединг створено');
    }
    if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';
      job.progress.records_total = 1;
      job.progress.records_processed = 1;
      job.progress.records_indexed = 1;
      delete job.tempContext;
      return;
    }

    idx++;
    setTimeout(next, 1000 + Math.random() * 800);
  };
  next();
}

// =============================================
// 🎵 AUDIO PIPELINE — Acoustic Signal Processing
// =============================================
function runAudioPipeline(jobId, filename) {
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = ['CREATED', 'UPLOAD', 'DECODE', 'TRANSCRIPT', 'VECTORIZE', 'READY'];
  let idx = 0;

  const next = () => {
    const stage = stages[idx];
    const percent = Math.round(((idx + 1) / stages.length) * 100);
    const details = {
      CREATED: 'Ініціалізація Acoustic Signal Processing...',
      UPLOAD: `Завантаження аудіо ${filename}...`,
      DECODE: 'Декодування аудіо: FFmpeg → WAV 16kHz моно...',
      TRANSCRIPT: 'Whisper Large v3: транскрибація мовлення → текст...',
      VECTORIZE: 'Семантична векторизація транскрипту...',
      READY: `✅ Аудіо оброблено: ${filename}`
    }[stage];

    job.state = stage;
    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    if (stage === 'UPLOAD') {
      DB_FILES.push({ id: jobId, filename, size_bytes: 5120000, uploaded_at: new Date().toISOString(), type: 'audio' });
    }
    if (stage === 'DECODE') {
      const duration = 30 + Math.floor(Math.random() * 300); // seconds
      job.tempContext = { duration, format: 'WAV 16kHz', speakers: 1 + Math.floor(Math.random() * 3) };
      emitEvent(jobId, 'AUDIO_DECODED', `Тривалість: ${Math.floor(duration / 60)}хв ${duration % 60}с | ${job.tempContext.speakers} спікер(ів)`);
    }
    if (stage === 'TRANSCRIPT') {
      const transcript = `Обговорення митних процедур. Доповідач зазначив критичні зміни в тарифних ставках на електроніку. Рекомендовано переглянути класифікацію за кодом 8471. Зафіксовано порушення в декларації UA-${Math.floor(Math.random() * 999999)}.`;
      const segments = [];
      for (let t = 0; t < job.tempContext.duration; t += 30) {
        segments.push({ start: t, end: Math.min(t + 30, job.tempContext.duration), text: transcript.substring(0, 60) + '...' });
      }
      job.tempContext.transcript = transcript;
      job.tempContext.segments = segments;
      emitEvent(jobId, 'TRANSCRIPT_COMPLETE', `Транскрибовано ${segments.length} сегментів тексту`);
    }
    if (stage === 'VECTORIZE') {
      const chunks = job.tempContext.segments || [];
      chunks.forEach((seg, i) => {
        DB_VECTORS.push({ id: `audio-${jobId}-${i}`, text: seg.text, vector: Array(384).fill(0).map(() => Math.random()), source: 'audio', source_file: filename });
      });
      DB_SEARCH_INDEX.push({
        id: `audio-${jobId}`, text: job.tempContext.transcript,
        declaration: { id: `audio-${jobId}`, declaration_number: `AUD-${jobId.slice(-6)}`, company_name: 'Аудіо транскрипт', goods_description: job.tempContext.transcript.slice(0, 80), country_origin: 'AUDIO', customs_office: 'N/A', customs_value_usd: 0, date: new Date().toISOString(), risk_score: 0 }
      });
      DB_FACTS.push({
        id: `audio-${jobId}`, declaration_number: `AUD-${jobId.slice(-6)}`, date: new Date().toISOString().split('T')[0],
        company_name: 'Аудіо запис', goods_description: `Транскрипт: ${job.tempContext.transcript.slice(0, 60)}`, goods_category: 'Медіа',
        country_origin: 'AUDIO', customs_office: 'Digital', weight_kg: 0, customs_value_usd: 0,
        risk_score: 5, source_file: filename, ingested_at: new Date().toISOString(),
        metadata: { duration_seconds: job.tempContext.duration, speakers: job.tempContext.speakers, segments: chunks.length }
      });
      emitEvent(jobId, 'AUDIO_VECTORIZED', `${chunks.length} аудіо-сегментів векторизовано`);
    }
    if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';
      const segs = job.tempContext?.segments?.length || 0;
      job.progress.records_total = segs;
      job.progress.records_processed = segs;
      job.progress.records_indexed = segs;
      delete job.tempContext;
      return;
    }

    idx++;
    setTimeout(next, 1200 + Math.random() * 800);
  };
  next();
}

// =============================================
// 🎬 VIDEO PIPELINE — Visual Frame Analysis
// =============================================
function runVideoPipeline(jobId, filename) {
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = ['CREATED', 'UPLOAD', 'DECODE', 'OCR', 'TRANSCRIPT', 'VECTORIZE', 'READY'];
  let idx = 0;

  const next = () => {
    const stage = stages[idx];
    const percent = Math.round(((idx + 1) / stages.length) * 100);
    const details = {
      CREATED: 'Ініціалізація Visual Frame Analysis...',
      UPLOAD: `Завантаження відео ${filename}...`,
      DECODE: 'FFmpeg декодування: H.264 → кадри 1fps для аналізу...',
      OCR: 'YOLO v8 + CRAFT: Detection на кожному ключовому кадрі...',
      TRANSCRIPT: 'Whisper Large v3: транскрибація аудіо-доріжки...',
      VECTORIZE: 'Мультимодальна векторизація: CLIP (кадри) + Llama-3 (текст)...',
      READY: `✅ Відео оброблено: ${filename}`
    }[stage];

    job.state = stage;
    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    if (stage === 'UPLOAD') {
      DB_FILES.push({ id: jobId, filename, size_bytes: 52428800, uploaded_at: new Date().toISOString(), type: 'video' });
    }
    if (stage === 'DECODE') {
      const duration = 60 + Math.floor(Math.random() * 600);
      const fps = 30;
      const keyframes = Math.floor(duration / 10);
      job.tempContext = { duration, fps, keyframes, frames_analyzed: keyframes };
      emitEvent(jobId, 'VIDEO_DECODED', `Тривалість: ${Math.floor(duration / 60)}хв ${duration % 60}с | ${keyframes} ключових кадрів`);
    }
    if (stage === 'OCR') {
      const objects = ['Контейнер', 'Вантажівка', 'Митний пост', 'Штрих-код', 'Номерний знак', 'Документ'];
      const detected = objects.slice(0, 2 + Math.floor(Math.random() * 4));
      job.tempContext.detected_objects = detected;
      job.tempContext.ocr_text = `Кадровий аналіз: виявлено ${detected.join(', ')}`;
      emitEvent(jobId, 'VIDEO_OCR_COMPLETE', `Виявлено ${detected.length} типів об'єктів на ${job.tempContext.keyframes} кадрах`);
    }
    if (stage === 'TRANSCRIPT') {
      const transcript = `Оглядове відео митного терміналу. Показано процедуру інспекції вантажу. Інспектор зазначає відповідність документації. Виявлено маркування на контейнері ${Math.floor(Math.random() * 999999)}.`;
      const segments = [];
      for (let t = 0; t < job.tempContext.duration; t += 30) {
        segments.push({ start: t, end: Math.min(t + 30, job.tempContext.duration), text: transcript.substring(0, 60) + '...' });
      }
      job.tempContext.transcript = transcript;
      job.tempContext.segments = segments;
      emitEvent(jobId, 'VIDEO_TRANSCRIPT_COMPLETE', `Аудіо транскрибовано: ${segments.length} сегментів`);
    }
    if (stage === 'VECTORIZE') {
      const totalChunks = (job.tempContext.segments?.length || 0) + (job.tempContext.keyframes || 0);
      // Visual vectors
      for (let i = 0; i < job.tempContext.keyframes; i++) {
        DB_VECTORS.push({ id: `vid-frame-${jobId}-${i}`, text: `Frame ${i}: ${job.tempContext.ocr_text}`, vector: Array(384).fill(0).map(() => Math.random()), source: 'video-frame', source_file: filename });
      }
      // Text vectors
      (job.tempContext.segments || []).forEach((seg, i) => {
        DB_VECTORS.push({ id: `vid-text-${jobId}-${i}`, text: seg.text, vector: Array(384).fill(0).map(() => Math.random()), source: 'video-audio', source_file: filename });
      });
      DB_SEARCH_INDEX.push({
        id: `video-${jobId}`, text: `${job.tempContext.transcript} ${job.tempContext.ocr_text}`,
        declaration: { id: `video-${jobId}`, declaration_number: `VID-${jobId.slice(-6)}`, company_name: 'Відео аналіз', goods_description: `Відео: ${filename}`, country_origin: 'VIDEO', customs_office: 'N/A', customs_value_usd: 0, date: new Date().toISOString(), risk_score: 0 }
      });
      DB_FACTS.push({
        id: `video-${jobId}`, declaration_number: `VID-${jobId.slice(-6)}`, date: new Date().toISOString().split('T')[0],
        company_name: 'Відео аналітика', goods_description: `Відео: ${job.tempContext.transcript.slice(0, 60)}`, goods_category: 'Медіа',
        country_origin: 'VIDEO', customs_office: 'Digital', weight_kg: 0, customs_value_usd: 0,
        risk_score: 5, source_file: filename, ingested_at: new Date().toISOString(),
        metadata: { duration_seconds: job.tempContext.duration, keyframes: job.tempContext.keyframes, objects: job.tempContext.detected_objects, segments: job.tempContext.segments?.length }
      });
      emitEvent(jobId, 'VIDEO_VECTORIZED', `${totalChunks} мультимодальних ембедингів (кадри + аудіо)`);
    }
    if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';
      const total = (job.tempContext?.segments?.length || 0) + (job.tempContext?.keyframes || 0);
      job.progress.records_total = total;
      job.progress.records_processed = total;
      job.progress.records_indexed = total;
      delete job.tempContext;
      return;
    }

    idx++;
    setTimeout(next, 1500 + Math.random() * 1000);
  };
  next();
}

// =============================================
// 🌐 WEBSITE PIPELINE — Autonomous Web Sonar
// =============================================
function runWebsitePipeline(jobId, url) {
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = ['CREATED', 'CRAWL', 'EXTRACT_CONTENT', 'VALIDATE', 'NORMALIZE', 'INDEX_SEARCH', 'READY'];
  let idx = 0;
  const domain = (url || 'unknown.com').replace(/https?:\/\//, '').split('/')[0];

  const next = () => {
    const stage = stages[idx];
    const percent = Math.round(((idx + 1) / stages.length) * 100);
    const details = {
      CREATED: 'Ініціалізація Autonomous Web Sonar...',
      CRAWL: `Crawling ${domain}: виявлення сторінок, robots.txt, sitemap.xml...`,
      EXTRACT_CONTENT: 'Readability Engine: витягнення тексту, зображень, метаданих...',
      VALIDATE: 'DQ Check: перевірка цілісності та релевантності контенту...',
      NORMALIZE: 'Нормалізація до Canonical Web Schema...',
      INDEX_SEARCH: 'OpenSearch: повнотекстова індексація сторінок...',
      READY: `✅ Веб-сайт ${domain} оброблено.`
    }[stage];

    job.state = stage;
    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    if (stage === 'CRAWL') {
      const pagesFound = 5 + Math.floor(Math.random() * 20);
      const links = pagesFound * 3;
      job.tempContext = { domain, pagesFound, links, pages: [] };
      for (let i = 0; i < pagesFound; i++) {
        job.tempContext.pages.push({
          id: `page-${jobId}-${i}`,
          url: `https://${domain}/page-${i + 1}`,
          title: `Сторінка ${i + 1}: ${['Новини', 'Контакти', 'Про нас', 'Товари', 'Послуги', 'Документи', 'Звіти', 'Аналітика'][i % 8]}`,
          text: `Контент сторінки ${i + 1} сайту ${domain}. Інформація про митні процедури та торгові операції.`,
          wordCount: 200 + Math.floor(Math.random() * 800)
        });
      }
      DB_FILES.push({ id: jobId, filename: `crawl_${domain}.json`, size_bytes: pagesFound * 5000, uploaded_at: new Date().toISOString(), type: 'website' });
      emitEvent(jobId, 'CRAWL_COMPLETE', `Знайдено ${pagesFound} сторінок, ${links} зв'язків`);
    }
    if (stage === 'EXTRACT_CONTENT') {
      emitEvent(jobId, 'CONTENT_EXTRACTED', `Витягнено контент з ${job.tempContext.pagesFound} сторінок`);
    }
    if (stage === 'VALIDATE') {
      const valid = job.tempContext.pages.filter(() => Math.random() > 0.1);
      job.tempContext.validPages = valid;
      emitEvent(jobId, 'VALIDATION_COMPLETE', `${valid.length}/${job.tempContext.pagesFound} сторінок пройшли валідацію`);
    }
    if (stage === 'NORMALIZE') {
      emitEvent(jobId, 'NORMALIZED', 'Контент нормалізовано до Canonical Schema');
    }
    if (stage === 'INDEX_SEARCH') {
      const pages = job.tempContext.validPages || job.tempContext.pages;
      pages.forEach(page => {
        DB_SEARCH_INDEX.push({
          id: page.id, text: `${page.title} ${page.text}`,
          declaration: { id: page.id, declaration_number: `WEB-${jobId.slice(-6)}`, company_name: domain, goods_description: page.title, country_origin: 'WEB', customs_office: 'N/A', customs_value_usd: 0, date: new Date().toISOString(), risk_score: 0 }
        });
        DB_VECTORS.push({ id: page.id, text: page.text, vector: Array(384).fill(0).map(() => Math.random()), source: 'website', source_file: domain });
      });
      // Graph: link structure
      const siteNode = `site-${domain.replace(/[^a-z0-9]/g, '')}`;
      if (!DB_GRAPH.nodes.find(n => n.id === siteNode)) {
        DB_GRAPH.nodes.push({ id: siteNode, label: domain, type: 'Website' });
      }
      pages.slice(0, 10).forEach(page => {
        DB_GRAPH.nodes.push({ id: page.id, label: page.title, type: 'WebPage' });
        DB_GRAPH.edges.push({ from: siteNode, to: page.id, label: 'HAS_PAGE' });
      });
      emitEvent(jobId, 'WEB_INDEXED', `${pages.length} сторінок проіндексовано + граф зв'язків`);
    }
    if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';
      const total = job.tempContext?.validPages?.length || job.tempContext?.pagesFound || 0;
      job.progress.records_total = total;
      job.progress.records_processed = total;
      job.progress.records_indexed = total;
      delete job.tempContext;
      return;
    }

    idx++;
    setTimeout(next, 1000 + Math.random() * 800);
  };
  next();
}

// =============================================
// ⚡ API PIPELINE — Neural Stream Sync
// =============================================
function runApiPipeline(jobId, apiUrl) {
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = ['CREATED', 'AUTH', 'FETCH', 'VALIDATE', 'TRANSFORM', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'];
  let idx = 0;
  const endpoint = (apiUrl || 'api.example.com').replace(/https?:\/\//, '').split('/')[0];

  const next = () => {
    const stage = stages[idx];
    const percent = Math.round(((idx + 1) / stages.length) * 100);
    const details = {
      CREATED: 'Ініціалізація Neural Stream Sync...',
      AUTH: `Автентифікація через API Key/OAuth2 для ${endpoint}...`,
      FETCH: `Запит до API: GET ${apiUrl}...`,
      VALIDATE: 'Валідація JSON Schema відповіді...',
      TRANSFORM: 'Трансформація: API Response → Canonical Model...',
      LOAD_SQL: 'Запис структурованих даних у PostgreSQL...',
      INDEX_SEARCH: 'Індексація в OpenSearch...',
      READY: `✅ API інтеграція ${endpoint} завершена.`
    }[stage];

    job.state = stage;
    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    if (stage === 'AUTH') {
      emitEvent(jobId, 'API_AUTH_OK', `Автентифікація для ${endpoint} пройдена`);
    }
    if (stage === 'FETCH') {
      const recordCount = 20 + Math.floor(Math.random() * 80);
      const apiData = [];
      for (let i = 0; i < recordCount; i++) {
        apiData.push({
          id: `api-rec-${jobId}-${i}`,
          name: `API Record ${i + 1}`,
          value: Math.floor(Math.random() * 100000),
          category: ['trade', 'customs', 'logistics', 'finance'][i % 4],
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
        });
      }
      job.tempContext = { records: apiData, endpoint };
      emitEvent(jobId, 'API_FETCHED', `Отримано ${recordCount} записів з API`);
    }
    if (stage === 'VALIDATE') {
      const valid = job.tempContext.records.filter(() => Math.random() > 0.05);
      job.tempContext.validRecords = valid;
      emitEvent(jobId, 'API_VALIDATED', `${valid.length}/${job.tempContext.records.length} записів пройшли валідацію`);
    }
    if (stage === 'TRANSFORM') {
      emitEvent(jobId, 'API_TRANSFORMED', 'Дані трансформовано до Canonical Model');
    }
    if (stage === 'LOAD_SQL') {
      const records = job.tempContext.validRecords || job.tempContext.records;
      records.forEach(rec => {
        DB_FACTS.push({
          id: rec.id, declaration_number: `API-${jobId.slice(-6)}-${rec.id.split('-').pop()}`,
          date: rec.timestamp.split('T')[0],
          company_name: `API: ${endpoint}`, goods_description: `${rec.name} (${rec.category})`,
          goods_category: rec.category, country_origin: 'API', customs_office: endpoint,
          weight_kg: 0, customs_value_usd: rec.value, risk_score: Math.floor(Math.random() * 30),
          source_file: `api_${endpoint}`, ingested_at: new Date().toISOString()
        });
      });
      emitEvent(jobId, 'API_SQL_STORED', `${records.length} записів збережено у PostgreSQL`);
    }
    if (stage === 'INDEX_SEARCH') {
      const records = job.tempContext.validRecords || job.tempContext.records;
      records.forEach(rec => {
        DB_SEARCH_INDEX.push({
          id: rec.id, text: `${rec.name} ${rec.category} ${endpoint}`,
          declaration: { id: rec.id, declaration_number: `API-${jobId.slice(-6)}`, company_name: endpoint, goods_description: rec.name, country_origin: 'API', customs_office: endpoint, customs_value_usd: rec.value, date: rec.timestamp, risk_score: 0 }
        });
      });
      emitEvent(jobId, 'API_INDEXED', `${records.length} записів проіндексовано`);
    }
    if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';
      const total = job.tempContext?.validRecords?.length || job.tempContext?.records?.length || 0;
      job.progress.records_total = total;
      job.progress.records_processed = total;
      job.progress.records_indexed = total;
      delete job.tempContext;
      return;
    }

    idx++;
    setTimeout(next, 800 + Math.random() * 600);
  };
  next();
}

// =============================================
// 📡 RSS PIPELINE — Plasma News Stream
// =============================================
function runRssPipeline(jobId, feedUrl) {
  const job = etlJobs.find(j => j.job_id === jobId);
  if (!job) return;

  const stages = ['CREATED', 'FETCH', 'PARSE', 'TRANSFORM', 'INDEX_SEARCH', 'READY'];
  let idx = 0;
  const feedDomain = (feedUrl || 'news.example.com').replace(/https?:\/\//, '').split('/')[0];

  const NEWS_TEMPLATES = [
    { title: 'Зміни в митних тарифах на електроніку', category: 'Регуляція', risk: 35 },
    { title: 'Нові правила імпорту с/г продукції', category: 'Агро', risk: 20 },
    { title: 'Розслідування контрабанди на Одеській митниці', category: 'Безпека', risk: 85 },
    { title: 'Стратегічні зміни в логістичних маршрутах', category: 'Логістика', risk: 15 },
    { title: 'Санкційний список оновлено: +12 компаній', category: 'Санкції', risk: 90 },
    { title: 'Ринок металу: тренди та прогнози Q2', category: 'Аналітика', risk: 10 },
    { title: 'Кібератака на митну систему: реакція', category: 'Безпека', risk: 70 },
    { title: 'Автоматизація митного оформлення', category: 'Технологія', risk: 5 },
    { title: 'Нові торгові угоди з країнами АСЕАН', category: 'Дипломатія', risk: 15 },
    { title: 'Виявлення цінових аномалій в імпорті фармацевтики', category: 'Фармацевтика', risk: 65 },
  ];

  const next = () => {
    const stage = stages[idx];
    const percent = Math.round(((idx + 1) / stages.length) * 100);
    const details = {
      CREATED: 'Ініціалізація Plasma News Stream...',
      FETCH: `Отримання RSS фіду з ${feedDomain}...`,
      PARSE: 'Розбір XML/Atom: витягнення заголовків, контенту, дат...',
      TRANSFORM: 'Трансформація до уніфікованого формату новин...',
      INDEX_SEARCH: 'OpenSearch + Qdrant: повнотекстова індексація + семантичне групування...',
      READY: `✅ RSS моніторинг ${feedDomain} активовано.`
    }[stage];

    job.state = stage;
    job.progress = { ...job.progress, stage, percent, details };
    emitEvent(jobId, `${stage}_STARTED`, details);

    if (stage === 'FETCH') {
      const articleCount = 5 + Math.floor(Math.random() * 10);
      const articles = [];
      for (let i = 0; i < articleCount; i++) {
        const template = NEWS_TEMPLATES[i % NEWS_TEMPLATES.length];
        articles.push({
          id: `rss-${jobId}-${i}`,
          title: template.title,
          text: `${template.title}. Детальний аналіз ситуації в секторі ${template.category}. Джерело: ${feedDomain}.`,
          category: template.category,
          risk_score: template.risk,
          published: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
          source: feedDomain
        });
      }
      job.tempContext = { articles, feedDomain };
      emitEvent(jobId, 'RSS_FETCHED', `Отримано ${articleCount} статей з ${feedDomain}`);
    }
    if (stage === 'PARSE') {
      emitEvent(jobId, 'RSS_PARSED', `${job.tempContext.articles.length} статей розпарсено`);
    }
    if (stage === 'TRANSFORM') {
      emitEvent(jobId, 'RSS_TRANSFORMED', 'Формат уніфіковано: заголовок, текст, категорія, ризик');
    }
    if (stage === 'INDEX_SEARCH') {
      const articles = job.tempContext.articles;
      articles.forEach(article => {
        // OpenSearch
        DB_SEARCH_INDEX.push({
          id: article.id, text: `${article.title} ${article.text}`,
          declaration: { id: article.id, declaration_number: `RSS-${jobId.slice(-6)}`, company_name: feedDomain, goods_description: article.title, country_origin: 'RSS', customs_office: 'News', customs_value_usd: 0, date: article.published, risk_score: article.risk_score }
        });
        // Qdrant
        DB_VECTORS.push({ id: article.id, text: `${article.title} ${article.text}`, vector: Array(384).fill(0).map(() => Math.random()), source: 'rss', source_file: feedDomain });
        // PostgreSQL
        DB_FACTS.push({
          id: article.id, declaration_number: `RSS-${jobId.slice(-6)}-${article.id.split('-').pop()}`,
          date: article.published.split('T')[0],
          company_name: feedDomain, goods_description: article.title,
          goods_category: article.category, country_origin: 'RSS', customs_office: 'News',
          weight_kg: 0, customs_value_usd: 0, risk_score: article.risk_score,
          source_file: `rss_${feedDomain}`, ingested_at: new Date().toISOString()
        });
      });
      emitEvent(jobId, 'RSS_INDEXED', `${articles.length} статей: OpenSearch + Qdrant + PostgreSQL`);
    }
    if (stage === 'READY') {
      DB_PIPELINE_STATE[jobId] = 'COMPLETED';
      const total = job.tempContext?.articles?.length || 0;
      job.progress.records_total = total;
      job.progress.records_processed = total;
      job.progress.records_indexed = total;
      delete job.tempContext;
      return;
    }

    idx++;
    setTimeout(next, 900 + Math.random() * 600);
  };
  next();
}

// =============================================
// 📊 MONITORING & SYSTEM
// =============================================

// Universal Health
app.get(['/api/v1/health', '/api/v1/monitoring/health', '/v1/monitoring/health'], (req, res) => {
  res.json({
    status: 'healthy', timestamp: new Date().toISOString(), databases: {
      postgresql: DB_FACTS.length,
      opensearch: DB_SEARCH_INDEX.length,
      qdrant: DB_VECTORS.length,
      graph_nodes: DB_GRAPH.nodes.length,
      files: DB_FILES.length
    }
  });
});

// Autonomy
app.get(['/api/v1/autonomy/status', '/v1/autonomy/status'], (req, res) => {
  res.json({ state: 'SOVEREIGN', active_strategies: 4, neural_load: 12 + Math.random() * 5, uptime: '7d 14h' });
});

app.get(['/api/v1/autonomy/metrics', '/v1/autonomy/metrics'], (req, res) => {
  res.json({ efficiency: 94.2, anomaly_detection_rate: 98.7, vector_search_precision: 0.96, timestamp: new Date().toISOString() });
});

app.get(['/api/v1/autonomy/hypotheses', '/v1/autonomy/hypotheses'], (req, res) => {
  res.json([
    { id: 'hyp-1', title: 'Маршрутна аномалія', probability: 0.84, status: 'VERIFYING' },
    { id: 'hyp-2', title: 'Кластеризація ризику ЄДРПОУ', probability: 0.76, status: 'STABLE' }
  ]);
});

// System Lockdown
app.get(['/api/v1/system/lockdown', '/v1/system/lockdown', '/api/v45/system/lockdown'], (req, res) => {
  res.json({ active: false, level: 0, reason: null, status: 'secure', is_active: false });
});

app.post('/api/v45/system/lockdown', (req, res) => {
  res.json({ is_active: true, status: 'LOCKDOWN ENGAGED' });
});

// System metrics (handles both v1 format and v45 Omniscience expectations)
app.get(['/api/v1/system/metrics', '/v1/system/metrics', '/api/v45/system/status', '/api/v55/system/status', '/api/v2/system/status'], (req, res) => {
  res.json({
    health_score: 98 + Math.random() * 2,
    advisor_note: "Sovereign AI Active: Всі системи працюють стабільно.",
    opensearch: { opensearch_docs: DB_SEARCH_INDEX.length },
    qdrant: { qdrant_vectors: DB_VECTORS.length },
    cpu: 24 + Math.random() * 15,
    cpu_percent: 24 + Math.random() * 15, // used by v1 omniscience metrics
    memory: 45 + Math.random() * 20,
    memory_percent: 45 + Math.random() * 20, // used by v1 omniscience metrics
    disk: 32,
    network: { in: Math.random() * 1000, out: Math.random() * 500 },
    active_containers: 12,
    timestamp: new Date().toISOString()
  });
});

app.get(['/api/v1/metrics/realtime', '/v1/metrics/realtime', '/api/v45/metrics/realtime'], (req, res) => {
  res.json({
    activeUsers: 3,
    requestsPerSecond: Math.floor(Math.random() * 50),
    avgResponseTime: Math.floor(Math.random() * 30),
    errorRate: Math.random() * 0.5,
    // V45 Realtime metrics structure 
    throughput: { value: 1400 + Math.random() * 200, unit: 'req/s' },
    latency: { value: 45 + Math.random() * 10, unit: 'ms' },
    error_rate: { value: 0.01 + Math.random() * 0.02, unit: '%' },
    ndcg: { value: 0.94, unit: 'score' },
    timestamp: new Date().toISOString()
  });
});

app.get(['/api/v1/monitoring/health', '/api/v45/monitoring/health'], (req, res) => {
  res.json({
    status: 'UP',
    health_score: 99,
    services: { database: { status: 'UP' }, cache: { status: 'UP' }, llm: { status: 'UP' } }
  });
});

app.get('/api/v45/training/status', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    stage: 'OPTIMIZATION',
    message: 'Training module is idle.',
    status: 'IDLE',
    progress: 100
  });
});

// =============================================
// 🌍 OSINT UA - DataGov & Prozorro
// =============================================

app.get(['/api/v1/osint_ua/datagov/search', '/v1/osint_ua/datagov/search'], (req, res) => {
  const q = req.query.q || '';
  const mocks = [
    {
      id: 'dataset-001',
      name: 'edrpou-registry',
      title: 'Єдиний державний реєстр юридичних осіб та фізичних осіб-підприємців (ЄДРПОУ)',
      notes: 'Повний перелік зареєстрованих суб’єктів господарювання в Україні. Дані включають назву, код, адресу та статус.',
      organization: { title: 'Міністерство юстиції України' },
      metadata_modified: new Date().toISOString(),
      resources: [
        { id: 'res-1', name: 'Повний витяг (CSV)', format: 'CSV', url: '#', size: 1024 * 1024 * 450, last_modified: new Date().toISOString() },
        { id: 'res-2', name: 'API Docs', format: 'JSON', url: '#', size: null, last_modified: new Date().toISOString() }
      ]
    },
    {
      id: 'dataset-002',
      name: 'customs-rates-2024',
      title: 'Митні ставки та тарифи на 2024 рік',
      notes: 'Актуальні ставки ввізного мита згідно з чинним законодавством України.',
      organization: { title: 'Державна митна служба України' },
      metadata_modified: new Date(Date.now() - 86400000).toISOString(),
      resources: [
        { id: 'res-3', name: 'Тарифна сітка (XLSX)', format: 'XLSX', url: '#', size: 1024 * 1024 * 12, last_modified: new Date().toISOString() }
      ]
    },
    {
      id: 'dataset-003',
      name: 'sanctions-list-ua',
      title: 'Державний реєстр санкцій України',
      notes: 'Перелік осіб та компаній, до яких застосовано спеціальні економічні та інші обмежувальні заходи (санкції).',
      organization: { title: 'РНБО' },
      metadata_modified: new Date().toISOString(),
      resources: [
        { id: 'res-4', name: 'База даних санкцій', format: 'JSON', url: '#', size: 1024 * 256, last_modified: new Date().toISOString() }
      ]
    }
  ].filter(d => d.title.toLowerCase().includes(q.toLowerCase()) || d.notes.toLowerCase().includes(q.toLowerCase()));

  res.json({
    count: mocks.length,
    results: mocks
  });
});

app.get(['/api/v1/osint_ua/prozorro/tenders', '/v1/osint_ua/prozorro/tenders'], (req, res) => {
  const tenders = [
    {
      id: 'UA-2024-03-01-0001',
      title: 'Закупівля серверного обладнання для дата-центру',
      value: 1450000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'Національний Банк України',
      date: new Date().toISOString(),
      category: 'IT обладнання', region: 'Київ', bids_count: 7,
      expectedValue: 1600000, risk_score: 12
    },
    {
      id: 'UA-2024-03-02-0045',
      title: 'Модернізація мережевої інфраструктури (Cisco Core Switches)',
      value: 890000, currency: 'UAH', status: 'active.awarding',
      procuringEntity: 'МВС України',
      date: new Date(Date.now() - 3600000).toISOString(),
      category: 'Телекомунікації', region: 'Київ', bids_count: 4,
      expectedValue: 950000, risk_score: 8
    },
    {
      id: 'UA-2024-03-05-1234',
      title: 'Послуги з підтримки програмного забезпечення Oracle',
      value: 3200000, currency: 'UAH', status: 'complete',
      procuringEntity: 'НАК "Нафтогаз України"',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      category: 'IT послуги', region: 'Київ', bids_count: 2,
      expectedValue: 3500000, risk_score: 45
    },
    {
      id: 'UA-2024-03-06-0078',
      title: 'Будівництво мосту через р. Дніпро (ділянка Запоріжжя)',
      value: 15200000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'Запорізька ОДА',
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      category: 'Будівництво', region: 'Запоріжжя', bids_count: 3,
      expectedValue: 18000000, risk_score: 67
    },
    {
      id: 'UA-2024-03-07-0156',
      title: 'Медичне обладнання для обласної лікарні (КТ-сканер)',
      value: 8750000, currency: 'UAH', status: 'active.qualification',
      procuringEntity: 'КНП "Обласна клінічна лікарня" Львів',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      category: 'Медицина', region: 'Львів', bids_count: 5,
      expectedValue: 9200000, risk_score: 23
    },
    {
      id: 'UA-2024-03-08-0234',
      title: 'Паливо дизельне ЄВРО-5 (річний контракт)',
      value: 4560000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'Міноборони України',
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
      category: 'Паливо та ПММ', region: 'Київ', bids_count: 12,
      expectedValue: 5000000, risk_score: 18
    },
    {
      id: 'UA-2024-03-09-0312',
      title: 'Послуги з охорони та моніторингу (24/7)',
      value: 720000, currency: 'UAH', status: 'unsuccessful',
      procuringEntity: 'Укрзалізниця',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      category: 'Безпека', region: 'Харків', bids_count: 1,
      expectedValue: 800000, risk_score: 82
    },
    {
      id: 'UA-2024-03-10-0456',
      title: 'Капітальний ремонт дороги М-06 Київ-Чоп (км 245-280)',
      value: 12800000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'Укравтодор',
      date: new Date(Date.now() - 86400000 * 6).toISOString(),
      category: 'Дорожнє будівництво', region: 'Закарпаття', bidsCount: 6,
      expectedValue: 14500000, riskScore: 55
    },
    {
      id: 'UA-2024-03-11-0523',
      title: 'Шкільні автобуси (10 одиниць) для сільських громад',
      value: 6200000, currency: 'UAH', status: 'active.awarding',
      procuringEntity: 'Рівненська ОВА',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      category: 'Транспорт', region: 'Рівне', bidsCount: 3,
      expectedValue: 6800000, riskScore: 14
    },
    {
      id: 'UA-2024-03-12-0601',
      title: 'Ліцензії Microsoft 365 для державних установ (5000 ліц.)',
      value: 2340000, currency: 'UAH', status: 'complete',
      procuringEntity: 'Міністерство цифрової трансформації',
      date: new Date(Date.now() - 86400000 * 8).toISOString(),
      category: 'Програмне забезпечення', region: 'Київ', bidsCount: 2,
      expectedValue: 2500000, riskScore: 31
    },
    {
      id: 'UA-2024-03-13-0678',
      title: 'Харчування для закладів освіти (нав. рік 2024-2025)',
      value: 3890000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'Одеська міська рада',
      date: new Date(Date.now() - 86400000 * 9).toISOString(),
      category: 'Харчування', region: 'Одеса', bidsCount: 8,
      expectedValue: 4200000, riskScore: 41
    },
    {
      id: 'UA-2024-03-14-0712',
      title: 'Генератори дизельні 100 кВт (15 од.) для критичної інфраструктури',
      value: 5670000, currency: 'UAH', status: 'active.qualification',
      procuringEntity: 'ДСНС України',
      date: new Date(Date.now() - 86400000 * 10).toISOString(),
      category: 'Енергетичне обладнання', region: 'Дніпро', bidsCount: 9,
      expectedValue: 6100000, riskScore: 20
    },
    {
      id: 'UA-2024-03-15-0834',
      title: 'Системи відеоспостереження для 48 шкіл',
      value: 1120000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'Вінницька міська рада',
      date: new Date(Date.now() - 86400000 * 11).toISOString(),
      category: 'Безпека', region: 'Вінниця', bidsCount: 5,
      expectedValue: 1300000, riskScore: 16
    },
    {
      id: 'UA-2024-03-16-0901',
      title: 'Протезування кінцівок для ветеранів (200 комплектів)',
      value: 9800000, currency: 'UAH', status: 'active.awarding',
      procuringEntity: 'Міністерство у справах ветеранів',
      date: new Date(Date.now() - 86400000 * 12).toISOString(),
      category: 'Медицина', region: 'Київ', bidsCount: 4,
      expectedValue: 10500000, riskScore: 9
    },
    {
      id: 'UA-2024-03-17-0956',
      title: 'CloudFlare Enterprise + WAF для e-Gov порталів',
      value: 780000, currency: 'UAH', status: 'complete',
      procuringEntity: 'ДІА',
      date: new Date(Date.now() - 86400000 * 13).toISOString(),
      category: 'Кібербезпека', region: 'Київ', bidsCount: 1,
      expectedValue: 800000, riskScore: 72
    },
    {
      id: 'UA-2024-03-18-1023',
      title: 'Реконструкція водопровідної мережі (12 км трубопроводу)',
      value: 7450000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'КП "Миколаївводоканал"',
      date: new Date(Date.now() - 86400000 * 14).toISOString(),
      category: 'Комунальні послуги', region: 'Миколаїв', bidsCount: 4,
      expectedValue: 8200000, riskScore: 38
    },
    {
      id: 'UA-2024-03-19-1089',
      title: 'Спецодяг та засоби захисту для рятувальників (5000 ком.)',
      value: 3100000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'ДСНС України',
      date: new Date(Date.now() - 86400000 * 15).toISOString(),
      category: 'Засоби захисту', region: 'Київ', bidsCount: 11,
      expectedValue: 3500000, riskScore: 15
    },
    {
      id: 'UA-2024-03-20-1145',
      title: 'Електробуси (20 од.) для міського транспорту',
      value: 14200000, currency: 'UAH', status: 'active.qualification',
      procuringEntity: 'КП "Черкасиелектротранс"',
      date: new Date(Date.now() - 86400000 * 16).toISOString(),
      category: 'Транспорт', region: 'Черкаси', bidsCount: 3,
      expectedValue: 16000000, riskScore: 28
    },
    {
      id: 'UA-2024-03-21-1201',
      title: 'Підручники для 1-4 класів НУШ (500 000 примірників)',
      value: 2890000, currency: 'UAH', status: 'active.tendering',
      procuringEntity: 'МОН України',
      date: new Date(Date.now() - 86400000 * 17).toISOString(),
      category: 'Освіта', region: 'Київ', bidsCount: 6,
      expectedValue: 3200000, riskScore: 22
    },
    {
      id: 'UA-2024-03-22-1267',
      title: 'Утилізація медичних відходів (річний контракт)',
      value: 520000, currency: 'UAH', status: 'unsuccessful',
      procuringEntity: 'КНП "Міська лікарня №2" Тернопіль',
      date: new Date(Date.now() - 86400000 * 18).toISOString(),
      category: 'Екологія', region: 'Тернопіль', bidsCount: 0,
      expectedValue: 600000, riskScore: 91
    }
  ];

  res.json({ tenders });
});

// 📊 Prozorro Analytics Endpoints
app.get('/api/v1/osint_ua/prozorro/stats', (req, res) => {
  res.json({
    analytics: {
      total_value: 2870000000,
      avg_risk: 61,
      critical_tenders: 147,
      categories: [
        { name: 'Будівництво', value: 1200000000, color: '#f59e0b' },
        { name: 'ПММ', value: 680000000, color: '#10b981' },
        { name: 'Медицина', value: 420000000, color: '#6366f1' },
        { name: 'ІТ', value: 320000000, color: '#0ea5e9' },
        { name: 'Дороги', value: 250000000, color: '#ec4899' },
      ],
      trends: [
        { date: '01.03', value: 82000000 }, { date: '05.03', value: 145000000 },
        { date: '10.03', value: 98000000 },  { date: '15.03', value: 220000000 },
        { date: '20.03', value: 170000000 }, { date: '25.03', value: 310000000 },
        { date: '30.03', value: 260000000 },
      ]
    }
  });
});

app.get('/api/v1/osint_ua/prozorro/analytics', (req, res) => {
  res.json({
    topProcuringEntities: [
      { name: 'Міноборони України', tendersCount: 3, totalValue: 14560000 },
      { name: 'ДСНС України', tendersCount: 2, totalValue: 8770000 },
      { name: 'МОН України', tendersCount: 2, totalValue: 5690000 },
      { name: 'Укравтодор', tendersCount: 1, totalValue: 12800000 },
      { name: 'НАК "Нафтогаз"', tendersCount: 1, totalValue: 3200000 }
    ],
    monthlyTrend: [
      { month: 'Вер 2023', count: 145, value: 890000000 },
      { month: 'Жов 2023', count: 167, value: 1020000000 },
      { month: 'Лис 2023', count: 134, value: 780000000 },
      { month: 'Гру 2023', count: 198, value: 1450000000 },
      { month: 'Січ 2024', count: 112, value: 670000000 },
      { month: 'Лют 2024', count: 156, value: 980000000 },
      { month: 'Бер 2024', count: 189, value: 1340000000 }
    ],
    savingsAnalysis: {
      expectedTotal: 118600000,
      actualTotal: 105530000,
      savings: 13070000,
      savingsPercent: 11.02
    }
  });
});

// ⛴️ MARITIME INTELLIGENCE MOCKS
app.get('/api/v1/maritime/vessels', (req, res) => {
  res.json([
    { id: 'v-1', name: 'OCEAN TITAN', flag: 'Panama', type: 'Container Ship', location: { lat: 46.48, lon: 30.72 }, status: 'moored', speed: 0, destination: 'Odessa, UA', eta: '2024-03-20T10:00:00Z', risk_score: 12 },
    { id: 'v-2', name: 'CRIMEA EXPRESS', flag: 'Russia', type: 'Oil Tanker', location: { lat: 44.61, lon: 33.52 }, status: 'underway', speed: 14.5, destination: 'Novorossiysk, RU', eta: '2024-03-18T14:30:00Z', risk_score: 88 },
    { id: 'v-3', name: 'BLACK SEA STAR', flag: 'Turkey', type: 'Bulk Carrier', location: { lat: 41.01, lon: 28.97 }, status: 'underway', speed: 11.2, destination: 'Chornomorsk, UA', eta: '2024-03-21T08:00:00Z', risk_score: 15 },
    { id: 'v-4', name: 'NORDIC SPIRIT', flag: 'Norway', type: 'Ro-Ro Cargo', location: { lat: 43.84, lon: 28.58 }, status: 'anchored', speed: 0.2, destination: 'Constanta, RO', eta: '2024-03-19T18:00:00Z', risk_score: 5 },
    { id: 'v-5', name: 'PHOENIX 1', flag: 'Malta', type: 'General Cargo', location: { lat: 45.21, lon: 29.73 }, status: 'underway', speed: 9.8, destination: 'Izmail, UA', eta: '2024-03-20T22:00:00Z', risk_score: 42 }
  ]);
});

app.get('/api/v1/maritime/ports', (req, res) => {
  res.json([
    { id: 'p-1', name: 'Одеський морський порт', country: 'Україна', location: { lat: 46.49, lon: 30.74 }, vessel_count: 12, capacity: 85, risk_level: 'medium' },
    { id: 'p-2', name: 'Порт Чорноморськ', country: 'Україна', location: { lat: 46.33, lon: 30.65 }, vessel_count: 8, capacity: 60, risk_level: 'low' },
    { id: 'p-3', name: 'Порт Південний', country: 'Україна', location: { lat: 46.61, lon: 31.01 }, vessel_count: 15, capacity: 92, risk_level: 'low' },
    { id: 'p-4', name: 'Порт Ізмаїл', country: 'Україна', location: { lat: 45.34, lon: 28.84 }, vessel_count: 24, capacity: 95, risk_level: 'medium' },
    { id: 'p-5', name: 'Констанца', country: 'Румунія', location: { lat: 44.17, lon: 28.66 }, vessel_count: 45, capacity: 78, risk_level: 'low' }
  ]);
});

// 🏢 REGISTRIES INTELLIGENCE MOCKS
app.get('/api/v1/registries/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  const results = [
    { edrpou: '39448822', name: 'ТОВ "МЕГА-ЛОГІСТИК ПЛЮС"', status: 'active', region: 'м. Київ', cers_score: 88.4 },
    { edrpou: '22334455', name: 'ПрАТ "УКР-ІМПОРТ-СИСТЕМА"', status: 'active', region: 'м. Львів', cers_score: 54.2 },
    { edrpou: '44556677', name: 'ТОВ "ВЕСТ-ГРУП КОРП"', status: 'active', region: 'м. Одеса', cers_score: 22.8 },
    { edrpou: '55667788', name: 'ТОВ "ЕНЕРГО-ТРЕЙДІНГ"', status: 'active', region: 'м. Дніпро', cers_score: 72.5 },
    { edrpou: '12345678', name: 'ТОВ "АЛЬФА ТРЕЙД"', status: 'terminated', region: 'м. Харків', cers_score: 95.0 }
  ].filter(c => c.name.toLowerCase().includes(query) || c.edrpou.includes(query));
  
  res.json({ results });
});

app.get('/api/v1/registries/company/:edrpou', (req, res) => {
  const { edrpou } = req.params;
  const company = {
    edrpou,
    name: edrpou === '39448822' ? 'ТОВ "МЕГА-ЛОГІСТИК ПЛЮС"' : 'Компанія з Реєстру',
    fullName: edrpou === '39448822' ? 'ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ "МЕГА-ЛОГІСТИК ПЛЮС"' : 'ПОВНА НАЗВА КОМПАНІЇ',
    status: 'Зареєстровано',
    registrationDate: '2014-10-15',
    address: 'м. Київ, вул. Велика Васильківська, буд. 100',
    authorizedCapital: 1500000,
    directors: [
      { name: 'Іваненко Петро Сергійович', role: 'Керівник', since: '2020-05-12' }
    ],
    beneficiaries: [
      { name: 'Сидоренко Олександр Миколайович', share: '100%', country: 'Україна' }
    ],
    activities: [
      { code: '46.90', name: 'Неспеціалізована оптова торгівля', primary: true },
      { code: '52.29', name: 'Інша допоміжна діяльність у сфері транспорту', primary: false }
    ],
    riskFactors: [
      { title: 'Офшорні зв\'язки', severity: 'high', description: 'Засновник має зв\'язки з юрисдикціями BVI' },
      { title: 'Часта зміна керівництва', severity: 'medium', description: 'Зміна директора 3 рази за 2 роки' }
    ],
    cers_data: {
      total_score: 88.4,
      layers: { behavioral: 92, institutional: 85, influence: 78, structural: 96, predictive: 88 }
    }
  };
  res.json(company);
});

// AI Agents
app.get('/api/v1/ai/agents', (req, res) => {
  res.json([
    { id: 'titan-1', name: 'TITAN Analyzer', status: 'active', tasksCompleted: DB_FACTS.length, accuracy: 0.97 },
    { id: 'inquisitor-1', name: 'INQUISITOR Scanner', status: 'active', tasksCompleted: Math.floor(DB_FACTS.length * 0.8), accuracy: 0.94 },
    { id: 'sovereign-1', name: 'SOVEREIGN Predictor', status: 'active', tasksCompleted: Math.floor(DB_FACTS.length * 0.6), accuracy: 0.91 }
  ]);
});

// =============================================
// 🧠 AI QUERY — ЗАЧІПАЄ РЕАЛЬНІ ДАНІ З БАЗИ
// =============================================

app.post(['/api/v1/ai/query', '/api/v1/nexus/chat'], (req, res) => {
  const query = req.body?.query || '';
  const qLower = query.toLowerCase();

  // Шукаємо по реальних даних в "базі"
  const matchingRecords = DB_FACTS.filter(d => {
    const text = `${d.goods_description} ${d.company_name} ${d.country_origin} ${d.customs_office} ${d.hs_code} ${d.date} ${d.goods_category}`.toLowerCase();
    return qLower.split(/\s+/).some(word => word.length > 2 && text.includes(word));
  });

  const sources = matchingRecords.slice(0, 5).map(d => ({
    id: d.id,
    title: `Декларація ${d.declaration_number}`,
    snippet: `${d.company_name} — ${d.goods_description} (${d.country_origin})`,
    score: d.risk_score / 100,
    database: 'PostgreSQL + OpenSearch'
  }));

  let responseText = '';

  if (DB_FACTS.length === 0) {
    responseText = `⚠️ База даних порожня. Завантажте файл через "Центр Даних" → "Додати Джерело" → "Запустити Імпорт", щоб дані з'явилися в системі.\n\nПісля завантаження я зможу аналізувати реальні декларації.`;
  } else if (matchingRecords.length > 0) {
    // Аналітика по знайдених записах
    const totalValue = matchingRecords.reduce((s, d) => s + d.customs_value_usd, 0);
    const avgValue = Math.round(totalValue / matchingRecords.length);
    const highRisk = matchingRecords.filter(d => d.risk_score > 70);
    const uniqueCompanies = [...new Set(matchingRecords.map(d => d.company_name))];
    const uniqueCountries = [...new Set(matchingRecords.map(d => d.country_origin))];
    const categories = {};
    matchingRecords.forEach(d => { categories[d.goods_category] = (categories[d.goods_category] || 0) + 1; });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    responseText = `📊 **Аналіз на основі ${matchingRecords.length} записів з бази (з ${DB_FACTS.length} загальних):**\n\n`;
    responseText += `📦 **Операції:** ${matchingRecords.length} декларацій знайдено\n`;
    responseText += `💰 **Загальна вартість:** $${totalValue.toLocaleString()} (середня: $${avgValue.toLocaleString()})\n`;
    responseText += `🏢 **Компанії:** ${uniqueCompanies.length} унікальних (${uniqueCompanies.slice(0, 3).join(', ')}${uniqueCompanies.length > 3 ? '...' : ''})\n`;
    responseText += `🌍 **Країни:** ${uniqueCountries.join(', ')}\n`;
    responseText += `📋 **Топ категорія:** ${topCategory ? `${topCategory[0]} (${topCategory[1]} записів)` : '—'}\n`;

    if (highRisk.length > 0) {
      responseText += `\n🔴 **РИЗИКОВІ ДЕКЛАРАЦІЇ:** ${highRisk.length} з підвищеним ризиком (>70)\n`;
      highRisk.slice(0, 3).forEach(d => {
        responseText += `  • ${d.declaration_number}: ${d.company_name} — ${d.goods_description} (ризик: ${d.risk_score}%)\n`;
      });
    }
  } else {
    // Загальна статистика по всій базі
    const totalValue = DB_FACTS.reduce((s, d) => s + d.customs_value_usd, 0);
    const highRisk = DB_FACTS.filter(d => d.risk_score > 70);
    const categories = {};
    DB_FACTS.forEach(d => { categories[d.goods_category] = (categories[d.goods_category] || 0) + 1; });

    responseText = `📊 **Загальна статистика бази (${DB_FACTS.length} записів):**\n\n`;
    responseText += `💰 Загальна вартість: $${totalValue.toLocaleString()}\n`;
    responseText += `🔴 Ризикових декларацій: ${highRisk.length}\n`;
    responseText += `📋 Категорії: ${Object.entries(categories).map(([k, v]) => `${k} (${v})`).join(', ')}\n`;
    responseText += `\nВаш запит "${query}" не знайшов прямих збігів. Спробуйте запитати про конкретну компанію, країну чи товар.`;
  }

  setTimeout(() => {
    res.json({
      answer: responseText,
      confidence: matchingRecords.length > 0 ? 0.95 : 0.6,
      sources,
      metadata: {
        records_searched: DB_FACTS.length,
        records_matched: matchingRecords.length,
        databases_queried: ['PostgreSQL', 'OpenSearch', 'Qdrant']
      }
    });
  }, 800);
});

// --- NEW: COPILOT API ---
app.post('/api/v1/copilot/chat', (req, res) => {
  const { message } = req.body;
  const qLower = (message || '').toLowerCase();
  
  const matchingRecords = DB_FACTS.filter(d => {
    const text = `${d.goods_description} ${d.company_name} ${d.country_origin} ${d.customs_office} ${d.hs_code} ${d.date} ${d.goods_category}`.toLowerCase();
    return qLower.split(/\s+/).some(word => word.length > 2 && text.includes(word));
  });

  const sources = matchingRecords.slice(0, 5).map(d => ({
    id: d.id,
    type: 'declaration',
    title: `Декларація ${d.declaration_number}`,
    snippet: `${d.company_name} — ${d.goods_description} (${d.country_origin})`,
    relevance: 0.9 + Math.random() * 0.1
  }));

  let reply = `Вітаю! Я AI Copilot системи Predator. Обробив ваш запит: "${message}".\n\n`;
  if (matchingRecords.length > 0) {
    reply += `Аналіз бази виявив **${matchingRecords.length}** відповідних операцій. Найбільша активність спостерігається у компанії **${matchingRecords[0].company_name}**.`;
  } else {
    reply += `Я не знайшов специфічних даних для цього запиту в поточній вибірці, але можу допомогти з налаштуванням параметрів звіту.`;
  }

  res.json({
    message_id: `msg-${Date.now()}`,
    reply: reply,
    sources: sources,
    tokens_used: 124
  });
});

app.post('/api/v1/copilot/chat/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { message } = req.body;
  const responseText = `Аналізую ваш запит щодо "${message}"... Система Predator підключає LLM-агента для обробки OSINT-даних. Знайдено відповідності в реєстрах.`;
  const chunks = responseText.split(' ');
  
  let i = 0;
  const interval = setInterval(() => {
    if (i < chunks.length) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', data: { content: chunks[i] + ' ' } })}\n\n`);
      i++;
    } else {
      res.write(`data: ${JSON.stringify({ type: 'complete', data: { message_id: Date.now() } })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 50);
});

// =============================================
// 📥 UNIVERSAL INGESTION ROUTER
// =============================================
let activeUploads = {};

app.post('/api/v1/ingest/upload/start', (req, res) => {
  const request_id = `req-${Date.now()}`;
  activeUploads[request_id] = { chunks: 0, startedAt: Date.now() };
  res.json({ request_id });
});

app.post('/api/v1/ingest/upload/chunk', (req, res) => {
  // Mock receiving a chunk
  const { request_id, index } = req.body || req.query; // If body is parsed or formData is not
  if (request_id && activeUploads[request_id]) {
    activeUploads[request_id].chunks++;
  }
  res.json({ success: true, index });
});

app.post('/api/v1/ingest/upload/complete', (req, res) => {
  const job_id = `file-${Date.now()}`;
  // Read from body (assuming multer or express body parser handles it, or from query/form)
  const filename = req.body?.filename || req.query?.filename || "upload.data";
  const source_type = req.body?.source_type || 'generic';

  let pipelineType = 'customs';
  if (filename.toLowerCase().endsWith('.pdf')) pipelineType = 'pdf';
  if (filename.toLowerCase().endsWith('.mp3')) pipelineType = 'audio';
  if (filename.toLowerCase().endsWith('.mp4')) pipelineType = 'video';
  if (filename.toLowerCase().includes('telegram')) pipelineType = 'telegram';

  const newJob = {
    job_id, id: job_id, source_id: job_id,
    source_file: filename, pipeline_type: pipelineType,
    state: 'CREATED',
    progress: { percent: 0, records_total: 1000, records_processed: 0, records_indexed: 0, stage: 'CREATED', details: `Started pipeline for ${filename}` },
    timestamps: { created_at: new Date().toISOString(), state_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    errors: []
  };

  etlJobs.unshift(newJob);
  DB_PIPELINE_STATE[job_id] = 'STARTED';
  emitEvent(job_id, 'FILE_UPLOADED', `Файл ${filename} прийнято до обробки`);

  if (pipelineType === 'customs') {
    runPipeline(job_id, filename);
  } else {
    // Basic fallback progress for other types
    setTimeout(() => { newJob.state = 'VALIDATING'; newJob.progress.percent = 20; }, 2000);
    setTimeout(() => { newJob.state = 'PROCESSING'; newJob.progress.percent = 60; }, 4000);
    setTimeout(() => { newJob.state = 'READY'; newJob.progress.percent = 100; newJob.progress.stage = 'COMPLETED'; }, 6000);
  }

  res.json({ success: true, id: job_id, job_id, source_id: job_id, message: "Pipeline initiated" });
});

app.post(['/api/v1/data-hub/upload', '/api/v1/ingest/upload', '/api/v1/ingestion/upload'], (req, res) => {
  const job_id = `etl-${Date.now()}`;
  // Detect source type from request body or filename
  const contentType = req.headers['content-type'] || '';
  const source_type = req.body?.source_type || 'customs';
  const filename = req.body?.filename || "Березень_2024.xlsx";

  // Determine pipeline based on file extension or explicit source_type
  let pipelineType = 'customs';
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext) || source_type === 'pdf') pipelineType = 'pdf';
  else if (['doc', 'docx'].includes(ext) || source_type === 'word') pipelineType = 'word';
  else if (['jpg', 'jpeg', 'png', 'webp', 'tiff'].includes(ext) || source_type === 'image') pipelineType = 'image';
  else if (['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext) || source_type === 'audio') pipelineType = 'audio';
  else if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext) || source_type === 'video') pipelineType = 'video';
  else if (['csv', 'xlsx', 'xls'].includes(ext) || ['customs', 'excel', 'csv'].includes(source_type)) pipelineType = 'customs';

  const source_file = filename;
  const PIPELINE_LABELS = {
    customs: 'Structured Data Reactor',
    pdf: 'Quantum Document Stack',
    word: 'Text Analysis Stack',
    image: 'Vision Analysis Layer',
    audio: 'Acoustic Signal Processing',
    video: 'Visual Frame Analysis'
  };

  const newJob = {
    job_id, id: job_id, source_id: job_id, source_file, pipeline_type: pipelineType,
    state: 'CREATED',
    progress: { percent: 0, records_total: 0, records_processed: 0, records_indexed: 0, stage: 'CREATED', details: `Ініціалізація ${PIPELINE_LABELS[pipelineType] || 'Pipeline'}...` },
    timestamps: { created_at: new Date().toISOString(), state_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    errors: []
  };

  etlJobs.unshift(newJob);
  DB_PIPELINE_STATE[job_id] = 'STARTED';
  emitEvent(job_id, 'PIPELINE_STARTED', `[${PIPELINE_LABELS[pipelineType]}] Запущено пайплайн для ${source_file}`);

  // Route to the correct pipeline
  switch (pipelineType) {
    case 'pdf': runPdfPipeline(job_id, source_file); break;
    case 'word': runWordPipeline(job_id, source_file); break;
    case 'image': runImagePipeline(job_id, source_file); break;
    case 'audio': runAudioPipeline(job_id, source_file); break;
    case 'video': runVideoPipeline(job_id, source_file); break;
    default: runPipeline(job_id, source_file); break;
  }

  res.json({ success: true, job_id, source_id: job_id, id: job_id, pipeline_type: pipelineType });
});

app.post(['/api/v1/ingest/telegram', '/v1/ingest/telegram'], (req, res) => {
  const { url, name } = req.body;
  const job_id = `tg-${Date.now()}`;
  const username = (url || '').split('/').filter(Boolean).slice(-1)[0]?.replace('@', '') || 'unknown';

  const newJob = {
    job_id, id: job_id, source_id: job_id,
    source_file: `telegram_${username}`, pipeline_type: 'telegram',
    state: 'CREATED',
    progress: { percent: 0, records_total: 0, records_processed: 0, records_indexed: 0, stage: 'CREATED', details: `Ініціалізація моніторингу @${username}...` },
    timestamps: { created_at: new Date().toISOString(), state_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    errors: []
  };

  etlJobs.unshift(newJob);
  DB_PIPELINE_STATE[job_id] = 'STARTED';
  emitEvent(job_id, 'TELEGRAM_PIPELINE_STARTED', `Запущено пайплайн для Telegram каналу @${username}`);

  // Запускаємо моніторинг
  runTelegramPipeline(job_id, url);

  res.json({ success: true, job_id, source_id: job_id, id: job_id, message: "Парсинг розпочато" });
});

// 🌐 Website ingestion endpoint
app.post(['/api/v1/ingest/website', '/v1/ingest/website'], (req, res) => {
  const { url } = req.body;
  const job_id = `web-${Date.now()}`;
  const domain = (url || 'unknown.com').replace(/https?:\/\//, '').split('/')[0];

  const newJob = {
    job_id, id: job_id, source_id: job_id,
    source_file: domain, pipeline_type: 'website',
    state: 'CREATED',
    progress: { percent: 0, records_total: 0, records_processed: 0, records_indexed: 0, stage: 'CREATED', details: `Ініціалізація Web Sonar для ${domain}...` },
    timestamps: { created_at: new Date().toISOString(), state_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    errors: []
  };

  etlJobs.unshift(newJob);
  DB_PIPELINE_STATE[job_id] = 'STARTED';
  emitEvent(job_id, 'WEBSITE_PIPELINE_STARTED', `Web Sonar активовано для ${domain}`);
  runWebsitePipeline(job_id, url);

  res.json({ success: true, job_id, source_id: job_id, id: job_id, message: `Crawling ${domain} розпочато` });
});

// ⚡ API ingestion endpoint
app.post(['/api/v1/ingest/api', '/v1/ingest/api'], (req, res) => {
  const { url, api_key } = req.body;
  const job_id = `api-${Date.now()}`;
  const endpoint = (url || 'api.example.com').replace(/https?:\/\//, '').split('/')[0];

  const newJob = {
    job_id, id: job_id, source_id: job_id,
    source_file: `api_${endpoint}`, pipeline_type: 'api',
    state: 'CREATED',
    progress: { percent: 0, records_total: 0, records_processed: 0, records_indexed: 0, stage: 'CREATED', details: `Ініціалізація API Stream Sync для ${endpoint}...` },
    timestamps: { created_at: new Date().toISOString(), state_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    errors: []
  };

  etlJobs.unshift(newJob);
  DB_PIPELINE_STATE[job_id] = 'STARTED';
  emitEvent(job_id, 'API_PIPELINE_STARTED', `Neural Stream Sync для ${endpoint}`);
  runApiPipeline(job_id, url);

  res.json({ success: true, job_id, source_id: job_id, id: job_id, message: `API інтеграція з ${endpoint} розпочата` });
});

// 📡 RSS ingestion endpoint
app.post(['/api/v1/ingest/rss', '/v1/ingest/rss'], (req, res) => {
  const { url } = req.body;
  const job_id = `rss-${Date.now()}`;
  const feedDomain = (url || 'news.example.com').replace(/https?:\/\//, '').split('/')[0];

  const newJob = {
    job_id, id: job_id, source_id: job_id,
    source_file: `rss_${feedDomain}`, pipeline_type: 'rss',
    state: 'CREATED',
    progress: { percent: 0, records_total: 0, records_processed: 0, records_indexed: 0, stage: 'CREATED', details: `Ініціалізація Plasma Stream для ${feedDomain}...` },
    timestamps: { created_at: new Date().toISOString(), state_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    errors: []
  };

  etlJobs.unshift(newJob);
  DB_PIPELINE_STATE[job_id] = 'STARTED';
  emitEvent(job_id, 'RSS_PIPELINE_STARTED', `Plasma News Stream для ${feedDomain}`);
  runRssPipeline(job_id, url);

  res.json({ success: true, job_id, source_id: job_id, id: job_id, message: `RSS моніторинг ${feedDomain} розпочато` });
});


// ETL Jobs listing
app.get('/api/v45/etl/jobs', (req, res) => { res.json({ jobs: etlJobs }); });
app.get('/api/v1/etl/jobs', (req, res) => { res.json({ jobs: etlJobs }); });
app.get('/api/v1/etl/status', (req, res) => {
  res.json({
    status: 'READY',
    active_jobs: etlJobs.filter(j => j.state !== 'READY' && j.state !== 'COMPLETED').length,
    total_records: DB_FACTS.length,
    new_docs_24h: Math.floor(DB_FACTS.length * 0.15) + (etlJobs.length * 12)
  });
});

// =============================================
// 🧠 NEURAL TRAINING ENGINE
// =============================================

let neuralTrainingState = {
  status: 'IDLE',
  progress: 0,
  activeModel: 'Predator-v45-X-Core',
  startTime: null,
  logs: []
};

app.get('/api/v1/neural/training/status', (req, res) => {
  if (neuralTrainingState.status === 'TRAINING') {
    const elapsed = (Date.now() - neuralTrainingState.startTime) / 1000;
    neuralTrainingState.progress = Math.min(100, elapsed * 2); // 1% every 0.5s

    if (neuralTrainingState.progress >= 100) {
      neuralTrainingState.status = 'COMPLETED';
    } else if (Math.random() > 0.7) {
      const epoch = Math.floor(neuralTrainingState.progress / 3.3);
      const loss = (0.5 * (1 - neuralTrainingState.progress / 100)).toFixed(4);
      const acc = (85 + (neuralTrainingState.progress / 100) * 14.5).toFixed(2);
      neuralTrainingState.logs.push(`[${new Date().toLocaleTimeString()}] Epoch ${epoch}: Loss=${loss} Acc=${acc}%`);
      if (neuralTrainingState.logs.length > 50) neuralTrainingState.logs.shift();
    }
  }
  res.json(neuralTrainingState);
});

app.post('/api/v1/neural/training/start', (req, res) => {
  neuralTrainingState = {
    status: 'TRAINING',
    progress: 0,
    activeModel: req.body.model || 'Predator-v45-X-Core',
    startTime: Date.now(),
    logs: [
      `[${new Date().toLocaleTimeString()}] Initializing Weights...`,
      `[${new Date().toLocaleTimeString()}] Optimizing for V45 Analytics Kernel...`,
      `[${new Date().toLocaleTimeString()}] Loading training dataset: Customs-Elite-v4...`
    ]
  };
  res.json({ success: true });
});

app.post('/api/v1/neural/training/stop', (req, res) => {
  neuralTrainingState.status = 'IDLE';
  res.json({ success: true });
});

app.get('/api/v1/neural/training/stats', (req, res) => {
  const stats = [
    { epoch: 1, loss: 2.5, accuracy: 30, val_loss: 2.8 },
    { epoch: 5, loss: 1.8, accuracy: 55, val_loss: 2.1 },
    { epoch: 10, loss: 1.2, accuracy: 72, val_loss: 1.5 },
    { epoch: 15, loss: 0.8, accuracy: 84, val_loss: 1.1 },
    { epoch: 20, loss: 0.5, accuracy: 91, val_loss: 0.8 },
    { epoch: 25, loss: 0.3, accuracy: 96, val_loss: 0.5 },
    { epoch: 30, loss: 0.15, accuracy: 98.5, val_loss: 0.35 },
  ];
  if (neuralTrainingState.status === 'TRAINING' || neuralTrainingState.status === 'COMPLETED') {
    const currentEpoch = Math.floor(neuralTrainingState.progress / 3.3);
    for (let i = 1; i <= currentEpoch; i++) {
      if (!stats.find(s => s.epoch === i * 3)) {
        stats.push({
          epoch: i * 3,
          loss: (2.5 * Math.pow(0.9, i)).toFixed(4),
          accuracy: (30 + i * 2).toFixed(2),
          val_loss: (2.8 * Math.pow(0.92, i)).toFixed(4)
        });
      }
    }
  }
  res.json(stats.sort((a, b) => a.epoch - b.epoch));
});

// Ingestion status
app.get(['/api/v1/agents', '/api/v1/ai/agents'], (req, res) => {
  res.json({
    agents: [
      { id: 'agent-1', name: 'Web Crawler', status: 'online' },
      { id: 'agent-2', name: 'Document Analysis', status: 'idle' }
    ]
  });
});

app.get(['/api/v1/ingest/jobs', '/api/v1/ingestion/jobs'], (req, res) => {
  res.json({ jobs: [] });
});
app.get(['/api/v1/ingest/status/:jobId', '/api/v1/ingestion/status/:jobId', '/api/v1/ingestion/jobs/:jobId'], (req, res) => {
  const job = etlJobs.find(j => j.job_id === req.params.jobId);
  if (job) {
    res.json(job);
  } else {
    res.json({ job_id: req.params.jobId, state: 'READY', progress: { percent: 100, stage: 'READY', details: 'Finished' } });
  }
});

// Pipeline events for a job
app.get('/api/v1/pipeline/events/:jobId', (req, res) => {
  const events = PIPELINE_EVENTS.filter(e => e.job_id === req.params.jobId);
  res.json({ events });
});

// =============================================
// 🔍 SEARCH — ШУКАЄ ПО РЕАЛЬНИХ ДАНИХ
// =============================================

// SSE Endpoint for real-time updates
app.get(['/api/v1/ingestion/stream/:jobId', '/api/v1/data-hub/stream/:jobId'], (req, res) => {
  const { jobId } = req.params;
  const job = etlJobs.find(j => j.job_id === jobId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const emitJob = (j) => {
    const sseData = {
      ...j,
      status: j.state === 'READY' ? 'ready' : j.state === 'FAILED' ? 'failed' : 'processing',
      stage: j.progress?.stage || 'INIT',
      sub_phase: j.progress?.details,
      percent: j.progress?.percent || 0,
      message: j.progress?.details,
      total: j.progress?.records_total || 0,
      current: j.progress?.records_processed || 0
    };
    res.write(`data: ${JSON.stringify(sseData)}\n\n`);
  }

  // Initial state emission
  if (job) {
    emitJob(job);
  }

  // Subscribe to global pipeline events for this jobId
  const interval = setInterval(() => {
    const latestJob = etlJobs.find(j => j.job_id === jobId);
    if (latestJob) {
      emitJob(latestJob);
      if (latestJob.state === 'READY' || latestJob.state === 'FAILED') {
        clearInterval(interval);
        res.end();
      }
    }
  }, 1000);

  req.on('close', () => clearInterval(interval));
});

app.get('/api/v1/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const queryWords = q.split(/\s+/).filter(Boolean);

  if (!q || DB_SEARCH_INDEX.length === 0) {
    return res.json({ results: [], total: 0, query: q });
  }

  const results = DB_SEARCH_INDEX
    .filter(doc => {
      const text = doc.text.toLowerCase();
      // Match if ANY word from the query is in the text
      return queryWords.some(word => word.length > 2 && text.includes(word));
    })
    .slice(0, 20)
    .map((doc, i) => ({
      id: doc.declaration.id,
      title: `[${doc.declaration.country_origin}] ${doc.declaration.declaration_number}: ${doc.declaration.goods_description}`,
      snippet: `${doc.declaration.company_name} | ${doc.declaration.customs_office} | $${doc.declaration.customs_value_usd.toLocaleString()}`,
      score: 0.95 - (i * 0.02),
      source: doc.declaration.country_origin === 'TELEGRAM' ? 'telegram' : 'customs-registry',
      category: doc.declaration.country_origin === 'TELEGRAM' ? 'intelligence' : 'customs',
      searchType: 'semantic-mock'
    }));

  res.json({ results, total: results.length, query: q });
});

app.post('/api/v1/search/customs', (req, res) => {
  const q = (req.body.query || '').toLowerCase();
  const queryWords = q.split(/\s+/).filter(Boolean);

  const results = DB_FACTS
    .filter(d => {
      if (!q) return true;
      const docString = `${d.goods_description} ${d.company_name} ${d.country_origin} ${d.date} ${d.hs_code}`.toLowerCase();
      // Simple mock semantic search: return true if at least one meaningful keyword matches the document
      return queryWords.some(word => word.length > 3 && docString.includes(word));
    })
    .slice(0, 20)
    .map(d => ({
      id: d.id,
      description: `${d.goods_description} — ${d.company_name}`,
      hs_code: d.hs_code,
      country_trading: d.country_origin,
      customs_office: d.customs_office,
      customs_value_usd: d.customs_value_usd,
      date: d.date,
      company: d.company_name,
      risk_score: d.risk_score,
      score: 0.95
    }));

  // Also include Telegram messages in the customs search if they mention any keywords!
  const tgResults = DB_SEARCH_INDEX
    .filter(doc => doc.source === 'customs-registry' || doc.declaration?.country_origin === 'TELEGRAM')
    .filter(doc => {
      if (!q) return false;
      const text = doc.text.toLowerCase();
      return queryWords.some(word => word.length > 3 && text.includes(word));
    })
    .slice(0, 10)
    .map(d => ({
      id: d.id,
      description: `[TELEGRAM] ${d.declaration.goods_description}`,
      hs_code: 'TG-MSG',
      country_trading: 'TELEGRAM',
      customs_office: d.declaration.company_name, // actually holds @channel
      customs_value_usd: 0,
      date: d.declaration.date,
      company: d.declaration.company_name,
      risk_score: d.declaration.risk_score,
      score: 0.88
    }));

  const allResults = [...results, ...tgResults].slice(0, 30);
  res.json({ results: allResults, total: allResults.length });
});

app.post('/api/v1/search/declarations', (req, res) => {
  const results = DB_FACTS.slice(0, 20).map(d => ({
    id: d.id,
    declarationNumber: d.declaration_number,
    company: d.company_name,
    value: d.customs_value_usd,
    status: d.status,
    date: d.date,
    goodsDescription: d.goods_description,
    country: d.country_origin,
    riskScore: d.risk_score
  }));
  res.json({ results, total: DB_FACTS.length, page: 1, pageSize: 20 });
});

// =============================================
// 📊 MONITORING & SYSTEM
// =============================================

app.get('/api/v1/monitoring/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  // Return real pipeline events if available
  const recentEvents = PIPELINE_EVENTS.slice(-limit).reverse().map(e => ({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    level: e.event.includes('FAIL') ? 'error' : e.event.includes('COMPLETE') ? 'success' : 'info',
    message: `[${e.event}] ${e.details}`,
    timestamp: e.timestamp,
    service: 'pipeline'
  }));
  if (recentEvents.length > 0) return res.json(recentEvents);

  res.json([{ id: `log-${Date.now()}`, level: 'info', message: 'Система в нормі. Очікує нових даних.', timestamp: new Date().toISOString() }]);
});

app.get('/api/v1/trinity/audit-logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = PIPELINE_EVENTS.slice(-limit).map((e, i) => ({
    id: `audit-${i}`, action: 'CREATE', entity: 'Declaration', user: 'system', timestamp: e.timestamp, details: e.details
  }));
  res.json(logs);
});

// Graph search
app.get('/api/v1/graph/search', (req, res) => {
  res.json({ nodes: DB_GRAPH.nodes.slice(0, 30), edges: DB_GRAPH.edges.slice(0, 50), total_nodes: DB_GRAPH.nodes.length, total_edges: DB_GRAPH.edges.length });
});

// Connectors / Sources — тепер повертає ВСІ типи джерел
app.get(['/api/v1/sources/connectors', '/api/v1/ingest/connectors'], (req, res) => {
  // Map all etlJobs to connectors
  const jobConnectors = etlJobs.map(j => {
    const pipeType = j.pipeline_type || 'customs';
    const typeMap = {
      'customs': 'excel', 'pdf': 'pdf', 'word': 'word', 'image': 'image',
      'audio': 'audio', 'video': 'video', 'telegram': 'telegram',
      'website': 'website', 'api': 'api', 'rss': 'rss'
    };
    return {
      id: j.job_id,
      name: j.source_file || j.job_id,
      type: typeMap[pipeType] || 'excel',
      status: j.state === 'READY' ? 'active' : j.state === 'FAILED' ? 'error' : 'processing',
      itemsCount: j.progress?.records_indexed || j.progress?.records_processed || 0,
      lastSync: j.timestamps?.updated_at || j.timestamps?.created_at,
      description: j.progress?.details || `Pipeline: ${pipeType}`,
      processingProgress: j.state !== 'READY' ? j.progress?.percent : undefined
    };
  });

  // Built-in demo sources (shown when no jobs have been run yet)
  const builtInSources = DB_FACTS.length > 0 ? [
    {
      id: 'src-customs-registry', name: 'Березень_2024.xlsx', type: 'excel',
      status: 'active', itemsCount: DB_FACTS.length,
      lastSync: new Date().toISOString(),
      description: 'Реєстр митних декларацій — Березень 2024'
    },
  ] : [];

  // Merge: etlJobs first, then built-in (filtering duplicates)
  const existingIds = new Set(jobConnectors.map(c => c.id));
  const mergedConnectors = [
    ...jobConnectors,
    ...builtInSources.filter(s => !existingIds.has(s.id))
  ];

  res.json(mergedConnectors);
});
app.get('/api/v1/sources/', (req, res) => { res.json([]); });

// System status
app.get('/api/v1/system/status', (req, res) => {
  res.json({ status: 'OPERATIONAL', stage: 'SOVEREIGN', uptime: '7d 14h', total_records: DB_FACTS.length });
});
app.get('/api/v1/system/stage', (req, res) => { res.json('SOVEREIGN'); });

app.get('/api/v1/system/infrastructure', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    components: {
      postgresql: { status: 'UP', version: '16.1', latency_ms: 2, records: DB_FACTS.length },
      opensearch: { status: 'UP', version: '2.11', latency_ms: 5, documents: DB_SEARCH_INDEX.length },
      qdrant: { status: 'UP', version: '1.7', latency_ms: 3, vectors: DB_VECTORS.length },
      graphdb: { status: 'UP', version: '5.0', latency_ms: 4, nodes: DB_GRAPH.nodes.length, edges: DB_GRAPH.edges.length },
      minio: { status: 'UP', version: '2024-01', latency_ms: 1, files: DB_FILES.length },
      redis: { status: 'UP', version: '7.2', latency_ms: 1, keys: Object.keys(DB_PIPELINE_STATE).length }
    }
  });
});

// Premium
app.get('/api/v1/premium/intelligence-alerts', (req, res) => {
  const highRisk = DB_FACTS.filter(d => d.risk_score > 75).slice(0, 10);
  const alerts = highRisk.map((d, i) => ({
    id: `alert-${d.id}-${i}`,
    severity: d.risk_score > 90 ? 'critical' : d.risk_score > 80 ? 'high' : 'medium',
    title: d.risk_score > 90 ? `КРИТИЧНИЙ РИЗИК: ${d.company_name}` : `Ризикова декларація: ${d.company_name}`,
    description: `${d.goods_description} з ${d.country_origin} — зафіксовано аномальний ризик ${d.risk_score}% (код: ${d.hs_code})`,
    timestamp: d.ingested_at,
    category: d.risk_score > 90 ? 'risk' : 'competitor',
    status: 'active',
    source: 'Neural Risk Scanner v45',
    data: { company: d.company_name, score: d.risk_score, value: d.customs_value_usd }
  }));

  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-initial-0',
      severity: 'critical',
      title: 'Система готова до аналізу',
      description: 'Чекаємо на перші дані для запуску нейронного сканера.',
      timestamp: new Date().toISOString(),
      category: 'system',
      status: 'active',
      source: 'System Runtime'
    });
  }
  res.json(alerts);
});

app.get('/api/v1/premium/alert-rules', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Падіння цін більше 15%',
      category: 'price',
      condition: 'price_change < -15%',
      threshold: -15,
      isEnabled: true,
      notifications: { email: true, push: true, sms: true },
      triggeredCount: 12
    },
    {
      id: '2',
      name: 'Новий конкурент в сегменті',
      category: 'competitor',
      condition: 'new_competitor_detected',
      threshold: 0,
      isEnabled: true,
      notifications: { email: true, push: true, sms: false },
      triggeredCount: 5
    },
    {
      id: '3',
      name: 'Ризик-скор вище 80',
      category: 'risk',
      condition: 'risk_score > 80',
      threshold: 80,
      isEnabled: true,
      notifications: { email: true, push: true, sms: true },
      triggeredCount: 3
    },
    {
      id: '4',
      name: 'Аномальна вартість (Outlier)',
      category: 'risk',
      condition: 'z-score > 3.0',
      threshold: 3,
      isEnabled: true,
      notifications: { email: false, push: true, sms: false },
      triggeredCount: 1
    }
  ]);
});

app.get('/api/v1/premium/trade-flows', (req, res) => {
  const countries = [
    { id: 'ua', name: 'Україна', code: 'UA', x: 55, y: 35, imports: 0, exports: 0 },
    { id: 'cn', name: 'Китай', code: 'CN', x: 78, y: 42, imports: 245000000, exports: 12000000 },
    { id: 'de', name: 'Німеччина', code: 'DE', x: 48, y: 32, imports: 89000000, exports: 45000000 },
    { id: 'pl', name: 'Польща', code: 'PL', x: 51, y: 33, imports: 78000000, exports: 56000000 },
    { id: 'tr', name: 'Туреччина', code: 'TR', x: 58, y: 45, imports: 67000000, exports: 23000000 },
    { id: 'vn', name: "В'єтнам", code: 'VN', x: 82, y: 52, imports: 56000000, exports: 5000000 },
    { id: 'us', name: 'США', code: 'US', x: 20, y: 38, imports: 28000000, exports: 15000000 }
  ];

  const flows = countries.filter(c => c.id !== 'ua').map((c, i) => ({
    id: `flow-${i}`,
    from: c.id,
    to: 'ua',
    value: c.imports,
    product: ['Електроніка', 'Хімія', 'Добрива', 'Метал', 'Текстиль', 'Обладнання'][i % 6],
    color: ['#22d3ee', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6'][i % 6]
  }));

  res.json({ countries, flows });
});

app.get('/api/v1/premium/market-segments', (req, res) => {
  res.json([
    { id: '1', name: 'Електроніка та компоненти', volume: 245000000, change: 18.5, trend: 'up', topPlayers: ['ТОВ "ТехноІмпорт"', 'ПрАТ "ЕлектроСвіт"'], avgPrice: 125, priceChange: -5.2 },
    { id: '2', name: 'Хімічна продукція', volume: 189000000, change: 7.2, trend: 'up', topPlayers: ['ТОВ "ХімТрейд"', 'ПрАТ "АгроХім"'], avgPrice: 2.45, priceChange: 12.3 },
    { id: '3', name: 'Будівельні матеріали', volume: 134000000, change: 22.1, trend: 'up', topPlayers: ['ТОВ "БудМат"', 'ПрАТ "СтройІмпорт"'], avgPrice: 18.5, priceChange: -2.8 }
  ]);
});

app.get('/api/v1/premium/opportunities', (req, res) => {
  res.json([
    { id: '1', type: 'price_drop', title: 'Падіння цін на LED панелі', description: 'Ціни з В\'єтнаму впали на 23%. Оптимальний час для закупівлі.', potentialSaving: 125000, confidence: 92, urgency: 'high' },
    { id: '2', type: 'new_supplier', title: 'Новий постачальник добрив з Польщі', description: 'Grupa Azoty запустила нову лінію. Ціни на 15% нижче ринку.', potentialSaving: 89000, confidence: 87, urgency: 'medium' }
  ]);
});

app.get('/api/v1/premium/dashboard-stats', (req, res) => {
  const totalValue = DB_FACTS.reduce((sum, d) => sum + (d.customs_value_usd || 0), 0);
  const riskCount = DB_FACTS.filter(d => d.risk_score > 80).length;

  res.json({
    profit: [
      { id: '1', label: 'Potential Revenue', value: `$${(totalValue / 1000000).toFixed(1)}M`, trend: '+12%', color: 'emerald' },
      { id: '2', label: 'Market Share', value: '18.5%', trend: '+2.1%', color: 'cyan' },
      { id: '3', label: 'Active Competitors', value: '142', trend: '-5', color: 'purple' },
      { id: '4', label: 'Hot Opportunities', value: '8', trend: 'NEW', color: 'amber' }
    ],
    control: [
      { id: '1', label: 'Critical Risks', value: riskCount.toString(), trend: '+1', color: 'rose' },
      { id: '2', label: 'Under Investigation', value: '12', trend: '+4', color: 'orange' },
      { id: '3', label: 'Linked Entities', value: (DB_FACTS.length * 5).toString(), trend: '+56', color: 'indigo' },
      { id: '4', label: 'Evidence Collected', value: '4.5GB', trend: '+200MB', color: 'blue' }
    ],
    feeds: {
      profit: [
        { time: '14:30', tag: 'OPPORTUNITY', title: 'High Demand: Electronics', desc: 'Competitor A ran out of stock. Estimated gap: $200k.' },
        { time: '12:15', tag: 'PRICE ALERT', title: 'Steel Prices Drop', desc: 'Global index down 4%. Good time to procure raw materials.' }
      ],
      control: [
        { time: '14:32', tag: 'CRITICAL', title: 'Under-invoicing Detected', desc: 'Container #8922 declared value is 40% below market average.' },
        { time: '12:20', tag: 'RELATION', title: 'Hidden Beneficiary', desc: 'Company Y connected to sanctioned entity via 2 intermediaries.' }
      ]
    }
  });
});

app.get('/api/v1/premium/ai-insights', (req, res) => {
  res.json([
    {
      id: '1',
      type: 'opportunity',
      priority: 'critical',
      title: 'Оптимальний час для закупівлі LED панелей',
      description: 'На основі аналізу декларацій, ціни на LED панелі досягли мінімуму. Прогнозується зростання на 18%.',
      confidence: 94,
      impact: 'Економія до $45,000',
      category: 'Закупівлі',
      createdAt: new Date().toISOString(),
      actionable: true,
      actions: [{ label: 'Знайти постачальників', type: 'primary' }],
      saved: false
    },
    {
      id: '2',
      type: 'anomaly',
      priority: 'high',
      title: 'Незвична активність компанії "ТрансСхема"',
      description: 'Виявлено 340% зростання імпорту за останній тиждень.',
      confidence: 87,
      impact: 'Ризик: $120,000',
      category: 'Ризики',
      createdAt: new Date().toISOString(),
      actionable: true,
      actions: [{ label: 'Розпочати розслідування', type: 'primary' }],
      saved: true
    }
  ]);
});

app.get('/api/v1/intelligence/report/:ueid', (req, res) => {
  const { ueid } = req.params;
  const company = COMPANIES.find(c => c.edrpou === ueid) || { name: 'Невідома Компанія', edrpou: ueid };

  const mockReport = `
# 🦅 ЕКСПЕРТНИЙ ЗВІТ SOVEREIGN ADVISOR: ${company.name}
**Дата генерації:** ${new Date().toLocaleString()} | **UEID:** ${ueid}

## 1. STRATEGIC OVERVIEW
Об'єкт демонструє **${company.risk === 'high' ? 'КРИТИЧНО ВИСОКИЙ' : 'ПОМІРНИЙ'}** рівень системного ризику. 
На основі аналізу 5-шарової моделі CERS, виявлено ознаки аномальної активності в сегментах міжнародної торгівлі.

## 2. 5-LAYER RISK ANALYSIS (CERS v55.2)
*   **Behavioral (Поведінковий):** ${company.risk === 'high' ? '92%' : '24%'} - Виявлено різкі стрибки обсягів операцій у нетипові періоди.
*   **Institutional (Інституційний):** ${company.risk === 'high' ? '85%' : '15%'} - Компанія змінила 3 директорів за останні 6 місяців.
*   **Influence (Вплив):** ${company.risk === 'high' ? '78%' : '12%'} - Прямі зв'язки з політично значущими особами (PEP).
*   **Structural (Структурний):** ${company.risk === 'high' ? '96%' : '18%'} - Складна мережа офшорних бенефіціарів (BVI, Cyprus).
*   **Predictive (Прогностичний):** ${company.risk === 'high' ? '88%' : '21%'} - Висока ймовірність заниження митної вартості у наступному кварталі.

## 3. SHADOW DISCOVERY & CARTELS
Виявлено приховану мережу (**Shadow Network ID: SN-102**), що об'єднує ${company.name} з 4 іншими контрагентами. 
Ймовірний спільний центр прийняття рішень знаходиться за межами юрисдикції України.

## 4. РЕКОМЕНДАЦІЇ
1. **НЕГАЙНО:** Провести поглиблений аудит останніх 12 декларацій.
2. **МОНІТОРИНГ:** Встановити цілодобовий нагляд за фінансовими потоками.
3. **ЕСКАЛАЦІЯ:** Передати матеріали до відповідного підрозділу розслідувань.

---
*Звіт згенеровано автоматично системою PREDATOR Analytics v55.2-SM-EXTENDED.*
  `;

  res.json({
    ueid,
    report: mockReport,
    generated_at: new Date().toISOString()
  });
});

app.get('/api/v1/premium/predictions', (req, res) => {
  res.json([
    { id: '1', title: 'Імпорт електроніки', currentValue: 245, predictedValue: 289, timeframe: '30 днів', confidence: 87, trend: 'up' },
    { id: '2', title: 'Ціни на добрива', currentValue: 420, predictedValue: 385, timeframe: '14 днів', confidence: 82, trend: 'down' }
  ]);
});

app.get('/api/v1/premium/risk-entities', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'ТОВ "ТрансСхема"',
      edrpou: '12345678',
      riskScore: 94,
      riskLevel: 'critical',
      flags: ['Заниження вартості', 'Офшорні зв\'язки', 'Карусельна схема'],
      lastActivity: '2026-02-01',
      totalOperations: 156,
      suspiciousAmount: 8900000,
      linkedEntities: 12,
      investigations: 2
    },
    {
      id: '2',
      name: 'ПрАТ "ІмпортОптима"',
      edrpou: '23456789',
      riskScore: 87,
      riskLevel: 'high',
      flags: ['Зміна кодів УКТЗЕД', 'Нетипові обсяги'],
      lastActivity: '2026-01-30',
      totalOperations: 89,
      suspiciousAmount: 4500000,
      linkedEntities: 5,
      investigations: 1
    }
  ]);
});

app.get('/api/v1/premium/investigations', (req, res) => {
  res.json([
    {
      id: '1',
      entityName: 'ТОВ "ТрансСхема"',
      status: 'in_progress',
      priority: 'critical',
      assignedTo: 'Слідчий Коваленко О.І.',
      createdAt: '2026-01-15',
      findings: 8,
      potentialRecovery: 4500000
    },
    {
      id: '2',
      entityName: 'ПрАТ "ІмпортОптима"',
      status: 'escalated',
      priority: 'high',
      assignedTo: 'Прокурор Бондаренко Г.В.',
      createdAt: '2026-01-10',
      findings: 12,
      potentialRecovery: 7800000
    }
  ]);
});

app.get('/api/v1/premium/sanctions-results', (req, res) => {
  res.json([
    {
      id: '1',
      entityName: 'TransGlobal Logistics Ltd',
      entityType: 'company',
      status: 'clean',
      timestamp: new Date().toISOString(),
      matches: [],
      searchId: 'SCR-2026-001'
    },
    {
      id: '2',
      entityName: 'Nord Stream Enterprizes',
      entityType: 'company',
      status: 'blocked',
      timestamp: new Date().toISOString(),
      matches: [
        { id: 'm1', list: 'OFAC', program: 'SDN', target: 'Nord Stream Enterprizes', details: 'Blocked Entity', severity: 'high', dateMismatch: false, score: 100 }
      ],
      searchId: 'SCR-2026-002'
    }
  ]);
});

app.get('/api/v1/premium/rules', (req, res) => {
  res.json([
    { id: 'fraud_round', name: 'Suspicious round amounts', category: 'fraud', enabled: true },
    { id: 'sanctions_country', name: 'Sanctioned country', category: 'sanctions', enabled: true },
    { id: 'duplicate_decl', name: 'Duplicate declaration', category: 'quality', enabled: true },
    { id: 'hs_mismatch', name: 'Invalid HS code', category: 'customs', enabled: false }
  ]);
});

app.get('/api/v1/premium/costs', (req, res) => {
  res.json([
    { resource: 'LLM API', used: 12.45, limit: 50, color: 'emerald' },
    { resource: 'Embeddings', used: 3.20, limit: 20, color: 'blue' },
    { resource: 'Scraping', used: 1.80, limit: 10, color: 'amber' },
    { resource: 'Telegram', used: 0, limit: 5, color: 'cyan' }
  ]);
});

app.get('/api/v1/premium/commodity-forecast', (req, res) => {
  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'];
  res.json(months.map((month) => ({ month, actual: 100 + Math.random() * 50, forecast: 120 + Math.random() * 60 })));
});

app.get('/api/v1/premium/competitors', (req, res) => {
  const companyStats = {};
  DB_FACTS.forEach(d => {
    if (!companyStats[d.company_name]) {
      companyStats[d.company_name] = { name: d.company_name, imports: 0, exports: 0, topProductsSet: new Set(), countriesSet: new Set(), trend: 'up' };
    }
    const stat = companyStats[d.company_name];
    if (d.operation_type === 'Імпорт') stat.imports += d.customs_value_usd;
    else stat.exports += d.customs_value_usd;
    stat.topProductsSet.add(d.goods_category);
    stat.countriesSet.add(d.country_origin);
  });

  const competitors = Object.values(companyStats)
    .sort((a, b) => b.imports - a.imports)
    .slice(0, 5)
    .map((c, i) => ({
      name: c.name,
      imports: c.imports,
      exports: c.exports,
      topProducts: Array.from(c.topProductsSet).slice(0, 2),
      countries: Array.from(c.countriesSet).slice(0, 2),
      trend: i % 2 === 0 ? 'up' : 'stable',
      marketShare: Number((15 - i * 1.5).toFixed(1))
    }));

  if (competitors.length === 0) {
    competitors.push(
      { name: 'ТОВ "Укрторг"', imports: 15420000, exports: 2100000, topProducts: ['Електроніка', 'Комплектуючі'], countries: ['Китай', 'В\'єтнам'], trend: 'up', marketShare: 12.5 },
      { name: 'ТОВ "ГлобалТрейд"', imports: 12800000, exports: 8900000, topProducts: ['Хімія', 'Пластик'], countries: ['Німеччина', 'Польща'], trend: 'up', marketShare: 10.2 }
    );
  }
  res.json(competitors);
});

app.get('/api/v1/premium/suppliers', (req, res) => {
  const suppliersMap = {};
  DB_FACTS.forEach(d => {
    const key = `${d.country_origin}-${d.goods_category}`;
    if (!suppliersMap[key]) {
      suppliersMap[key] = {
        id: `sup-${Object.keys(suppliersMap).length}`,
        name: `${d.country_origin} ${d.goods_category} Supplier`,
        country: d.country_origin,
        countryCode: d.country_origin.substring(0, 2).toUpperCase(),
        city: 'Capital City',
        products: [d.goods_description],
        totalExportVolume: d.customs_value_usd * 10,
        avgPrice: d.customs_value_usd / (d.weight_kg || 1),
        priceCompetitiveness: 70 + Math.floor(Math.random() * 25),
        ukraineClients: 1 + Math.floor(Math.random() * 50),
        reliability: 80 + Math.floor(Math.random() * 19),
        leadTime: 5 + Math.floor(Math.random() * 20),
        lastShipment: d.date,
        certifications: ['ISO 9001', 'CE'],
        verified: true,
        isFavorite: false
      };
    } else {
      if (!suppliersMap[key].products.includes(d.goods_description)) {
        suppliersMap[key].products.push(d.goods_description);
      }
      suppliersMap[key].totalExportVolume += d.customs_value_usd;
    }
  });

  let suppliers = Object.values(suppliersMap).sort((a, b) => b.totalExportVolume - a.totalExportVolume).slice(0, 10);

  if (suppliers.length === 0) {
    suppliers = [{
      id: '1', name: 'Shenzhen Technology Co., Ltd', country: 'Китай', countryCode: 'CN', city: 'Shenzhen', products: ['LED панелі', 'Електроніка', 'Компоненти'], totalExportVolume: 45000000, avgPrice: 12.5, priceCompetitiveness: 92, ukraineClients: 28, reliability: 94, leadTime: 14, lastShipment: '2026-01-28', certifications: ['ISO 9001', 'CE', 'RoHS'], verified: true, isFavorite: false
    }];
  }

  res.json(suppliers);
});

app.get('/api/v1/premium/price-comparison', (req, res) => {
  const categoryStats = {};
  DB_FACTS.forEach(d => {
    if (!categoryStats[d.goods_category]) {
      categoryStats[d.goods_category] = {
        id: `prod-${Object.keys(categoryStats).length}`,
        name: `${d.goods_category} (Середній кошик)`,
        category: d.goods_category,
        hsCode: d.hs_code,
        unit: 'кг',
        prices: [],
        offers: []
      };
    }
    const price = d.customs_value_usd / (d.weight_kg || 1);
    categoryStats[d.goods_category].prices.push(price);

    if (categoryStats[d.goods_category].offers.length < 4) {
      categoryStats[d.goods_category].offers.push({
        id: `off-${d.id}`,
        supplierName: d.company_name,
        country: d.country_origin,
        countryCode: d.country_origin.substring(0, 2).toUpperCase(),
        price: Number(price.toFixed(2)),
        currency: 'USD',
        minQuantity: Math.floor(Math.random() * 100) + 10,
        leadTime: 5 + Math.floor(Math.random() * 15),
        reliability: 85 + Math.floor(Math.random() * 14),
        lastUpdated: d.date,
        priceHistory: [],
        isVerified: true,
        isBestPrice: false
      });
    }
  });

  const products = Object.values(categoryStats).map(p => {
    p.avgPrice = Number((p.prices.reduce((a, b) => a + b, 0) / p.prices.length).toFixed(2));
    delete p.prices;
    if (p.offers.length > 0) {
      const minPrice = Math.min(...p.offers.map(o => o.price));
      p.offers.forEach(o => o.isBestPrice = o.price === minPrice);
    }
    return p;
  });

  if (products.length === 0) {
    products.push({
      id: '1', name: 'LED панелі 55" (4K, IPS)', category: 'Електроніка', hsCode: '8528.72', unit: 'шт', avgPrice: 145,
      offers: [
        { id: '1a', supplierName: 'Shenzhen Display Co.', country: 'Китай', countryCode: 'CN', price: 125, currency: 'USD', minQuantity: 100, leadTime: 14, reliability: 94, lastUpdated: '2026-02-03', priceHistory: [], isVerified: true, isBestPrice: true },
        { id: '1b', supplierName: 'Vietnam Panels Ltd', country: "В'єтнам", countryCode: 'VN', price: 132, currency: 'USD', minQuantity: 50, leadTime: 18, reliability: 88, lastUpdated: '2026-02-02', priceHistory: [], isVerified: true, isBestPrice: false }
      ]
    });
  }

  res.json(products);
});

// Database stats API
app.get('/api/v1/database/stats', (req, res) => {
  res.json({
    postgresql: { records: DB_FACTS.length, size_mb: Math.round(DB_FACTS.length * 0.5 / 1024) },
    opensearch: { documents: DB_SEARCH_INDEX.length, index_size_mb: Math.round(DB_SEARCH_INDEX.length * 0.3 / 1024) },
    qdrant: { vectors: DB_VECTORS.length, dimensions: 384 },
    graph: { nodes: DB_GRAPH.nodes.length, edges: DB_GRAPH.edges.length },
    minio: { files: DB_FILES.length },
    pipeline_events: PIPELINE_EVENTS.length
  });
});

// Databases
app.get('/api/v1/databases/', (req, res) => {
  res.json([
    { id: 'pg-1', name: 'PostgreSQL (Facts)', type: 'relational', status: 'online', records: DB_FACTS.length },
    { id: 'os-1', name: 'OpenSearch (Index)', type: 'search', status: 'online', records: DB_SEARCH_INDEX.length },
    { id: 'qd-1', name: 'Qdrant (Vectors)', type: 'vector', status: 'online', records: DB_VECTORS.length },
    { id: 'ng-1', name: 'Neo4j (Graph)', type: 'graph', status: 'online', records: DB_GRAPH.nodes.length + DB_GRAPH.edges.length }
  ]);
});

// Optimizer
app.get('/api/v1/optimizer/status', (req, res) => {
  res.json({ status: 'IDLE', last_run: new Date().toISOString(), efficiency_gain: '12.4%' });
});

app.get('/api/v1/llm/providers', (req, res) => {
  res.json([{ id: 'openai', name: 'OpenAI (GPT-4)', status: 'active', latency: 240 }]);
});

// --- PREMIUM ENDPOINTS (must be BEFORE catch-all) ---
app.get('/api/v1/premium/market-trends', (req, res) => {
  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
  const results = months.map((m, i) => ({
    label: m,
    value: 80 + Math.floor(Math.random() * 50) + (i * 5),
    trend: Math.floor(Math.random() * 20 - 5)
  }));
  res.json(results);
});

app.get('/api/v1/newspaper', (req, res) => {
  const highRiskCount = DB_FACTS.filter(d => d.risk_score > 70).length;
  const totalVolume = DB_FACTS.reduce((acc, d) => acc + d.customs_value_usd, 0);

  res.json({
    metrics: [
      { label: 'Активні алерти', value: highRiskCount.toString(), change: -2, trend: 'down' },
      { label: 'Можливості ринку', value: '12', change: 3, trend: 'up' },
      { label: 'Ринковий скор', value: '78%', change: 5, trend: 'up' },
      { label: 'Рівень ризику', value: highRiskCount > 10 ? 'ВИСОКИЙ' : 'НИЗЬКИЙ', change: -8, trend: 'down' }
    ],
    stats: {
      total_documents: DB_FACTS.length,
      new_documents_24h: 42,
      system_health: 'Optimal'
    },
    recommendations: [
      'Переглянути постачальників у секторі електроніки',
      'Звернути увагу на ріст цін на логістику в Чорному морі',
      'Оптимізувати податкове навантаження через нові пільги'
    ],
    news: DB_FACTS.slice(0, 5).map(d => ({
      id: d.id,
      title: d.goods_description,
      type: d.operation_type,
      time: d.created_at,
      risk: d.risk_score
    })),
    sections: [
      {
        id: 'critical',
        title: '🚨 Критичні події',
        priority: 'critical',
        items: [
          {
            id: 'c-1',
            type: 'alert',
            title: 'Аномальна концентрація імпорту',
            summary: `Виявлено завантаження від нових постачальників на суму $${(totalVolume / 10).toFixed(1)}M`,
            impact: 'Потенційний демпінг на ринку електроніки',
            timestamp: '2 години тому',
            tags: ['імпорт', 'ризик', 'електроніка'],
            actionable: true
          }
        ]
      },
      {
        id: 'opportunities',
        title: '📈 Можливості та Тренди',
        priority: 'high',
        items: [
          {
            id: 'o-1',
            type: 'opportunity',
            title: 'Нова ніша: С/Г техніка',
            summary: 'Попит на запчастини зріс на 45% за останній тиждень',
            value: '$2.4М',
            timestamp: '6 годин тому',
            tags: ['сг-техніка', 'тренд'],
            actionable: true
          }
        ]
      }
    ],
    summary: `Сьогодні система PREDATOR зафіксувала ${highRiskCount} критичних алерти та 12 нових можливостей. Загальний стан ринку оцінюється як стабільний.`
  });
});



// =============================================
// 🌐 SERVER START
// =============================================

// =============================================
// 🤖 CO-PILOT AGENT SYSTEM (Dual-Agent + Fallback)
// =============================================

async function callOllama(prompt) {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3.1',
        prompt: prompt,
        stream: false
      })
    });
    if (!response.ok) throw new Error('Ollama offline');
    const data = await response.json();
    return data.response;
  } catch (e) {
    console.warn("⚠️ Ollama Fallback Triggered:", e.message);
    return null;
  }
}

async function callGitHubCopilot(prompt) {
  return new Promise((resolve) => {
    exec(`gh copilot explain "${prompt.replace(/"/g, '\\"')}"`, (error, stdout) => {
      if (error) {
        console.warn("⚠️ GH Copilot Fallback Triggered:", error.message);
        resolve(null);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function callGeminiCLI(prompt) {
  return new Promise((resolve) => {
    exec(`gemini --prompt "${prompt.replace(/"/g, '\\"')}"`, (error, stdout) => {
      if (error) {
        console.warn("⚠️ Gemini CLI Fallback Triggered:", error.message);
        resolve(null);
      } else {
        resolve(stdout);
      }
    });
  });
}

// REST API Fallback
async function callGeminiAPI(prompt) {
  const apiKey = getNextGeminiKey();
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "Вибачте, всі агенти зараз недоступні. Спробуйте пізніше.";
  }
}

app.post('/api/v1/ai/query', async (req, res) => {
  const { query, mode } = req.body;

  if (mode === 'voice') {
    console.log("🎤 Processing Voice Query...");
  }

  console.log(`🤖 Neural Consensus: Integrating Local Brain with Gemini Mouth for query: "${query}"`);

  // --- PHASE 1: THE BRAIN (Local Context & Facts) ---
  let localData = "";
  let dataAgent = "Direct Intelligence";

  // First priority: Local Llama 3 for project-specific facts
  const llamaAnalysis = await callOllama(`Analyze this request and extract relevant facts or code context from Predator Analytics project. Query: ${query}`);
  if (llamaAnalysis) {
    localData = llamaAnalysis;
    dataAgent = "Llama 3 (Local)";
  } else {
    // Second priority: GitHub Copilot CLI for engineering deep-dive
    const ghContext = await callGitHubCopilot(`Explain context for: ${query}`);
    if (ghContext) {
      localData = ghContext;
      dataAgent = "GitHub Copilot CLI";
    }
  }

  // --- PHASE 2: THE MOUTH (Gemini Reasoning & Communication) ---
  const orchestratorPrompt = `
    Ви — головний інтелект Predator v45 | Neural Analytics (базуєтесь на Gemini 1.5 Pro).
    Ваше завдання: відповісти користувачу, використовуючи надані ЛОКАЛЬНІ ДАНІ від нашого внутрішнього аналітичного ядра (${dataAgent}).
    
    ВНУТРІШНІ ДАНІ:
    ---
    ${localData || "Локальні деталі проекту недоступні для цього запиту."}
    ---
    
    ЗАПИТ КОРИСТУВАЧА: "${query}"
    
    ВИМОГИ ДО ВІДПОВІДІ:
    1. Говоріть впевнено, як вищий когнітивний інтелект.
    2. Використовуйте внутрішні дані, щоб бути максимально точними.
    3. Якщо внутрішні дані містять помилки, виправте їх своєю логікою.
    4. Зробіть відповідь "premium" — структурованою, цікавою та професійною.
    5. Ви — єдине вікно комунікації. Користувач не повинен бачити "сирі" дані, а лише вашу оброблену відповідь.
  `;

  let finalAnswer = await callGeminiAPI(orchestratorPrompt);

  res.json({
    answer: finalAnswer,
    agent: `Gemini 1.5 Pro (Brain: ${dataAgent})`,
    timestamp: new Date().toISOString()
  });
});

// =============================================
// 🎙️ SPEECH TO TEXT & TEXT TO SPEECH
// =============================================

app.post('/api/v1/ai/stt', upload.single('audio'), async (req, res) => {
  try {
    const audioBytes = fs.readFileSync(req.file.path).toString('base64');
    const audio = { content: audioBytes };
    const config = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'uk-UA',
    };
    const request = { audio: audio, config: config };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    res.json({ text: transcription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/ai/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    console.log(`[TTS] 🎙️ Processing request: "${text.substring(0, 50)}..."`);

    try {
      const request = {
        input: { text: text },
        // Using Wavenet-A for superior quality, Female to match 'Lesya'
        voice: {
          name: 'uk-UA-Wavenet-A',
          languageCode: 'uk-UA',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0
        },
      };

      console.log(`[TTS] 🚀 Attempting Google Cloud Wavenet (uk-UA-Wavenet-A)...`);

      const [response] = await ttsClient.synthesizeSpeech(request);
      res.set('Content-Type', 'audio/mp3');
      return res.send(response.audioContent);
    } catch (googleErr) {
      console.warn(`[TTS] ⚠️ Google Cloud failed: ${googleErr.message}`);
      console.log(`[TTS] 🔄 Falling back to MacOS 'say' (System Voice: Lesya)...`);

      // Fallback to MacOS 'say' + 'ffmpeg'
      const tempId = Date.now();
      const tempAiff = path.join('uploads', `fallback_${tempId}.aiff`);
      const tempMp3 = path.join('uploads', `fallback_${tempId}.mp3`);

      // Clean text for shell
      const safeText = text.replace(/["'`]/g, '');

      const sayCmd = `say -v Lesya "${safeText}" -o ${tempAiff}`;
      const ffmpegCmd = `ffmpeg -i ${tempAiff} -codec:a libmp3lame -qscale:a 2 ${tempMp3}`;

      exec(`${sayCmd} && ${ffmpegCmd}`, (error) => {
        if (error) {
          console.error(`[TTS] ❌ Fallback failed: ${error.message}`);
          return res.status(500).json({ error: "All TTS engines failed" });
        }

        try {
          const audioBuffer = fs.readFileSync(tempMp3);
          console.log(`[TTS] 🆗 Fallback successful (MacOS Lesya)`);
          res.set('Content-Type', 'audio/mp3');
          res.send(audioBuffer);

          // Cleanup
          setTimeout(() => {
            if (fs.existsSync(tempAiff)) fs.unlinkSync(tempAiff);
            if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
          }, 5000);
        } catch (readErr) {
          res.status(500).json({ error: "Failed to read fallback audio" });
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed initial data
console.log('🌱 Seeding initial database facts...');
const initialData = generateDeclarations(100, 'initial_seed.xlsx');
DB_FACTS.push(...initialData);

// Додаємо демонстраційні завдання ETL
etlJobs.push(
  { 
    job_id: 'job-1710528000000', 
    source_file: 'МИТНИЙ_РЕЄСТР_2024.xlsx', 
    pipeline_type: 'customs', 
    state: 'READY',
    progress: { records_processed: 125000, records_indexed: 124982, percent: 100, details: 'Обробка завершена успішно' },
    timestamps: { created_at: '2024-03-15T10:00:00Z', updated_at: '2024-03-15T10:15:00Z' }
  },
  { 
    job_id: 'job-1710531600000', 
    source_file: 'tax_report_q1.pdf', 
    pipeline_type: 'pdf', 
    state: 'PROCESSING',
    progress: { records_processed: 4500, records_indexed: 4400, percent: 65, details: 'Видобування таблиць з PDF...' },
    timestamps: { created_at: '2024-03-15T11:00:00Z', updated_at: '2024-03-15T11:05:00Z' }
  }
);
// WebSocket for real-time updates
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/api/v45/ws/omniscience' || pathname === '/api/v1/ws/system/events') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('✅ New Omniscience WS Client connected');

  const interval = setInterval(() => {
    if (ws.readyState !== 1) return;

    const cpu = 24 + Math.random() * 15;
    const ram = 45 + Math.random() * 20;
    const timestamp = new Date().toISOString();
    const pulseScore = Math.floor(85 + Math.random() * 15);

    ws.send(JSON.stringify({
      pulse: {
        score: pulseScore,
        status: pulseScore > 90 ? 'HEALTHY' : 'DEGRADED',
        reasons: pulseScore > 90 ? ['Neural Core Operational'] : ['Minor latency in sector 7'],
        alerts: []
      },
      system: {
        cpu_percent: cpu,
        memory_percent: ram,
        timestamp: timestamp,
        active_containers: 12,
        container_raw: "v45-ready-nvidia"
      },
      training: { active: false, progress: 0 },
      audit_logs: [],
      sagas: [],
      v45Realtime: {
        cpu: cpu,
        memory: ram,
        timestamp: timestamp
      }
    }));
  }, 2000);

  ws.on('close', () => clearInterval(interval));
});

export default app;

app.get('/api/v1/premium/top-importers', (req, res) => {
  const companyStats = {};
  DB_FACTS.forEach(d => {
    if (d.operation_type === 'Імпорт') {
      if (!companyStats[d.company_name]) {
        companyStats[d.company_name] = { name: d.company_name, volume: 0, value: 0, growth: Math.floor(Math.random() * 40 - 15), risk: d.risk_score };
      }
      companyStats[d.company_name].volume += d.weight_kg || 1000;
      companyStats[d.company_name].value += d.customs_value_usd;
    }
  });
  let results = Object.values(companyStats).sort((a, b) => b.value - a.value).slice(0, 10);
  if (results.length === 0) {
    results = [
      { name: 'АльфаТрейд ТОВ', volume: 12450000, value: 89000000, growth: 34.2, risk: 12 },
      { name: 'ГлобалІмпорт', volume: 9800000, value: 67000000, growth: 18.5, risk: 8 }
    ];
  }
  res.json(results);
});

app.get('/api/v1/premium/hs-analytics', (req, res) => {
  const hsStats = {};
  DB_FACTS.forEach(d => {
    const code = d.hs_code.substring(0, 4);
    if (!hsStats[code]) {
      hsStats[code] = { code, name: d.goods_category, volume: 0, anomalyScore: Math.floor(Math.random() * 80) };
    }
    hsStats[code].volume += d.customs_value_usd;
  });
  let results = Object.values(hsStats).sort((a, b) => b.volume - a.volume).slice(0, 6);
  if (results.length === 0) {
    results = [
      { code: '8471', name: 'Комп\'ютери', volume: 45000000, anomalyScore: 78 },
      { code: '8517', name: 'Телефони', volume: 38000000, anomalyScore: 23 }
    ];
  }
  res.json(results);
});

app.get('/api/v1/premium/price-anomalies', (req, res) => {
  // Real logic based on DB_FACTS
  const anomalies = [];
  DB_FACTS.slice(0, 50).forEach((d, i) => {
    if (d.risk_score > 60) {
      anomalies.push({
        id: d.id,
        hsCode: d.hs_code,
        description: d.goods_description,
        declared: d.customs_value_usd,
        market: Math.round(d.customs_value_usd * (1 + (Math.random() * 0.5 + 0.2))),
        deviation: -1 * Math.round(Math.random() * 40 + 20),
        companies: Math.floor(Math.random() * 10) + 1
      });
    }
  });
  let results = anomalies.sort((a, b) => a.deviation - b.deviation).slice(0, 10);
  if (results.length === 0) {
    results = [
      { id: 1, hsCode: '8471.30', description: 'Ноутбуки', declared: 150, market: 450, deviation: -66.7, companies: 12 }
    ];
  }
  res.json(results);
});

app.get('/api/v1/premium/competitor-radar', (req, res) => {
  const companyStats = {};
  DB_FACTS.forEach(d => {
    if (!companyStats[d.company_name]) {
      companyStats[d.company_name] = { name: d.company_name, volume: 0, growth: Math.floor(Math.random() * 100), risk: d.risk_score, diversity: Math.floor(Math.random() * 100), speed: Math.floor(Math.random() * 100) };
    }
    companyStats[d.company_name].volume += d.customs_value_usd;
  });
  let results = Object.values(companyStats).sort((a, b) => b.volume - a.volume).slice(0, 3).map(c => ({
    name: c.name,
    metrics: { volume: Math.min(100, Math.round(c.volume / 10000)), growth: c.growth, risk: c.risk, diversity: c.diversity, speed: c.speed }
  }));
  if (results.length === 0) {
    results = [
      { name: 'АльфаТрейд', metrics: { volume: 85, growth: 70, risk: 20, diversity: 60, speed: 75 } }
    ];
  }
  res.json(results);
});

app.get('/api/v1/premium/competitor-radar-v2', (req, res) => {
  const entities = [
    {
      ueid: 'ueid-v55-001',
      name: 'ТОВ "МЕГА-ЛОГІСТИК ПЛЮС"',
      edrpou: '39448822',
      sector: 'Транспортні послуги',
      cers_score: 88.4,
      cers_level: 'CRITICAL',
      cers_level_ua: 'КРИТИЧНИЙ',
      trend: 'increasing',
      confidence: 0.94,
      last_updated: new Date().toISOString(),
      risk_factors: ['Аномальна інтенсивність', 'Зміна бенефіціара', 'Офшорні транзакції']
    },
    {
      ueid: 'ueid-v55-002',
      name: 'ПрАТ "УКР-ІМПОРТ-СИСТЕМА"',
      edrpou: '22334455',
      sector: 'Електроніка та IT',
      cers_score: 54.2,
      cers_level: 'MODERATE',
      cers_level_ua: 'СЕРЕДНІЙ',
      trend: 'stable',
      confidence: 0.88,
      last_updated: new Date().toISOString(),
      risk_factors: ['Пункт пропуску з підвищеним ризиком']
    },
    {
      ueid: 'ueid-v55-003',
      name: 'ТОВ "ВЕСТ-ГРУП КОРП"',
      edrpou: '44556677',
      sector: 'Будівельні матеріали',
      cers_score: 22.8,
      cers_level: 'LOW',
      cers_level_ua: 'НИЗЬКИЙ',
      trend: 'decreasing',
      confidence: 0.91,
      last_updated: new Date().toISOString(),
      risk_factors: []
    },
    {
      ueid: 'ueid-v55-004',
      name: 'ТОВ "ЕНЕРГО-ТРЕЙДІНГ"',
      edrpou: '55667788',
      sector: 'Енергетика',
      cers_score: 72.5,
      cers_level: 'HIGH',
      cers_level_ua: 'ВИСОКИЙ',
      trend: 'increasing',
      confidence: 0.86,
      last_updated: new Date().toISOString(),
      risk_factors: ['Податковий борг', 'Судові справи (кримінал)']
    }
  ];
  res.json(entities);
});

app.get('/api/v1/premium/market-trends', (req, res) => {
  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
  const results = months.map((m, i) => ({
    label: m,
    value: 80 + Math.floor(Math.random() * 50) + (i * 5),
    trend: Math.floor(Math.random() * 20 - 5)
  }));
  res.json(results);
});

app.get('/api/v1/telegram/feed', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('/Users/dima-mac/Documents/Predator_21/.antigravity_tmp/channel_data.json', 'utf8'));
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

app.get('/api/v1/newspaper', (req, res) => {
  const highRiskCount = DB_FACTS.filter(d => d.risk_score > 70).length;
  const totalVolume = DB_FACTS.reduce((acc, d) => acc + d.customs_value_usd, 0);

  res.json({
    metrics: [
      { label: 'Активні алерти', value: highRiskCount.toString(), change: -2, trend: 'down' },
      { label: 'Можливості ринку', value: '12', change: 3, trend: 'up' },
      { label: 'Ринковий скор', value: '78%', change: 5, trend: 'up' },
      { label: 'Рівень ризику', value: highRiskCount > 10 ? 'ВИСОКИЙ' : 'НИЗЬКИЙ', change: -8, trend: 'down' }
    ],
    stats: {
      total_documents: DB_FACTS.length,
      new_documents_24h: 42,
      system_health: 'Optimal'
    },
    recommendations: [
      'Переглянути постачальників у секторі електроніки',
      'Звернути увагу на ріст цін на логістику в Чорному морі',
      'Оптимізувати податкове навантаження через нові пільги'
    ],
    news: DB_FACTS.slice(0, 5).map(d => ({
      id: d.id,
      title: d.goods_description,
      type: d.operation_type,
      time: d.created_at,
      risk: d.risk_score
    })),
    sections: [
      {
        id: 'critical',
        title: '🚨 Критичні події',
        priority: 'critical',
        items: [
          {
            id: 'c-1',
            type: 'alert',
            title: 'Аномальна концентрація імпорту',
            summary: `Виявлено завантаження від нових постачальників на суму $${(totalVolume / 10).toFixed(1)}M`,
            impact: 'Потенційний демпінг на ринку електроніки',
            timestamp: '2 години тому',
            tags: ['імпорт', 'ризик', 'електроніка'],
            actionable: true
          }
        ]
      },
      {
        id: 'opportunities',
        title: '📈 Можливості та Тренди',
        priority: 'high',
        items: [
          {
            id: 'o-1',
            type: 'opportunity',
            title: 'Нова ніша: С/Г техніка',
            summary: 'Попит на запчастини зріс на 45% за останній тиждень',
            value: '$2.4М',
            timestamp: '6 годин тому',
            tags: ['сг-техніка', 'тренд'],
            actionable: true
          }
        ]
      }
    ],
    summary: `Сьогодні система PREDATOR зафіксувала ${highRiskCount} критичних алерти та 12 нових можливостей. Загальний стан ринку оцінюється як {status}.`
  });
});

// =============================================
// 🚀 API v2 — PREDATOR v55 ENDPOINTS
// =============================================

const v2Jobs = {};

// POST /api/v2/ingestion/upload
app.post('/api/v2/ingestion/upload', (req, res) => {
  const job_id = `v2-${Date.now()}`;
  const source = req.query.source || req.body?.source || 'customs';
  const recordsCount = Math.floor(Math.random() * 500) + 50;

  v2Jobs[job_id] = {
    job_id,
    status: 'pending',
    source,
    records_total: recordsCount,
    records_processed: 0,
    entities_created: 0,
    entities_resolved: 0,
    errors: [],
    started_at: new Date().toISOString(),
    finished_at: null
  };

  // Simulate processing
  let processed = 0;
  const interval = setInterval(() => {
    processed = Math.min(recordsCount, processed + Math.floor(recordsCount / 10));
    if (v2Jobs[job_id]) {
      v2Jobs[job_id].status = processed >= recordsCount ? 'done' : 'running';
      v2Jobs[job_id].records_processed = processed;
      v2Jobs[job_id].entities_created = Math.floor(processed * 0.3);
      v2Jobs[job_id].entities_resolved = Math.floor(processed * 0.7);
      if (processed >= recordsCount) {
        v2Jobs[job_id].finished_at = new Date().toISOString();
        clearInterval(interval);
      }
    }
  }, 800);

  res.json({
    job_id,
    status: 'pending',
    records_count: recordsCount,
    message: `Файл прийнятий. ${recordsCount} записів у черзі.`
  });
});

// GET /api/v2/ingestion/jobs/:job_id
app.get('/api/v2/ingestion/jobs/:job_id', (req, res) => {
  const job = v2Jobs[req.params.job_id];
  if (!job) {
    return res.status(404).json({ detail: `Job '${req.params.job_id}' не знайдено` });
  }
  res.json(job);
});

// GET /api/v2/ingestion/progress/:job_id (SSE)
app.get('/api/v2/ingestion/progress/:job_id', (req, res) => {
  const { job_id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const tick = setInterval(() => {
    const job = v2Jobs[job_id] || { job_id, status: 'done', records_total: 0, records_processed: 0 };
    res.write(`event: progress\ndata: ${JSON.stringify(job)}\n\n`);
    if (job.status === 'done' || job.status === 'failed') {
      clearInterval(tick);
      res.end();
    }
  }, 1000);

  req.on('close', () => clearInterval(tick));
});

// POST /api/v2/ingestion/trigger/:source_type
app.post('/api/v2/ingestion/trigger/:source_type', (req, res) => {
  const { source_type } = req.params;
  const task_id = `celery-${Date.now()}`;
  res.json({ status: 'queued', source: source_type, task_id });
});

// POST /api/v2/pipeline/run
app.post('/api/v2/pipeline/run', (req, res) => {
  const { source, records = [], entity_type = 'company' } = req.body || {};
  const uniqueEntities = Math.floor(records.length * 0.6) || 3;
  res.json({
    pipeline: 'v55-full',
    source: source || 'customs',
    unique_entities: uniqueEntities,
    steps: {
      data_fusion: { entities_created: Math.floor(uniqueEntities * 0.4), entities_resolved: Math.floor(uniqueEntities * 0.6), records_fused: records.length },
      behavioral: { status: 'ok', entities_scored: uniqueEntities },
      institutional: { status: 'ok', entities_scored: uniqueEntities },
      influence: { status: 'ok', entities_scored: uniqueEntities },
      structural: { status: 'ok', entities_scored: uniqueEntities },
      predictive: { status: 'ok', entities_scored: uniqueEntities },
      cers: { status: 'ok', entities_scored: uniqueEntities }
    }
  });
});

// POST /api/v2/pipeline/entity/:ueid/rescore
app.post('/api/v2/pipeline/entity/:ueid/rescore', (req, res) => {
  const { ueid } = req.params;
  res.json({
    ueid,
    behavioral: { bvi: 45.2, ass: 32.1, cp: 67.8, aggregate: 48.4, confidence: 0.82 },
    institutional: { aai: 55.0, pls: 42.0, aggregate: 50.1, confidence: 0.75 },
    influence: { im: 38.5, hci: 29.4, aggregate: 35.2, confidence: 0.70 },
    structural: { mci: 41.0, tdi: 25.5, aggregate: 36.8, confidence: 0.68 },
    predictive: { disappearance_risk: 22.1, scheme_emergence_risk: 31.4, aggregate: 27.3, confidence: 0.65 },
    cers: { score: 41.2, level: 'MEDIUM', level_ua: 'СЕРЕДНІЙ', level_en: 'MEDIUM', confidence: 0.73 },
    status: 'rescored'
  });
});

// GET /api/v2/entities/
app.get('/api/v2/entities/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  res.json({ entities: [], total: 0, page, limit });
});

// POST /api/v2/entities/resolve
app.post('/api/v2/entities/resolve', (req, res) => {
  const { name, edrpou } = req.body || {};
  res.json({
    ueid: `UA-${edrpou || '00000000'}-MOCK`,
    name: name || 'Unknown',
    edrpou,
    created: true
  });
});

// GET /api/v2/signals/
app.get('/api/v2/signals/', (req, res) => {
  res.json({ signals: [], total: 0 });
});

// GET /api/v2/analytics/entity/:ueid
app.get('/api/v2/analytics/entity/:ueid', (req, res) => {
  res.json({
    ueid: req.params.ueid,
    cers: { score: 41.2, level: 'MEDIUM', level_ua: 'СЕРЕДНІЙ' },
    behavioral: { aggregate: 48.4 },
    institutional: { aggregate: 50.1 },
    influence: { aggregate: 35.2 },
    structural: { aggregate: 36.8 },
    predictive: { aggregate: 27.3 }
  });
});

// GET /api/v2/decisions/
app.get('/api/v2/decisions/', (req, res) => {
  res.json({ decisions: [], total: 0 });
});

// --- System & Dashboard ---
app.get('/api/v1/system/engines', (req, res) => {
    res.json({
        'neural_behavioral': { id: 'behavioral', score: 89, trend: '+2.1%', status: 'optimal', throughput: 42400, latency: 12, load: 45 },
        'institutional_core': { id: 'institutional', score: 94, trend: '+0.5%', status: 'optimal', throughput: 38200, latency: 8, load: 22 },
        'influence_mapping': { id: 'influence', score: 68, trend: '-3.2%', status: 'calibrating', throughput: 12500, latency: 45, load: 88 },
        'structural_vault': { id: 'structural', score: 97, trend: '+1.4%', status: 'optimal', throughput: 28900, latency: 5, load: 12 },
        'predictive_matrix': { id: 'predictive', score: 85, trend: '+4.7%', status: 'optimal', throughput: 15400, latency: 18, load: 35 }
    });
});

app.get('/api/v1/risk/sectors', (req, res) => {
    res.json({
        items: [
            { id: 'finance', score: 72 },
            { id: 'logistics', score: 48 },
            { id: 'realEstate', score: 65 },
            { id: 'energy', score: 28 },
            { id: 'it', score: 12 },
            { id: 'construction', score: 89 }
        ]
    });
});

app.get('/api/v1/alerts', (req, res) => {
    res.json({
        items: [
            { id: 'alt-1', title: 'Аномальний імпорт електроніки', target: 'ТОВ "МЕГА-ТРЕЙД"', risk: 'CRITICAL', time: '10 хв тому', status: 'new' },
            { id: 'alt-2', title: 'Зміна UBO у санкційному списку', target: 'ПрАТ "ЗАХІД-ЕНЕРГО"', risk: 'HIGH', time: '45 хв тому', status: 'new' },
            { id: 'alt-3', title: 'Виявлено новий картель ТОВ/АТ', target: 'Сектор будівництва', risk: 'MEDIUM', time: '2 год тому', status: 'new' },
            { id: 'alt-4', title: 'Ризик зникнення компанії-імпортера', target: 'ТОВ "ВЕКТОР"', risk: 'HIGH', time: '5 год тому', status: 'new' }
        ]
    });
});

app.get('/api/v1/intelligence/report/:ueid', (req, res) => {
    const reports = {
        'v55_daily_brief': `
# 🕶️ Суверенна Довідка: Стан Ринку v55

## 📊 Глобальний Аналіз
За останні 24 години система зафіксувала **аномальне зростання** активності у секторі паливно-енергетичного комплексу. 
Коефіцієнт структурного ризику зріс на **4.2%**.

## 🚨 Ключові Аномалії
1. **ТОВ "ЕНЕРГО-ГРУП"**: Виявлено приховані зв'язки з офшорними юрисдикціями через ланцюжок номінальних власників.
2. **АТ "УКР-БУД"**: Серія транзакцій з контрагентами з "сірого" списку.

## ⚖️ Рекомендації Sovereign
- Посилити моніторинг митних декларацій по коду HS **8471**.
- Провести поглиблений аудит бенефіціарів у логістичному секторі Одеської обл.
        `,
        'global-briefing-v55': `
# 🛰️ Оперативне Зведення: Ситуаційний Центр

## 🧠 Нейронна Оцінка
Система PREDATOR оцінює загальний рівень загрози як **MODERATE (СЕРЕДНІЙ)**. 
Проте, у секторі **електроніки** спостерігається перехід до **КРИТИЧНОГО** стану.

## 📉 Тренди
- Зменшення середньої митної вартості на 12% для критичного імпорту.
- Синхронізація 42 нових нод у графу впливу.

**Sovereign Decision Support**: Рекомендується запуск превентивного розслідування щодо групи компаній "ВЕСТ-ЛОГІСТИК".
        `
    };
    res.json({ report: reports[req.params.ueid] || reports['v55_daily_brief'] });
});

// --- Maritime Sovereignty ---
app.get('/api/v1/maritime/vessels', (req, res) => {
    res.json({
        items: [
            { id: 'v-1', name: 'OCEAN_TITAN', flag: 'PANAMA', type: 'Container Ship', location: { lat: 46.48, lon: 30.72 }, status: 'at_anchor', destination: 'Odesa Port', risk_score: 12, imo: '9234567', mmsi: '235078000', speed: 0.1, last_seen: '2 хв тому' },
            { id: 'v-2', name: 'GHOST_RUNNER', flag: 'UNKNOWN', type: 'General Cargo', location: { lat: 45.12, lon: 32.45 }, status: 'underway', destination: 'Sevastopol', risk_score: 94, mmsi: '999999999', speed: 18.5, heading: 145, last_seen: '10 сек тому' },
            { id: 'v-3', name: 'NEBULOUS_PRIDE', flag: 'LIBERIA', type: 'Oil Tanker', location: { lat: 44.85, lon: 33.10 }, status: 'underway', destination: 'Novorossiysk', risk_score: 72, imo: '9876543', speed: 12.2, heading: 90, last_seen: '5 хв тому' },
            { id: 'v-4', name: 'SOVEREIGN_VOYAGER', flag: 'UKRAINE', type: 'Bulk Carrier', location: { lat: 46.60, lon: 31.05 }, status: 'loading', destination: 'Chornomorsk', risk_score: 5, imo: '9112233', status: 'optimal' }
        ]
    });
});

app.get('/api/v1/maritime/ports', (req, res) => {
    res.json({
        items: [
            { id: 'p-1', name: 'Одеський Морський Порт', country: 'Ukraine', location: { lat: 46.48, lon: 30.72 }, vessel_count: 42, capacity: 85, risk_level: 'LOW', status: 'operational' },
            { id: 'p-2', name: 'Порт Южний', country: 'Ukraine', location: { lat: 46.62, lon: 31.01 }, vessel_count: 18, capacity: 60, risk_level: 'LOW', status: 'operational' },
            { id: 'p-3', name: 'Севастопольський Порт', country: 'Occupied', location: { lat: 44.61, lon: 33.52 }, vessel_count: 64, capacity: 95, risk_level: 'CRITICAL', status: 'restricted' }
        ]
    });
});

// Catch-all for any missing endpoints (must be last)
app.use('/api', (req, res) => {
  console.log(`[MOCK] Unhandled ${req.method} ${req.path}`);
  if (req.method === 'GET') {
    // Return empty arrays for list endpoints to avoid UI crashes
    if (req.path.endsWith('s') || req.path.includes('list') || req.path.includes('history')) return res.json([]);
    return res.json({});
  }
  res.json({ success: true, message: 'Mock accepted' });
});

server.listen(PORT, () => {
    console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
});
