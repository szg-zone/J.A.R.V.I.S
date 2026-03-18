# AI Rules — J.A.R.V.I.S - SZG Coding Contract

> This file is your operating contract. Read it fully before writing a single line of code.
> Every rule here exists because it prevents a real failure mode. None are optional.

---

## 0. Identity & Mission

You are a **world-class senior TypeScript engineer** building J.A.R.V.I.S - SZG — a production-grade autonomous AI daemon for Windows. You write clean, typed, modular, professional code. You never cut corners on error handling, never leave TODOs in shipped code, and never produce demo-quality work.

The user is a professional developer. Give them working, production-ready code. Never describe what you would do — do it.

---

## 1. Skills System (Highest Priority)

**Before implementing any subsystem, read the relevant skill file in `skills/`.**

```
Starting a new sprint?
  → Check docs/skills_index.md for which skills apply
  → Read those skill files fully
  → Apply the patterns they teach
  → Skill files override general knowledge
```

If `skills/` folder is empty or a skill file doesn't exist: proceed using `docs/` only. Never fabricate skill file contents.

---

## 2. Language & Runtime Rules

### Stack (non-negotiable)
- **Runtime**: Bun (not Node, not Deno) — `Bun.serve`, `Bun.file`, `bun:sqlite`, `Bun.spawn`
- **Language**: TypeScript ESM — `"type": "module"` in package.json
- **No build step** — Bun runs `.ts` directly
- **Imports**: Always `.ts` extension — `import { x } from './foo.ts'`

### TypeScript rules
- No `any` — strict types everywhere
- Explicit return types on all exported functions
- Interfaces over types for object shapes
- No `!` non-null assertion — handle nulls explicitly
- No `var` — `const` default, `let` only when reassignment needed

---

## 3. Project Identity

```
Full name  : J.A.R.V.I.S - SZG
Root folder: jarvis-szg/
Data dir   : ~/.jarvis-szg/
DB path    : ~/.jarvis-szg/jarvis.db
Port       : 3142
```

All paths use `homedir()` from `os` module. Never hardcode `C:\Users\...`.

---

## 4. File Structure Rules

```
src/core/        — LLM client + agent loop + shared types
src/memory/      — SQLite vault
src/tools/       — registry + impl/ (one file per tool)
src/server/      — WebSocket + HTTP server
src/voice/       — TTS + STT [Phase 2]
src/browser/     — Playwright [Phase 3]
src/awareness/   — OCR + struggle [Phase 4]
src/automation/  — workflow engine [Phase 5]
public/          — dashboard HTML
skills/          — expert knowledge (READ ONLY, never modify)
docs/            — project docs
```

- Max ~200 lines per file — split before hitting the limit
- One tool per file in `src/tools/impl/`
- Export a single named singleton from service files
- Never create barrel `index.ts` files

---

## 5. API Rules

### NVIDIA NIM
```
Base URL : https://integrate.api.nvidia.com/v1
Model    : deepseek-ai/deepseek-v3-1
Auth     : Authorization: Bearer ${process.env.NVIDIA_API_KEY}
```
- Check `res.ok === false` — throw with status + body text
- Buffer incomplete SSE chunks across reads
- Exponential backoff: 3 retries, 1s/2s/4s on 429/503
- 30-second AbortController timeout on all requests
- Never hardcode the key

---

## 6. Memory Rules

- Database at `~/.jarvis-szg/jarvis.db` — use `homedir()`
- Prepared statements always — never string-interpolate SQL
- `CREATE TABLE IF NOT EXISTS` on every table
- FTS5 for knowledge search with LIKE fallback
- Extraction is **always fire-and-forget** — never `await` it
- Max 20 knowledge records injected per turn

---

## 7. Tool Rules

- `execute()` **never throws** — always catch, always return string
- `description` is the most critical field — LLM reads it to decide when to call
- Blocklist check before every `run_command` execution
- Each tool is its own file in `src/tools/impl/`

**Blocked shell patterns**: `rm -rf`, `format`, `del /f /s /q`, `rd /s /q`, `shutdown`, `reg delete`, `net user`

---

## 8. Error Handling Rules

- Never let unhandled promise rejection crash the daemon
- try/catch everything: LLM calls, tools, WebSocket sends, DB ops
- Descriptive errors: `"Error reading /path: ENOENT"` not `"Error"`
- Log with prefix: `console.error('[AGENT] failed:', err)`
- Startup failures: `process.exit(1)` with clear message

---

## 9. Security Rules

- Never execute shell without blocklist check
- Never commit `.env`
- Never store raw credentials in vault
- Validate WebSocket message shape before processing
- Never read files outside safe paths without confirmation

---

## 10. Code Style Rules

- No comments explaining what code does — self-documenting code
- Comments only for WHY — non-obvious decisions
- Functions: `verbNoun` pattern (`buildContext`, `extractText`)
- Constants: `SCREAMING_SNAKE_CASE`
- 2-space indent, single quotes, no semicolons
- Max 100 chars per line

---

## 11. Phase Gating Rules

| Phase | Scope |
|-------|-------|
| 1 | Core: NIM client, agent, vault, tools, server, dashboard |
| 2 | Voice: STT, TTS, wake word |
| 3 | Browser: Playwright |
| 4 | Awareness: OCR, struggle detection |
| 5 | Automation: workflow engine, triggers |

Do not write Phase N+1 code while Phase N is incomplete.

---

## 12. Git Auto-Commit Rules

After every completed sprint task:
```powershell
git add .
git commit -m "<type>(<scope>): <description>"
git push origin main
```

Update `docs/progress.md` — check off the task, add commit hash.

Types: `feat` `fix` `chore` `refactor` `docs` `perf`
Scopes: `core` `memory` `tools` `server` `voice` `browser` `awareness` `automation`

Never commit: `.env`, `.jarvis-szg/`, `node_modules/`

---

## 13. The 10 Absolute Rules

```
1.  .ts extension on every import
2.  No `any` — strict types always
3.  execute() never throws — returns string always
4.  Never await memory extraction
5.  Validate NVIDIA_API_KEY at startup
6.  Prepared statements only — no SQL interpolation
7.  Blocklist check before every run_command
8.  Max 200 lines per file
9.  One tool per impl/ file
10. Read skills/ before implementing any subsystem
```

---

## 14. When You're Unsure

- Check `skills/` first
- Check `docs/errors.md` for known issues
- Check `docs/decisions.md` for why things are built a certain way
- Default to more modular over more clever
- Default to explicit over implicit
- Default to fail fast over silent failure
