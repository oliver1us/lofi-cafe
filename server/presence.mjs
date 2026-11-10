import { WebSocketServer, WebSocket } from 'ws';

export function attachPresence(server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 256 });
  function broadcast() {
    const count = [...wss.clients].filter(client => client.listening).length;
    for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(String(count));
  }
  server.on('upgrade', (request, socket, head) => {
    if (new URL(request.url, 'http://localhost').pathname !== '/api/presence') return;
    // Same-origin clients only; no connection to lofi.cafe's production backend.
    try {
      if (request.headers.origin && new URL(request.headers.origin).host !== request.headers.host) {
        socket.destroy(); return;
      }
    } catch { socket.destroy(); return; }
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  });
  wss.on('connection', ws => {
    ws.listening = false;
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', data => {
      if (String(data) === 'ping') { broadcast(); return; }
      try {
        const update = JSON.parse(String(data));
        if (typeof update.listening === 'boolean') { ws.listening = update.listening; broadcast(); }
      } catch { /* Ignore malformed presence messages. */ }
    });
    ws.on('close', broadcast);
    ws.on('error', () => ws.terminate());
    broadcast();
  });
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.alive) { ws.terminate(); continue; }
      ws.alive = false;
      ws.ping();
    }
  }, 30000);
  heartbeat.unref();
  server.on('close', () => { clearInterval(heartbeat); wss.close(); });
}
