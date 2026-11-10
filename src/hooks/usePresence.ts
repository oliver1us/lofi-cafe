import { useEffect, useRef, useState } from 'react';

// Counts this clone's listeners, never the original site's audience or a fictional number.
export function usePresence(listening: boolean) {
  const [count, setCount] = useState<number | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const active = useRef(listening);
  active.current = listening;
  useEffect(() => {
    let disposed = false;
    let retry: ReturnType<typeof setTimeout>;
    function connect() {
      if (disposed) return;
      const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/presence`);
      socket.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ listening: active.current }));
      ws.onmessage = event => {
        const value = Number(event.data);
        if (Number.isSafeInteger(value) && value >= 0) setCount(value);
      };
      ws.onclose = () => {
        setCount(null);
        if (!disposed) retry = setTimeout(connect, 5000);
      };
    }
    connect();
    const heartbeat = setInterval(() => {
      if (socket.current?.readyState === WebSocket.OPEN) socket.current.send('ping');
    }, 25000);
    return () => { disposed = true; clearTimeout(retry); clearInterval(heartbeat); socket.current?.close(); };
  }, []);
  useEffect(() => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ listening }));
  }, [listening]);
  return count;
}
