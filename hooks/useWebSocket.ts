'use client';

import { useEffect, useRef, useCallback } from 'react';

type EventHandler = (data: any) => void;

export function useWebSocket(events: Record<string, EventHandler>) {
  const wsRef = useRef<WebSocket | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data);
        const handler = eventsRef.current[event];
        if (handler) handler(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      // Reconnect after 2 seconds
      setTimeout(() => {
        if (wsRef.current === ws) {
          connect();
        }
      }, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [connect]);
}
