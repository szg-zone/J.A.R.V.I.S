import { exec } from 'child_process';

const BLOCKLIST = [
  'rm -rf /',
  'del /f /s /q c:',
  'format',
  'dd if=',
  'mkfs',
  'sudo',
  'runas',
  'chmod 777',
  'curl.*-d.*http',
  'wget.*-O-',
  'nc -e',
  'ncat',
  'taskkill /f /im',
  'taskkill /f',
  'kill -9',
  'pkill',
  'reg delete',
  'schtasks /create',
  'powershell.*-enc',
  'cmd /c',
  'bash -c',
  'git push',
  'git push origin',
  'npm install -g',
  'pip install',
  'cargo install',
  'del /',
  'rmdir /s /q',
  'Invoke-WebRequest.*-Uri.*http',
  'Start-Process.*-FilePath.*cmd',
  'iex',
  'Invoke-Expression',
];

const BLOCKLIST_PATTERNS: RegExp[] = [];

for (const pattern of BLOCKLIST) {
  try {
    BLOCKLIST_PATTERNS.push(new RegExp(pattern, 'i'));
  } catch {
    // Skip invalid regex
  }
}

function isBlocked(command: string): boolean {
  return BLOCKLIST_PATTERNS.some(pattern => pattern.test(command));
}

export const runCommand = {
  name: 'run_command',
  description: 'Execute a shell command and return the output. Use with caution - dangerous commands are blocked.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute'
      },
      cwd: {
        type: 'string',
        description: 'Optional working directory for the command'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)'
      }
    },
    required: ['command']
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    let command = args.command as string;
    const cwd = args.cwd as string | undefined;
    const timeout = (args.timeout as number) || 30000;

    if (!command) {
      return JSON.stringify({ error: 'Missing command parameter' });
    }

    command = command.trim();
    
    if (isBlocked(command)) {
      return JSON.stringify({ 
        error: 'Command blocked for security reasons',
        reason: 'Command matches a blocked pattern'
      });
    }

    return new Promise<string>((resolve) => {
      const options: { cwd?: string; timeout?: number } = {};
      if (cwd) options.cwd = cwd;
      
      const timer = setTimeout(() => {
        resolve(JSON.stringify({ 
          error: 'Command timed out',
          timeout: timeout
        }));
      }, timeout);

      exec(command, options, (error, stdout, stderr) => {
        clearTimeout(timer);
        
        if (error) {
          resolve(JSON.stringify({
            success: false,
            error: error.message,
            stderr: stderr || undefined
          }));
        } else {
          resolve(JSON.stringify({
            success: true,
            stdout: stdout.trim() || undefined,
            stderr: stderr.trim() || undefined
          }));
        }
      });
    });
  }
};
