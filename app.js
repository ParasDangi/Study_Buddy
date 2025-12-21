// Frontend logic: speech recognition, sending to backend, conversation history, and speech synthesis
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const transcriptEl = document.getElementById('transcript');
const sendBtn = document.getElementById('sendBtn');
const textInput = document.getElementById('textInput');
const replyArea = document.getElementById('replyArea');
const speakResponseToggle = document.getElementById('speakResponse');
const historyEl = document.getElementById('history');

let recognition;
let recognizing = false;
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  startBtn.disabled = true;
  stopBtn.disabled = true;
  transcriptEl.placeholder = 'Speech Recognition not supported in this browser. Use Chrome/Edge.';
} else {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    transcriptEl.value = (final + ' ' + interim).trim();
  };

  recognition.onstart = () => { recognizing = true; startBtn.disabled = true; stopBtn.disabled = false; };
  recognition.onend = () => { recognizing = false; startBtn.disabled = false; stopBtn.disabled = true; };
}

startBtn?.addEventListener('click', () => {
  if (recognition && !recognizing) recognition.start();
});
stopBtn?.addEventListener('click', () => {
  if (recognition && recognizing) recognition.stop();
});

async function askStudyBuddy(message) {
  replyArea.textContent = 'Thinking...';
  try {
    const payload = { message, sessionId: window.studyBuddySessionId || null };
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.sessionId) {
      window.studyBuddySessionId = data.sessionId;
      localStorage.setItem('studyBuddy_sessionId', data.sessionId);
    }
    if (data.reply) {
      // update local history stored in localStorage
      const sid = window.studyBuddySessionId || 'local';
      const key = 'studyBuddy_history_' + sid;
      const raw = localStorage.getItem(key);
      const hist = raw ? JSON.parse(raw) : [];
      hist.push({ role: 'user', content: message });
      hist.push({ role: 'assistant', content: data.reply });
      localStorage.setItem(key, JSON.stringify(hist));
      replyArea.textContent = data.reply;
      renderHistory(hist);
      if (speakResponseToggle.checked) speakText(data.reply);
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
    el.innerHTML = `<strong>${m.role}:</strong> <span>${escapeHtml(m.content)}</span>`;
    historyEl.appendChild(el);
  });
  historyEl.scrollTop = historyEl.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

// Allow Enter to send when focus in text input
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); sendBtn.click(); }
});

// On load, restore session id and history
window.addEventListener('load', () => {
  const sid = localStorage.getItem('studyBuddy_sessionId');
  if (sid) {
    window.studyBuddySessionId = sid;
    const key = 'studyBuddy_history_' + sid;
    const raw = localStorage.getItem(key);
    const hist = raw ? JSON.parse(raw) : [];
    renderHistory(hist);
  }
});
// Frontend logic: speech recognition, sending to backend, conversation history, and speech synthesis
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const transcriptEl = document.getElementById('transcript');
const sendBtn = document.getElementById('sendBtn');
const textInput = document.getElementById('textInput');
const replyArea = document.getElementById('replyArea');
const speakResponseToggle = document.getElementById('speakResponse');
const historyEl = document.getElementById('history');

let recognition;
let recognizing = false;
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  startBtn.disabled = true;
  stopBtn.disabled = true;
  transcriptEl.placeholder = 'Speech Recognition not supported in this browser. Use Chrome/Edge.';
} else {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    transcriptEl.value = (final + ' ' + interim).trim();
  };

  recognition.onstart = () => { recognizing = true; startBtn.disabled = true; stopBtn.disabled = false; };
  recognition.onend = () => { recognizing = false; startBtn.disabled = false; stopBtn.disabled = true; };
}

startBtn?.addEventListener('click', () => {
  if (recognition && !recognizing) recognition.start();
});
stopBtn?.addEventListener('click', () => {
  if (recognition && recognizing) recognition.stop();
});

async function askStudyBuddy(message) {
  replyArea.textContent = 'Thinking...';
  try {
    const payload = { message, sessionId: window.studyBuddySessionId || null };
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.sessionId) {
      window.studyBuddySessionId = data.sessionId;
      localStorage.setItem('studyBuddy_sessionId', data.sessionId);
    }
    if (data.reply) {
      // update local history stored in localStorage
      const sid = window.studyBuddySessionId || 'local';
      const key = 'studyBuddy_history_' + sid;
      const raw = localStorage.getItem(key);
      const hist = raw ? JSON.parse(raw) : [];
      hist.push({ role: 'user', content: message });
      hist.push({ role: 'assistant', content: data.reply });
      localStorage.setItem(key, JSON.stringify(hist));
      replyArea.textContent = data.reply;
      renderHistory(hist);
      if (speakResponseToggle.checked) speakText(data.reply);
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
    el.innerHTML = `<strong>${m.role}:</strong> <span>${escapeHtml(m.content)}</span>`;
    historyEl.appendChild(el);
  });
  historyEl.scrollTop = historyEl.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// On load, restore session id and history
window.addEventListener('load', () => {
  const sid = localStorage.getItem('studyBuddy_sessionId');
  if (sid) {
    window.studyBuddySessionId = sid;
    const key = 'studyBuddy_history_' + sid;
    const raw = localStorage.getItem(key);
    const hist = raw ? JSON.parse(raw) : [];
    renderHistory(hist);
  }
});

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

// Allow Enter to send when focus in text input
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); sendBtn.click(); }
});
