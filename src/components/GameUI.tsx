/**
 * GameUI.tsx - Game status display and win announcement
 * 
 * Used by: LocalPage, RoomPage (online)
 * Shows: Current turn indicator, winner celebration modal with confetti
 */

"use client";

import { useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store";
import confetti from "canvas-confetti";

export function GameUI() {
  const { game, isMyTurn } = useGameStore();
  const hasTriggeredConfetti = useRef(false);

  const statusLabel = useMemo(() => {
    if (!game) return "";
    if (game.status === "waiting") return "Waiting for opponent…";
    if (game.status === "finished") return "";
    const currentName = game.players[game.turn].name;
    return isMyTurn() ? `${currentName}'s turn` : "Opponent's turn";
  }, [game, isMyTurn]);

  useEffect(() => {
    if (game?.status === "finished" && game?.winner && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      
      // Center burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
      });
      
      // Left side burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.5 },
        });
      }, 250);
      
      // Right side burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.5 },
        });
      }, 400);

      // Extra celebration burst
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.5, y: 0.3 },
        });
      }, 600);
    }
    
    if (game?.status !== "finished") {
      hasTriggeredConfetti.current = false;
    }
  }, [game?.status, game?.winner]);

  if (!game) return null;

  const isFinished = game.status === "finished" && game.winner;

  return (
    <div className="flex w-full flex-col gap-3 mb-2 rounded-xl relative">
      {statusLabel && (
        <div className="flex items-center justify-center text-2xl font-bold text-amber-900 font-fredoka">
          {statusLabel}
        </div>
      )}

      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl mb-3 bg-linear-to-br from-amber-400 to-amber-500 p-4 text-center shadow-lg"
          >
            <div className="text-xl font-bold text-white font-fredoka">
              {game.winner === "player1"
                ? game.players.player1.name
                : game.players.player2.name}{" "}
              is the Winner!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
