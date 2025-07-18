import { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "./useUser";

export default function useWebSocket(onMessage) {
  const url = "ws://localhost:8080";
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const messageHandlerRef = useRef(onMessage);
  const { user } = useUser();

  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      sendMessage({ action: "identify", userId: user.id });
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      if (messageHandlerRef.current) {
        try {
          const data = JSON.parse(event.data);
          messageHandlerRef.current(data);
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      }
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback((messageObject) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(messageObject));
    } else {
      console.warn("WebSocket not open: message not sent");
    }
  }, []);

  return {
    sendMessage,
    connected,
    socket: socketRef.current,
  };
}
