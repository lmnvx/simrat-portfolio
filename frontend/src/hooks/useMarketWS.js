import { useEffect, useState } from "react";

export function useMarketWS(url) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setConnected(true);
      };

      ws.onmessage = (e) => {
        if (cancelled) return;
        try {
          setData(JSON.parse(e.data));
        } catch {
          /* ignore malformed frame */
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        // Let onclose handle the reconnect; just avoid an unhandled error spam.
        ws?.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        // Detach handlers before closing so a half-open socket from a
        // StrictMode double-mount can't fire onclose -> reconnect after
        // this effect instance has already been torn down.
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
    };
  }, [url]);

  return { data, connected };
}
