# Architecture Decision Records
# J.A.R.V.I.S - SZG

> This file records every significant architecture decision made for this project.
> Before changing any of these decisions, read the reasoning.
> If you still want to change it, add a new ADR below explaining why.

---

## ADR-001 — Runtime: Bun over Node.js

**Date**: Project inception
**Status**: Final

**Decision**: Use Bun as the JavaScript runtime.

**Reasoning**:
- `bun:sqlite` is built-in — no native module compilation. On Windows, `better-sqlite3` (Node) requires MSVC build tools and frequently fails during `npm install`.
- `Bun.serve()` handles HTTP + WebSocket in a single call — no `ws` library needed.
- TypeScript runs directly — no `ts-node`, no `tsx`, no build step. Just `bun run src/index.ts`.
- Startup time is 3-10x faster than Node for a daemon that may restart.
- `Bun.file()`, `Bun.spawn()`, `Bun.sleep()` — standard operations that need no libraries.

**Rejected alternatives**:
- Node.js: native SQLite compilation breaks on Windows constantly.
- Deno: smaller ecosystem, different module resolution, less familiar.

---

## ADR-002 — Database: SQLite over Redis/Postgres

**Date**: Project inception
**Status**: Final

**Decision**: Use SQLite via `bun:sqlite` at `~/.jarvis-szg/jarvis.db`.

**Reasoning**:
- Zero setup. No server to install, no port to configure, no connection string.
- Single file at a predictable path. Easy to backup, inspect, delete.
- FTS5 virtual table gives full-text search without Elasticsearch.
- WAL mode gives concurrent read/write without blocking.
- This is a single-user daemon — there is no multi-tenancy requirement.
- The user can inspect the data: `sqlite3 jarvis.db "SELECT * FROM knowledge"`

**Rejected alternatives**:
- Redis: requires a running server, adds operational complexity.
- Postgres + pgvector: massive overkill for a personal daemon.
- JSON files: no FTS, no transactions, fragile under concurrent writes.

---

## ADR-003 — LLM: NVIDIA NIM / DeepSeek V3 as Primary

**Date**: Project inception
**Status**: Final

**Decision**: Use NVIDIA NIM free tier with DeepSeek V3 as the primary LLM.

**Reasoning**:
- Free tier with generous limits — no credit card, no billing surprises.
- OpenAI-compatible API — the entire LLM client layer is provider-agnostic. Swapping to Groq or Gemini means changing 2 constants.
- DeepSeek V3 has excellent tool calling accuracy — critical for the agentic loop.
- 128k context window — can hold long conversation histories.
- Fast inference on NVIDIA hardware.

**How to swap providers** (change 2 constants in `src/core/llm.ts`):
```typescript
const NIM_BASE = 'https://integrate.api.nvidia.com/v1';   // change this
const MODEL = 'deepseek-ai/deepseek-v3-1';                // and this
```

---

## ADR-004 — Module Structure: `src/core/` not `src/agent/`

**Date**: First refactor
**Status**: Final

**Decision**: Use `src/core/` for the LLM client and agent loop.

**Reasoning**:
- `core/` communicates "this is the heart of the system" — appropriate for LLM + agent.
- `agent/` was ambiguous — does it contain one agent or many? Phase 6 adds specialist agents, so `agent/` would need to expand.
- `core/llm.ts`, `core/agent.ts`, `core/types.ts` reads cleanly as a cohesive trio.

---

## ADR-005 — Tools: `impl/` Split over Monolithic Registry

**Date**: First refactor
**Status**: Final

**Decision**: Each tool lives in its own file under `src/tools/impl/`. The registry only imports and registers.

**Reasoning**:
- Adding a tool = adding one file. Nothing else changes.
- Each tool can be tested in isolation.
- The registry file stays small and readable — just a list of imports.
- Easier to read skill files per tool without scrolling through 500 lines.

**Pattern**:
```
src/tools/impl/web_search.ts  → exports webSearchTool
src/tools/registry.ts         → imports + registers all tools
```

---

## ADR-006 — Memory Extraction: Fire-and-Forget

**Date**: Project inception
**Status**: Final

**Decision**: Knowledge extraction after every conversation turn runs without `await`.

**Reasoning**:
- Extraction takes 200–600ms (LLM call). The user should not wait for it.
- Extraction failure must never block the conversation or surface an error.
- The extracted knowledge is useful for future turns, not the current one.
- One failed extraction losing a few facts is acceptable. Blocking the user is not.

**Implementation**:
```typescript
// ✅ Correct — fire and forget
vault.extractAsync(userMsg, assistantMsg);

// ❌ Wrong — blocks response
await vault.extractAsync(userMsg, assistantMsg);
```

---

## ADR-007 — Browser Automation: Playwright over Raw CDP

**Date**: Phase 3 planning
**Status**: Final

**Decision**: Use Playwright, not raw Chrome DevTools Protocol.

**Reasoning**:
- Playwright handles page load states (networkidle, domcontentloaded) automatically.
- Shadow DOM and iframes work out of the box.
- Auto-waits prevent flaky selectors — no manual `page.waitForSelector()` needed.
- Still uses CDP under the hood — no performance penalty.
- Raw CDP requires writing a lot of glue code that Playwright already solved.

---

## ADR-008 — Dashboard: Single HTML File, No Build Step

**Date**: Project inception
**Status**: Final

**Decision**: The dashboard is `public/index.html` — one file, vanilla HTML/CSS/JS, no bundler.

**Reasoning**:
- The daemon already starts with `bun run src/index.ts`. Adding a separate `npm run dev` for the frontend breaks the single-command startup.
- No Vite, no webpack, no React SSR — all add complexity for a single-user tool.
- Vanilla WebSocket + DOM is sufficient for a chat interface.
- The dashboard can be redesigned without touching the backend.
- The single file approach is faster to load (no network requests for chunks).

**If the dashboard grows complex** (Phase 6+), extract to a separate `client/` directory with Vite, but keep the `bun run src/index.ts` entrypoint serving it.

---

## ADR-009 — Voice: Browser-Side Wake Word

**Date**: Phase 2 planning
**Status**: Final

**Decision**: Wake word detection (`openwakeword` WASM) runs entirely in the browser, not on the server.

**Reasoning**:
- Privacy: no audio is sent to any server until the wake word triggers. The microphone stream never leaves the machine.
- Performance: offloads inference from the Node/Bun process to browser GPU/CPU.
- Latency: no round-trip network call for wake word detection.
- The server only receives audio after the user has intentionally triggered the voice mode.

---

## ADR-010 — Skills System: Read-Before-Build Protocol

**Date**: User requirement
**Status**: Final

**Decision**: Before implementing any subsystem, the AI must read relevant files in `skills/`.

**Reasoning**:
- The user maintains curated expert knowledge in `skills/*.md`.
- These files contain patterns, idioms, and best practices that go beyond the standard docs.
- Without this protocol, the AI might implement a technically correct but suboptimal solution that ignores the user's preferred patterns.
- The skill files represent the user's accumulated engineering judgment.

**Protocol**:
```
1. Identify which skills are relevant to the current task
2. Read those skill files fully
3. Apply patterns from skills — they take precedence over general knowledge
4. If skills/ is empty or missing, proceed with docs/ only
5. Never fabricate skill file contents — only use what actually exists
```

---

## ADR-011 — Error Strategy: Return Strings, Never Throw

**Date**: Project inception
**Status**: Final

**Decision**: Tool `execute()` functions always return a string — success result or error description. They never throw.

**Reasoning**:
- A tool failure should produce a "here's what went wrong" message that the LLM can reason about and potentially retry or work around.
- If tools throw, the agent loop needs try/catch at every tool call site. If tools return strings, the loop is simpler.
- The LLM is better at handling "Error: ENOENT reading /path/file.txt" as a string than catching an exception.

---

## ADR-012 — Single Process Architecture

**Date**: Project inception
**Status**: Final

**Decision**: All subsystems run in one Bun process. No microservices.

**Reasoning**:
- One command starts everything: `bun run src/index.ts`
- Subsystems communicate via direct function calls — no network, no IPC, no serialization.
- In-memory state is shared — the WebSocket server can directly call the agent, which directly calls the vault.
- One user + personal machine = zero reason for horizontal scaling.
- Operational simplicity is the highest priority for a personal tool.

**Exception**: The Go sidecar for desktop automation (Phase 3) is a separate process by necessity — it needs platform-native APIs (Win32 UIA). It connects back to the main process via JWT-authenticated WebSocket.
