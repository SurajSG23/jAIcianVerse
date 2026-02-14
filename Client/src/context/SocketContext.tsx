import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ReactNode } from "react";

const SOCKET_URL = "http://localhost:3000";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (!stored) return;

    let token: string;
    try {
      const parsed = JSON.parse(stored);
      token = parsed.token;
    } catch {
      return;
    }

    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("setup");
    });

    s.on("disconnect", () => setIsConnected(false));
    s.on("connect_error", () => setIsConnected(false));

    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
