/**
 * socket.ts - Real-time client helper for online multiplayer
 * 
 * Used by: RoomPage (online/[roomId]/page.tsx), Board.tsx
 * Handles: SSE connection for receiving updates, HTTP POST for sending moves
 * 
 * Note: Uses Server-Sent Events + HTTP instead of WebSocket
 * because Next.js doesn't support native WebSockets.
 */

import { GameEvent } from "@/types";

let eventSource: EventSource | null = null;
let currentRoom: string | null = null;
let currentPlayer: string | null = null;
let messageCallback: ((data: unknown) => void) | null = null;

export const connectSocket = (
  roomId: string,
  playerId: string,
  onMessage?: (data: unknown) => void,
) => {
  if (onMessage) {
    messageCallback = onMessage;
  }
  
  currentRoom = roomId;
  currentPlayer = playerId;

  if (typeof window === "undefined") return null;

  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  const url = `/api/room/stream?roomId=${roomId}`;
  eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (messageCallback) {
        messageCallback(payload);
      }
    } catch {
      // ignore parse errors
    }
  };

  eventSource.onerror = () => {
    if (currentRoom && currentPlayer) {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      setTimeout(() => {
        if (currentRoom && currentPlayer) {
          connectSocket(currentRoom, currentPlayer);
        }
      }, 2000);
    }
  };

  return eventSource;
};

export const sendSocket = async (data: GameEvent) => {
  if (!currentRoom) return;

  try {
    await fetch(`/api/room?id=${currentRoom}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // ignore send errors
  }
};

export const closeSocket = () => {
  currentRoom = null;
  currentPlayer = null;
  messageCallback = null;
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
};
