/**
 * store.ts - Zustand global state management for Quoridor
 * 
 * Used by: Board, GameUI, LocalPage, OnlinePage, RoomPage components
 * Manages: Game state, valid moves, wall previews, online/local mode context
 * Actions: initLocal, movePawn, placeWall, setGame, reset
 */

import { create } from "zustand";
import {
  GameState,
  Position,
  Wall,
} from "./types";
import {
  applyMove,
  applyWall,
  getValidMoves,
  isValidWall,
} from "./lib/game";

type Mode = "local" | "online" | null;

interface GameStore {
  // State
  mode: Mode;
  roomId: string | null;
  myId: string | null;
  game: GameState | null;

  // UI
  validMoves: Position[];
  wallPreview: Wall | null;

  // Actions
  initLocal: (p1Name: string, p2Name: string) => void;
  setOnlineContext: (roomId: string, myId: string) => void;
  setGame: (game: GameState) => void;
  movePawn: (to: Position) => void;
  placeWall: (wall: Wall) => void;
  setWallPreview: (wall: Wall | null) => void;
  isMyTurn: () => boolean;
  reset: () => void;
}

const initialGame = (p1Name: string, p2Name: string): GameState => ({
  status: "playing",
  turn: "player1",
  winner: null,
  players: {
    player1: { id: "p1", name: p1Name || "Player 1", pos: { row: 0, col: 4 }, walls: 10 },
    player2: { id: "p2", name: p2Name || "Player 2", pos: { row: 8, col: 4 }, walls: 10 },
  },
  walls: [],
});

export const useGameStore = create<GameStore>((set, get) => ({
  mode: null,
  roomId: null,
  myId: null,
  game: null,

  validMoves: [],
  wallPreview: null,

  initLocal: (p1Name: string, p2Name: string) => {
    const game = initialGame(p1Name, p2Name);
    set({
      mode: "local",
      roomId: null,
      myId: null,
      game,
      validMoves: getValidMoves(game, "player1"),
      wallPreview: null,
    });
  },

  setOnlineContext: (roomId: string, myId: string) =>
    set({ roomId, myId, mode: "online" }),

  setGame: (game: GameState) => {
    // Only show valid moves when game is actively playing
    const validMoves = game.status === "playing" ? getValidMoves(game, game.turn) : [];
    set({
      game,
      validMoves,
      wallPreview: null,
    });
  },

  movePawn: (to: Position) => {
    const game = get().game;
    if (!game || game.status === "finished") return;
    const next = applyMove(game, game.turn, to);
    set({
      game: next,
      validMoves: next.status === "finished" ? [] : getValidMoves(next, next.turn),
      wallPreview: null,
    });
  },

  placeWall: (wall: Wall) => {
    const game = get().game;
    if (!game || game.status === "finished") return;
    if (!isValidWall(game, wall)) return;
    const next = applyWall(game, game.turn, wall);
    set({
      game: next,
      validMoves: next.status === "finished" ? [] : getValidMoves(next, next.turn),
      wallPreview: null,
    });
  },

  setWallPreview: (wall: Wall | null) => set({ wallPreview: wall }),

  isMyTurn: () => {
    const { game, myId } = get();
    if (!game || game.status !== "playing") return false;
    const turn = game.turn;
    const playerId = game.players[turn].id;
    return !myId || playerId === myId;
  },

  reset: () =>
    set({
      mode: null,
      roomId: null,
      myId: null,
      game: null,
      validMoves: [],
      wallPreview: null,
    }),
}));
