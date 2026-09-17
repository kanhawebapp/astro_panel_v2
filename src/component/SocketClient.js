"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
} from "react";

import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!SOCKET_URL) {
      console.error(
        "NEXT_PUBLIC_SOCKET_URL is not configured"
      );
      setLoading(false);
      return;
    }

    console.log("Connecting to socket with cookies...");
    console.log("Socket URL:", SOCKET_URL);

    const socketInstance = io(SOCKET_URL + "/dhwani-astro", {
      path: "/astro-websocket-service-v2/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setLoading(false);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    socketInstance.on("connect_error", (err) => {
      console.error(
        "🚨 Socket connection failed:",
        err.message
      );

      setLoading(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log("Disconnecting socket...");
      socketInstance.disconnect();
    };
  }, []);

  if (loading) {
    return <div>Connecting to server...</div>;
  }

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;