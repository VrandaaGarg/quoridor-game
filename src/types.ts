/**
 * types.ts - Core TypeScript type definitions for Quoridor game
 * 
 * Used by: All game logic, components, store, and API routes
 * Contains: Position, Player, Wall, GameState, and GameEvent types
 */

export type Position = { row: number; col: number };
export type Player = "player1" | "player2";
export type WallDir = "h" | "v";
export type Wall = { row: number; col: number; dir: WallDir };
export type Status = "waiting" | "playing" | "finished";

export type GameState = {
  status: Status;
  turn: Player;
  winner: Player | null;
  players: {
    player1: { id: string; name: string; pos: Position; walls: number };
    player2: { id: string; name: string; pos: Position; walls: number };
  };
  walls: Wall[];
};

export type GameEvent =
  | { type: "join"; playerId: string; name: string }
  | { type: "start" }
  | { type: "move"; player: Player; to: Position }
  | { type: "wall"; player: Player; wall: Wall }
  | { type: "win"; winner: Player };

