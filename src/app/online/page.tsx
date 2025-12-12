/**
 * online/page.tsx - Online lobby page (/online)
 * 
 * Features: Create room, join room with code, toggle UI with animated ghost
 * Calls: /api/room to create/join, redirects to /online/[roomId]
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGameStore } from "@/store";
import Ghost from "@/components/Ghost";

export default function OnlinePage() {
  const router = useRouter();
  const { reset } = useGameStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const createRoom = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create room");
      router.push(`/online/${data.roomId}?pid=${data.playerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const joinRoom = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/room?action=join", {
        method: "POST",
        body: JSON.stringify({ roomId: roomCode.trim().toUpperCase(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to join room");
      router.push(`/online/${roomCode.trim().toUpperCase()}?pid=${data.playerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen overflow-hidden max-w-5xl flex-col gap-6 px-6 py-10 font-fredoka">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-amber-700 font-bold">
            Online mode
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-950 tracking-wide">
            Play with friends online
          </h1>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-full cursor-pointer border-2  border-amber-200 bg-white px-4 md:px-6 py-1 md:py-2 text-xs md:text-sm font-bold text-amber-900 shadow-md transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg active:translate-y-0"
        >
          Clear state
        </button>
      </div>

      <div className="h-full my-auto flex flex-1 items-center justify-center">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur-sm ring-4 ring-amber-200">
          
          {/* Toggle with Ghost */}
          <div className="relative">
            {/* Animated Ghost above toggle */}
            <motion.div
              className="absolute -top-32 z-10"
              animate={{
                left: isJoinMode ? "calc(75% - 40px)" : "calc(25% - 120px)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ scale: 1.8 }}
            >
              <Ghost color="red" isMoving={true} />
            </motion.div>

            {/* Toggle buttons */}
            <div className="relative flex rounded-2xl overflow-hidden border-2 border-amber-300 bg-amber-100">
              {/* Animated background slider */}
              <motion.div
                className="absolute top-0 my-1 bottom-0 w-1/2 bg-amber-400 rounded-xl"
                animate={{
                  left: isJoinMode ? "calc(50% - 2px)" : "2.5px",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
              <button
                type="button"
                onClick={() => setIsJoinMode(false)}
                className={`relative z-10 flex-1 py-3 text-sm font-bold transition-colors ${
                  !isJoinMode ? "text-amber-900" : "text-amber-600 hover:text-amber-700"
                }`}
              >
                Create Room
              </button>
              <button
                type="button"
                onClick={() => setIsJoinMode(true)}
                className={`relative z-10 flex-1 py-3 text-sm font-bold transition-colors ${
                  isJoinMode ? "text-amber-900" : "text-amber-600 hover:text-amber-700"
                }`}
              >
                Join Room
              </button>
            </div>
          </div>

          {/* Form content */}
          <div className="space-y-4 mt-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-amber-700">Enter your name</span>
              <input
                className="w-full rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-base font-medium text-amber-900 placeholder:text-amber-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>

            {isJoinMode && (
              <motion.label
                className="block"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="mb-1 block text-sm font-bold text-amber-700">Enter room code</span>
                <input
                  className="w-full rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-base font-medium text-amber-900 placeholder:text-amber-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all uppercase"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  maxLength={8}
                />
              </motion.label>
            )}
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={isJoinMode ? joinRoom : createRoom}
            disabled={busy || !name.trim() || (isJoinMode && !roomCode.trim())}
            className="mt-2 w-full transform rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-4 text-xl font-bold text-white shadow-lg shadow-amber-300/50 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0.5 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {busy ? "Loading..." : isJoinMode ? "Join Room" : "Create Room"}
          </button>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-2 ring-red-200">
              {error}
            </div>
          )}

          {/* Info text */}
          <p className="text-center text-xs text-amber-600">
            Rooms expire after 30 minutes of inactivity.
          </p>
        </div>
      </div>
    </main>
  );
}
