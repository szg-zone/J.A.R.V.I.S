# Tools Skill
# J.A.R.V.I.S - SZG — Tool Registry & Implementation

> Expert knowledge for registering tools, writing execute() functions, and tool definitions.

---

## When to Read

Read this skill before implementing:
- `src/tools/registry.ts` — Tool registry
- `src/tools/impl/*.ts` — Individual tool implementations

---

## Tool Interface

```typescript
// src/tools/types.ts
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}
```

---

## Registry Implementation

```typescript
// src/tools/registry.ts
import { Tool } from './types.ts';

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} already registered`);
    }
    this.tools.set(tool.name, tool);
  }
  
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  getDefinitions(): object[] {
    return Array.from(this.tools.values()).map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
  }
  
  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
    
    try {
      return await tool.execute(args);
    } catch (e) {
      return JSON.stringify({ error: e.message });
    }
  }
  
  list(): string[] {
    return Array.from(this.tools.keys());
  }
}

export const toolRegistry = new ToolRegistry();
```

---

## Tool Implementation Pattern

```typescript
// src/tools/impl/web_search.ts
export const webSearch = {
  name: 'web_search',
  description: 'Search the web for current information. Use this when you need up-to-date information or facts.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query'
      }
    },
    required: ['query']
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const query = args.query as string;
    if (!query) return JSON.stringify({ error: 'Missing query' });
    
    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
      );
      const data = await response.json();
      return JSON.stringify(data);
    } catch (e) {
      return JSON.stringify({ error: e.message });
    }
  }
};
```

---

## Built-in Tools (7 Required)

1. **web_search** — Search the web
2. **remember** — Store information in memory
3. **recall** — Search memory
4. **datetime** — Get current date/time
5. **run_command** — Execute shell commands (with blocklist!)
6. **read_file** — Read file contents
7. **write_file** — Write file contents

---

## Error Return Format

```typescript
// Always return string, never throw
async execute(args): Promise<string> {
  try {
    // Do work
    return JSON.stringify({ success: true, data: result });
  } catch (e) {
    // Return error as string
    return JSON.stringify({ error: e.message });
  }
}
```

---

## Parameter Schema

```typescript
parameters: {
  type: 'object',
  properties: {
    argName: {
      type: 'string',
      description: 'What this argument does'
    }
  },
  required: ['argName']
}
```

---

## Testing Tools

```typescript
// Test a tool directly
const result = await toolRegistry.execute('web_search', { query: 'test' });
console.log(result);

// List all tools
console.log(toolRegistry.list());
```

---

## Related Skills

- `agent.md` — For tool calling in agent loop
- `security.md` — For run_command blocklist
