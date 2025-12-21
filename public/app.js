// Study Buddy frontend — single clean file
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const transcriptEl = document.getElementById('transcript');
  const sendBtn = document.getElementById('sendBtn');
  const textInput = document.getElementById('textInput');
  const replyArea = document.getElementById('replyArea');
  const speakResponseToggle = document.getElementById('speakResponse');
  const historyEl = document.getElementById('history');

  if (!startBtn || !stopBtn || !transcriptEl || !sendBtn || !textInput || !replyArea) {
    console.warn('Study Buddy UI missing required elements.');
    return;
  }

  let recognition = null;
  let recognizing = false;

  function setUnsupported() {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    transcriptEl.placeholder = 'Speech Recognition not supported in this browser. Use Chrome/Edge.';
  }

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    setUnsupported();
  } else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t + ' ';
          else interim += t + ' ';
        }
        transcriptEl.value = (final + interim).trim();
      };

      recognition.onstart = () => { recognizing = true; startBtn.disabled = true; stopBtn.disabled = false; };
      recognition.onend = () => { recognizing = false; startBtn.disabled = false; stopBtn.disabled = true; };
    } catch (e) {
      console.warn('SpeechRecognition init failed', e);
      setUnsupported();
    }
  }

  startBtn.addEventListener('click', () => {
    if (!recognition) return;
    try {
      if (!recognizing) recognition.start();
    } catch (e) {
      // start() may throw if called while already starting
      console.warn('recognition.start() error', e);
    }
  });

  stopBtn.addEventListener('click', () => {
    if (!recognition) return;
    try {
      if (recognizing) recognition.stop();
    } catch (e) {
      console.warn('recognition.stop() error', e);
    }
  });

  async function askStudyBuddy(message) {
    replyArea.textContent = 'Thinking...';
    try {
      const payload = { message, sessionId: window.studyBuddySessionId || null };
      // helper to attempt POST and return response
      async function tryPost(url) {
        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // Primary try: relative path (works when served by the Node server)
      let res = null;
      try {
        res = await tryPost('/api/ask');
        // If server returns 405 (e.g., static-only server), try localhost fallback
        if (res.status === 405) {
          const fallbackUrl = 'http://localhost:3000/api/ask';
          res = await tryPost(fallbackUrl);
        }
      } catch (e) {
        // network or CORS error — try localhost fallback
        try {
          res = await tryPost('http://localhost:3000/api/ask');
        } catch (e2) {
          throw new Error('Network error and localhost fallback failed. Is the Node server running?');
        }
      }

      // Safely handle responses that are not valid JSON (e.g., HTML error pages or empty body)
      let data = null;
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
      }
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (e) {
          const txt = await res.text().catch(() => '');
          throw new Error('Invalid JSON response from server: ' + (txt || e.message));
        }
      } else {
        // If server returned plain text, treat it as message
        const txt = await res.text().catch(() => '');
        data = { reply: txt };
      }
      if (data.sessionId) {
        window.studyBuddySessionId = data.sessionId;
        try { localStorage.setItem('studyBuddy_sessionId', data.sessionId); } catch (e) {}
      }
      if (data.reply) {
        const sid = window.studyBuddySessionId || 'local';
        const key = 'studyBuddy_history_' + sid;
        const raw = localStorage.getItem(key);
        const hist = raw ? JSON.parse(raw) : [];
        hist.push({ role: 'user', content: message });
        hist.push({ role: 'assistant', content: data.reply });
        try { localStorage.setItem(key, JSON.stringify(hist)); } catch (e) {}
        replyArea.textContent = data.reply;
        renderHistory(hist);
        if (speakResponseToggle?.checked) speakText(data.reply);
      } else if (data.error) {
        replyArea.textContent = 'Error: ' + data.error;
      }
    } catch (err) {
      replyArea.textContent = 'Request failed: ' + (err.message || err);
    }
  }

  function renderHistory(hist) {
    if (!historyEl) return;
    if (!hist || hist.length === 0) {
      historyEl.textContent = '(no conversation yet)';
      return;
    }
    historyEl.innerHTML = '';
    hist.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'hist-item';
      const who = document.createElement('strong');
      who.textContent = m.role + ':';
      who.style.display = 'inline-block';
      who.style.width = '90px';
      who.style.color = '#6b7280';
      const span = document.createElement('span');
      span.innerHTML = escapeHtml(m.content);
      el.appendChild(who);
      el.appendChild(span);
      historyEl.appendChild(el);
    });
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  sendBtn.addEventListener('click', () => {
    const typed = textInput.value.trim();
    const spoken = transcriptEl.value.trim();
    const message = typed || spoken;
    if (!message) return;
    askStudyBuddy(message);
  });

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendBtn.click(); }
  });

  // restore session history
  const sid = localStorage.getItem('studyBuddy_sessionId');
  if (sid) {
    window.studyBuddySessionId = sid;
    const key = 'studyBuddy_history_' + sid;
    const raw = localStorage.getItem(key);
    const hist = raw ? JSON.parse(raw) : [];
    renderHistory(hist);
  }
});