# Skills Index
# J.A.R.V.I.S - SZG — Skills Folder Reference

> The `skills/` folder contains expert knowledge files curated by the user.
> This index tells you what each skill covers and when to read it.
> Always check this file at session start to know which skills are available.

---

## Protocol

```
Session start:
  1. Read this index file
  2. Note which skills are available (check that the files actually exist)
  3. Before each sprint, re-check which skills apply
  4. Read the full skill file before writing code for that subsystem

Rule: If a skill file says to do something differently than the docs,
      the SKILL WINS — it's the user's curated preference.
```

---

## Skill Files & When to Read Them

### `skills/agent.md`
**Read before**: implementing or modifying the agent loop, tool calling, multi-agent orchestration
**Covers**: agent loop patterns, iteration limits, tool calling best practices, context management, how to structure the system prompt, multi-turn conversation handling

### `skills/memory.md`
**Read before**: implementing SQLite vault, knowledge extraction, context injection, RAG patterns
**Covers**: schema design, FTS5 queries, extraction prompt engineering, context window budgeting, knowledge deduplication, retrieval ranking

### `skills/browser.md`
**Read before**: implementing Playwright controller, browser tools, CDP, screenshot tools
**Covers**: Playwright best practices, stealth mode, element selection strategy, error handling for dynamic pages, Windows Chrome detection

### `skills/voice.md`
**Read before**: implementing TTS, STT, wake word, voice state machine
**Covers**: edge-tts usage patterns, Groq Whisper API, audio chunking, WebSocket binary frames, sentence splitting for TTS, wake word sensitivity tuning

### `skills/awareness.md`
**Read before**: implementing screen capture, OCR, struggle detection, vision escalation
**Covers**: PowerShell screenshot technique, tesseract.js patterns, hash-based change detection, behavioral signal calculation, grace period logic

### `skills/tools.md`
**Read before**: registering any new tool, writing tool `execute()` functions
**Covers**: tool naming conventions, description writing (LLM reads this to decide when to call), parameter schema patterns, error return format, testing tools

### `skills/server.md`
**Read before**: implementing or modifying the WebSocket server, REST endpoints, client management
**Covers**: Bun.serve() patterns, WebSocket lifecycle, session management, binary frame handling, broadcast patterns, reconnect logic

### `skills/workflow.md`
**Read before**: implementing the automation engine, triggers, workflow execution
**Covers**: topological sort execution, trigger backend patterns, error policies, cron expression handling, execution history storage

### `skills/security.md`
**Read before**: any shell execution, file access, credential handling, user input processing
**Covers**: blocklist patterns, path sanitization, credential vault patterns, input validation, what to refuse

### `skills/typescript.md`
**Read before**: any TypeScript/Bun-specific implementation
**Covers**: Bun-specific APIs, ESM patterns, import conventions, type patterns, common Bun gotchas on Windows

### `skills/dashboard.md`
**Read before**: modifying `public/index.html`, adding dashboard features
**Covers**: vanilla JS WebSocket patterns, streaming token display, tool activity UI, voice state indicators, dark theme conventions

### `skills/testing.md`
**Read before**: writing or running acceptance tests
**Covers**: manual test patterns, how to test streaming endpoints, WebSocket testing, SQLite inspection commands

---

## Quick-Reference: Skill → Sprint Mapping

| Sprint | Skills to read |
|--------|---------------|
| 1.1 Skeleton | `typescript.md` |
| 1.2 NIM Client | `agent.md` (LLM section), `typescript.md` |
| 1.3 Memory Vault | `memory.md` |
| 1.4 Tool Registry | `tools.md` |
| 1.5 Agent Loop | `agent.md`, `memory.md`, `tools.md` |
| 1.6 WebSocket Server | `server.md` |
| 1.7 Dashboard UI | `dashboard.md` |
| 1.8 Entry Point | `typescript.md`, `security.md` |
| 2.1 TTS | `voice.md` |
| 2.2 STT | `voice.md` |
| 2.3 Wake Word | `voice.md` |
| 3.1 Browser | `browser.md`, `tools.md` |
| 4.1 Screenshots | `awareness.md` |
| 4.2 OCR | `awareness.md` |
| 4.3 Struggle | `awareness.md`, `agent.md` |
| 5.1 Engine | `workflow.md` |

---

## If a Skill File Doesn't Exist

```
If skills/agent.md doesn't exist:
  → Proceed using docs/architecture.md and docs/ai_rules.md
  → Do not fabricate skill file content
  → Note to user: "skills/agent.md not found — proceeding with docs only"
```

Never assume a skill file's content. Only apply what you actually read.

---

## Adding Skills

When the user adds a new skill file to `skills/`:
1. Add it to this index with description and when-to-read guidance
2. Update the sprint mapping table if applicable
3. On next relevant implementation, read it before coding
