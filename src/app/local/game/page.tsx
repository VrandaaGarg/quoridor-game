/**
 * local/game/page.tsx - Local game board (/local/game)
 * 
 * Features: Game board, reset functionality
 * Redirects to /local if no game state exists
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Board } from "@/components/Board";
import { GameUI } from "@/components/GameUI";
import { useGameStore } from "@/store";

export default function LocalGamePage() {
  const router = useRouter();
  const { game, reset } = useGameStore();

  useEffect(() => {
    if (!game) {
      router.replace("/local");
    }
  }, [game, router]);

  if (!game) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-10 font-fredoka">
        <div className="rounded-xl bg-white p-6 text-center shadow">
          Loading game...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10 font-fredoka">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-amber-700 font-bold">
            Local mode
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-950 tracking-wide">
            {game.players.player1.name} vs {game.players.player2.name}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            router.push("/local");
          }}
          className="rounded-full border-2 border-amber-200 bg-white px-4 md:px-6 py-1 md:py-2 text-xs md:text-sm font-bold text-amber-900 shadow-md transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg active:translate-y-0"
        >
          New Game
        </button>
      </div>

      <div className="h-full my-auto">
        <GameUI />
        <Board />
      </div>
    </main>
  );
}
