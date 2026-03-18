import { Database } from 'bun:sqlite';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { chat } from '../core/llm.ts';
import type { Message } from '../core/types.ts';

const DB_PATH = join(homedir(), '.jarvis-szg', 'jarvis.db');

export interface Knowledge {
  id: number;
  type: string;
  content: string;
  tags: string;
  source: string;
  confidence: number;
  created_at: number;
  updated_at: number;
  expires_at: number | null;
}

export interface VaultStats {
  memories: number;
  conversations: number;
}

const EXTRACTION_PROMPT = `Extract structured knowledge from this conversation.
Return JSON array of objects with: type, content, tags

Types: fact, preference, event, person, project, commitment, note

Conversation:
{content}

Respond with valid JSON only. If no useful knowledge, respond with empty array [].`;

class MemoryVault {
  private db: Database;
  private initialized = false;

  constructor() {
    const dir = join(homedir(), '.jarvis-szg');
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(DB_PATH);
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT DEFAULT '',
        source TEXT DEFAULT 'extraction',
        confidence REAL DEFAULT 1.0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER
      )
    `);

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts
      USING fts5(content, tags, content='knowledge', content_rowid='id')
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_session ON conversations(session_id, created_at)
    `);

    this.initialized = true;
  }

  store(type: string, content: string, tags: string = '', source: string = 'extraction', confidence: number = 1.0): number {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO knowledge (type, content, tags, source, confidence, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(type, content, tags, source, confidence, now, now);
    
    const insertStmt = this.db.prepare(`
      INSERT INTO knowledge_fts (rowid, content, tags)
      VALUES (?, ?, ?)
    `);
    insertStmt.run(result.lastInsertRowId, content, tags);

    return result.lastInsertRowId as number;
  }

  search(query: string, limit: number = 5): Knowledge[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchQuery = query.split(' ').map(term => `"${term}"*`).join(' OR ');
    
    try {
      const stmt = this.db.prepare(`
        SELECT k.id, k.type, k.content, k.tags, k.source, k.confidence, k.created_at, k.updated_at, k.expires_at
        FROM knowledge k
        JOIN knowledge_fts fts ON k.id = fts.rowid
        WHERE knowledge_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `);
      return stmt.all(searchQuery, limit) as Knowledge[];
    } catch {
      const stmt = this.db.prepare(`
        SELECT * FROM knowledge
        WHERE content LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(`%${query}%`, limit) as Knowledge[];
    }
  }

  buildContext(userMessage: string, maxTokens: number = 2000): string {
    const memories = this.search(userMessage, 5);
    if (memories.length === 0) return '';

    return memories
      .map(m => `[${m.type}] ${m.content}`)
      .join('\n\n');
  }

  saveMessage(sessionId: string, role: string, content: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (session_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(sessionId, role, content, Date.now());
  }

  loadHistory(sessionId: string, limit: number = 20): Message[] {
    const stmt = this.db.prepare(`
      SELECT role, content FROM conversations
      WHERE session_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `);
    const rows = stmt.all(sessionId, limit) as { role: string; content: string }[];
    
    return rows.map(row => ({
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content,
    }));
  }

  extractAsync(content: string): void {
    setTimeout(() => {
      this.extract(content).catch(err => console.error('[Vault] Extraction error:', err));
    }, 0);
  }

  private async extract(content: string): Promise<void> {
    if (!content || content.length < 50) return;

    try {
      const prompt = EXTRACTION_PROMPT.replace('{content}', content);
      
      const response = await chat(
        [{ role: 'user', content: prompt }],
        { temperature: 0.3, max_tokens: 2048 }
      );

      let parsed: Array<{ type?: string; content?: string; tags?: string }> = [];
      
      try {
        parsed = JSON.parse(response.content);
      } catch {
        const match = response.content.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }

      if (!Array.isArray(parsed)) return;

      for (const item of parsed) {
        if (item.type && item.content) {
          this.store(item.type, item.content, item.tags || '', 'extraction', 0.8);
        }
      }
    } catch (err) {
      console.error('[Vault] Extraction failed:', err);
    }
  }

  getStats(): VaultStats {
    const memoriesResult = this.db.query('SELECT COUNT(*) as count FROM knowledge').get() as { count: number };
    const conversationsResult = this.db.query('SELECT COUNT(*) as count FROM conversations').get() as { count: number };

    return {
      memories: memoriesResult.count,
      conversations: conversationsResult.count,
    };
  }

  deleteExpired(): number {
    const now = Date.now();
    const stmt = this.db.prepare(`
      DELETE FROM knowledge WHERE expires_at IS NOT NULL AND expires_at < ?
    `);
    const result = stmt.run(now);
    return result.changes;
  }
}

export const vault = new MemoryVault();
