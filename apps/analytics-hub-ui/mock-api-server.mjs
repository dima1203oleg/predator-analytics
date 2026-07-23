import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 9080;

app.use(cors());
app.use(express.json());

// Legacy endpoint that the UI might still be calling
app.post('/api/osint/search', (req, res) => {
  console.log('Mock OSINT Search Request:', req.body);
  const { query } = req.body;
  
  setTimeout(() => {
    res.json({
      id: "3111724753",
      type: "person",
      name: "Кизима Дмитро Миколайович",
      code: query || "3111724753",
      status: "SUSPICIOUS",
      riskScore: 85,
      address: "с. Угерсько, Стрийський р-н",
      description: "Особа з високим рівнем ризику. Знайдено численні зв'язки з фіктивними компаніями.",
      relationships: [
        { targetId: "comp-1", targetName: "ТОВ АГРО-ТРАНС", type: "Засновник", risk: "HIGH" },
        { targetId: "comp-2", targetName: "ПП БУД-ІНВЕСТ", type: "Керівник", risk: "MEDIUM" }
      ],
      aiRecommendations: "Рекомендується поглиблена перевірка фінансових операцій та зв'язків з контрагентами.",
      courts: { totalCases: 5, criminalCases: 1, lastCaseTitle: "Справа про ухилення від сплати податків", lastCaseDate: "2023-11-15" }
    });
  }, 1500);
});

// New endpoint structure
app.post('/api/v1/osint/scan/start', (req, res) => {
  console.log('Mock OSINT Scan Start:', req.body);
  res.json({
    status: "ok",
    job_id: "mock-job-123",
    message: "Scan started"
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', source: 'mock-api' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API Server running on http://localhost:${PORT}`);
});
