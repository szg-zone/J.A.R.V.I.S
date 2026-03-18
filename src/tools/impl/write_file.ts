import { writeFileSync, existsSync, mkdirSync } from 'fs';
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

export const writeFile = {
  name: 'write_file',
  description: 'Write content to a file. Use this to create or update text files, code, or configuration files.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to write'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      },
      encoding: {
        type: 'string',
        description: 'File encoding (default: utf-8)',
        default: 'utf-8'
      },
      append: {
        type: 'boolean',
        description: 'Append to file instead of overwriting (default: false)',
        default: false
      }
    },
    required: ['path', 'content']
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const userPath = args.path as string;
    const content = args.content as string;
    const encoding = (args.encoding as string) || 'utf-8';
    const append = (args.append as boolean) || false;

    if (!userPath) {
      return JSON.stringify({ error: 'Missing path parameter' });
    }

    if (content === undefined) {
      return JSON.stringify({ error: 'Missing content parameter' });
    }

    if (content.length > MAX_FILE_SIZE) {
      return JSON.stringify({ 
        error: 'Content too large',
        maxSize: MAX_FILE_SIZE,
        actualSize: content.length
      });
    }

    try {
      const baseDir = process.cwd();
      const safePath = sanitizePath(userPath, baseDir);
      
      const dir = dirname(safePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const flag = append ? 'a' : 'w';
      writeFileSync(safePath, content, { flag: flag as 'w' | 'a', encoding: encoding as BufferEncoding });

      return JSON.stringify({
        success: true,
        message: append ? 'Content appended successfully' : 'File written successfully',
        path: safePath,
        size: content.length
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return JSON.stringify({ error: errorMessage });
    }
  }
};
