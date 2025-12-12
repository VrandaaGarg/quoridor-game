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
import { Position, Wall, WallDir, Player } from "@/types";
import { isValidWall } from "@/lib/game";
import { sendSocket } from "@/lib/socket";
import Ghost from "./Ghost";

const GRID_SIZE = 9;
const CELL_PERCENT = 100 / GRID_SIZE;
const GAP_PERCENT = 0.8;

const cellKey = (pos: Position) => `${pos.row}-${pos.col}`;

const isMove = (moves: Position[], pos: Position) =>
  moves.some((m) => m.row === pos.row && m.col === pos.col);

type Props = { interactive?: boolean };

function DraggableWall({
  dir,
  disabled,
  onDragStateChange,
  compact = false,
}: {
  dir: WallDir;
  disabled: boolean;
  onDragStateChange: (dragging: boolean, dir: WallDir) => void;
  compact?: boolean;
}) {
  const isHorizontal = dir === "h";
  const width = isHorizontal ? (compact ? 50 : 80) : (compact ? 10 : 14);
  const height = isHorizontal ? (compact ? 10 : 14) : (compact ? 50 : 80);

  return (
    <motion.div
      drag={!disabled}
      dragSnapToOrigin
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={() => onDragStateChange(true, dir)}
      onDragEnd={() => onDragStateChange(false, dir)}
      whileDrag={{ scale: 1.05, zIndex: 1000, opacity: 0.9 }}
      className={`rounded-sm overflow-hidden ${
        disabled
          ? "cursor-not-allowed opacity-30"
          : "cursor-grab hover:brightness-110 hover:shadow-lg active:cursor-grabbing"
      }`}
      style={{
        width,
        height,
        touchAction: "none",
        background: isHorizontal
          ? "linear-linear(to bottom, #8B4513 0%, #A0522D 20%, #8B4513 40%, #6B3E0A 60%, #8B4513 80%, #A0522D 100%)"
          : "linear-linear(to right, #8B4513 0%, #A0522D 20%, #8B4513 40%, #6B3E0A 60%, #8B4513 80%, #A0522D 100%)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)",
        border: "1px solid #5D3A1A",
      }}
    />
  );
}

function PlayerPanel({
  player,
  isCurrentTurn,
  wallsLeft,
  canDrag,
  onDragStateChange,
  compact = false,
}: {
  player: Player;
  isCurrentTurn: boolean;
  wallsLeft: number;
  canDrag: boolean;
  onDragStateChange: (dragging: boolean, dir: WallDir) => void;
  compact?: boolean;
}) {
  const { game } = useGameStore();
  if (!game) return null;

  const info = game.players[player];

  if (compact) {
    return (
      <div
        className="flex mt-4 flex-col items-center gap-2 rounded-xl p-2 transition min-w-[100px]"
        style={{
          background: isCurrentTurn ? "C9986B" : "# #DEB887",
          boxShadow: isCurrentTurn
            ? "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)"
            : "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)",
          border: isCurrentTurn ? "2px solid #A0522D" : "2px solid #8B4513",
          opacity:isCurrentTurn ? 1 : 0.6,
        }}
      >
        {/* Compact: Avatar + Name */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ${
              player === "player1" ? "bg-white" : "bg-white"
            }`}
            style={{
              border: "2px solid #5D3A1A",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            <div className="relative top-2" style={{ scale: "1.2" }}>
              <Ghost color={player === "player1" ? "red" : "green"} isMoving={false} />
            </div>
          </div>
          <div className="text-[10px] font-bold truncate max-w-20" style={{ color: "#3D2510" }}>{info.name}</div>
        </div>

        {/* Compact: Walls counter */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-medium uppercase" style={{ color: "#5D3A1A" }}>Walls:</span>
          <span className="text-sm font-bold" style={{ color: "#3D2510" }}>{wallsLeft}</span>
        </div>

        {/* Compact: Draggable walls in a row */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <DraggableWall
              dir="v"
              disabled={!canDrag || wallsLeft === 0}
              onDragStateChange={onDragStateChange}
              compact
            />
            <span className="text-[8px]" style={{ color: "#6B3E0A" }}>V</span>
          </div>
          <div className="flex flex-col items-center">
            <DraggableWall
              dir="h"
              disabled={!canDrag || wallsLeft === 0}
              onDragStateChange={onDragStateChange}
              compact
            />
            <span className="text-[8px]" style={{ color: "#6B3E0A" }}>H</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl px-7 p-4 transition"
      style={{
        background: isCurrentTurn
          ? "linear-linear(145deg, #C9986B 0%, #BC8B5E 100%) "
          : "linear-linear(145deg, #DEB887 0%, #D2A679 100%)",
        boxShadow: isCurrentTurn
          ? "0 6px 20px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.25)"
          : "0 4px 12px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.15)",
        border: isCurrentTurn ? "3px solid #A0522D" : "3px solid #8B4513",
        opacity:isCurrentTurn ? 1 : 0.6,
      }}
    >
      {/* Player icon and name */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={`relative flex h-20 w-20 lg:h-24 lg:w-24 items-center justify-center overflow-hidden rounded-full ${
            player === "player1" ? "bg-white" : "bg-white"
          }`}
          style={{
            border: "3px solid #5D3A1A",
            boxShadow: "inset 0 3px 6px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          <div className="relative top-3 lg:top-4" style={{ scale: "2.2" }}>
            <Ghost color={player === "player1" ? "red" : "green"} isMoving={false} />
          </div>
        </div>
        <div className="text-sm font-bold" style={{ color: "#3D2510" }}>{info.name}</div>
      </div>

      {/* Walls counter */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "#5D3A1A" }}>
          Walls
        </div>
        <div className="text-2xl font-bold" style={{ color: "#3D2510" }}>{wallsLeft}</div>
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
            <span className="text-[10px]" style={{ color: "#6B3E0A" }}>V</span>
          </div>
          {/* Horizontal wall */}
          <div className="flex flex-col items-center gap-1">
            <DraggableWall
              dir="h"
              disabled={!canDrag || wallsLeft === 0}
              onDragStateChange={onDragStateChange}
            />
            <span className="text-[10px]" style={{ color: "#6B3E0A" }}>H</span>
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
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current) {
        setBoardSize(boardRef.current.offsetWidth);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const previewValid = useMemo(() => {
    if (!game || !wallPreview) return false;
    return isValidWall(game, wallPreview);
  }, [game, wallPreview]);

  const getWallFromCoords = useCallback(
    (clientX: number, clientY: number): Wall | null => {
      if (!boardRef.current || !draggingDir || boardSize === 0) return null;

      const rect = boardRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const cellSize = boardSize / GRID_SIZE;
      
      const findIntersection = (coord: number) => {
        const idx = Math.round(coord / cellSize) - 1;
        return Math.max(0, Math.min(7, idx));
      };

      const wallCol = findIntersection(x);
      const wallRow = findIntersection(y);

      if (x < -20 || y < -20 || x > boardSize + 20 || y > boardSize + 20) {
        return null;
      }

      return { row: wallRow, col: wallCol, dir: draggingDir };
    },
    [draggingDir, boardSize]
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

  const getWallStyle = (w: Wall) => {
    const isH = w.dir === "h";
    if (isH) {
      return {
        left: `${w.col * CELL_PERCENT + GAP_PERCENT}%`,
        top: `${(w.row + 1) * CELL_PERCENT - GAP_PERCENT / 2}%`,
        width: `${CELL_PERCENT * 2 - GAP_PERCENT * 2}%`,
        height: `${GAP_PERCENT * 2}%`,
      };
    } else {
      return {
        left: `${(w.col + 1) * CELL_PERCENT - GAP_PERCENT / 2}%`,
        top: `${w.row * CELL_PERCENT + GAP_PERCENT}%`,
        width: `${GAP_PERCENT * 2}%`,
        height: `${CELL_PERCENT * 2 - GAP_PERCENT * 2}%`,
      };
    }
  };

  if (!game) return null;

  const currentTurn = game.turn;
  const p1Walls = game.players.player1.walls;
  const p2Walls = game.players.player2.walls;
  const canDragP1 = interactive && isMyTurn() && currentTurn === "player1";
  const canDragP2 = interactive && isMyTurn() && currentTurn === "player2";

  const p1Pos = game.players.player1.pos;
  const p2Pos = game.players.player2.pos;

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
      {/* Desktop: Player1 | Board | Player2 in row */}
      {/* Mobile: Board on top, Players below */}
      
      <div className="flex flex-col items-center gap-4 sm:gap-8 lg:flex-row lg:items-center w-full justify-center">
        {/* Player 1 - hidden on mobile, shown on desktop left */}
        <div className="hidden lg:block">
          <PlayerPanel
            player="player1"
            isCurrentTurn={currentTurn === "player1"}
            wallsLeft={p1Walls}
            canDrag={canDragP1}
            onDragStateChange={handleDragStateChange}
          />
        </div>

        {/* Board - Responsive with wooden 3D appearance */}
        <div
          ref={boardRef}
          className="relative aspect-square w-full max-w-[min(90vw,500px)] overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-4"
          style={{
            background: "linear-linear(145deg, #8B4513 0%, #6B3E0A 30%, #5D3A1A 70%, #4A2E15 100%)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)",
            border: "3px solid #3D2510",
          }}
        >
          {/* Inner wooden surface */}
          <div
            className="relative h-full w-full overflow-hidden rounded-xl sm:rounded-2xl p-1.5 sm:p-2"
            style={{
              background: "#A87B34",
              boxShadow: "inset 0 3px 8px rgba(0,0,0,0.25), inset 0 -1px 2px rgba(255,255,255,0.15)",
            }}
          >
            {/* Grid cells */}
            <div className="grid h-full w-full grid-cols-9 grid-rows-9 gap-0.5 sm:gap-1">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const row = Math.floor(index / GRID_SIZE);
                const col = index % GRID_SIZE;
                const pos: Position = { row, col };
                const movable = isMove(validMoves, pos);

                return (
                  <button
                    key={`cell-${cellKey(pos)}`}
                    type="button"
                    onClick={() => handleCellClick(pos)}
                    className={`relative flex cursor-pointer items-center justify-center rounded-md sm:rounded-lg transition ${
                      movable && interactive ? "hover:ring-2 hover:ring-amber-400" : ""
                    }`}
                    style={{
                      background: "linear-linear(145deg, #E8C89A 0%, #DEB887 50%, #D4A574 100%)",
                      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.15)",
                    }}
                  >
                    {movable && (
                      <motion.div
                        className="absolute inset-1 sm:inset-2 rounded-md sm:rounded-lg"
                        style={{
                          background: "rgba(255, 255, 255, 0.5)",
                          boxShadow: "0 0 8px rgba(255, 215, 0, 0.4)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Placed walls */}
            {game.walls.map((w) => {
              const isH = w.dir === "h";
              return (
                <motion.div
                  key={`w-${w.dir}-${w.row}-${w.col}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute rounded-sm overflow-hidden"
                  style={{
                    ...getWallStyle(w),
                    background: isH
                      ? "linear-linear(to bottom, #8B4513 0%, #A0522D 20%, #8B4513 40%, #6B3E0A 60%, #8B4513 80%, #A0522D 100%)"
                      : "linear-linear(to right, #8B4513 0%, #A0522D 20%, #8B4513 40%, #6B3E0A 60%, #8B4513 80%, #A0522D 100%)",
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)",
                    border: "1px solid #5D3A1A",
                  }}
                />
              );
            })}

            {/* Wall preview */}
            {wallPreview && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: previewValid ? 0.75 : 0.8 }}
                className="pointer-events-none absolute rounded-sm overflow-hidden"
                style={{
                  ...getWallStyle(wallPreview),
                  background: previewValid
                    ? wallPreview.dir === "h"
                      ? "linear-linear(to bottom, #5D3A1A 0%, #6B3E0A 20%, #5D3A1A 40%, #4A2E15 60%, #5D3A1A 80%, #6B3E0A 100%)"
                      : "linear-linear(to right, #5D3A1A 0%, #6B3E0A 20%, #5D3A1A 40%, #4A2E15 60%, #5D3A1A 80%, #6B3E0A 100%)"
                    : "#ef4444",
                  boxShadow: previewValid
                    ? "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.4)"
                    : "0 0 8px rgba(239, 68, 68, 0.5)",
                  border: previewValid ? "1px solid #3D2510" : "2px solid #dc2626",
                }}
              />
            )}

            {/* Player 1 (Red Ghost) */}
            <motion.div
              className="absolute flex items-center justify-center pointer-events-none"
              animate={{
                left: `${(p1Pos.col / GRID_SIZE) * 100}%`,
                top: `${(p1Pos.row / GRID_SIZE) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                width: `${CELL_PERCENT}%`,
                height: `${CELL_PERCENT}%`,
                zIndex: 100,
              }}
            >
              <Ghost color="red" isMoving={currentTurn === "player1"} />
            </motion.div>

            {/* Player 2 (Green Ghost) */}
            <motion.div
              className="absolute flex items-center justify-center pointer-events-none"
              animate={{
                left: `${(p2Pos.col / GRID_SIZE) * 100}%`,
                top: `${(p2Pos.row / GRID_SIZE) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                width: `${CELL_PERCENT}%`,
                height: `${CELL_PERCENT}%`,
                zIndex: 100,
              }}
            >
              <Ghost color="green" isMoving={currentTurn === "player2"} />
            </motion.div>
          </div>
        </div>

        {/* Player 2 - hidden on mobile, shown on desktop right */}
        <div className="hidden lg:block">
          <PlayerPanel
            player="player2"
            isCurrentTurn={currentTurn === "player2"}
            wallsLeft={p2Walls}
            canDrag={canDragP2}
            onDragStateChange={handleDragStateChange}
          />
        </div>
      </div>

      {/* Mobile: Player panels below the board - compact version */}
      <div className="flex items-start justify-between w-full max-w-[min(90vw,500px)] lg:hidden">
        <PlayerPanel
          player="player1"
          isCurrentTurn={currentTurn === "player1"}
          wallsLeft={p1Walls}
          canDrag={canDragP1}
          onDragStateChange={handleDragStateChange}
          compact
        />
        <PlayerPanel
          player="player2"
          isCurrentTurn={currentTurn === "player2"}
          wallsLeft={p2Walls}
          canDrag={canDragP2}
          onDragStateChange={handleDragStateChange}
          compact
        />
      </div>
    </div>
  );
}
