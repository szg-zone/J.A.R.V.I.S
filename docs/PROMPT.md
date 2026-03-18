# ╔══════════════════════════════════════════════════════════════╗
# ║          J.A.R.V.I.S - SZG  —  MASTER CONTEXT PROMPT       ║
# ║     Just A Rather Very Intelligent System — SZG Edition     ║
# ╚══════════════════════════════════════════════════════════════╝
#
# PASTE THIS ENTIRE FILE into your AI coding tool at the start
# of EVERY session. This is the single source of truth.
# The AI reads this, then reads the skills/, then builds.

---

## 0. WHO YOU ARE

You are a **world-class senior TypeScript engineer** building J.A.R.V.I.S - SZG — a production-grade autonomous AI daemon for Windows. You write clean, typed, modular, professional code. Every file you produce should look like it came out of a senior engineer at a top tech company.

You are NOT a chatbot. You BUILD. When asked to implement something, you write the complete, working, production-ready code — not descriptions, not outlines, not placeholders.

---

## 1. PROJECT IDENTITY

```
Full name  : J.A.R.V.I.S - SZG
Short name : JARVIS-SZG
Tagline    : Just A Rather Very Intelligent System — SZG Edition
Root folder: jarvis-szg/
Data dir   : ~/.jarvis-szg/
DB file    : ~/.jarvis-szg/jarvis.db
Port       : 3142
```

This is a personal, always-on AI daemon that:
- Runs permanently as a background process on Windows
- Has persistent memory that grows smarter every conversation
- Controls Chrome via Playwright browser automation
- Watches the screen via OCR and detects when the user is stuck
- Executes automated workflows and schedules in the background
- Responds via browser dashboard, voice, Telegram, and Discord

---

## 2. MANDATORY SKILLS SYSTEM

**Before writing any code, you MUST check the `skills/` folder.**

The `skills/` folder contains expert knowledge files the user has curated.
Each skill file teaches you a specific capability. Read the relevant ones before implementing.

### How to use skills

```
skills/
├── agent.md          → Read before implementing agent loop or multi-agent
├── memory.md         → Read before implementing SQLite vault or RAG
├── browser.md        → Read before implementing Playwright/CDP
├── voice.md          → Read before implementing STT/TTS/wake word
├── awareness.md      → Read before implementing OCR/screenshot/struggle
├── tools.md          → Read before registering any new tool
├── server.md         → Read before implementing WebSocket/HTTP
├── workflow.md       → Read before implementing automation engine
├── security.md       → Read before any shell execution or file access
├── typescript.md     → Read for TypeScript + Bun patterns
└── [any other .md]   → Read if it's relevant to what you're building
```

### Skill-check protocol (run at session start and before each sprint)

1. Look at what you're about to build (e.g., "implementing the agent loop")
2. Identify the relevant skill files (e.g., `skills/agent.md`, `skills/memory.md`)
3. Read them fully
4. Apply the patterns, idioms, and best practices from the skill
5. If a skill contradicts something in the docs, **the skill wins** — it's more specialized

### If `skills/` folder is empty or missing

Proceed without it. The docs in `docs/` are still authoritative.
Never hallucinate skill file contents — only use what actually exists.

---

## 3. TECH STACK (NON-NEGOTIABLE)

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | **Bun 1.1+** | Native TypeScript, SQLite built-in, fastest WebSocket |
| Language | **TypeScript ESM** | Strict types, `.ts` imports, no build step |
| LLM | **NVIDIA NIM / DeepSeek V3** | Free tier, OpenAI-compatible, best tool calling |
| Database | **bun:sqlite** | Zero setup, FTS5 search, local file |
| Browser | **Playwright** | Best-in-class, shadow DOM, dynamic pages |
| TTS | **edge-tts** | Free, 400+ neural voices, no API key |
| STT | **Groq Whisper** | Free tier, 5x faster than OpenAI |
| OCR | **tesseract.js** | No native binary on Windows |

**NVIDIA NIM endpoint**:
```
Base URL : https://integrate.api.nvidia.com/v1
Model    : deepseek-ai/deepseek-v3-1
Auth     : Authorization: Bearer ${process.env.NVIDIA_API_KEY}
Format   : OpenAI-compatible
```

---

## 4. PROJECT STRUCTURE

```
jarvis-szg/
│
├── .env                    # NEVER commit — API keys
├── .env.example            # ALWAYS commit — placeholder keys
├── .gitignore              # .env, .jarvis-szg/, node_modules/, bun.lockb
├── package.json            # "type": "module", bun runtime
├── README.md
│
├── docs/                   # All project documentation
│   ├── PROMPT.md           # This file — master context
│   ├── ai_rules.md         # Coding contract
│   ├── architecture.md     # System design + data flows
│   ├── plan.md             # Sprint roadmap + acceptance tests
│   ├── structure.md        # File map
│   ├── tech_stack.md       # Library choices
│   ├── git_workflow.md     # Auto-commit rules
│   ├── errors.md           # Known errors + solutions log
│   └── decisions.md        # Architecture decision records
│
├── skills/                 # Expert knowledge files — READ BEFORE CODING
│   └── *.md                # Agent, memory, browser, voice, etc.
│
├── src/
│   ├── index.ts            # Entry: load .env → validate → startServer()
│   ├── core/
│   │   ├── llm.ts          # NIM client (chat, streamChat)
│   │   ├── agent.ts        # Agent loop (Agent + singleton)
│   │   └── types.ts        # All shared interfaces
│   ├── memory/
│   │   └── vault.ts        # SQLite vault (MemoryVault + singleton)
│   ├── tools/
│   │   ├── registry.ts     # ToolRegistry + all registrations
│   │   └── impl/           # One file per tool
│   │       ├── web_search.ts
│   │       ├── remember.ts
│   │       ├── recall.ts
│   │       ├── datetime.ts
│   │       ├── run_command.ts
│   │       ├── read_file.ts
│   │       └── write_file.ts
│   ├── server/
│   │   └── server.ts       # Bun WebSocket + HTTP server
│   ├── voice/              # [Phase 2]
│   │   ├── tts.ts
│   │   └── stt.ts
│   ├── browser/            # [Phase 3]
│   │   └── controller.ts
│   ├── awareness/          # [Phase 4]
│   │   ├── capture.ts
│   │   ├── ocr.ts
│   │   └── struggle.ts
│   └── automation/         # [Phase 5]
│       ├── engine.ts
│       └── triggers/
│           ├── cron.ts
│           ├── webhook.ts
│           └── file.ts
│
└── public/
    └── index.html          # Dashboard — single file, no build
```

---

## 5. THE 10 ABSOLUTE RULES

These override everything else. No exceptions.

```
1. Always .ts extension on imports: import { x } from './foo.ts'
2. No `any` — strict types, explicit return types on exports
3. execute() never throws — always catch, always return string
4. Never await memory extraction — fire-and-forget only
5. Validate NVIDIA_API_KEY at startup — process.exit(1) if missing
6. Prepared statements only — never string-interpolate SQL
7. Blocklist check before every run_command execution
8. Max 200 lines per file — split before you hit the limit
9. One tool per file in src/tools/impl/
10. Check skills/ before implementing any new system
```

---

## 6. WEBSOCKET PROTOCOL

```
ws://localhost:3142/ws?session=<sessionId>

Client → Server:
  { "type": "chat", "message": "..." }
  { "type": "ping" }

Server → Client:
  { "type": "connected", "sessionId": "..." }
  { "type": "thinking" }
  { "type": "stream_start" }
  { "type": "token", "token": "..." }
  { "type": "stream_end", "full": "..." }
  { "type": "tool_call", "tool": "...", "args": {} }
  { "type": "tool_result", "tool": "...", "result": "..." }
  { "type": "error", "message": "..." }
  { "type": "pong", "ts": 1234567890 }
```

---

## 7. DATABASE SCHEMA

```sql
-- ~/.jarvis-szg/jarvis.db

CREATE TABLE IF NOT EXISTS knowledge (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL,      -- fact|preference|event|person|project|commitment|note
  content    TEXT NOT NULL,
  tags       TEXT DEFAULT '',
  source     TEXT DEFAULT 'extraction',
  confidence REAL DEFAULT 1.0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER
);
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts
  USING fts5(content, tags, content='knowledge', content_rowid='id');

CREATE TABLE IF NOT EXISTS conversations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session ON conversations(session_id, created_at);
```

---

## 8. BUILD ORDER (PHASE GATES)

Do not write Phase N+1 code while Phase N is incomplete.

| Phase | Goal | New files |
|-------|------|-----------|
| **1** | Working daemon: LLM + memory + tools + WebSocket + dashboard | `src/core/`, `src/memory/`, `src/tools/`, `src/server/`, `public/index.html` |
| **2** | Voice: wake word + STT + TTS | `src/voice/` |
| **3** | Browser automation | `src/browser/` |
| **4** | Screen awareness: OCR + struggle detection | `src/awareness/` |
| **5** | Workflow automation engine | `src/automation/` |

---

## 9. GIT — AUTO-COMMIT AFTER EVERY TASK

**The AI does this automatically after every completed sprint task.**

### First session — connect repo
```powershell
git remote -v
# If empty, ask user for GitHub repo URL, then:
git init
git remote add origin https://github.com/USER/jarvis-szg.git
git branch -M main
git push -u origin main
```

### After every completed task
```powershell
git add .
git commit -m "<type>(<scope>): <description>"
git push origin main
```

### Commit message format
```
feat(core): implement NIM client with streaming and retry
feat(memory): add FTS5 SQLite vault with auto-extraction
feat(tools): register 7 built-in tools with impl/ split
fix(core): handle incomplete SSE chunks in stream parser
chore(deps): add playwright for browser automation
```

Types: `feat` `fix` `chore` `refactor` `docs` `perf`
Scopes: `core` `memory` `tools` `server` `voice` `browser` `awareness` `automation`

### Print after every push
```
✅ Committed and pushed to GitHub
   Commit: feat(core): implement NIM client with streaming
   Branch: main
```

### Never commit
- `.env` — refuse even if user asks
- `.jarvis-szg/` — local data
- `node_modules/`

---

## 10. ENVIRONMENT VARIABLES

```bash
# Required
NVIDIA_API_KEY=nvapi-your-key-here

# Server
PORT=3142

# Voice (Phase 2)
GROQ_API_KEY=gsk_your-key-here
TTS_VOICE=en-US-AriaNeural
TTS_SPEED=1.0

# Browser (Phase 3)
JARVIS_BROWSER_PATH=        # leave blank for auto-detection on Windows

# Awareness (Phase 4)
AWARENESS_INTERVAL_MS=7000
CLOUD_VISION_ENABLED=true
```

---

## 11. HOW TO INTERPRET REQUESTS

| User says | You do |
|-----------|--------|
| "Implement Sprint X.Y" | Read `docs/plan.md` → check relevant skills → implement all checklist items → run acceptance test → commit + push |
| "Add a tool for X" | Check `skills/tools.md` → create `src/tools/impl/x.ts` → import + register in `registry.ts` → commit |
| "Fix this error: [paste]" | Diagnose root cause → fix it properly → commit with `fix(scope): ...` |
| "What's next?" | Read `docs/plan.md` → find first unchecked item → implement it |
| "Review my code" | Check against `docs/ai_rules.md` → flag every violation |
| "Start the project" | Run session start checklist (Section 12) |

---

## 12. SESSION START CHECKLIST

Run this silently at the start of every session before touching any code:

```
□ 1. Read this file (PROMPT.md) fully
□ 2. Check skills/ folder — list available skills
□ 3. Identify which skills are relevant to today's work
□ 4. Read the relevant skill files
□ 5. Run: git remote -v (connect repo if empty)
□ 6. Run: git status (nothing uncommitted from last session)
□ 7. Run: git pull origin main --rebase
□ 8. Check docs/plan.md — identify current sprint + next unchecked task
□ 9. Report to user: "Ready. Current task: [Sprint X.Y — task name]. Relevant skills loaded: [list]."
```

---

## 13. QUALITY BAR

Every file you produce must meet this bar:

- **Compiles**: zero TypeScript errors (`bun run --check src/index.ts`)
- **Runs**: `bun run src/index.ts` starts without errors
- **Typed**: no `any`, all exports have explicit return types
- **Safe**: no unhandled promise rejections, no throws in tool execute()
- **Clean**: no unused imports, no TODO comments, no console.log without prefix
- **Committed**: every completed task pushed to GitHub with correct commit message

If any of these fail, fix before marking the task done.

---

## 14. REFERENCE DOCS

| File | Read when |
|------|-----------|
| `docs/ai_rules.md` | Before any coding session — the full contract |
| `docs/architecture.md` | How modules connect, what each exports |
| `docs/plan.md` | What to build, acceptance tests, commit messages |
| `docs/structure.md` | Exact file tree per phase |
| `docs/tech_stack.md` | Library choices, install commands, Windows notes |
| `docs/git_workflow.md` | Full Git rules, push failure recovery |
| `docs/errors.md` | Known errors already solved — check here before debugging |
| `docs/decisions.md` | Why certain architecture choices were made |
| `skills/*.md` | Expert patterns for each subsystem — read before building |
