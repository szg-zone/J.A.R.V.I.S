# Server Skill
# J.A.R.V.I.S - SZG — WebSocket Server Implementation

> Expert knowledge for implementing Bun WebSocket server, REST endpoints, and session management.

---

## When to Read

Read this skill before implementing:
- `src/server/server.ts` — Main server file

---

## Implementation

```typescript
// src/server/server.ts
import { BunServer } from 'bun';

interface WSClient {
  ws: WebSocket;
  sessionId: string;
}

class JarvisServer {
  private clients: Map<string, WSClient> = new Map();
  private server: BunServer | null = null;
  
  start(port: number = 3142): void {
    this.server = Bun.serve({
      port,
      fetch: (req, ctx) => this.handleRequest(req),
      websocket: {
        open: (ws) => this.handleOpen(ws),
        message: (ws, msg) => this.handleMessage(ws, msg),
        close: (ws, code, reason) => this.handleClose(ws, code, reason),
      }
    });
    
    console.log(`JARVIS running on port ${port}`);
  }
  
  private handleRequest(req: Request): Response {
    const url = new URL(req.url);
    
    // REST endpoints
    if (url.pathname === '/') {
      return new Response(Bun.file('./public/index.html'));
    }
    
    if (url.pathname === '/api/status') {
      return Response.json({ status: 'ok', clients: this.clients.size });
    }
    
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      return this.handleChat(req);
    }
    
    if (url.pathname === '/api/memory') {
      return Response.json(vault.getStats());
    }
    
    // WebSocket upgrade
    if (url.pathname.startsWith('/ws')) {
      const sessionId = url.searchParams.get('session') || 'default';
      const pair = new WebSocketPair();
      
      this.handleOpen(pair[1], sessionId);
      
      return new Response(null, {
        status: 101,
        webSocket: pair[1]
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
  
  private async handleOpen(ws: WebSocket, sessionId: string = 'default'): Promise<void> {
    this.clients.set(sessionId, { ws, sessionId });
    ws.send(JSON.stringify({ type: 'connected', sessionId }));
  }
  
  private async handleMessage(ws: WebSocket, msg: string | Buffer): Promise<void> {
    const data = typeof msg === 'string' ? JSON.parse(msg) : JSON.parse(msg.toString());
    const sessionId = this.getSessionId(ws);
    
    if (data.type === 'chat') {
      ws.send(JSON.stringify({ type: 'thinking' }));
      
      // Process through agent with streaming
      await agent.run(data.message, (token) => {
        ws.send(JSON.stringify({ type: 'token', token }));
      });
      
      ws.send(JSON.stringify({ type: 'stream_end', full: response }));
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
}

export const server = new JarvisServer();
export function startServer(port?: number): void {
  server.start(port);
}
export function broadcast(message: object): void {
  server.broadcast(message);
}
```

---

## WebSocket Protocol

```
Client → Server:
  { "type": "chat", "message": "..." }
  { "type": "ping" }

Server → Client:
  { "type": "connected", "sessionId": "..." }
  { "type": "thinking" }
  { "type": "stream_start" }
  { "type": "token", "token": "..." }
  { "type": "stream_end", "full": "..." }
  { "type": "tool_call", "tool": "...", "args": {} }
  { "type": "tool_result", "tool": "...", "result": "..." }
  { "type": "error", "message": "..." }
  { "type": "pong", "ts": 1234567890 }
```

---

## Session Management

- Session ID from URL param: `/ws?session=abc123`
- Store in Map: `clients.set(sessionId, { ws, sessionId })`
- Cleanup on close

---

## Binary Frame Handling

```typescript
// TTS audio chunks - binary
ws.send(audioBuffer); // Raw binary

// STT audio from client - binary
ws.on('message', (msg, binary) => {
  if (binary) {
    // Handle audio buffer
  }
});
```

---

## Reconnect Logic (Client)

```javascript
// Auto-reconnect with exponential backoff
let reconnectDelay = 1000;
function connect() {
  ws = new WebSocket(url);
  
  ws.onclose = () => {
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  };
}
```

---

## Related Skills

- `voice.md` — For binary audio handling
- `dashboard.md` — For client WebSocket implementation
