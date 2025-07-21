import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useUser } from "../hooks/useUser";
import { dataActionEnum } from "../utils/constants";

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const { user } = useUser();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef([]);
  const [notifications, setNotifications] = useState([]);


  const sendMessage = useCallback((msgObj) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgObj));
    }
  }, []);

  // Allow components to subscribe to messages
  const addListener = useCallback((handler) => {
    listenersRef.current.push(handler);

    return () => {
      listenersRef.current = listenersRef.current.filter(
        (fn) => fn !== handler,
      );
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const ws = new window.WebSocket("ws://localhost:8080");
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      sendMessage({ action: "identify", userId: user.id });
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      // Notification handling
      if (data.action === dataActionEnum.NOTIFICATION) {
        console.log("Notification received:", data);
        setNotifications((prev) => [data, ...prev]);
      }

      listenersRef.current.forEach((fn) => fn(data));
    };

    return () => {
      ws.close();
      setConnected(false);
    };
    // eslint-disable-next-line
  }, [user?.id]);

  const value = {
    connected,
    sendMessage,
    addListener,
    notifications,
    socket: socketRef.current,
    clearNotifications: () => setNotifications([]),
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWS() {
  return useContext(WebSocketContext);
}
