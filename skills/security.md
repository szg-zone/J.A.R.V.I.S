# Security Skill
# J.A.R.V.I.S - SZG — Security Best Practices

> Expert knowledge for shell execution, file access, credential handling, and input validation.

---

## When to Read

Read this skill before implementing:
- Any shell execution (run_command tool)
- File access tools
- Credential handling

---

## Command Blocklist

```typescript
// src/tools/impl/run_command.ts

const BLOCKLIST = [
  // Dangerous commands
  'rm -rf /',
  'del /f /s /q',
  'format',
  'dd if=',
  'mkfs',
  
  // Privilege escalation
  'sudo',
  'runas',
  'chmod 777',
  
  // Network exfiltration
  'curl .* -d',
  'wget .* -O-',
  'nc -e',
  'ncat',
  
  // Process manipulation
  'taskkill /f',
  'kill -9',
  'pkill',
  
  // System
  'reg delete',
  'reg add.*\\run',
  'schtasks /create',
  
  // Scripts
  'powershell.*-enc',
  'cmd /c',
  'bash -c',
  
  // Git (avoid automatic push)
  'git push',
  'git push origin',
  
  // Package managers (avoid auto-install)
  'npm install -g',
  'pip install',
  'cargo install'
];

const BLOCKLIST_PATTERNS = BLOCKLIST.map(pattern => 
  new RegExp(pattern, 'i')
);

function isBlocked(command: string): boolean {
  return BLOCKLIST_PATTERNS.some(pattern => pattern.test(command));
}
```

---

## Path Sanitization

```typescript
import { resolve, isAbsolute } from 'path';
import { existsSync } from 'fs';

function sanitizePath(userPath: string, baseDir: string): string {
  // Resolve to absolute
  let resolved = isAbsolute(userPath) 
    ? userPath 
    : resolve(baseDir, userPath);
  
  // Block path traversal
  if (resolved.includes('..')) {
    throw new Error('Path traversal not allowed');
  }
  
  // Ensure within allowed directory
  const allowedDir = resolve(baseDir);
  if (!resolved.startsWith(allowedDir)) {
    throw new Error('Path outside allowed directory');
  }
  
  return resolved;
}

// Usage
const safePath = sanitizePath(args.path, process.cwd());
```

---

## Input Validation

```typescript
function validateInput(input: unknown, schema: object): boolean {
  // Use zod for runtime validation
  const result = schema.safeParse(input);
  return result.success;
}

// Example schema
const runCommandSchema = z.object({
  command: z.string()
    .min(1)
    .max(500)
    .refine(cmd => !isBlocked(cmd), {
      message: 'Command blocked for security'
    })
});
```

---

## Credential Vault

```typescript
// Never store credentials in code
// Use environment variables only

// Bad
const API_KEY = 'sk-xxx'; // Never!

// Good
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error('API_KEY required');

// Validate at startup
function validateEnv(): void {
  const required = ['NVIDIA_API_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing required env: ${key}`);
      process.exit(1);
    }
  }
}
```

---

## SQL Injection Prevention

```typescript
// Always use prepared statements
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const result = stmt.get(userId);

// Never interpolate
// BAD: db.query(`SELECT * FROM users WHERE id = ${userId}`)
// GOOD: db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
```

---

## What to Refuse

| Category | Examples |
|----------|----------|
| Shell injection | `; rm -rf`, `&& curl` |
| Path traversal | `../../etc/passwd` |
| Credential access | Reading `.env`, `~/.aws/credentials` |
| Privilege escalation | `sudo`, `runas` |
| Network exfiltration | `curl`, `nc` to external IPs |
| Process killing | `taskkill /f`, `kill -9` |

---

## Security Checklist

- [ ] Validate NVIDIA_API_KEY at startup
- [ ] Block dangerous commands in run_command
- [ ] Sanitize all file paths
- [ ] Use prepared statements for SQL
- [ ] Never commit secrets
- [ ] Log security events
- [ ] Rate limit API endpoints

---

## Related Skills

- `tools.md` — For run_command implementation
- `typescript.md` — For secure Bun patterns
