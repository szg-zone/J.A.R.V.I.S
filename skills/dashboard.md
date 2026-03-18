# Dashboard Skill
# J.A.R.V.I.S - SZG — Dashboard UI Implementation

> Expert knowledge for implementing the dashboard UI in `public/index.html`.

---

## When to Read

Read this skill before implementing:
- `public/index.html` — Dashboard UI

---

## Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>J.A.R.V.I.S</title>
  <style>
    /* Dark theme styles */
  </style>
</head>
<body>
  <div id="app">
    <header>
      <h1>J.A.R.V.I.S</h1>
      <span id="status" class="connected">Connected</span>
    </header>
    
    <div id="messages"></div>
    
    <div id="input-area">
      <textarea id="input" placeholder="Ask JARVIS..."></textarea>
      <button id="send">Send</button>
    </div>
  </div>
  
  <script>
    // WebSocket logic
  </script>
</body>
</html>
```

---

## WebSocket Connection

```javascript
const sessionId = sessionStorage.getItem('sessionId') || 
  Math.random().toString(36).substring(2);

sessionStorage.setItem('sessionId', sessionId);

let ws;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

function connect() {
  ws = new WebSocket(`ws://localhost:3142/ws?session=${sessionId}`);
  
  ws.onopen = () => {
    console.log('Connected');
    updateStatus('connected');
    reconnectAttempts = 0;
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleMessage(data);
  };
  
  ws.onclose = () => {
    updateStatus('disconnected');
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connect, delay);
      reconnectAttempts++;
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}
```

---

## Message Handling

```javascript
function handleMessage(data) {
  switch (data.type) {
    case 'connected':
      console.log('Session:', data.sessionId);
      break;
      
    case 'thinking':
      showThinking();
      break;
      
    case 'token':
      appendToken(data.token);
      break;
      
    case 'stream_end':
      hideThinking();
      finalizeMessage(data.full);
      break;
      
    case 'tool_call':
      showToolCall(data.tool, data.args);
      break;
      
    case 'tool_result':
      showToolResult(data.tool, data.result);
      break;
      
    case 'error':
      showError(data.message);
      break;
  }
}
```

---

## Dark Theme

```css
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --accent: #58a6ff;
  --success: #3fb950;
  --error: #f85149;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## UI Components

```javascript
// Streaming token display
function appendToken(token) {
  const lastMsg = document.querySelector('.message.assistant .content');
  if (lastMsg) {
    lastMsg.textContent += token;
  }
}

// Tool activity
function showToolCall(tool, args) {
  const toolDiv = document.createElement('div');
  toolDiv.className = 'tool-call';
  toolDiv.innerHTML = `<span class="tool-name">${tool}</span>`;
  document.getElementById('messages').appendChild(toolDiv);
}

// Connection status
function updateStatus(status) {
  const statusEl = document.getElementById('status');
  statusEl.className = status;
  statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}
```

---

## Input Handling

```javascript
document.getElementById('input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const input = document.getElementById('input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message to UI
  addMessage('user', message);
  
  // Send to WebSocket
  ws.send(JSON.stringify({ type: 'chat', message }));
  
  input.value = '';
}
```

---

## Session Persistence

```javascript
// Store session in sessionStorage
const sessionId = sessionStorage.getItem('sessionId') || 
  generateUUID();

sessionStorage.setItem('sessionId', sessionId);

// Send with every message
ws.send(JSON.stringify({ 
  type: 'chat', 
  message, 
  sessionId 
}));
```

---

## Related Skills

- `server.md` — For WebSocket server protocol
- `voice.md` — For voice state indicators
