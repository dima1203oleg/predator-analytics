import sys
import re

file_path = '/Users/Shared/Predator_60/apps/predator-analytics-ui/mock-api-server.mjs'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add fs, exec, os if not exists
if "import fs from 'fs'" not in content:
    content = content.replace("import express from 'express';", "import express from 'express';\nimport fs from 'fs';\nimport os from 'os';\nimport path from 'path';\nimport { exec } from 'child_process';")

# 2. Add raw body parser for STT if not exists
if "app.use('/api/v1/ai/stt', express.raw" not in content:
    content = content.replace("app.use(express.json());", "app.use(express.json());\napp.use('/api/v1/ai/stt', express.raw({ type: ['audio/webm', 'audio/wav', 'audio/ogg', 'application/octet-stream'], limit: '50mb' }));")

# 3. Replace EXPLAIN (AI Copilot) block
explain_regex = re.compile(r"// ==========================================\n// EXPLAIN \(AI Copilot\)\n// ==========================================.*?(?=// ==========================================)", re.DOTALL)

explain_new = """// ==========================================
// EXPLAIN (AI Copilot)
// ==========================================
app.post('/api/v1/explain', (req, res) => {
  res.json({
    explanation: 'Ця сутність має високий ризик через зв\\'язки з офшорними юрисдикціями (Кіпр, BVI).',
    confidence: 0.94,
    chain: ['Зв\\'язок з TARGET-01', 'Реєстрація на Кіпрі', 'Транзакції через BANK-01'],
  });
});

app.post('/api/v1/copilot/chat', async (req, res) => {
  const { message } = req.body;
  
  try {
    const ollamaResponse = await fetch('http://194.177.1.240:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:latest',
        messages: [
          { role: 'system', content: 'Ти розумний та корисний AI-асистент (PREDATOR Analytics). Відповідай українською мовою. Будь лаконічним.' },
          { role: 'user', content: message }
        ],
        stream: false
      })
    });
    
    const data = await ollamaResponse.json();
    let reply = data.message?.content || 'Помилка генерації';
    
    res.json({
      message_id: `msg-${Date.now()}`,
      reply: reply,
      sources: [],
      tokens_used: data.eval_count || 0
    });
  } catch (error) {
    console.error(`[Copilot] ❌ Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

"""

content = explain_regex.sub(explain_new, content)

# 4. Replace VOICE block
voice_regex = re.compile(r"// ==========================================\n// VOICE\n// ==========================================.*?(?=// ==========================================)", re.DOTALL)

voice_new = """// ==========================================
// VOICE & AI TTS/STT
// ==========================================
app.post('/api/v1/voice/transcribe', (req, res) => {
  res.json({ text: "покажи мені останні транзакції по кіпру" });
});

app.post('/api/v1/voice/synthesize', (req, res) => {
  res.setHeader('Content-Type', 'audio/webm');
  res.send(Buffer.from([]));
});

app.post('/api/v1/ai/stt', async (req, res) => {
  try {
    const audioBuffer = req.body;
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: "No audio data provided" });
    }
    
    const tempFilePath = path.join(os.tmpdir(), `stt_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    console.log(`[STT] Processing audio file: ${tempFilePath} (${audioBuffer.length} bytes)`);
    exec(`python3 /Users/Shared/Predator_60/scripts/stt_server.py "${tempFilePath}"`, (error, stdout, stderr) => {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (error) {
        console.error(`[STT] ❌ Error: ${stderr || error.message}`);
        return res.status(500).json({ error: "STT Engine failed" });
      }
      try {
        const result = JSON.parse(stdout);
        console.log(`[STT] ✅ Success: "${result.text}"`);
        res.json(result);
      } catch (e) {
        console.error(`[STT] JSON Parse error: ${e.message}`);
        res.status(500).json({ error: "Invalid STT response" });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/ai/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    console.log(`[TTS] 🎙️ Processing request: "${text.substring(0, 50)}..."`);
    
    const safeText = text.replace(/["'`]/g, '');
    exec(`python3 /Users/Shared/Predator_60/scripts/tts_server.py "${safeText}"`, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[TTS] ❌ Error: ${stderr || error.message}`);
        return res.status(500).json({ error: "TTS Engine failed" });
      }
      res.set('Content-Type', 'audio/wav');
      res.send(stdout);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

"""

content = voice_regex.sub(voice_new, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("UI Mock API Patched successfully!")
