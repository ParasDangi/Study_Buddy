const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Optional: OPENAI_API_KEY for cloud usage. Alternatively use a local model command.
if (!process.env.OPENAI_API_KEY && !process.env.LOCAL_MODEL_CMD) {
  console.warn('No OPENAI_API_KEY and no LOCAL_MODEL_CMD set. Server will use a simple built-in offline fallback (non-ML).');
}

/**
 * Run a configured local model command and capture stdout.
 * The environment variable `LOCAL_MODEL_CMD` should be a shell command template containing '{prompt}' where the prompt will be inserted.
 * Example: LOCAL_MODEL_CMD="gpt4all --model models/gpt4all-lora.bin --prompt '{prompt}'"
 */
function runLocalModel(prompt) {
  return new Promise((resolve, reject) => {
    const cmdTemplate = process.env.LOCAL_MODEL_CMD;
    if (!cmdTemplate) return reject(new Error('LOCAL_MODEL_CMD not configured'));

    // Replace placeholder with escaped prompt
    const cmd = cmdTemplate.replace('{prompt}', prompt.replace(/"/g, '\\"'));

    // Use shell to allow complex commands; user must ensure command is safe
    const proc = spawn(cmd, { shell: true });
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(`Local model failed (code ${code}): ${err || out}`));
    });
  });
}

// In-memory conversation store (sessionId -> messages[]). For production, persist this.
const conversations = {};

// Simple API endpoint to ask the assistant with session-based conversation history
app.post('/api/ask', async (req, res) => {
  const { message, sessionId } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  try {
    // Determine session id (create if missing)
    const sid = sessionId || crypto.randomUUID();

    // Initialize conversation with a system instruction if new
    if (!conversations[sid]) {
      conversations[sid] = [
        {
          role: 'system',
          content:
            'You are Study Buddy, an AI voice assistant for study purposes only. Be concise, helpful, and avoid medical/legal/adult advice.'
        }
      ];
    }

    // Append user message
    conversations[sid].push({ role: 'user', content: message });

    // Prepare a prompt from recent conversation for local model or OpenAI
    const windowSize = 12; // messages (including system messages)
    const messages = conversations[sid].slice(-windowSize);

    // Flatten messages into a single prompt for local CLI models
    const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + '\nASSISTANT:';

    let reply = 'Sorry, no response.';

    if (process.env.OPENAI_API_KEY) {
      // Use OpenAI if key is present
      const { Configuration, OpenAIApi } = require('openai');
      const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
      const openai = new OpenAIApi(configuration);
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 600
      });
      reply = completion.data.choices && completion.data.choices[0].message ? completion.data.choices[0].message.content : reply;
    } else if (process.env.LOCAL_MODEL_CMD) {
      // Try to call a user-configured local model command
      try {
        const out = await runLocalModel(prompt);
        reply = out || reply;
      } catch (e) {
        console.error('Local model error', e.message || e);
        reply = 'Local model failed: ' + (e.message || 'unknown error');
      }
    } else {
      // Very small built-in offline fallback (non-ML): simple template/responses for study tasks
      // This ensures the server works offline in a limited capacity.
      const q = message.toLowerCase();
      if (q.includes('summarize') || q.includes('summary')) reply = 'Short summary: ' + message.replace(/summarize|summary/gi, '').trim();
      else if (q.includes('explain')) reply = 'Explanation: ' + message.replace(/explain/gi, '').trim();
      else if (q.includes('define')) reply = 'Definition: ' + message.replace(/define/gi, '').trim();
      else reply = "Sorry — offline mode can't fully answer that. Install a local model and set LOCAL_MODEL_CMD for full on-device AI.";
    }

    // Save assistant reply into history
    conversations[sid].push({ role: 'assistant', content: reply });

    // Prune to keep bounded memory
    if (conversations[sid].length > 200) conversations[sid] = conversations[sid].slice(-200);

    res.json({ reply, sessionId: sid });
  } catch (err) {
    console.error('OpenAI error', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'AI request failed', details: err?.message || err });
  }
});

app.listen(PORT, () => {
  console.log(`Study Buddy server running on http://localhost:${PORT}`);
});
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. AI requests will fail until it is provided.');
}
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// In-memory conversation store (sessionId -> messages[]). For production, persist this.
const conversations = {};

// Simple API endpoint to ask the assistant with session-based conversation history
app.post('/api/ask', async (req, res) => {
  const { message, sessionId } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  try {
    // Determine session id (create if missing)
    const sid = sessionId || crypto.randomUUID();

    // Initialize conversation with a system instruction if new
    if (!conversations[sid]) {
      conversations[sid] = [
        {
          role: 'system',
          content:
            'You are Study Buddy, an AI voice assistant for study purposes only. Be concise, helpful, and avoid medical/legal/adult advice.'
        }
      ];
    }

    // Append user message
    conversations[sid].push({ role: 'user', content: message });

    // Keep a sliding window to avoid sending huge context
    const windowSize = 12; // messages (including system messages)
    const messagesToSend = conversations[sid].slice(-windowSize);

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messagesToSend,
      max_tokens: 600
    });

    const reply =
      completion.data.choices && completion.data.choices[0].message
        ? completion.data.choices[0].message.content
        : 'Sorry, no response.';

    // Save assistant reply into history
    conversations[sid].push({ role: 'assistant', content: reply });

    // Prune to keep bounded memory
    if (conversations[sid].length > 200) conversations[sid] = conversations[sid].slice(-200);

    res.json({ reply, sessionId: sid });
  } catch (err) {
    console.error('OpenAI error', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'AI request failed', details: err?.message || err });
  }
});

app.listen(PORT, () => {
  console.log(`Study Buddy server running on http://localhost:${PORT}`);
});
