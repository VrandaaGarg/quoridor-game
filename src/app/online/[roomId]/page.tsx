/**
 * [roomId]/page.tsx - Online game room (/online/[roomId])
 * 
 * Features: Real-time game sync via WebSocket, player identification
 * Connects: /api/socket for live updates, /api/room for initial state
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Board } from "@/components/Board";
import { GameUI } from "@/components/GameUI";
import { connectSocket, closeSocket } from "@/lib/socket";
import { useGameStore } from "@/store";
import { Player } from "@/types";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const roomId = params.roomId;
  const playerId = search.get("pid") || "";
  const { setGame, setOnlineContext, game } = useGameStore();
  const [error, setError] = useState<string | null>(null);

  // Sync initial state
  useEffect(() => {
    const fetchState = async () => {
      if (!roomId || !playerId) return;
      try {
        const res = await fetch(`/api/room?id=${roomId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Unable to load room");
        setOnlineContext(roomId, playerId);
        setGame(data.game);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };
    fetchState();
  }, [roomId, playerId, setGame, setOnlineContext]);

  // Live updates
  useEffect(() => {
    if (!roomId || !playerId) return;
    const socket = connectSocket(roomId, playerId, (payload) => {
      const p = payload as { type?: string; game?: unknown };
      if (p?.type === "state" && p.game) {
        setGame(p.game as Parameters<typeof setGame>[0]);
      }
    });
    return () => {
      closeSocket();
      socket?.close();
    };
  }, [roomId, playerId, setGame]);

  const myPlayer: Player | null = useMemo(() => {
    if (!game) return null;
    if (game.players.player1.id === playerId) return "player1";
    if (game.players.player2.id === playerId) return "player2";
    return null;
  }, [game, playerId]);

  if (!playerId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-10">
        <div className="rounded-xl bg-white p-6 text-center shadow">
          Missing player id. Return to lobby.
          <button
            type="button"
            className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => router.push("/online")}
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-amber-700">
            Room {roomId}
          </p>
          <h1 className="text-3xl font-semibold text-amber-950">Play online</h1>
          {/* <p className="text-amber-800">
            Share this link to invite a friend. Turn-based sync via Redis + WebSocket.
          </p> */}
        </div>
        <div className="rounded-lg bg-white px-3 py-2 text-xs text-amber-800 shadow">
          You are: {myPlayer ?? "Spectator"}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {game ? (
        <>
          {game.status === "waiting" && (
            <div className="rounded-xl bg-amber-50 p-6 text-center shadow ring-2 ring-amber-200">
              <p className="text-lg font-semibold text-amber-900">Waiting for opponent to join...</p>
              <p className="mt-2 text-sm text-amber-700">Share this room code with your friend:</p>
              <p className="mt-1 text-2xl font-bold text-amber-950 tracking-wider">{roomId}</p>
            </div>
          )}
          <GameUI />
          <Board interactive={game.status === "playing"} />
        </>
      ) : (
        <div className="rounded-xl bg-white p-6 text-center shadow">Loading game…</div>
      )}
    </main>
  );
}

