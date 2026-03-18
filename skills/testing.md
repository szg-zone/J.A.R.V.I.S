# Testing Skill
# J.A.R.V.I.S - SZG — Testing & Verification

> Expert knowledge for manual testing, WebSocket testing, and SQLite inspection.

---

## When to Read

Read this skill before implementing:
- Testing any component
- Verifying acceptance criteria

---

## Manual Testing

### Start Server
```bash
bun run src/index.ts
```

### Check Dashboard
- Open http://localhost:3142
- Verify dark theme loads
- Check "Connected" status appears

### Test Chat
- Send a message
- Verify streaming tokens appear
- Check response completes

### Test Tools
- "Search for weather in Tokyo" → Should use web_search
- "Remember I prefer dark mode" → Should use remember
- "What do I prefer?" → Should use recall

---

## WebSocket Testing

```javascript
// Test WebSocket directly
const ws = new WebSocket('ws://localhost:3142/ws?session=test');

ws.onopen = () => {
  console.log('Connected');
  
  // Test chat
  ws.send(JSON.stringify({ type: 'chat', message: 'Hello' }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

---

## SQLite Inspection

```bash
# Open database
bun -e "
const { Database } = require('bun:sqlite');
const db = new Database(require('os').homedir() + '/.jarvis-szg/jarvis.db');

// Check tables
console.log('Tables:', db.query(\"SELECT name FROM sqlite_master WHERE type='table'\").all());

// Check knowledge
console.log('Knowledge:', db.query('SELECT * FROM knowledge LIMIT 5').all());

// Check conversations
console.log('Conversations:', db.query('SELECT * FROM conversations LIMIT 5').all());
"
```

---

## Acceptance Criteria Checklist

### Sprint 1.1 - Skeleton
- [ ] Directory structure matches docs/structure.md
- [ ] package.json has "type": "module"
- [ ] .env and .env.example exist
- [ ] .gitignore exists
- [ ] Bun version >= 1.1.0
- [ ] GitHub connected and initial commit pushed

### Sprint 1.2 - NIM Client
- [ ] `chat()` returns response without streaming
- [ ] `streamChat()` streams tokens via callback
- [ ] Tool calls are parsed correctly
- [ ] Retry logic works (3 attempts)
- [ ] Timeout after 30s

### Sprint 1.3 - Memory Vault
- [ ] Database created at ~/.jarvis-szg/jarvis.db
- [ ] Knowledge table with FTS5 works
- [ ] store() saves and returns ID
- [ ] search() finds relevant memories
- [ ] buildContext() returns formatted context
- [ ] saveMessage()/loadHistory() work
- [ ] getStats() returns counts

### Sprint 1.4 - Tool Registry
- [ ] All 7 tools registered
- [ ] Tool execution returns string
- [ ] Errors caught and returned as JSON

### Sprint 1.5 - Agent Loop
- [ ] 20 iteration limit
- [ ] Knowledge context injected
- [ ] Tool calls executed
- [ ] Results fed back to LLM
- [ ] Tokens streamed to callback

### Sprint 1.6 - WebSocket Server
- [ ] Server starts on port 3142
- [ ] WebSocket upgrades at /ws
- [ ] chat message triggers agent
- [ ] tokens stream to client
- [ ] stream_end with full response
- [ ] REST endpoints work

### Sprint 1.7 - Dashboard
- [ ] Dark theme displays
- [ ] WebSocket connects
- [ ] Tokens stream live
- [ ] Tool calls shown
- [ ] Status indicator works
- [ ] Session persists

### Sprint 1.8 - Entry Point
- [ ] .env parsed manually
- [ ] NVIDIA_API_KEY validated
- [ ] Banner prints on start
- [ ] SIGINT handled gracefully

---

## Testing Commands

```bash
# TypeScript check
bun run check

# Start server
bun run start

# Development mode
bun run dev

# SQLite inspection
sqlite3 ~/.jarvis-szg/jarvis.db ".tables"
sqlite3 ~/.jarvis-szg/jarvis.db "SELECT * FROM knowledge LIMIT 5"
```

---

## Related Skills

- `memory.md` — For SQLite patterns
- `server.md` — For WebSocket testing
- `dashboard.md` — For UI testing
