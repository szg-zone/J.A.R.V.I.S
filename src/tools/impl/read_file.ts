import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, isAbsolute, join, dirname } from 'path';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB max

function sanitizePath(userPath: string, baseDir: string): string {
  let resolved = isAbsolute(userPath) 
    ? userPath 
    : resolve(baseDir, userPath);
  
  if (resolved.includes('..')) {
    throw new Error('Path traversal not allowed');
  }
  
  return resolved;
}

export const readFile = {
  name: 'read_file',
  description: 'Read the contents of a file. Use this to read text files, code, or configuration files.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to read'
      },
      encoding: {
        type: 'string',
        description: 'File encoding (default: utf-8)',
        default: 'utf-8'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of characters to read (for large files)'
      }
    },
    required: ['path']
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const userPath = args.path as string;
    const encoding = (args.encoding as string) || 'utf-8';
    const limit = args.limit as number | undefined;

    if (!userPath) {
      return JSON.stringify({ error: 'Missing path parameter' });
    }

    try {
      const baseDir = process.cwd();
      const safePath = sanitizePath(userPath, baseDir);
      
      if (!existsSync(safePath)) {
        return JSON.stringify({ error: 'File not found', path: safePath });
      }

      const stats = statSync(safePath);
      if (!stats.isFile()) {
        return JSON.stringify({ error: 'Path is not a file' });
      }

      if (stats.size > MAX_FILE_SIZE) {
        return JSON.stringify({ 
          error: 'File too large',
          maxSize: MAX_FILE_SIZE,
          actualSize: stats.size
        });
      }

      let content = readFileSync(safePath, encoding as BufferEncoding);
      
      if (limit && content.length > limit) {
        content = content.slice(0, limit) + '\n... (truncated)';
      }

      return JSON.stringify({
        success: true,
        path: safePath,
        size: stats.size,
        content
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return JSON.stringify({ error: errorMessage });
    }
  }
};
