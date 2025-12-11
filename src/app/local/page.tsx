/**
 * local/page.tsx - Local two-player pass & play mode (/local)
 * 
 * Features: Player name input, game board, reset functionality
 * No server required - all state managed in Zustand store
 */

"use client";

import { useState } from "react";
import { Board } from "@/components/Board";
import { GameUI } from "@/components/GameUI";
import { useGameStore } from "@/store";

export default function LocalPage() {
  const { game, initLocal, reset } = useGameStore();
  const [p1, setP1] = useState("Red");
  const [p2, setP2] = useState("Green");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-amber-700">
            Local mode
          </p>
          <h1 className="text-3xl font-semibold text-amber-950">Two-player pass & play</h1>
        </div>
        {game && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm hover:border-amber-300"
          >
            Reset
          </button>
        )}
      </div>

      {!game ? (
        <div className="flex flex-col max-w-2xl mx-auto gap-4 rounded-xl bg-white/70 p-6 shadow-sm ring-1 ring-amber-100 ">
          <label className="text-sm font-semibold text-amber-900">
            Player 1 (Red)
            <input
              className="mt-1 w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
            />
          </label>
          <label className="text-sm font-semibold text-amber-900">
            Player 2 (Green)
            <input
              className="mt-1 w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => initLocal(p1, p2)}
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-base font-semibold text-white shadow-lg hover:bg-amber-600"
            >
              Start Game
            </button>
          </div>
        </div>
      ) : (
        <>
          <GameUI />
          <Board />
        </>
      )}
    </main>
  );
}

