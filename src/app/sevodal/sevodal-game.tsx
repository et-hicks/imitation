'use client';

import { useCallback, useEffect, useState } from "react";

const WORD = "dislike";
const ROWS = 7;
const COLS = 7;

type Status = "" | "correct" | "present" | "absent";

const statusClass = (status: Status) => {
  switch (status) {
    case "correct":
      return "bg-green-500 text-white";
    case "present":
      return "bg-yellow-500 text-white";
    case "absent":
      return "bg-gray-500 text-white";
    default:
      return "bg-transparent";
  }
};

export default function SevodalGame() {
  const [board, setBoard] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [statuses, setStatuses] = useState<Status[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [activeRow, setActiveRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const evaluateGuess = useCallback(() => {
    const guess = board[activeRow].join("");
    const newStatuses: Status[][] = statuses.map((row) => [...row]);

    for (let i = 0; i < COLS; i++) {
      const letter = guess[i];
      if (letter === WORD[i]) {
        newStatuses[activeRow][i] = "correct";
      } else if (WORD.includes(letter)) {
        newStatuses[activeRow][i] = "present";
      } else {
        newStatuses[activeRow][i] = "absent";
      }
    }

    setStatuses(newStatuses);

    if (guess === WORD) {
      setToast("congrats");
      setGameOver(true);
      return;
    }

    if (activeRow === ROWS - 1) {
      setToast("better luck next time");
      setGameOver(true);
      return;
    }

    setActiveRow((r) => r + 1);
    setCurrentCol(0);
  }, [activeRow, board, statuses]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;

      if (e.key === "Enter") {
        if (currentCol === COLS) {
          evaluateGuess();
        }
        return;
      }

      if (e.key === "Backspace") {
        if (currentCol > 0) {
          setBoard((prev) => {
            const next = prev.map((row) => [...row]);
            next[activeRow][currentCol - 1] = "";
            return next;
          });
          setCurrentCol((c) => c - 1);
        }
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        if (currentCol < COLS) {
          const letter = e.key.toLowerCase();
          setBoard((prev) => {
            const next = prev.map((row) => [...row]);
            next[activeRow][currentCol] = letter;
            return next;
          });
          setCurrentCol((c) => c + 1);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeRow, currentCol, evaluateGuess, gameOver]);

  useEffect(() => {
    if (toast) {
      const timeout = window.setTimeout(() => setToast(null), 3000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [toast]);

  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex flex-col items-center justify-center text-white gap-8 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-white text-4xl font-semibold">sevodal</h1>
        <p className="text-sm text-gray-300">
          guess the secret word in seven tries. press enter to submit and
          backspace to delete.
        </p>
      </div>

      <div className="grid gap-2">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 justify-center">
            {row.map((letter, colIndex) => (
              <div
                key={colIndex}
                className={`w-12 h-12 border-2 border-gray-700 flex items-center justify-center text-2xl uppercase ${statusClass(
                  statuses[rowIndex][colIndex]
                )}`}
              >
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {toast ? (
        <div className="px-4 py-2 rounded bg-gray-800 text-sm uppercase tracking-wide">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
