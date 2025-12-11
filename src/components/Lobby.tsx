/**
 * Lobby.tsx - Online room creation/join interface
 * 
 * Used by: OnlinePage (/online)
 * Features: Name input, create room button, join with code,
 *           shareable room link display
 */

"use client";

import { useState } from "react";

type Props = {
  onCreate: (name: string) => Promise<void> | void;
  onJoin: (roomId: string, name: string) => Promise<void> | void;
  defaultName?: string;
  busy?: boolean;
  roomId?: string | null;
};

export function Lobby({ onCreate, onJoin, defaultName = "", busy, roomId }: Props) {
  const [name, setName] = useState(defaultName);
  const [joinRoom, setJoinRoom] = useState("");

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-white/70 p-6 shadow-sm ring-1 ring-amber-100">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-amber-900">
          Your name
          <input
            className="mt-1 w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onCreate(name)}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-60"
        >
          Create Room
        </button>
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            value={joinRoom}
            onChange={(e) => setJoinRoom(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={6}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => onJoin(joinRoom, name)}
            className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 shadow hover:bg-amber-200 disabled:opacity-60"
          >
            Join
          </button>
        </div>
      </div>

      {roomId && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Share this link:{" "}
          <code className="rounded bg-white px-2 py-1 text-xs">
            {typeof window !== "undefined"
              ? `${window.location.origin}/online/${roomId}`
              : roomId}
          </code>
        </div>
      )}
    </div>
  );
}

