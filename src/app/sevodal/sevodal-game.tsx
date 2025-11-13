'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WORD_LIST = [
  "ability",
  "balance",
  "battery",
  "between",
  "blanket",
  "cabinet",
  "capital",
  "capture",
  "careful",
  "certain",
  "channel",
  "charity",
  "college",
  "combine",
  "company",
  "compare",
  "compete",
  "complex",
  "concept",
  "confirm",
  "connect",
  "contact",
  "contain",
  "content",
  "control",
  "convert",
  "correct",
  "country",
  "courage",
  "cousins",
  "crafted",
  "culture",
  "current",
  "dancing",
  "dealers",
  "decades",
  "decline",
  "defense",
  "deliver",
  "density",
  "deposit",
  "desktop",
  "develop",
  "digital",
  "discuss",
  "display",
  "distant",
  "diverse",
  "drawing",
  "dynamic",
  "economy",
  "edition",
  "element",
  "embrace",
  "emotion",
  "engaged",
  "enhance",
  "enjoyed",
  "entered",
  "episode",
  "essence",
  "evening",
  "example",
  "excited",
  "expense",
  "explore",
  "express",
  "factory",
  "farming",
  "fashion",
  "feature",
  "federal",
  "feeling",
  "finally",
  "fitness",
  "flowers",
  "focused",
  "fortune",
  "freedom",
  "friends",
  "gallery",
  "general",
  "genuine",
  "greater",
  "harmony",
  "healthy",
  "helpful",
  "history",
  "holiday",
  "housing",
  "imagine",
  "improve",
  "include",
  "indoors",
  "journey",
  "justice",
  "kitchen",
  "landing",
  "largely",
  "learned",
];
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
  const [solution] = useState(
    () => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)] ?? "dislike"
  );
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
  const inputRef = useRef<HTMLInputElement>(null);

  const keyboardRows = useMemo(
    () => [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
    ],
    []
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const evaluateGuess = useCallback(() => {
    const guess = board[activeRow].join("");
    const newStatuses: Status[][] = statuses.map((row) => [...row]);

    for (let i = 0; i < COLS; i++) {
      const letter = guess[i];
      if (letter === solution[i]) {
        newStatuses[activeRow][i] = "correct";
      } else if (solution.includes(letter)) {
        newStatuses[activeRow][i] = "present";
      } else {
        newStatuses[activeRow][i] = "absent";
      }
    }

    setStatuses(newStatuses);

    if (guess === solution) {
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
  }, [activeRow, board, solution, statuses]);

  const handleLetter = useCallback(
    (letter: string) => {
      if (gameOver || currentCol >= COLS) return;
      setBoard((prev) => {
        const next = prev.map((row) => [...row]);
        next[activeRow][currentCol] = letter;
        return next;
      });
      setCurrentCol((c) => c + 1);
    },
    [activeRow, currentCol, gameOver]
  );

  const handleBackspace = useCallback(() => {
    if (gameOver || currentCol === 0) return;
    setBoard((prev) => {
      const next = prev.map((row) => [...row]);
      next[activeRow][currentCol - 1] = "";
      return next;
    });
    setCurrentCol((c) => c - 1);
  }, [activeRow, currentCol, gameOver]);

  const handleSubmit = useCallback(() => {
    if (gameOver || currentCol !== COLS) return;
    evaluateGuess();
  }, [currentCol, evaluateGuess, gameOver]);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver) return;

      if (key === "Enter") {
        handleSubmit();
        return;
      }

      if (key === "Backspace") {
        handleBackspace();
        return;
      }

      if (/^[a-zA-Z]$/.test(key) && currentCol < COLS) {
        handleLetter(key.toLowerCase());
      }
    },
    [currentCol, gameOver, handleBackspace, handleLetter, handleSubmit]
  );

  useEffect(() => {
    // surface solution in console for quick debugging when page loads
    // eslint-disable-next-line no-console
    console.log("Sevodal solution:", solution);
  }, [solution]);

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

      <input
        ref={inputRef}
        aria-hidden
        className="absolute h-0 w-0 opacity-0"
        onBlur={focusInput}
        onKeyDown={(e) => {
          e.preventDefault();
          handleKey(e.key);
        }}
        type="text"
      />

      <div className="grid gap-2" onClick={focusInput} role="presentation">
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

      <div className="flex flex-col gap-2">
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((key) => {
              const label =
                key === "enter" ? "enter" : key === "backspace" ? "⌫" : key;
              const widthClass =
                key === "enter" || key === "backspace"
                  ? "px-4"
                  : "px-3";
              return (
                <button
                  key={key}
                  className={`bg-gray-700 text-white uppercase text-sm py-3 rounded ${widthClass}`}
                  onClick={() => {
                    if (key === "enter") {
                      handleKey("Enter");
                    } else if (key === "backspace") {
                      handleKey("Backspace");
                    } else {
                      handleKey(key);
                    }
                    focusInput();
                  }}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}
