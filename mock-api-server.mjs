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
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 9080;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

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
  }, 1000); // <-- Closing NORMALIZE timeout
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
app.get(['/api/v1/system/lockdown', '/v1/system/lockdown'], (req, res) => {
  res.json({ active: false, level: 0, reason: null });
});

// System metrics
app.get('/api/v1/system/metrics', (req, res) => {
  res.json({ cpu: 24 + Math.random() * 15, memory: 45 + Math.random() * 20, disk: 32, network: { in: Math.random() * 1000, out: Math.random() * 500 }, timestamp: new Date().toISOString() });
});

app.get('/api/v1/metrics/realtime', (req, res) => {
  res.json({ activeUsers: 3, requestsPerSecond: Math.floor(Math.random() * 50), avgResponseTime: Math.floor(Math.random() * 30), errorRate: Math.random() * 0.5 });
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

// =============================================
// 📤 UPLOAD & PIPELINE
// =============================================

app.post(['/api/v1/data-hub/upload', '/api/v1/ingest/upload'], (req, res) => {
  const job_id = `etl-${Date.now()}`;
  const source_file = "Березень_2024.xlsx";
  const newJob = {
    job_id, id: job_id, source_id: job_id, source_file,
    state: 'UPLOADING',
    progress: { percent: 0, records_total: 0, records_processed: 0, records_indexed: 0, stage: 'UPLOADING', details: 'Ініціалізація пайплайну...' },
    timestamps: { created_at: new Date().toISOString(), state_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    errors: []
  };

  etlJobs.unshift(newJob);
  DB_PIPELINE_STATE[job_id] = 'STARTED';
  emitEvent(job_id, 'PIPELINE_STARTED', `Запущено повний пайплайн для ${source_file}`);

  // Запускаємо реальний 6-фазний пайплайн
  runPipeline(job_id, source_file);

  res.json({ success: true, job_id, source_id: job_id, id: job_id });
});

// ETL Jobs listing
app.get('/api/v25/etl/jobs', (req, res) => { res.json({ jobs: etlJobs }); });
app.get('/api/v1/etl/jobs', (req, res) => { res.json({ jobs: etlJobs }); });
app.get('/api/v1/etl/status', (req, res) => {
  res.json({ status: 'READY', active_jobs: etlJobs.filter(j => j.state !== 'READY' && j.state !== 'COMPLETED').length, total_records: DB_FACTS.length });
});

// Ingestion status
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
  if (!q || DB_SEARCH_INDEX.length === 0) {
    return res.json({ results: [], total: 0, query: q });
  }

  const results = DB_SEARCH_INDEX
    .filter(doc => doc.text.toLowerCase().includes(q))
    .slice(0, 20)
    .map((doc, i) => ({
      id: doc.declaration.id,
      title: `Декларація ${doc.declaration.declaration_number}: ${doc.declaration.goods_description}`,
      snippet: `${doc.declaration.company_name} | ${doc.declaration.country_origin} | ${doc.declaration.customs_office} | $${doc.declaration.customs_value_usd.toLocaleString()}`,
      score: 0.95 - (i * 0.02),
      source: 'customs-registry',
      category: 'customs',
      searchType: 'full-text'
    }));

  res.json({ results, total: results.length, query: q });
});

app.post('/api/v1/search/customs', (req, res) => {
  const q = (req.body.query || '').toLowerCase();
  const results = DB_FACTS
    .filter(d => `${d.goods_description} ${d.company_name} ${d.country_origin} ${d.date} ${d.hs_code}`.toLowerCase().includes(q))
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
  res.json({ results, total: results.length });
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

// Connectors / Sources
app.get('/api/v1/sources/connectors', (req, res) => { res.json([]); });
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
  const highRisk = DB_FACTS.filter(d => d.risk_score > 80).slice(0, 3);
  const alerts = highRisk.map((d, i) => ({
    id: `alert-${i}`, severity: 'high',
    title: `Ризикова декларація: ${d.company_name}`,
    description: `${d.goods_description} з ${d.country_origin} — ризик ${d.risk_score}%`,
    timestamp: d.ingested_at
  }));
  if (alerts.length === 0) {
    alerts.push({ id: 'alert-0', severity: 'info', title: 'Немає ризикових декларацій', description: 'Завантажте дані через Центр Даних', timestamp: new Date().toISOString() });
  }
  res.json(alerts);
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

// =============================================
// 🌐 SERVER START
// =============================================

const server = app.listen(PORT, () => {
  console.log(`\n🚀 PREDATOR Mock API v2 running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`🗂  DB Stats: http://localhost:${PORT}/api/v1/database/stats`);
  console.log(`\n📌 Дані з'являться після завантаження файлу через UI або POST /api/v1/ingest/upload\n`);
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'metrics',
      data: { cpu: 24 + Math.random() * 15, memory: 45 + Math.random() * 20, timestamp: new Date().toISOString(), db_records: DB_FACTS.length }
    }));
  }, 2000);
  ws.on('close', () => clearInterval(interval));
});

export default app;
