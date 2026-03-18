# Known Errors & Solutions Log
# J.A.R.V.I.S - SZG

> Before spending time debugging any error, check this file first.
> If you solve a new error, add it here immediately.
> Format: error signature → root cause → exact fix.

---

## How to Use This File

When you hit an error:
1. Copy the key part of the error message (the unique identifiable string)
2. `Ctrl+F` search this file for it
3. If found → apply the documented fix
4. If not found → debug normally, then add it here when solved

---

## Bun / Runtime Errors

### `Cannot find module './foo' — did you mean './foo.ts'?`
**Cause**: Missing `.ts` extension in import statement.
**Fix**: Always use `.ts` extension: `import { x } from './foo.ts'`
```typescript
// ❌ Wrong
import { chat } from '../core/llm';
// ✅ Correct
import { chat } from '../core/llm.ts';
```

### `SyntaxError: Cannot use import statement in a module`
**Cause**: A file is using CommonJS `require()` instead of ESM `import`.
**Fix**: Replace `const x = require('y')` with `import x from 'y'`
Also verify `package.json` has `"type": "module"`.

### `error: "bun:sqlite" is not available`
**Cause**: Using an old version of Bun that doesn't bundle SQLite.
**Fix**: Update Bun: `bun upgrade` — requires Bun 1.0.0+

### `error: Cannot read property 'run' of undefined`
**Cause**: Database not initialized before use, or `new Database()` failed silently.
**Fix**: Wrap database init in try/catch, check path exists:
```typescript
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
const dir = join(homedir(), '.jarvis-szg');
mkdirSync(dir, { recursive: true });
const db = new Database(join(dir, 'jarvis.db'));
```

### `ENOENT: No such file or directory, open '~/.jarvis-szg/jarvis.db'`
**Cause**: Tilde `~` is not expanded by Bun's file APIs on Windows.
**Fix**: Always use `homedir()` from the `os` module:
```typescript
import { homedir } from 'os';
import { join } from 'path';
const DB_PATH = join(homedir(), '.jarvis-szg', 'jarvis.db');
```

---

## NVIDIA NIM / LLM Errors

### `NIM API 401: Unauthorized`
**Cause**: API key is missing, wrong, or has expired.
**Fix**:
1. Check `.env` — `NVIDIA_API_KEY` must start with `nvapi-`
2. Go to https://build.nvidia.com → regenerate key
3. The key is passed as `Authorization: Bearer nvapi-xxxxx`

### `NIM API 429: Too Many Requests`
**Cause**: Free tier rate limit hit.
**Fix**: The retry logic in `src/core/llm.ts` handles this automatically (1s/2s/4s backoff, 3 retries). If you're getting persistent 429s, wait 60 seconds and retry.

### `NIM API 422: Unprocessable Entity`
**Cause**: Malformed request body — usually wrong message format or invalid tool schema.
**Fix**: Check that:
- All messages have `role` and `content` fields
- Tool `parameters` follows JSON Schema format with `type: "object"` at root
- `tool_choice` is `"auto"` not `"none"` when tools are passed

### `Streaming: incomplete JSON chunk / SyntaxError on SSE parse`
**Cause**: SSE stream delivers partial JSON lines that span buffer reads.
**Fix**: Buffer incomplete lines across reads:
```typescript
let buf = '';
for await (const chunk of stream) {
  buf += decoder.decode(chunk, { stream: true });
  const lines = buf.split('\n');
  buf = lines.pop() ?? '';  // keep incomplete last line
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') return;
    try { /* parse */ } catch { /* skip malformed */ }
  }
}
```

### `fetch: The operation was aborted` / `AbortError`
**Cause**: 30-second timeout triggered — LLM took too long.
**Fix**: This is expected behavior. The user will see an error. If it happens frequently, check your internet connection or increase timeout to 60s for complex tasks.

---

## SQLite / Memory Errors

### `SqliteError: no such table: knowledge_fts`
**Cause**: FTS5 virtual table wasn't created or was dropped.
**Fix**: Re-run table creation. Both tables must be created together:
```typescript
db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts
  USING fts5(content, tags, content='knowledge', content_rowid='id')`);
```

### `SqliteError: fts5: syntax error near "..."`
**Cause**: FTS query contains special characters that break FTS5 syntax.
**Fix**: The LIKE fallback in `vault.search()` handles this. Make sure the try/catch wraps the FTS query:
```typescript
try {
  return db.prepare(`SELECT k.* FROM knowledge k
    JOIN knowledge_fts f ON k.id = f.rowid
    WHERE knowledge_fts MATCH ? LIMIT ?`).all(query, limit);
} catch {
  return db.prepare(`SELECT * FROM knowledge
    WHERE content LIKE ? LIMIT ?`).all(`%${query}%`, limit);
}
```

### `Memory extraction crashes main flow`
**Cause**: `await vault.extractAsync()` was called instead of fire-and-forget.
**Fix**: Never await extraction. Call without await:
```typescript
vault.extractAsync(userMsg, assistantMsg); // ✅ no await
await vault.extractAsync(userMsg, assistantMsg); // ❌ blocks response
```

---

## WebSocket Errors

### `WebSocket is closed before the connection is established`
**Cause**: Client connects before the Bun server finishes starting up.
**Fix**: Add auto-reconnect logic in the dashboard:
```javascript
function connect() {
  const ws = new WebSocket('ws://localhost:3142/ws?session=' + sessionId);
  ws.onclose = () => setTimeout(connect, 2000); // retry after 2s
}
```

### `WebSocket send after close`
**Cause**: Trying to send to a client that already disconnected.
**Fix**: Wrap all `ws.send()` calls in try/catch and remove from clients Map on error:
```typescript
try {
  ws.send(JSON.stringify(msg));
} catch {
  clients.delete(clientId);
}
```

### `Binary frame not recognized as audio`
**Cause**: Browser sending binary WebSocket frames that the server isn't handling.
**Fix**: In Bun's WebSocket handler, check frame type:
```typescript
message(ws, data) {
  if (data instanceof Buffer) {
    // Binary frame — audio data, route to STT
  } else {
    // String frame — JSON message
    const msg = JSON.parse(data);
  }
}
```

---

## Windows / PowerShell Errors

### `powershell: execution of scripts is disabled on this system`
**Cause**: PowerShell execution policy is set to Restricted.
**Fix**: Run once as Administrator:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### `EACCES: permission denied` on PowerShell spawn
**Cause**: Process doesn't have permission to spawn PowerShell.
**Fix**: Run the terminal as Administrator, or check Windows Defender isn't blocking Bun.

### `port 3142 already in use`
**Cause**: A previous JARVIS-SZG process is still running.
**Fix**:
```powershell
netstat -ano | findstr :3142
taskkill /PID <pid> /F
```
Or change port in `.env`: `PORT=3143`

### `Screenshot is blank / all black`
**Cause**: PowerShell can't access the display in some session contexts.
**Fix**: Ensure the terminal is running in an interactive session with desktop access (not a service or headless context).

---

## Playwright / Browser Errors

### `Error: Failed to launch browser: executable doesn't exist`
**Cause**: Chrome/Chromium not found at expected path.
**Fix**: Set path explicitly in `.env`:
```
JARVIS_BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```
Or install Chromium via Playwright:
```powershell
bunx playwright install chromium
```

### `Error: page.click: Element is not visible`
**Cause**: Element exists in accessibility tree but is hidden or off-screen.
**Fix**: Scroll to element first, or use `force: true` option. Consider using `page.evaluate()` to click directly.

### `Error: Target closed` mid-automation
**Cause**: Browser tab was closed while automation was running.
**Fix**: Wrap all Playwright calls in try/catch. On `Target closed`, re-launch browser and retry once.

---

## Tesseract / OCR Errors

### `Tesseract: Error loading language 'eng'`
**Cause**: Language data file not downloaded.
**Fix**: tesseract.js downloads language data automatically on first use. Ensure you have internet access on first run.

### `OCR returns empty string on screenshot`
**Cause**: Screenshot is too small, blurry, or has dark text on dark background.
**Fix**: Check the screenshot first. If awareness captures are failing, add a minimum brightness check before OCR.

---

## Git Errors

### `git push: rejected — non-fast-forward`
**Fix**: `git pull origin main --rebase && git push origin main`

### `git push: Authentication failed`
**Fix**: `git config credential.helper store` then push again — enter GitHub username + PAT when prompted.

### `fatal: remote origin already exists`
**Fix**: `git remote set-url origin https://github.com/USER/REPO.git`

---

## Template: Adding a New Error

When you solve a new error, add it here:

```markdown
### `[paste the key error string here]`
**Cause**: [what actually caused it — root cause, not symptoms]
**Fix**: [exact commands or code changes that solved it]
```
