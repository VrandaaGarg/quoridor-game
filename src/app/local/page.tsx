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
  const [p1, setP1] = useState("Player 1");
  const [p2, setP2] = useState("Player 2");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10 font-fredoka">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-amber-700 font-bold">
            Local mode
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-950 tracking-wide">Two-player pass & play</h1>
        </div>
        {game && (
          <button
            type="button"
            onClick={reset}
            className="rounded-full border-2 border-amber-200 bg-white px-4 md:px-6 py-1 md:py-2 text-xs md:text-sm font-bold text-amber-900 shadow-md transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg active:translate-y-0"
          >
            Reset
          </button>
        )}
      </div>

     <div className="h-full my-auto">
       {!game ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur-sm ring-4 ring-amber-200">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-amber-900 mb-2">Who's Playing?</h2>
              <p className="text-amber-700">Enter names for local battle!</p>
            </div>
            
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-red-600">Player 1 (Red)</span>
                <input
                  className="w-full rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-900 placeholder:text-red-300 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all"
                  value={p1}
                  onChange={(e) => setP1(e.target.value)}
                  placeholder="Red Player"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-green-600">Player 2 (Green)</span>
                <input
                  className="w-full rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3 text-base font-medium text-green-900 placeholder:text-green-300 focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all"
                  value={p2}
                  onChange={(e) => setP2(e.target.value)}
                  placeholder="Green Player"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => initLocal(p1, p2)}
              className="mt-2 w-full transform rounded-xl bg-linear-to-br from-amber-400 to-amber-600 px-6 py-4 text-xl font-bold text-white shadow-lg shadow-amber-300/50 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0.5 active:shadow-sm"
            >
              Start Game!
            </button>
          </div>
        </div>
      ) : (
        <>
          <GameUI />
          <Board />
        </>
      )}
     </div>
    </main>
  );
}

