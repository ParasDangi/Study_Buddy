# Study Buddy

Study Buddy is a small web-based AI voice assistant focused on study help: explanations, summaries, practice questions, and learning assistance. It uses the browser Speech APIs for voice input/output and proxies AI requests through a small Node/Express backend to the OpenAI API.

**Files added**
- [package.json](package.json)
- [server.js](server.js)
- [public/index.html](public/index.html)
- [public/app.js](public/app.js)
- [public/style.css](public/style.css)

**Requirements**
- Node.js 18+ and npm

This project can run in two modes:

- Cloud mode (uses OpenAI): set `OPENAI_API_KEY`.
- Offline/on-device mode (no OpenAI costs): install a local model runner and set `LOCAL_MODEL_CMD`.

If you cannot afford OpenAI API calls, use offline mode as described below.

**Quick start**
1. Install dependencies:

```bash
npm install
```

2. Set your OpenAI API key (PowerShell example):

```powershell
$env:OPENAI_API_KEY = "sk-..."
npm start
```

3. Open http://localhost:3000 in Chrome/Edge for best Speech API support.

**Usage notes & safety**
- The assistant is configured for study purposes only and will avoid medical, legal, and adult content.
- Speech recognition uses the browser's built-in APIs — works best in Chromium-based browsers.
- Keep your `OPENAI_API_KEY` secret. Consider running behind HTTPS in production and adding rate limits/auth if needed.

**Next steps** (suggestions)
- Add authentication to restrict access.
- Persist conversation history per user.
- Add language selection and improved prompt engineering for study-specific modes (quiz, summarize, explain).

**Offline / On-device setup (no API cost)**

1) Install a local model runner. Options:

- gpt4all (https://gpt4all.io/) — provides lightweight local models and a CLI.
- ollama (https://ollama.com/) — runs LLMs locally with a simple CLI (supports Windows via WSL/installer).
- llama.cpp / ggml-based builds — many frontends expose a CLI.

2) Configure the `LOCAL_MODEL_CMD` env var with a command template that includes `{prompt}`. Example PowerShell commands:

```powershell
# Example for gpt4all CLI (adjust flags/model path as needed)
$env:LOCAL_MODEL_CMD = 'gpt4all --model models/gpt4all-lora.bin --prompt "{prompt}"'
npm start

# Example for ollama (runs a model named llama2 locally)
$env:LOCAL_MODEL_CMD = 'ollama run llama2 --prompt "{prompt}"'
npm start
```

3) The server will replace `{prompt}` with the conversation context and call the command. If the command fails or is not configured, the server will fall back to a simple built-in offline responder (limited answers).

Notes:
- Local models require disk space and sometimes a GPU for reasonable performance. Small CPU models work but may be slow.
- `LOCAL_MODEL_CMD` uses the shell: ensure commands are safe and properly quoted for your shell.

**Using Google Gemini / Gemini API**

You can use a Gemini-style API instead of OpenAI. Two modes are supported:

- `GEMINI_API_URL` + `GEMINI_API_KEY`: call a custom Gemini-compatible endpoint (server will POST JSON with `{ prompt }` and send `Authorization: Bearer <key>`).
- `GEMINI_API_KEY` + `GEMINI_MODEL`: call the Google Generative Text API using your API key and model name. Example model: `models/text-bison-001`.

Examples (PowerShell):

```powershell
# Use Google Generative API (Gemini) with model name
$env:GEMINI_API_KEY = "YOUR_GOOGLE_API_KEY"
$env:GEMINI_MODEL = "text-bison@001"  # or models/text-bison-001 depending on your account
npm start

# Or point to a custom Gemini-compatible endpoint
$env:GEMINI_API_KEY = "YOUR_KEY"
$env:GEMINI_API_URL = "https://my-gemini-proxy.example.com/generate"
npm start
```

If `GEMINI_*` variables are present the server will prefer them over `OPENAI_API_KEY` or `LOCAL_MODEL_CMD`.


***
