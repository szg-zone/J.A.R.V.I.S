import type { Tool } from './types.ts';
import { webSearch } from './impl/web_search.ts';
import { remember } from './impl/remember.ts';
import { recall } from './impl/recall.ts';
import { datetime } from './impl/datetime.ts';
import { runCommand } from './impl/run_command.ts';
import { readFile } from './impl/read_file.ts';
import { writeFile } from './impl/write_file.ts';

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
      const errorMessage = e instanceof Error ? e.message : String(e);
      return JSON.stringify({ error: errorMessage });
    }
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }
}

export const toolRegistry = new ToolRegistry();

toolRegistry.register(webSearch);
toolRegistry.register(remember);
toolRegistry.register(recall);
toolRegistry.register(datetime);
toolRegistry.register(runCommand);
toolRegistry.register(readFile);
toolRegistry.register(writeFile);
