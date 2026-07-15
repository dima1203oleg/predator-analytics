import sys
import re

file_path = '/Users/Shared/Predator_60/apps/predator-analytics-ui/mock-api-server.mjs'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace STT
stt_regex = re.compile(r"app\.post\('/api/v1/ai/stt', upload\.single\('audio'\), async \(req, res\) => \{.*?\n\}\);\n", re.DOTALL)

stt_new = """app.post('/api/v1/ai/stt', upload.single('audio'), async (req, res) => {
  try {
    const audioPath = req.file.path;
    console.log(`[STT] Processing audio file: ${audioPath}`);
    exec(`python3 /Users/Shared/Predator_60/scripts/stt_server.py "${audioPath}"`, (error, stdout, stderr) => {
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
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
"""

# Replace TTS
tts_regex = re.compile(r"app\.post\('/api/v1/ai/tts', async \(req, res\) => \{.*?\n\}\);\n", re.DOTALL)

tts_new = """app.post('/api/v1/ai/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    console.log(`[TTS] 🎙️ Processing request: "${text.substring(0, 50)}..."`);
    
    // Call python TTS script
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

# Replace AI Chat
chat_regex = re.compile(r"app\.post\('/api/v1/ai/chat', \(req, res\) => \{.*?\n\}\);\n", re.DOTALL)

chat_new = """app.post('/api/v1/ai/chat', async (req, res) => {
  const { messages, model, stream } = req.body;
  const selectedModel = model || 'deepseek-r1:latest';
  
  console.log(`[AI] Chat request using model: ${selectedModel}`);
  
  try {
    const ollamaResponse = await fetch('http://194.177.1.240:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: messages,
        stream: false
      })
    });
    
    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);
    }
    
    const data = await ollamaResponse.json();
    res.json(data);
  } catch (error) {
    console.error(`[AI] ❌ Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});
"""

# Replace copilot chat
copilot_regex = re.compile(r"app\.post\('/api/v1/copilot/chat', \(req, res\) => \{.*?\n\}\);\n", re.DOTALL)
copilot_new = """app.post('/api/v1/copilot/chat', async (req, res) => {
  const { message } = req.body;
  
  try {
    const ollamaResponse = await fetch('http://194.177.1.240:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:latest',
        messages: [{ role: 'user', content: message }],
        stream: false
      })
    });
    
    const data = await ollamaResponse.json();
    
    res.json({
      message_id: `msg-${Date.now()}`,
      reply: data.message?.content || 'Помилка генерації',
      sources: [],
      tokens_used: data.eval_count || 0
    });
  } catch (error) {
    console.error(`[Copilot] ❌ Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});
"""


new_content = stt_regex.sub(stt_new, content)
new_content = tts_regex.sub(tts_new, new_content)
new_content = chat_regex.sub(chat_new, new_content)
new_content = copilot_regex.sub(copilot_new, new_content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Patch applied successfully!")
