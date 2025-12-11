/**
 * GameUI.tsx - Game status display and win announcement
 * 
 * Used by: LocalPage, RoomPage (online)
 * Shows: Current turn indicator, winner celebration modal
 */

"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store";

export function GameUI() {
  const { game, isMyTurn } = useGameStore();

  const statusLabel = useMemo(() => {
    if (!game) return "";
    if (game.status === "waiting") return "Waiting for opponent…";
    if (game.status === "finished") {
      const winnerName =
        game.winner === "player1"
          ? game.players.player1.name
          : game.players.player2.name;
      return `${winnerName} wins!`;
    }
    const currentName = game.players[game.turn].name;
    return isMyTurn() ? `${currentName}'s turn` : "Opponent's turn";
  }, [game, isMyTurn]);

  if (!game) return null;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl">
      <div className="flex items-center justify-center text-2xl font-bold text-amber-900">
       {statusLabel}
        
      </div>

      {/* <AnimatePresence>
        {game.status === "finished" && game.winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg bg-amber-500/20 p-4 text-center ring-1 ring-amber-300"
          >
            <div className="text-lg font-bold text-amber-900">
              🎉{" "}
              {game.winner === "player1"
                ? game.players.player1.name
                : game.players.player2.name}{" "}
              wins! 🎉
            </div>
          </motion.div>
        )}
      </AnimatePresence> */}
    </div>
  );
}
