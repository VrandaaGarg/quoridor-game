/**
 * api/room/stream/route.ts - Server-Sent Events endpoint for real-time game updates
 * 
 * Polls Redis for game state changes and pushes updates to connected clients.
 * Used as alternative to WebSocket since Next.js doesn't support native WebSockets.
 */

import { fetchGameState } from "@/lib/server-game";
import { getRedis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 400;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return new Response("Missing roomId", { status: 400 });
  }

  try {
    getRedis();
  } catch {
    return new Response("Redis not configured", { status: 503 });
  }

  let lastStateJson = "";
  let isActive = true;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: unknown) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial state
      const initialGame = await fetchGameState(roomId);
      if (initialGame) {
        lastStateJson = JSON.stringify(initialGame);
        sendEvent({ type: "state", game: initialGame });
      }

      // Poll for updates
      const poll = async () => {
        if (!isActive) return;

        try {
          const game = await fetchGameState(roomId);
          if (game) {
            const currentJson = JSON.stringify(game);
            if (currentJson !== lastStateJson) {
              lastStateJson = currentJson;
              sendEvent({ type: "state", game });
            }
          }
        } catch (err) {
          console.error("SSE poll error:", err);
        }

        if (isActive) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      setTimeout(poll, POLL_INTERVAL_MS);
    },
    cancel() {
      isActive = false;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
