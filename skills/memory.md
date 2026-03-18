# Memory Skill
# J.A.R.V.I.S - SZG — Memory Vault Implementation

> Expert knowledge for implementing SQLite vault, knowledge extraction, context injection, and RAG patterns.

---

## When to Read

Read this skill before implementing:
- `src/memory/vault.ts` — the memory system
- Any knowledge extraction logic
- Context injection for LLM prompts

---

## Database Schema

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
  role       TEXT NOT NULL,      -- user|assistant
  content    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session ON conversations(session_id, created_at);
```

---

## Implementation

```typescript
// src/memory/vault.ts
import { Database } from 'bun:sqlite';
import { homedir } from 'os';
import { join } from 'path';

const DB_PATH = join(homedir(), '.jarvis-szg', 'jarvis.db');

class MemoryVault {
  private db: Database;
  
  constructor() {
    // Ensure directory exists
    const dir = join(homedir(), '.jarvis-szg');
    // ... create directory if needed
    
    this.db = new Database(DB_PATH);
    this.initialize();
  }
  
  private initialize(): void {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge (...)
      CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts (...)
      CREATE TABLE IF NOT EXISTS conversations (...)
    `);
  }
  
  // Store a memory
  store(type: string, content: string, tags: string = ''): number {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO knowledge (type, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(type, content, tags, now, now).lastInsertRowId as number;
  }
  
  // Full-text search
  search(query: string, limit: number = 5): Knowledge[] {
    const stmt = this.db.prepare(`
      SELECT k.* FROM knowledge k
      JOIN knowledge_fts fts ON k.id = fts.rowid
      WHERE knowledge_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);
    return stmt.all(query, limit) as Knowledge[];
  }
  
  // Build context for LLM
  buildContext(userMessage: string, maxTokens: number = 2000): string {
    // Search for relevant memories
    const memories = this.search(userMessage, 5);
    if (memories.length === 0) return '';
    
    // Format as context
    return memories
      .map(m => `[${m.type}] ${m.content}`)
      .join('\n\n');
  }
  
  // Save conversation message
  saveMessage(sessionId: string, role: string, content: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (session_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(sessionId, role, content, Date.now());
  }
  
  // Load conversation history
  loadHistory(sessionId: string, limit: number = 20): Message[] {
    const stmt = this.db.prepare(`
      SELECT role, content FROM conversations
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(sessionId, limit).reverse() as Message[];
  }
  
  // Fire-and-forget knowledge extraction
  extractAsync(content: string): void {
    setTimeout(() => this.extract(content), 0);
  }
  
  private async extract(content: string): Promise<void> {
    // Use LLM to extract structured knowledge
    // ... implementation
  }
  
  // Stats
  getStats(): { memories: number; conversations: number } {
    const memories = this.db.query('SELECT COUNT(*) as count FROM knowledge').get() as { count: number };
    const conversations = this.db.query('SELECT COUNT(*) as count FROM conversations').get() as { count: number };
    return { memories: memories.count, conversations: conversations.count };
  }
}

export const vault = new MemoryVault();
```

---

## Knowledge Types

| Type | Description | Example |
|------|-------------|---------|
| `fact` | Factual information | "JARVIS runs on port 3142" |
| `preference` | User preferences | "User prefers dark theme" |
| `event` | Past events | "Meeting at 3pm yesterday" |
| `person` | People info | "John works on frontend" |
| `project` | Project knowledge | "Project uses React 18" |
| `commitment` | Promises made | "Will fix bug by Friday" |
| `note` | General notes | "API key in .env" |

---

## Extraction Prompt

```typescript
const EXTRACTION_PROMPT = `Extract structured knowledge from this conversation.
Return JSON array of objects with: type, content, tags

Types: fact, preference, event, person, project, commitment, note

Conversation:
${content}

Respond with valid JSON only:`;
```

---

## Deduplication

```typescript
// Check for similar content before storing
private async deduplicate(content: string): Promise<boolean> {
  const similar = this.search(content, 1);
  if (similar.length === 0) return false;
  
  // Simple similarity check
  const similarity = this.jaccardSimilarity(content, similar[0].content);
  return similarity > 0.8;
}

private jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(' '));
  const setB = new Set(b.toLowerCase().split(' '));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
```

---

## Context Window Budgeting

| Component | Budget |
|-----------|--------|
| System prompt | 500 tokens |
| Knowledge context | 2000 tokens |
| History (20 msgs) | 3000 tokens |
| Current message | 500 tokens |
| **Total** | ~6000 tokens |

Reserve 2K for completion = 8K max input.

---

## Related Skills

- `agent.md` — For context injection in agent loop
- `tools.md` — For remember/recall tools
- `typescript.md` — For Bun SQLite patterns
