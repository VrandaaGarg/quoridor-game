/**
 * online/page.tsx - Online lobby page (/online)
 * 
 * Features: Create room, join room with code, error handling
 * Calls: /api/room to create/join, redirects to /online/[roomId]
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lobby } from "@/components/Lobby";
import { useGameStore } from "@/store";

export default function OnlinePage() {
  const router = useRouter();
  const { reset } = useGameStore();
  const [busy, setBusy] = useState(false);
  const [lastRoom, setLastRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async (name: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create room");
      setLastRoom(data.roomId);
      router.push(`/online/${data.roomId}?pid=${data.playerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const joinRoom = async (roomId: string, name: string) => {
    if (!roomId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/room?action=join", {
        method: "POST",
        body: JSON.stringify({ roomId, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to join room");
      setLastRoom(roomId);
      router.push(`/online/${roomId}?pid=${data.playerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-amber-700">Online</p>
          <h1 className="text-3xl font-semibold text-amber-950">
            Invite a friend or join a room
          </h1>
          <p className="text-amber-800">Rooms expire after 30 minutes of inactivity.</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm hover:border-amber-300"
        >
          Clear state
        </button>
      </div>

      <Lobby onCreate={createRoom} onJoin={joinRoom} busy={busy} roomId={lastRoom} />

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
    </main>
  );
}

