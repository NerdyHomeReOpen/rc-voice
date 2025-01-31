import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = "ws://localhost:4500";

export const useWebSocket = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket"],
      reconnection: true, // 啟用自動重連 (默認為 true)
      reconnectionAttempts: 5, // 最大重連次數 (設置為 5 次)
      reconnectionDelay: 1000, // 初始重連延遲 (1 秒)
      reconnectionDelayMax: 5000, // 最大重連延遲 (5 秒)
      timeout: 20000, // 連接超時 (20 秒)
    });

    setSocketInstance(socket);

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    });

    socket.on("error", (error) => {
      setError(error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback((type, data) => {
    if (!socketInstance) return;

    socketInstance.emit(type, data);
  }, []);

  return { isConnected, error, sendMessage };
};

export default useWebSocket;
