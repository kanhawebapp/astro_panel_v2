"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

  const SOCKET_URL = "https://dhwaniastro.com";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("Connecting to socket with cookies...");

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
      console.error("🚨 Socket connection failed:", err.message);
      setLoading(false);
    });

    setSocket(socketInstance);

    return () => {
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