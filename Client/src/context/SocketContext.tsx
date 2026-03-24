import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ReactNode } from "react";

const SOCKET_URL = "http://localhost:3000";
const AUTH_CHANGE_EVENT = "jai-auth-changed";

const getStoredToken = (): string => {
  const stored = localStorage.getItem("userInfo");
  if (!stored) return "";

  try {
    const parsed = JSON.parse(stored);
    return parsed?.token || "";
  } catch {
    return "";
  }
};

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string>(() => getStoredToken());

  useEffect(() => {
    const refreshToken = () => {
      setToken(getStoredToken());
    };

    window.addEventListener("storage", refreshToken);
    window.addEventListener(AUTH_CHANGE_EVENT, refreshToken as EventListener);

    return () => {
      window.removeEventListener("storage", refreshToken);
      window.removeEventListener(AUTH_CHANGE_EVENT, refreshToken as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      return;
    }

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
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);
