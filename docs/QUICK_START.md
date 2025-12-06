# 🚀 Predator Analytics v21 - Quick Start Guide

Welcome to **Predator Analytics v21** — the most advanced Ukrainian data intelligence platform with AI-powered analysis and semantic search.

---

## 📋 Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **Docker** (optional, for containerized deployment)
- **API Keys** (free tier available for all providers)

---

## ⚡ 5-Minute Setup

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/your-org/predator-analytics.git
cd predator-analytics

# Install frontend dependencies
npm install

# Install backend dependencies
cd ua-sources
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

**Minimum Required Keys (All Free Tier):**
```bash
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

**Get Free API Keys:**
- **Gemini:** https://makersuite.google.com/app/apikey
- **Groq:** https://console.groq.com/keys

### 3. Start Services

```bash
# Terminal 1: Backend
cd ua-sources
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
```

### 4. Access Application

Open browser: **http://localhost:5173**

Default credentials:
- Username: `admin`
- Password: `predator2024`

---

## 🎯 Key Features Tour

### 1. **Dashboard (War Room)**
- Real-time cluster topology
- Agent swarm visualization
- Threat radar
- System overclock control

**Try it:**
1. Navigate to **Dashboard** tab
2. Drag the "Overclock" slider
3. Watch metrics respond in real-time

### 2. **Analytics with LLM Council**
- Multi-model AI analysis
- Semantic search toggle
- 4 routing modes

**Try it:**
1. Go to **Analytics** tab
2. Toggle **Semantic** switch ON
3. Search: `"корупція в Укрзалізниці"`
4. Toggle OFF and select **Council** mode
5. Run Deep Scan

### 3. **LLM Routing Modes**

| Mode | Use Case | Speed | Accuracy |
|------|----------|-------|----------|
| **AUTO** | General queries | Medium | High |
| **FAST** | Simple lookups | Very Fast | Medium |
| **PRECISE** | Complex analysis | Slow | Very High |
| **COUNCIL** | Critical decisions | Slow | Maximum |

**Example:**
```
Query: "Проаналізуй ризики компанії з ЄДРПОУ 12345678"

AUTO → Routes to Groq (fast, sufficient)
COUNCIL → Queries Groq + Gemini + Mistral, synthesizes best answer
```

### 4. **Semantic Search**

**When to use:**
- ✅ Finding documents by meaning (not just keywords)
- ✅ Exploring large datasets quickly
- ✅ Discovery mode

**When NOT to use:**
- ❌ Need deep reasoning (use Deep Scan instead)
- ❌ Require citations and sources
- ❌ Complex multi-step analysis

---

## 🔑 API Key Management

### Multiple Keys (Load Balancing)

```bash
# .env
GROQ_API_KEY=key1,key2,key3,key4
```

System will **randomly rotate** keys to:
- Avoid rate limits
- Distribute load
- Improve resilience

### Provider Priority

Default order (if `AUTO` mode):
1. Groq (fastest)
2. Gemini (balanced)
3. Mistral (fallback)

Override with `preferred_provider` parameter.

---

## 📊 Usage Examples

### Example 1: Quick Company Lookup

```
Mode: FAST
Query: "ЄДРПОУ 00032945"
Expected: Basic company info in <1s
```

### Example 2: Risk Analysis

```
Mode: PRECISE
Query: "Оцінити корупційні ризики ТОВ 'Будівельник' за 2023 рік"
Expected: Detailed report in 5-10s
```

### Example 3: Strategic Decision

```
Mode: COUNCIL
Query: "Чи варто інвестувати в компанію X? Врахуй фінансові показники, репутацію, судові справи"
Expected: Multi-perspective analysis in 10-15s
```

---

## 🛠️ Advanced Configuration

### Custom LLM Endpoints

```bash
# .env
LLM_GROQ_BASE_URL=https://api.groq.com/openai/v1
LLM_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

### Adjust Timeouts

```python
# ua-sources/app/services/llm.py
timeout=60.0  # Increase for slow connections
```

### Enable Debug Logging

```bash
# .env
LOG_LEVEL=DEBUG
```

---

## 🐛 Troubleshooting

### Issue: "API Key Invalid"

**Solution:**
1. Check `.env` file has correct keys
2. Verify no extra spaces or quotes
3. Test key directly: `curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/...`

### Issue: "Council Mode Timeout"

**Solution:**
- Reduce number of council members in `llm.py` (default: 3)
- Increase timeout in `_call_openai_compatible()`

### Issue: "Semantic Search Returns No Results"

**Solution:**
1. Check OpenSearch/Qdrant services are running
2. Verify index exists: `curl localhost:9200/_cat/indices`
3. Re-index data if needed

---

## 📚 Learn More

- **Full Documentation:** `docs/`
- **API Reference:** `http://localhost:8000/docs` (when backend running)
- **Architecture:** `docs/v20_integration_summary.md`
- **Changelog:** `CHANGELOG.md`

---

## 🎓 Best Practices

### 1. **Use Semantic Search First**
- Fast exploration
- Broad discovery
- Then deep-dive with Deep Scan

### 2. **Choose Right Mode**
- Don't use COUNCIL for simple queries (waste of resources)
- Use AUTO for 90% of cases

### 3. **Monitor API Usage**
- Check provider dashboards weekly
- Rotate keys if approaching limits

### 4. **Secure Your Keys**
- Never commit `.env` to git
- Use environment variables in production
- Rotate keys monthly

---

## 🚀 Next Steps

1. **Explore Data Sources:**
   - Navigate to **Integration** tab
   - Connect to Ukrainian registries (EDR, Prozorro, etc.)

2. **Configure Agents:**
   - Go to **Agents** tab
   - Set up automated monitoring

3. **Deploy to Production:**
   - See `DEPLOYMENT.md`
   - Use Docker Compose or Kubernetes

4. **Join Community:**
   - Report bugs: GitHub Issues
   - Contribute: Pull Requests welcome!

---

## 💡 Pro Tips

- **Keyboard Shortcuts:**
  - `Ctrl+K` - Quick search
  - `Ctrl+/` - Command palette
  
- **Performance:**
  - Enable browser caching
  - Use Chrome/Edge for best experience
  
- **Security:**
  - Enable 2FA in Settings
  - Review audit logs weekly

---

## 📞 Support

- **Documentation:** This guide + `docs/`
- **Issues:** GitHub Issues
- **Email:** support@predator-analytics.com (if available)

---

**Happy Hunting! 🎯**

*Predator Analytics Team*
