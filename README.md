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
- An OpenAI API key set as the environment variable `OPENAI_API_KEY` (not checked into source)

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

***

If you want, I can run the app locally (if Node is available), add server-side persistence (SQLite), or implement authentication. Which would you like next?
