import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    // Send a welcome message so the client knows it's connected
    ws.send(JSON.stringify({ event: 'connected', data: { time: Date.now() } }));
  });

  console.log('[WS] WebSocket server initialized');
}

export function broadcast(event: string, data?: any) {
  if (!wss) return;
  const message = JSON.stringify({ event, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
