import { agent } from '../core/agent.ts';
import { vault } from '../memory/vault.ts';

interface WSClient {
  ws: WebSocket;
  sessionId: string;
}

interface ClientMessage {
  type: 'chat' | 'ping';
  message?: string;
}

class JarvisServer {
  private clients: Map<string, WSClient> = new Map();
  private server: Bun.Server | null = null;

  start(port: number = 3142): Bun.Server {
    this.server = Bun.serve({
      port,
      fetch: (req, server) => this.handleRequest(req, server),
      websocket: {
        open: (ws) => {
          const sessionId = (ws.data as { sessionId?: string })?.sessionId || 'default';
          this.handleOpen(ws, sessionId);
        },
        message: (ws, msg) => this.handleMessage(ws, msg),
        close: (ws, code, reason) => this.handleClose(ws, code, reason),
      }
    });

    console.log(`🤖 JARVIS running on http://localhost:${port}`);
    console.log(`📊 Dashboard: http://localhost:${port}`);
    console.log(`🔌 WebSocket: ws://localhost:${port}/ws`);

    return this.server;
  }

  private handleRequest(req: Request, server: Bun.Server): Response {
    const url = new URL(req.url);

    if (url.pathname === '/') {
      return new Response(Bun.file('./public/index.html'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (url.pathname === '/api/status') {
      return Response.json({
        status: 'ok',
        clients: this.clients.size,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    }

    if (url.pathname === '/api/memory') {
      return Response.json(vault.getStats());
    }

    if (url.pathname === '/api/chat' && req.method === 'POST') {
      return this.handleChat(req);
    }

    if (url.pathname.startsWith('/ws') || url.pathname === '/ws') {
      const sessionId = url.searchParams.get('session') || 'default';
      
      const upgraded = server.upgrade(req, {
        data: { sessionId }
      });

      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 500 });
      }
      
      return; // WebSocket upgrade in progress
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleChat(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { message: string; sessionId?: string };
      const sessionId = body.sessionId || 'default';

      let fullResponse = '';
      
      const response = await agent.run(body.message, {
        sessionId,
        onToken: (token) => {
          fullResponse += token;
        },
        onToolCall: (tool, args) => {
          this.broadcastToSession(sessionId, {
            type: 'tool_call',
            tool,
            args
          });
        },
        onToolResult: (tool, result) => {
          this.broadcastToSession(sessionId, {
            type: 'tool_result',
            tool,
            result
          });
        }
      });

      return Response.json({
        success: true,
        response,
        sessionId
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      return Response.json({
        success: false,
        error: errorMessage
      }, { status: 500 });
    }
  }

  private handleOpen(ws: WebSocket, sessionId: string = 'default'): void {
    this.clients.set(sessionId, { ws, sessionId });
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId
    }));
  }

  private async handleMessage(ws: WebSocket, msg: string | Buffer): Promise<void> {
    let data: ClientMessage;
    
    try {
      const msgStr = typeof msg === 'string' ? msg : msg.toString();
      data = JSON.parse(msgStr);
    } catch {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON message'
      }));
      return;
    }

    const sessionId = this.getSessionId(ws);

    if (data.type === 'chat' && data.message) {
      ws.send(JSON.stringify({ type: 'thinking' }));

      let fullResponse = '';
      
      try {
        await agent.run(data.message, {
          sessionId,
          onToken: (token) => {
            fullResponse += token;
            ws.send(JSON.stringify({ type: 'token', token }));
          },
          onToolCall: (tool, args) => {
            ws.send(JSON.stringify({ type: 'tool_call', tool, args }));
          },
          onToolResult: (tool, result) => {
            ws.send(JSON.stringify({ type: 'tool_result', tool, result }));
          }
        });

        ws.send(JSON.stringify({ type: 'stream_end', full: fullResponse }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        ws.send(JSON.stringify({ type: 'error', message: errorMessage }));
      }
    }

    if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
    }
  }

  private handleClose(ws: WebSocket, code: number, reason: string): void {
    const sessionId = this.getSessionId(ws);
    this.clients.delete(sessionId);
  }

  private getSessionId(ws: WebSocket): string {
    for (const [id, client] of this.clients) {
      if (client.ws === ws) return id;
    }
    return 'unknown';
  }

  broadcast(message: object): void {
    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      client.ws.send(data);
    }
  }

  private broadcastToSession(sessionId: string, message: object): void {
    const client = this.clients.get(sessionId);
    if (client) {
      client.ws.send(JSON.stringify(message));
    }
  }
}

export const server = new JarvisServer();

export function startServer(port?: number): Bun.Server {
  return server.start(port);
}

export function broadcast(message: object): void {
  server.broadcast(message);
}
