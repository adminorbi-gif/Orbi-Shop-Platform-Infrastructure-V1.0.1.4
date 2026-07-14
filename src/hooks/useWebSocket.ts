import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ChatMessage } from "../types";

// In development, the proxy or direct localhost:3000 will be used.
// In production, the current host is used.
const SOCKET_URL = window.location.origin;

export type ConnectionQuality = "poor" | "good" | "offline";

export function useWebSocket(
  userId?: string,
  activeConversationId?: string | null,
  onNewMessage?: (msg: ChatMessage) => void
) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>("offline");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const activeRoomsRef = useRef<Set<string>>(new Set());
  const pendingQueueRef = useRef<any[]>([]);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // We use refs for dependencies that shouldn't trigger re-connects
  const onNewMessageRef = useRef(onNewMessage);
  const activeConversationIdRef = useRef(activeConversationId);
  
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    activeConversationIdRef.current = activeConversationId;
  }, [onNewMessage, activeConversationId]);

  // Monitor latency to determine connection quality
  const startLatencyMonitor = useCallback((sock: Socket) => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    pingIntervalRef.current = setInterval(() => {
      if (!sock.connected) {
        setConnectionQuality("offline");
        return;
      }

      const start = Date.now();
      sock.emit("ping_latency", () => {
        const latency = Date.now() - start;
        if (latency > 1000) {
          setConnectionQuality("poor");
        } else {
          setConnectionQuality("good");
        }
      });
    }, 10000); // Check every 10 seconds
  }, []);

  useEffect(() => {
    if (!userId) {
      setConnectionQuality("offline");
      return;
    }

    // Initialize connection
    if (!socketRef.current) {
      console.log("[WebSocket] Connecting to:", SOCKET_URL);
      
      const newSocket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      const handleConnect = () => {
        console.log("[WebSocket] Connected:", newSocket.id);
        setIsConnected(true);
        setConnectionQuality("good");
        
        // 1. Identify client
        newSocket.emit("identify", userId);

        // 2. Automatically rejoin previously active rooms
        activeRoomsRef.current.forEach((room) => {
          console.log("[WebSocket] Auto-rejoining room:", room);
          newSocket.emit("joinConversation", room);
        });

        // 3. Process any offline queued messages
        if (pendingQueueRef.current.length > 0) {
          console.log(`[WebSocket] Dispatching ${pendingQueueRef.current.length} queued offline messages`);
          const queue = [...pendingQueueRef.current];
          pendingQueueRef.current = [];
          queue.forEach((msg) => {
            newSocket.emit("sendMessage", msg);
          });
        }

        startLatencyMonitor(newSocket);
      };

      const handleDisconnect = (reason: string) => {
        console.warn("[WebSocket] Disconnected:", reason);
        setIsConnected(false);
        setConnectionQuality("offline");
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };

      const handleConnectError = (error: any) => {
        console.error("[WebSocket] Connection error:", error);
        setConnectionQuality("offline");
      };

      newSocket.on("connect", handleConnect);
      newSocket.on("disconnect", handleDisconnect);
      newSocket.on("connect_error", handleConnectError);

      newSocket.on("newMessage", (message: ChatMessage) => {
        if (activeConversationIdRef.current === message.conversationId) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        }
        if (onNewMessageRef.current) {
          onNewMessageRef.current(message);
        }
      });

      newSocket.on("messagesRead", ({ conversationId, readByUserId }: { conversationId: string; readByUserId: string }) => {
        setMessages((prev) => {
          return prev.map((m) => {
            if (m.conversationId === conversationId && m.senderId !== readByUserId && !m.isRead) {
              return { ...m, isRead: true };
            }
            return m;
          });
        });
      });

      newSocket.on("messagesDeleted", ({ conversationId }: { conversationId: string }) => {
        setMessages((prev) => prev.filter((m) => m.conversationId !== conversationId));
      });

      // Simple echo handler for latency checks
      newSocket.on("ping_echo", () => {});

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      if (socketRef.current) {
        console.log("[WebSocket] Disconnecting client...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setConnectionQuality("offline");
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      }
    };
  }, [userId, startLatencyMonitor]);

  // Join room and record it for auto-reconnection
  const joinConversation = useCallback((conversationId: string) => {
    activeRoomsRef.current.add(conversationId);
    if (socketRef.current?.connected) {
      console.log("[WebSocket] Join conversation room:", conversationId);
      socketRef.current.emit("joinConversation", conversationId);
    }
  }, []);

  // Leave room and remove it from auto-reconnection list
  const leaveConversation = useCallback((conversationId: string) => {
    activeRoomsRef.current.delete(conversationId);
    if (socketRef.current?.connected) {
      console.log("[WebSocket] Leave conversation room:", conversationId);
      socketRef.current.emit("leaveConversation", conversationId);
    }
  }, []);

  // Send message or queue if offline
  const sendMessage = useCallback((message: Partial<ChatMessage>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("sendMessage", message);
    } else {
      console.warn("[WebSocket] Offline. Queueing message for reconnect:", message);
      pendingQueueRef.current.push(message);
    }
  }, []);

  const emitMessagesRead = useCallback((conversationId: string, readByUserId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("messagesRead", { conversationId, readByUserId });
    }
  }, []);

  // Explicit reconnection trigger
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("[WebSocket] Explicit reconnection triggered");
      socketRef.current.connect();
    }
  }, []);

  return {
    socket,
    isConnected,
    connectionQuality,
    messages,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitMessagesRead,
    reconnect,
    setMessages,
  };
}

