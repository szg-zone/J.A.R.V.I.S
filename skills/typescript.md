# TypeScript Skill
# J.A.R.V.I.S - SZG — TypeScript & Bun Patterns

> Expert knowledge for TypeScript ESM, Bun-specific APIs, and Windows patterns.

---

## When to Read

Read this skill before implementing:
- Any `.ts` file in the project
- Bun runtime specific code
- Windows-specific paths

---

## Package.json Requirements

```json
{
  "type": "module",
  "scripts": {
    "start": "bun run src/index.ts",
    "check": "bun run --check src/index.ts"
  },
  "dependencies": {
    "bun-types": "^1.1.0"
  }
}
```

---

## Import Patterns

```typescript
// Always use .ts extension
import { foo } from './foo.ts';
import { bar } from './bar.ts';

// External packages
import { someModule } from 'some-package';

// Relative paths
import utils from '../utils.ts';
```

---

## Bun SQLite

```typescript
import { Database } from 'bun:sqlite';

const db = new Database('my.db');

// Query
const users = db.query('SELECT * FROM users').all();

// Prepared statement
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId);

// Run (insert/update)
const result = db.prepare('INSERT INTO users (name) VALUES (?)').run(name);
```

---

## Bun HTTP Server

```typescript
Bun.serve({
  port: 3142,
  fetch(req) {
    return new Response('Hello');
  },
  websocket: {
    open(ws) { /* ... */ },
    message(ws, msg) { /* ... */ },
    close(ws) { /* ... */ }
  }
});
```

---

## Windows Path Handling

```typescript
import { resolve, join, dirname } from 'path';
import { homedir } from 'os';

// Use forward slashes or proper joins
const configPath = resolve(homedir(), '.jarvis-szg', 'config.json');
// On Windows: C:\Users\username\.jarvis-szg\config.json

// For shell commands, convert to backslashes
const windowsPath = path.replace(/\//g, '\\');
```

---

## Environment Variables

```typescript
// Parse .env manually
import { readFileSync } from 'fs';

function loadEnv(): void {
  const envPath = '.env';
  const envContent = readFileSync(envPath, 'utf-8');
  
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      process.env[key] = valueParts.join('=');
    }
  }
}
```

---

## TypeScript Strict Mode

```typescript
// No any - always type explicitly
function greet(name: string): string {
  return `Hello, ${name}`;
}

// Explicit return types on exports
export function processData(input: Data): Promise<Result> {
  // ...
}

export class Handler {
  private state: State;
  
  constructor(initial: State) {
    this.state = initial;
  }
}
```

---

## Async/Await Patterns

```typescript
// Always catch errors in async
async function safeRun(): Promise<string> {
  try {
    const result = await someAsync();
    return result;
  } catch (e) {
    // Return error as string, don't throw
    return `Error: ${e.message}`;
  }
}

// Fire-and-forget
function triggerAsync(): void {
  setTimeout(() => {
    doWork().catch(console.error);
  }, 0);
}
```

---

## Windows-Specific Gotchas

1. **Line endings**: Set `git config core.autocrlf true`
2. **Paths**: Always use `path.join()` or `resolve()`
3. **Shell**: Use `cmd /c` for Windows commands
4. **Environment**: `.env` uses CRLF on Windows

---

## Type Checking

```bash
# Run TypeScript check
bun run check

# Or directly
bun run --check src/index.ts
```

---

## Related Skills

- `memory.md` — For Bun SQLite patterns
- `server.md` — For Bun WebSocket patterns
- `security.md` — For environment variable handling
