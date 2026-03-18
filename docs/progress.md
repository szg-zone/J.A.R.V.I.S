# Progress Tracker
# J.A.R.V.I.S - SZG — Sprint Status

> The AI updates this file after every completed task.
> This is the single source of truth for what's done and what's next.
> Last updated: [AI updates this timestamp on every write]

---

## How This Works

After every completed sprint task:
1. The AI marks the task `[x]`
2. Adds the commit hash next to it
3. Updates the "Current Status" section
4. Pushes this file to GitHub along with the code

---

## Current Status

```
Phase    : 1 — Core Daemon
Status   : ✅ COMPLETE
JARVIS is running at http://localhost:3142
```

---

## Phase 1 — Core Daemon

### Sprint 1.1 — Project Skeleton
- [x] Create directory structure per `docs/structure.md`
- [x] Initialize `package.json` with `"type": "module"`
- [x] Create `.env` and `.env.example`
- [x] Create `.gitignore`
- [x] Verify `bun --version` ≥ 1.1.0
- [x] Connect GitHub repo and push initial commit

### Sprint 1.2 — NIM Client (`src/core/llm.ts`)
- [x] Implement `chat()` — non-streaming, tool calling
- [x] Implement `streamChat()` — SSE streaming
- [x] Add retry logic: 3 attempts, 1s/2s/4s backoff
- [x] Add 30-second AbortController timeout
- [x] Export all interfaces from `src/core/types.ts`

### Sprint 1.3 — Memory Vault (`src/memory/vault.ts`)
- [x] Create `~/.jarvis-szg/` directory on first run
- [x] Initialize SQLite at `~/.jarvis-szg/jarvis.db`
- [x] Create `knowledge` + `knowledge_fts` tables
- [x] Create `conversations` table with index
- [x] Implement `store()`, `search()`, `buildContext()`
- [x] Implement `saveMessage()`, `loadHistory()`
- [x] Implement `extractAsync()` — fire-and-forget
- [x] Implement `getStats()`

### Sprint 1.4 — Tool Registry (`src/tools/`)
- [x] Implement `ToolRegistry` class in `registry.ts`
- [x] Create `impl/web_search.ts`
- [x] Create `impl/remember.ts`
- [x] Create `impl/recall.ts`
- [x] Create `impl/datetime.ts`
- [x] Create `impl/run_command.ts` (with blocklist)
- [x] Create `impl/read_file.ts`
- [x] Create `impl/write_file.ts`
- [x] Register all 7 tools in `registry.ts`

### Sprint 1.5 — Agent Loop (`src/core/agent.ts`)
- [x] Implement `Agent.run()` with 20-iteration loop
- [x] Load history + inject knowledge context
- [x] Execute tool calls → push results → continue
- [x] Stream response via `onToken` callback
- [x] Save messages + fire-and-forget extraction
- [x] Export `agent` singleton

### Sprint 1.6 — WebSocket Server (`src/server/server.ts`)
- [x] `Bun.serve()` with WebSocket upgrade at `/ws`
- [x] Send `thinking` event immediately on message
- [x] Stream tokens via `token` events
- [x] Send `stream_end` with full response
- [x] REST routes: `/`, `/api/chat`, `/api/status`, `/api/memory`
- [x] Export `startServer()` and `broadcast()`

### Sprint 1.7 — Dashboard UI (`public/index.html`)
- [x] Dark theme, professional design
- [x] WebSocket with auto-reconnect
- [x] Streaming token display
- [x] Tool call activity shown inline
- [x] Connection status indicator
- [x] Session persistence via sessionStorage

### Sprint 1.8 — Entry Point (`src/index.ts`)
- [x] Parse `.env` manually (no library)
- [x] Validate `NVIDIA_API_KEY` — fail fast
- [x] Print startup banner
- [x] Handle SIGINT gracefully

**Phase 1 done when**: `bun run src/index.ts` starts, dashboard loads, can chat with streaming, tools work, memory accumulates.

---

## Phase 2 — Voice Interface

### Sprint 2.1 — TTS (`src/voice/tts.ts`)
- [ ] `bun add edge-tts`
- [ ] `synthesize(text)` → async generator of MP3 Buffers
- [ ] Sentence splitting before synthesis
- [ ] Server sends buffers as binary WebSocket frames

### Sprint 2.2 — STT (`src/voice/stt.ts`)
- [ ] `transcribe(buffer)` → `Promise<string>`
- [ ] Send to Groq Whisper API
- [ ] Browser captures WebM → binary WS frame → server → transcribe()

### Sprint 2.3 — Wake Word + Voice State
- [ ] openwakeword WASM in Web Worker
- [ ] 4-state machine: idle → listening → processing → responding
- [ ] "Hey JARVIS" wake word detection
- [ ] Push-to-talk: Space held → listening

**Phase 2 done when**: Can say "Hey JARVIS" → ask a question → hear the answer.

---

## Phase 3 — Browser Automation

### Sprint 3.1 — Playwright Controller (`src/browser/controller.ts`)
- [ ] `bun add playwright` + `bunx playwright install chromium`
- [ ] Windows Chrome auto-detection
- [ ] Stealth mode + dedicated profile
- [ ] browser_navigate, snapshot, click, type, extract, screenshot tools
- [ ] Register all browser tools

**Phase 3 done when**: Can ask "go to github.com and tell me the top trending repos" and JARVIS navigates Chrome and answers.

---

## Phase 4 — Screen Awareness

### Sprint 4.1 — Screenshot Loop (`src/awareness/capture.ts`)
- [ ] PowerShell screen capture, 7s interval
- [ ] Pixel change threshold (skip identical frames)

### Sprint 4.2 — OCR (`src/awareness/ocr.ts`)
- [ ] `bun add tesseract.js`
- [ ] `extractText()` → `{ text, hash, urls }`

### Sprint 4.3 — Struggle Detection (`src/awareness/struggle.ts`)
- [ ] Rolling 30-frame behavioral analysis
- [ ] 4 signal weights, 2-min grace period
- [ ] Vision escalation on struggle_detected

**Phase 4 done when**: Stare at a broken terminal for 2 minutes → JARVIS proactively suggests a fix.

---

## Phase 5 — Automation Engine

### Sprint 5.1 — Engine + Triggers
- [ ] Workflow definition types + topological sort
- [ ] Cron trigger (`triggers/cron.ts`)
- [ ] Webhook trigger (`triggers/webhook.ts`)
- [ ] File change trigger (`triggers/file.ts`)
- [ ] Execution history in SQLite

**Phase 5 done when**: Can define "every day at 9am, search HN and send me a summary" and it runs automatically.

---

## Completed Tasks Log

| Date | Sprint | Task | Commit |
|------|--------|------|--------|
| 2026-03-18 | 1.1 | Project Skeleton | 8ba4f9f |
| 2026-03-18 | 1.2 | NIM Client | 2fe5815 |
| 2026-03-18 | 1.3 | Memory Vault | 79d1425 |
| 2026-03-18 | 1.4 | Tool Registry | a5d7107 |
| 2026-03-18 | 1.5 | Agent Loop | 2bd86b6 |
| 2026-03-18 | 1.6 | WebSocket Server | 61f1a3d |
| 2026-03-18 | 1.7 | Dashboard UI | 2c85c3a |
| 2026-03-18 | 1.8 | Entry Point | [pending] |
| — | — | — | — |

*(AI fills this in as tasks complete)*

---

## Blockers

*(AI notes anything blocking progress here)*

| Date | Blocker | Status |
|------|---------|--------|
| — | — | — |
