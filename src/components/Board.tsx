/**
 * Board.tsx - Main game board component with drag-and-drop walls
 * 
 * Used by: LocalPage, RoomPage (online)
 * Features: 9x9 grid, animated pawns, draggable wall pieces,
 *           move highlighting, wall preview validation
 */

"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store";
import { GameState, Position, Wall, WallDir, Player } from "@/types";
import { isValidWall } from "@/lib/game";
import { sendSocket } from "@/lib/socket";

const CELL = 52;
const GAP = 12;
const BOARD_PX = CELL * 9 + GAP * 8;
const PADDING = 12;
const GRID_PADDING = 4;
const TOTAL_OFFSET = PADDING + GRID_PADDING;
const PAWN_SIZE = 40;

// Generate explicit grid track sizes: CELL, GAP, CELL, GAP, ... CELL
const gridTrackSizes = Array.from({ length: 17 }, (_, i) =>
  i % 2 === 0 ? `${CELL}px` : `${GAP}px`
).join(" ");

const cellKey = (pos: Position) => `${pos.row}-${pos.col}`;

const isMove = (moves: Position[], pos: Position) =>
  moves.some((m) => m.row === pos.row && m.col === pos.col);

const pawnColors = {
  player1: { bg: "bg-red-500", ring: "ring-red-300" },
  player2: { bg: "bg-green-500", ring: "ring-green-300" },
};

type Props = { interactive?: boolean };

function DraggableWall({
  dir,
  disabled,
  onDragStateChange,
}: {
  dir: WallDir;
  disabled: boolean;
  onDragStateChange: (dragging: boolean, dir: WallDir) => void;
}) {
  const isHorizontal = dir === "h";
  const width = isHorizontal ? CELL * 2 + GAP : GAP + 2;
  const height = isHorizontal ? GAP + 2 : CELL * 2 + GAP;

  return (
    <motion.div
      drag={!disabled}
      dragSnapToOrigin
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={() => onDragStateChange(true, dir)}
      onDragEnd={() => onDragStateChange(false, dir)}
      whileDrag={{ scale: 1.05, zIndex: 1000, opacity: 0.9 }}
      className={`rounded-md bg-amber-900 shadow-md ring-1 ring-amber-950 ${
        disabled
          ? "cursor-not-allowed opacity-30"
          : "cursor-grab hover:bg-amber-800 hover:shadow-lg active:cursor-grabbing"
      }`}
      style={{ width, height, touchAction: "none" }}
    />
  );
}

function PlayerPanel({
  player,
  isCurrentTurn,
  wallsLeft,
  canDrag,
  onDragStateChange,
}: {
  player: Player;
  isCurrentTurn: boolean;
  wallsLeft: number;
  canDrag: boolean;
  onDragStateChange: (dragging: boolean, dir: WallDir) => void;
}) {
  const { game } = useGameStore();
  if (!game) return null;

  const info = game.players[player];
  const colors = pawnColors[player];

  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-xl p-4 transition ${
        isCurrentTurn
          ? "bg-amber-50 ring-2 ring-amber-300"
          : "bg-white/40"
      }`}
    >
      {/* Player icon and name */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={`h-12 w-12 rounded-full ${colors.bg} shadow-lg ring-4 ${colors.ring}`}
        />
        <div className="text-sm font-bold text-amber-900">{info.name}</div>
      </div>

      {/* Walls counter */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs font-medium uppercase tracking-wide text-amber-600">
          Walls
        </div>
        <div className="text-2xl font-bold text-amber-800">{wallsLeft}</div>
      </div>

      {/* Draggable walls */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          {/* Vertical wall */}
          <div className="flex flex-col items-center gap-1">
            <DraggableWall
              dir="v"
              disabled={!canDrag || wallsLeft === 0}
              onDragStateChange={onDragStateChange}
            />
            <span className="text-[10px] text-amber-500">V</span>
          </div>
          {/* Horizontal wall */}
          <div className="flex flex-col items-center gap-1">
            <DraggableWall
              dir="h"
              disabled={!canDrag || wallsLeft === 0}
              onDragStateChange={onDragStateChange}
            />
            <span className="text-[10px] text-amber-500">H</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Board({ interactive = true }: Props) {
  const {
    game,
    validMoves,
    movePawn,
    placeWall,
    wallPreview,
    setWallPreview,
    isMyTurn,
    mode,
  } = useGameStore();

  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingDir, setDraggingDir] = useState<WallDir | null>(null);

  const previewValid = useMemo(() => {
    if (!game || !wallPreview) return false;
    return isValidWall(game, wallPreview);
  }, [game, wallPreview]);

  const getWallFromCoords = useCallback(
    (clientX: number, clientY: number): Wall | null => {
      if (!boardRef.current || !draggingDir) return null;

      const rect = boardRef.current.getBoundingClientRect();
      const x = clientX - rect.left - TOTAL_OFFSET;
      const y = clientY - rect.top - TOTAL_OFFSET;

      const findIntersection = (coord: number) => {
        const firstIntersection = CELL;
        const spacing = CELL + GAP;
        const idx = Math.round((coord - firstIntersection) / spacing);
        return Math.max(0, Math.min(7, idx));
      };

      const wallCol = findIntersection(x);
      const wallRow = findIntersection(y);

      if (x < -20 || y < -20 || x > BOARD_PX + 20 || y > BOARD_PX + 20) {
        return null;
      }

      return { row: wallRow, col: wallCol, dir: draggingDir };
    },
    [draggingDir]
  );

  useEffect(() => {
    if (!draggingDir) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const wall = getWallFromCoords(clientX, clientY);
      setWallPreview(wall);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [draggingDir, getWallFromCoords, setWallPreview]);

  const handleDragStateChange = useCallback(
    (dragging: boolean, dir: WallDir) => {
      if (dragging) {
        setDraggingDir(dir);
      } else {
        if (game && wallPreview && previewValid && isMyTurn()) {
          placeWall(wallPreview);
          if (mode === "online") {
            sendSocket({ type: "wall", player: game.turn, wall: wallPreview });
          }
        }
        setWallPreview(null);
        setDraggingDir(null);
      }
    },
    [game, wallPreview, previewValid, placeWall, setWallPreview, isMyTurn, mode]
  );

  const handleCellClick = (pos: Position) => {
    if (!interactive || !isMyTurn() || !game) return;
    if (isMove(validMoves, pos)) {
      movePawn(pos);
      if (mode === "online") {
        sendSocket({ type: "move", player: game.turn, to: pos });
      }
    }
  };

  if (!game) return null;

  const currentTurn = game.turn;
  const p1Walls = game.players.player1.walls;
  const p2Walls = game.players.player2.walls;
  const canDragP1 = interactive && isMyTurn() && currentTurn === "player1";
  const canDragP2 = interactive && isMyTurn() && currentTurn === "player2";

  // Build grid
  const grid = [];
  for (let r = 0; r < 17; r += 1) {
    for (let c = 0; c < 17; c += 1) {
      const isCellTile = r % 2 === 0 && c % 2 === 0;
      const isIntersection = r % 2 === 1 && c % 2 === 1;

      if (isCellTile) {
        const cell: Position = { row: r / 2, col: c / 2 };
        const movable = isMove(validMoves, cell);
        grid.push(
          <button
            key={`cell-${cellKey(cell)}`}
            type="button"
            onClick={() => handleCellClick(cell)}
            className={`relative flex items-center justify-center rounded-xl transition ${
              movable && interactive ? "hover:ring-2 hover:ring-amber-300" : ""
            }`}
            style={{
              width: CELL,
              height: CELL,
              backgroundColor: "#f4a261",
            }}
          >
            {movable && (
              <motion.div
                className="absolute inset-2 rounded-lg bg-white/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </button>
        );
      } else if (isIntersection) {
        grid.push(
          <div key={`ix-${r}-${c}`} style={{ width: GAP, height: GAP }} />
        );
      } else {
        grid.push(
          <div
            key={`groove-${r}-${c}`}
            style={{
              width: c % 2 === 0 ? CELL : GAP,
              height: r % 2 === 0 ? CELL : GAP,
              backgroundColor: "#f7d1a0",
            }}
          />
        );
      }
    }
  }

  // Calculate pawn positions (absolutely positioned outside grid)
  const p1Pos = game.players.player1.pos;
  const p2Pos = game.players.player2.pos;
  const getPawnStyle = (pos: Position) => ({
    top: TOTAL_OFFSET + pos.row * (CELL + GAP) + (CELL - PAWN_SIZE) / 2,
    left: TOTAL_OFFSET + pos.col * (CELL + GAP) + (CELL - PAWN_SIZE) / 2,
  });

  // Render placed walls
  const placedWalls = game.walls.map((w) => {
    const top = TOTAL_OFFSET + w.row * (CELL + GAP) + CELL;
    const left = TOTAL_OFFSET + w.col * (CELL + GAP) + CELL;
    const isH = w.dir === "h";
    return (
      <motion.div
        key={`w-${w.dir}-${w.row}-${w.col}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute rounded-md bg-amber-900 shadow-md ring-1 ring-amber-950"
        style={{
          top: isH ? top : top - CELL - GAP / 2 + GAP / 2,
          left: isH ? left - CELL - GAP / 2 + GAP / 2 : left,
          width: isH ? CELL * 2 + GAP : GAP,
          height: isH ? GAP : CELL * 2 + GAP,
        }}
      />
    );
  });

  // Render wall preview
  const previewWall = wallPreview && (
    <motion.div
      key="preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.8 }}
      className={`pointer-events-none absolute rounded-md shadow-lg ${
        previewValid
          ? "bg-green-400 ring-2 ring-green-500"
          : "bg-red-400 ring-2 ring-red-500"
      }`}
      style={{
        top:
          wallPreview.dir === "h"
            ? TOTAL_OFFSET + wallPreview.row * (CELL + GAP) + CELL
            : TOTAL_OFFSET +
              wallPreview.row * (CELL + GAP) +
              CELL -
              CELL -
              GAP / 2 +
              GAP / 2,
        left:
          wallPreview.dir === "h"
            ? TOTAL_OFFSET +
              wallPreview.col * (CELL + GAP) +
              CELL -
              CELL -
              GAP / 2 +
              GAP / 2
            : TOTAL_OFFSET + wallPreview.col * (CELL + GAP) + CELL,
        width: wallPreview.dir === "h" ? CELL * 2 + GAP : GAP,
        height: wallPreview.dir === "h" ? GAP : CELL * 2 + GAP,
      }}
    />
  );

  return (
    <div className="flex items-center gap-6">
      {/* Player 1 panel on the left */}
      <PlayerPanel
        player="player1"
        isCurrentTurn={currentTurn === "player1"}
        wallsLeft={p1Walls}
        canDrag={canDragP1}
        onDragStateChange={handleDragStateChange}
      />

      {/* Board */}
      <div
        ref={boardRef}
        className="relative rounded-2xl border border-amber-200 bg-amber-100/60 p-3 shadow-lg"
        style={{ width: BOARD_PX + 24, height: BOARD_PX + 24 }}
      >
        <div
          className="grid rounded-xl bg-amber-200 p-1"
          style={{
            width: BOARD_PX,
            height: BOARD_PX,
            gridTemplateColumns: gridTrackSizes,
            gridTemplateRows: gridTrackSizes,
            gap: 0,
          }}
        >
          {grid}
        </div>
        {placedWalls}
        {previewWall}
        
        {/* Pawns - rendered outside grid for proper z-index during animation */}
        <motion.div
          className="pointer-events-none absolute h-10 w-10 rounded-full bg-red-500 shadow-lg ring-2 ring-red-300"
          animate={getPawnStyle(p1Pos)}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ zIndex: 100 }}
        />
        <motion.div
          className="pointer-events-none absolute h-10 w-10 rounded-full bg-green-500 shadow-lg ring-2 ring-green-300"
          animate={getPawnStyle(p2Pos)}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ zIndex: 100 }}
        />
      </div>

      {/* Player 2 panel on the right */}
      <PlayerPanel
        player="player2"
        isCurrentTurn={currentTurn === "player2"}
        wallsLeft={p2Walls}
        canDrag={canDragP2}
        onDragStateChange={handleDragStateChange}
      />
    </div>
  );
}
