"use client";

import { useState, useEffect } from "react";
import type { Guess } from "./game-types";

export function getColor(colIdx: number, rowIdx: number): string {
  const x = (colIdx - 14.5) / 14.5;
  const y = (rowIdx - 7.5) / 7.5;

  const dist = Math.min(1, Math.sqrt(x * x + y * y));

  const wBlue = Math.max(0, -x);
  const wYellow = Math.max(0, x);
  const wGreen = Math.max(0, -y);
  const wRed = Math.max(0, y);

  const blue = [0, 0, 255];
  const yellow = [255, 255, 0];
  const green = [0, 200, 0];
  const red = [255, 0, 0];
  const white = [255, 255, 255];

  const dirTotal = wBlue + wYellow + wGreen + wRed || 1;
  const dirR =
    (wBlue * blue[0] + wYellow * yellow[0] + wGreen * green[0] + wRed * red[0]) / dirTotal;
  const dirG =
    (wBlue * blue[1] + wYellow * yellow[1] + wGreen * green[1] + wRed * red[1]) / dirTotal;
  const dirB =
    (wBlue * blue[2] + wYellow * yellow[2] + wGreen * green[2] + wRed * red[2]) / dirTotal;

  const t = Math.pow(dist, 0.8);
  const r = Math.round(white[0] * (1 - t) + dirR * t);
  const g = Math.round(white[1] * (1 - t) + dirG * t);
  const b = Math.round(white[2] * (1 - t) + dirB * t);

  return `rgb(${r}, ${g}, ${b})`;
}

const ROWS = "abcdefghijklmnop".split("");
const COLS = Array.from({ length: 30 }, (_, i) => i + 1);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

interface ColorGridBoardProps {
  onCellClick?: (row: string, col: number) => void;
  guesses?: Guess[];
  targetCell?: { row: string; col: number } | null;
  showTarget?: boolean;
  disabled?: boolean;
}

function Cell({
  row,
  col,
  colIdx,
  rowIdx,
  guess,
  isTarget,
  disabled,
  onCellClick,
}: {
  row: string;
  col: number;
  colIdx: number;
  rowIdx: number;
  guess: Guess | undefined;
  isTarget: boolean;
  disabled: boolean;
  onCellClick?: (row: string, col: number) => void;
}) {
  const color = getColor(colIdx, rowIdx);
  return (
    <td className="p-0.5">
      <div
        className={`relative w-7 h-7 rounded-sm transition-all duration-150 ${
          disabled ? "cursor-default" : "cursor-pointer hover:scale-125"
        } ${isTarget ? "ring-2 ring-white ring-offset-1 ring-offset-gray-950" : ""}`}
        style={{ backgroundColor: color }}
        title={`${row}${col}`}
        onClick={() => {
          if (!disabled && onCellClick) onCellClick(row, col);
        }}
      >
        {guess && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-5 h-5 rounded-full bg-gray-950/70 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
              {guess.guessNumber}
            </span>
          </div>
        )}
        {isTarget && !guess && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-white/90" />
          </div>
        )}
      </div>
    </td>
  );
}

export default function ColorGridBoard({
  onCellClick,
  guesses = [],
  targetCell,
  showTarget = false,
  disabled = false,
}: ColorGridBoardProps) {
  const isMobile = useIsMobile();

  // Mobile: transpose — columns (1-30) become rows, letter rows become columns
  if (isMobile) {
    return (
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-7 h-7" />
            {ROWS.map((row) => (
              <th
                key={row}
                className="w-7 h-7 text-center text-[10px] font-mono text-gray-400"
              >
                {row}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COLS.map((col, colIdx) => (
            <tr key={col}>
              <td className="w-7 h-7 text-center text-[10px] font-mono text-gray-400 pr-0.5">
                {col}
              </td>
              {ROWS.map((row, rowIdx) => (
                <Cell
                  key={`${row}${col}`}
                  row={row}
                  col={col}
                  colIdx={colIdx}
                  rowIdx={rowIdx}
                  guess={guesses.find((g) => g.row === row && g.col === col)}
                  isTarget={showTarget && targetCell?.row === row && targetCell?.col === col}
                  disabled={disabled}
                  onCellClick={onCellClick}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Desktop: default landscape layout
  return (
    <table className="border-collapse">
      <thead>
        <tr>
          <th className="w-8 h-8" />
          {COLS.map((col) => (
            <th
              key={col}
              className="w-8 h-8 text-center text-xs font-mono text-gray-400"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row, rowIdx) => (
          <tr key={row}>
            <td className="w-8 h-8 text-center text-xs font-mono text-gray-400 pr-1">
              {row}
            </td>
            {COLS.map((col, colIdx) => (
              <Cell
                key={`${row}${col}`}
                row={row}
                col={col}
                colIdx={colIdx}
                rowIdx={rowIdx}
                guess={guesses.find((g) => g.row === row && g.col === col)}
                isTarget={showTarget && targetCell?.row === row && targetCell?.col === col}
                disabled={disabled}
                onCellClick={onCellClick}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
