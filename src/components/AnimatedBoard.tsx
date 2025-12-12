"use client";

import { useState, useEffect, useRef } from "react";
import Ghost from "./Ghost";

interface Position {
  row: number;
  col: number;
}

interface Wall {
  row: number;
  col: number;
  orientation: "horizontal" | "vertical";
}

const GRID_SIZE = 9;
const LETTERS = ["Q", "U", "O", "R", "I", "D", "O", "R"];
const GAME_LETTERS = ["G", "A", "M", "E"];

// Walls positioned to create interesting paths
const walls: Wall[] = [
  { row: 1, col: 1, orientation: "horizontal" },
  { row: 2, col: 6, orientation: "vertical" },
  { row: 5, col: 1, orientation: "vertical" },
  { row: 6, col: 5, orientation: "horizontal" },
];

// Red ghost path - moves around top and right side, avoiding letters and walls
const player1Path: Position[] = [
  { row: 0, col: 8 },
  { row: 1, col: 8 },
  { row: 2, col: 8 },
  { row: 3, col: 8 },
  { row: 3, col: 7 },
  { row: 2, col: 7 },
  { row: 1, col: 7 },
  { row: 0, col: 7 },
  { row: 0, col: 8 },
];

// Green ghost path - moves around bottom and left side, avoiding letters and walls
const player2Path: Position[] = [
  { row: 6, col: 0 },
  { row: 7, col: 0 },
  { row: 8, col: 0 },
  { row: 8, col: 1 },
  { row: 7, col: 1 },
  { row: 6, col: 1 },
  { row: 5, col: 1 },
  { row: 5, col: 0 },
  { row: 6, col: 0 },
];

const MOVE_DURATION = 500;
const TURN_INTERVAL = 800;

export default function AnimatedBoard() {
  const [player1Pos, setPlayer1Pos] = useState<Position>(player1Path[0]);
  const [player2Pos, setPlayer2Pos] = useState<Position>(player2Path[0]);
  const [player1Index, setPlayer1Index] = useState(0);
  const [player2Index, setPlayer2Index] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [player1Moving, setPlayer1Moving] = useState(false);
  const [player2Moving, setPlayer2Moving] = useState(false);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTurn === 1) {
        setPlayer1Moving(true);
        const nextIndex = (player1Index + 1) % player1Path.length;
        setPlayer1Index(nextIndex);
        setPlayer1Pos(player1Path[nextIndex]);
        
        moveTimeoutRef.current = setTimeout(() => {
          setPlayer1Moving(false);
        }, MOVE_DURATION);
        
        setCurrentTurn(2);
      } else {
        setPlayer2Moving(true);
        const nextIndex = (player2Index + 1) % player2Path.length;
        setPlayer2Index(nextIndex);
        setPlayer2Pos(player2Path[nextIndex]);
        
        moveTimeoutRef.current = setTimeout(() => {
          setPlayer2Moving(false);
        }, MOVE_DURATION);
        
        setCurrentTurn(1);
      }
    }, TURN_INTERVAL);

    return () => {
      clearInterval(interval);
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
    };
  }, [currentTurn, player1Index, player2Index]);

  const getLetterForCell = (row: number, col: number): string | null => {
    if (row === 4 && col >= 0 && col < LETTERS.length) {
      return LETTERS[col];
    }
    if (row === 5 && col >= 2 && col < 2 + GAME_LETTERS.length) {
      return GAME_LETTERS[col - 2];
    }
    return null;
  };

  const getWallStyle = (wall: Wall) => {
    const cellSize = 100 / GRID_SIZE;
    const gapSize = 0.8;
    
    if (wall.orientation === "horizontal") {
      return {
        left: `${wall.col * cellSize + gapSize}%`,
        top: `${(wall.row + 1) * cellSize - gapSize / 2}%`,
        width: `${cellSize * 2 - gapSize * 2}%`,
        height: `${gapSize * 2}%`,
        background: "linear-gradient(to bottom, #8B4513 0%, #A0522D 20%, #8B4513 40%, #6B3E0A 60%, #8B4513 80%, #A0522D 100%)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)",
        border: "1px solid #5D3A1A",
      };
    } else {
      return {
        left: `${(wall.col + 1) * cellSize - gapSize / 2}%`,
        top: `${wall.row * cellSize + gapSize}%`,
        width: `${gapSize * 2}%`,
        height: `${cellSize * 2 - gapSize * 2}%`,
        background: "linear-gradient(to right, #8B4513 0%, #A0522D 20%, #8B4513 40%, #6B3E0A 60%, #8B4513 80%, #A0522D 100%)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)",
        border: "1px solid #5D3A1A",
      };
    }
  };

  return (
    <div
      className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-4"
      style={{
        background: "linear-gradient(145deg, #8B4513 0%, #6B3E0A 30%, #5D3A1A 70%, #4A2E15 100%)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)",
        border: "3px solid #3D2510",
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-xl sm:rounded-2xl"
        style={{
          background: "#A17B45",
          boxShadow: "inset 0 3px 8px rgba(0,0,0,0.25), inset 0 -1px 2px rgba(255,255,255,0.15)",
        }}
      >
        {/* Grid container - this is where ghosts are positioned relative to */}
        <div className="relative h-full w-full p-1">
          {/* Grid cells */}
          <div className="grid h-full w-full grid-cols-9 grid-rows-9 gap-[2px] sm:gap-1">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const row = Math.floor(index / GRID_SIZE);
              const col = index % GRID_SIZE;
              const letter = getLetterForCell(row, col);

              return (
                <div
                  key={index}
                  className="flex items-center justify-center rounded-md sm:rounded-lg overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #E8C89A 0%, #DEB887 50%, #D4A574 100%)",
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.15)",
                  }}
                >
                  {letter && (
                    <span 
                      className="font-rubik select-none text-xl sm:text-2xl md:text-3xl animate-wobble-float"
                      style={{
                        color: "#3D2510",
                        textShadow: "1px 1px 2px rgba(255,255,255,0.3)",
                        animationDelay: `${index * 150}ms`
                      }}
                    >
                      {letter}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Walls */}
          {walls.map((wall, index) => (
            <div
              key={`wall-${index}`}
              className="absolute rounded-sm"
              style={getWallStyle(wall)}
            />
          ))}

          {/* Player 1 (Red Ghost) */}
          <div
            className="absolute transition-all duration-500 ease-in-out flex items-center justify-center pointer-events-none"
            style={{
              left: `${(player1Pos.col / GRID_SIZE) * 100}%`,
              top: `${(player1Pos.row / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              zIndex: 100,
            }}
          >
            <Ghost color="red" isMoving={player1Moving} />
          </div>

          {/* Player 2 (Green Ghost) */}
          <div
            className="absolute transition-all duration-500 ease-in-out flex items-center justify-center pointer-events-none"
            style={{
              left: `${(player2Pos.col / GRID_SIZE) * 100}%`,
              top: `${(player2Pos.row / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              zIndex: 100,
            }}
          >
            <Ghost color="green" isMoving={player2Moving} />
          </div>
        </div>
      </div>
    </div>
  );
}
