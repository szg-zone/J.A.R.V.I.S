import { readFileSync, existsSync } from 'fs';
import { startServer } from './server/server.ts';

function loadEnv(): void {
  const envPath = '.env';
  
  if (!existsSync(envPath)) {
    console.warn('Warning: .env file not found');
    return;
  }
  
  const envContent = readFileSync(envPath, 'utf-8');
  
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        process.env[key] = valueParts.join('=');
      }
    }
  }
}

function validateEnv(): void {
  const required = ['NVIDIA_API_KEY'];
  
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Error: ${key} is not set in .env`);
      process.exit(1);
    }
  }
  
  console.log(`✅ NVIDIA_API_KEY validated`);
}

function printBanner(): void {
  const banner = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██╗   ██╗ ██████╗ ██╗██████╗     ██████╗ ███████╗██╗   ║█╗
║   ██║   ██║██╔═══██╗██║██╔══██╗    ██╔══██╗██╔════╝╚██╗ ║█╔╝
║   ██║   ██║██║   ██║██║██║  ██║    ██║  ██║█████╗   ╚████╔╝ 
║   ╚██╗ ██╔╝██║   ██║██║██║  ██║    ██║  ██║██╔══╝    ╚██╔╝  
║    ╚████╔╝ ╚██████╔╝██║██████╔╝    ██████╔╝███████╗   ██║   
║     ╚═══╝   ╚═════╝ ╚═╝╚═════╝    ╚═════╝ ╚══════╝   ╚═╝   
║                                                              ║
║          Just A Rather Very Intelligent System               ║
║                     SZG Edition v0.1.0                      ║
╚══════════════════════════════════════════════════════════════╝
`;
  console.log(banner);
}

function handleShutdown(): void {
  console.log('\n👋 Shutting down JARVIS...');
  process.exit(0);
}

function main(): void {
  loadEnv();
  validateEnv();
  printBanner();
  
  const port = parseInt(process.env.PORT || '3142', 10);
  
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
  
  startServer(port);
}

main();
