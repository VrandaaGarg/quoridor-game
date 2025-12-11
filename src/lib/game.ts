/**
 * game.ts - Core Quoridor game logic (client & server)
 * 
 * Used by: store.ts, server-game.ts, Board.tsx
 * Contains: Move validation, wall validation, pathfinding (BFS),
 *           win detection, and state mutation helpers
 */

import {
  GameState,
  Player,
  Position,
  Wall,
  WallDir,
} from "../types";

const BOARD_SIZE = 9;
const WALL_MAX = 8; // valid wall coordinates 0-7

const inBounds = (pos: Position) =>
  pos.row >= 0 &&
  pos.row < BOARD_SIZE &&
  pos.col >= 0 &&
  pos.col < BOARD_SIZE;

const wallInBounds = (wall: Wall) =>
  wall.row >= 0 &&
  wall.row < WALL_MAX &&
  wall.col >= 0 &&
  wall.col < WALL_MAX;

export function isBlocked(from: Position, to: Position, walls: Wall[]): boolean {
  if (from.row === to.row && Math.abs(from.col - to.col) === 1) {
    // Horizontal move across a vertical wall
    const leftCol = Math.min(from.col, to.col);
    return walls.some(
      (w) =>
        w.dir === "v" &&
        w.col === leftCol &&
        (w.row === from.row || w.row === from.row - 1),
    );
  }

  if (from.col === to.col && Math.abs(from.row - to.row) === 1) {
    // Vertical move across a horizontal wall
    const topRow = Math.min(from.row, to.row);
    return walls.some(
      (w) =>
        w.dir === "h" &&
        w.row === topRow &&
        (w.col === from.col || w.col === from.col - 1),
    );
  }

  return true; // Non-adjacent moves are not directly connected
}

export function getValidMoves(game: GameState, player: Player): Position[] {
  const me = game.players[player].pos;
  const opp = game.players[player === "player1" ? "player2" : "player1"].pos;
  const moves: Position[] = [];

  const tryAdd = (pos: Position) => {
    if (inBounds(pos) && !isBlocked(me, pos, game.walls)) {
      moves.push(pos);
    }
  };

  const dirs = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  for (const d of dirs) {
    const next: Position = { row: me.row + d.row, col: me.col + d.col };
    if (!inBounds(next) || isBlocked(me, next, game.walls)) continue;

    const isOpp =
      next.row === opp.row && next.col === opp.col;

    if (!isOpp) {
      moves.push(next);
      continue;
    }

    // Opponent adjacent: try jumping straight
    const jump: Position = { row: next.row + d.row, col: next.col + d.col };
    if (inBounds(jump) && !isBlocked(next, jump, game.walls)) {
      moves.push(jump);
    } else {
      // Diagonal options around the opponent when blocked
      const perp =
        d.row === 0
          ? [
              { row: 1, col: 0 },
              { row: -1, col: 0 },
            ]
          : [
              { row: 0, col: 1 },
              { row: 0, col: -1 },
            ];

      for (const p of perp) {
        const diag: Position = {
          row: next.row + p.row,
          col: next.col + p.col,
        };
        if (
          inBounds(diag) &&
          !isBlocked(me, next, game.walls) &&
          !isBlocked(next, diag, game.walls)
        ) {
          moves.push(diag);
        }
      }
    }
  }

  return moves;
}

export function canReachGoal(pos: Position, goalRow: number, walls: Wall[]): boolean {
  const visited = new Set<string>();
  const queue: Position[] = [pos];

  const key = (p: Position) => `${p.row},${p.col}`;

  while (queue.length) {
    const current = queue.shift()!;
    if (current.row === goalRow) return true;
    const k = key(current);
    if (visited.has(k)) continue;
    visited.add(k);

    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];

    for (const n of neighbors) {
      if (!inBounds(n)) continue;
      if (isBlocked(current, n, walls)) continue;
      queue.push(n);
    }
  }

  return false;
}

function wallsOverlap(a: Wall, b: Wall): boolean {
  // Walls of different directions can only conflict at intersection crossings
  if (a.dir !== b.dir) {
    // Check if they cross at the same intersection point
    return a.row === b.row && a.col === b.col;
  }

  // Same direction walls - check for any overlap
  // Walls are 2 cells long, so they overlap if:
  // - Horizontal walls: same row AND columns within 1 of each other
  // - Vertical walls: same column AND rows within 1 of each other
  if (a.dir === "h") {
    // Horizontal walls span col to col+1
    // They overlap if on same row and |col difference| <= 1
    return a.row === b.row && Math.abs(a.col - b.col) <= 1;
  } else {
    // Vertical walls span row to row+1
    // They overlap if on same column and |row difference| <= 1
    return a.col === b.col && Math.abs(a.row - b.row) <= 1;
  }
}

export function isValidWall(game: GameState, wall: Wall): boolean {
  if (!wallInBounds(wall)) return false;

  // Check for any overlap with existing walls
  for (const w of game.walls) {
    if (wallsOverlap(w, wall)) return false;
  }

  // Check path availability after placement
  const updatedWalls = [...game.walls, wall];
  const p1Goal = BOARD_SIZE - 1;
  const p2Goal = 0;
  const p1CanReach = canReachGoal(game.players.player1.pos, p1Goal, updatedWalls);
  const p2CanReach = canReachGoal(game.players.player2.pos, p2Goal, updatedWalls);

  return p1CanReach && p2CanReach;
}

export function getWinner(game: GameState): Player | null {
  if (game.players.player1.pos.row === BOARD_SIZE - 1) return "player1";
  if (game.players.player2.pos.row === 0) return "player2";
  return null;
}

export function applyMove(
  game: GameState,
  player: Player,
  to: Position,
): GameState {
  const moves = getValidMoves(game, player);
  if (!moves.some((m) => m.row === to.row && m.col === to.col)) return game;

  const next: GameState = {
    ...game,
    turn: player === "player1" ? "player2" : "player1",
    players: {
      ...game.players,
      [player]: {
        ...game.players[player],
        pos: to,
      },
    },
  };

  const winner = getWinner(next);
  if (winner) {
    next.status = "finished";
    next.winner = winner;
  }

  return next;
}

export function applyWall(
  game: GameState,
  player: Player,
  wall: Wall,
): GameState {
  if (game.players[player].walls <= 0) return game;
  if (!isValidWall(game, wall)) return game;

  const nextWalls = [...game.walls, wall];
  const next: GameState = {
    ...game,
    turn: player === "player1" ? "player2" : "player1",
    walls: nextWalls,
    players: {
      ...game.players,
      [player]: {
        ...game.players[player],
        walls: game.players[player].walls - 1,
      },
    },
  };

  return next;
}

