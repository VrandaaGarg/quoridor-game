/**
 * server-game.ts - Server-side game state persistence & sync
 * 
 * Used by: /api/room, /api/room/stream routes
 * Handles: Redis read/write, room TTL, applying moves/walls with validation
 */

import { getRedis } from "./redis";
import { GameState, Player, Wall } from "../types";
import { applyMove, applyWall } from "./game";

const ROOM_TTL_SECONDS = 60 * 30;

const roomKey = (id: string) => `room:${id}`;
const gameKey = (id: string) => `game:${id}`;

type RoomHash = Record<string, string>;

const safeParseWalls = (wallsRaw: unknown): Wall[] => {
  if (!wallsRaw) return [];
  
  // Upstash Redis may return already-parsed JSON or a string
  if (Array.isArray(wallsRaw)) {
    return wallsRaw as Wall[];
  }
  
  if (typeof wallsRaw === "string") {
    try {
      const parsed = JSON.parse(wallsRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  return [];
};

const parseGame = (room: RoomHash, game: RoomHash): GameState | null => {
  if (!room.status) return null;
  const walls: Wall[] = safeParseWalls(game.walls);

  const state: GameState = {
    status: (room.status as GameState["status"]) ?? "waiting",
    turn: (game.turn as Player) ?? "player1",
    winner: game.winner ? (game.winner as Player) : null,
    players: {
      player1: {
        id: room.p1Id ?? "",
        name: room.p1Name ?? "Player 1",
        pos: {
          row: Number(game.p1Row ?? 0),
          col: Number(game.p1Col ?? 4),
        },
        walls: Number(game.p1Walls ?? 10),
      },
      player2: {
        id: room.p2Id ?? "",
        name: room.p2Name ?? "Player 2",
        pos: {
          row: Number(game.p2Row ?? 8),
          col: Number(game.p2Col ?? 4),
        },
        walls: Number(game.p2Walls ?? 10),
      },
    },
    walls,
  };

  return state;
};

export const fetchGameState = async (roomId: string) => {
  const redis = getRedis();
  const [roomHash, gameHash] = await Promise.all([
    redis.hgetall<Record<string, string>>(roomKey(roomId)),
    redis.hgetall<Record<string, string>>(gameKey(roomId)),
  ]);

  if (!roomHash || Object.keys(roomHash).length === 0) return null;
  if (!gameHash || Object.keys(gameHash).length === 0) return null;

  return parseGame(roomHash, gameHash);
};

export const persistGameState = async (roomId: string, state: GameState) => {
  const redis = getRedis();
  await redis.hset(gameKey(roomId), {
    turn: state.turn,
    winner: state.winner ?? "",
    p1Row: state.players.player1.pos.row,
    p1Col: state.players.player1.pos.col,
    p1Walls: state.players.player1.walls,
    p2Row: state.players.player2.pos.row,
    p2Col: state.players.player2.pos.col,
    p2Walls: state.players.player2.walls,
    walls: JSON.stringify(state.walls),
  });
  await redis.expire(gameKey(roomId), ROOM_TTL_SECONDS);
  await redis.hset(roomKey(roomId), { status: state.status });
  await redis.expire(roomKey(roomId), ROOM_TTL_SECONDS);
};

export const persistRoomMeta = async (
  roomId: string,
  meta: Record<string, string>,
) => {
  const redis = getRedis();
  await redis.hset(roomKey(roomId), meta);
  await redis.expire(roomKey(roomId), ROOM_TTL_SECONDS);
};

export const applyGameEvent = async (
  roomId: string,
  event:
    | { type: "move"; player: Player; to: { row: number; col: number } }
    | { type: "wall"; player: Player; wall: Wall },
) => {
  const state = await fetchGameState(roomId);
  if (!state) return null;
  if (state.turn !== event.player) return state;
  
  let next = state;
  if (event.type === "move") {
    next = applyMove(state, event.player, event.to);
  } else if (event.type === "wall") {
    next = applyWall(state, event.player, event.wall);
  }
  await persistGameState(roomId, next);
  return next;
};

export const newRoomCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

export const initialGameState = (
  p1Id: string,
  p1Name: string,
  p2Id: string,
  p2Name: string,
  status: GameState["status"] = "playing",
): GameState => ({
  status,
  turn: "player1",
  winner: null,
  players: {
    player1: { id: p1Id, name: p1Name || "Red", pos: { row: 0, col: 4 }, walls: 10 },
    player2: { id: p2Id, name: p2Name || "Green", pos: { row: 8, col: 4 }, walls: 10 },
  },
  walls: [],
});

