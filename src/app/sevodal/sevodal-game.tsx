'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_WORD_LENGTH, WORD_LISTS } from "./word-lists";

const ROWS = 7;
const LENGTH_OPTIONS = [3, 4, 5, 6, 7] as const;

const getWordList = (length: number) =>
  WORD_LISTS[length] ?? WORD_LISTS[DEFAULT_WORD_LENGTH];

const getRandomWord = (length: number) => {
  const list = getWordList(length);
  return list[Math.floor(Math.random() * list.length)] ?? "dislike";
};

const createEmptyBoard = (cols: number) =>
  Array.from({ length: ROWS }, () => Array(cols).fill(""));

const createEmptyStatusGrid = (cols: number): Status[][] =>
  Array.from({ length: ROWS }, () => Array(cols).fill(""));

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

const statusToEmoji = (status: Status) => {
  switch (status) {
    case "correct":
      return "🟩";
    case "present":
      return "🟨";
    case "absent":
    default:
      return "◻️";
  }
};

export default function SevodalGame() {
  const [wordLength, setWordLength] = useState(DEFAULT_WORD_LENGTH);
  const [solution, setSolution] = useState(() =>
    getRandomWord(DEFAULT_WORD_LENGTH)
  );
  const [board, setBoard] = useState<string[][]>(() =>
    createEmptyBoard(DEFAULT_WORD_LENGTH)
  );
  const [statuses, setStatuses] = useState<Status[][]>(() =>
    createEmptyStatusGrid(DEFAULT_WORD_LENGTH)
  );
  const [activeRow, setActiveRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [awaitingSelection, setAwaitingSelection] = useState(true);
  const [shakingRow, setShakingRow] = useState<number | null>(null);
  const [didWin, setDidWin] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shakeTimeoutRef = useRef<number | null>(null);

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

  const startGame = useCallback(
    (length: number) => {
      setWordLength(length);
      setSolution(getRandomWord(length));
      setBoard(createEmptyBoard(length));
      setStatuses(createEmptyStatusGrid(length));
      setActiveRow(0);
      setCurrentCol(0);
      setToast(null);
      setGameOver(false);
      setShakingRow(null);
      setDidWin(false);
      setShareMessage(null);
      setAwaitingSelection(false);
      focusInput();
    },
    [focusInput]
  );

  const evaluateGuess = useCallback(() => {
    const guess = board[activeRow].join("");
    const wordList = getWordList(wordLength);

    if (!wordList.includes(guess)) {
      setToast("word not in list");
      setShakingRow(activeRow);
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
      shakeTimeoutRef.current = window.setTimeout(() => {
        setShakingRow(null);
      }, 500);
      return;
    }

    const newStatuses: Status[][] = statuses.map((row) => [...row]);

    for (let i = 0; i < wordLength; i++) {
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
    setShakingRow(null);

    if (guess === solution) {
      setToast("congrats");
      setDidWin(true);
      setShareMessage(null);
      setGameOver(true);
      return;
    }

    if (activeRow === ROWS - 1) {
      setToast("better luck next time");
      setDidWin(false);
      setShareMessage(null);
      setGameOver(true);
      return;
    }

    setActiveRow((r) => r + 1);
    setCurrentCol(0);
  }, [activeRow, board, solution, statuses, wordLength]);

  const handleLetter = useCallback(
    (letter: string) => {
      if (gameOver || currentCol >= wordLength) return;
      setBoard((prev) => {
        const next = prev.map((row) => [...row]);
        next[activeRow][currentCol] = letter;
        return next;
      });
      setCurrentCol((c) => c + 1);
    },
    [activeRow, currentCol, gameOver, wordLength]
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
    if (gameOver || currentCol !== wordLength) return;
    evaluateGuess();
  }, [currentCol, evaluateGuess, gameOver, wordLength]);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver || awaitingSelection) return;

      if (key === "Enter") {
        handleSubmit();
        return;
      }

      if (key === "Backspace") {
        handleBackspace();
        return;
      }

      if (/^[a-zA-Z]$/.test(key) && currentCol < wordLength) {
        handleLetter(key.toLowerCase());
      }
    },
    [
      awaitingSelection,
      currentCol,
      gameOver,
      handleBackspace,
      handleLetter,
      handleSubmit,
      wordLength,
    ]
  );

  useEffect(() => {
    if (awaitingSelection) return;
    // surface solution in console for quick debugging when a game starts
    // eslint-disable-next-line no-console
    console.log("Sevodal solution:", solution);
  }, [awaitingSelection, solution]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timeout = window.setTimeout(() => setToast(null), 3000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [toast]);

  const renderLengthPicker = (title: string, subtitle?: string) => (
    <div className="space-y-3 text-center">
      <div>
        <p className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-300">
          {title}
        </p>
        {subtitle ? (
          <p className="text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {LENGTH_OPTIONS.map((length) => (
          <button
            key={length}
            className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-100 transition hover:border-sky-400/70 hover:text-white"
            onClick={() => startGame(length)}
            type="button"
          >
            {length} letters
          </button>
        ))}
      </div>
    </div>
  );

  const gameInstructions = awaitingSelection
    ? "pick a length to begin."
    : `guess the secret ${wordLength}-letter word in seven tries. press enter to submit and backspace to delete.`;

  const buildShareText = useCallback(() => {
    const rows = statuses
      .slice(0, activeRow + 1)
      .map((row) =>
        row
          .slice(0, wordLength)
          .map((status) => statusToEmoji(status))
          .join("")
      )
      .join("\n");
    return `${wordLength} ethanhicks.com/sevodal\n${rows}`;
  }, [activeRow, statuses, wordLength]);

  const handleShare = useCallback(async () => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(buildShareText());
      setShareMessage("Copied to clipboard—go flex on your friends!");
    } catch (error) {
      setShareMessage("Unable to copy. Try again?");
    }
  }, [buildShareText]);

  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex flex-col items-center justify-center text-white gap-8 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-white text-4xl font-semibold">sevodal</h1>
        <p className="text-sm text-gray-300">{gameInstructions}</p>
      </div>

      {awaitingSelection ? (
        renderLengthPicker(
          "Choose your challenge",
          "Pick a word length to start playing"
        )
      ) : (
        <>
          <input
            ref={inputRef}
            aria-hidden
            className="absolute h-0 w-0 opacity-0"
            onBlur={focusInput}
            onKeyDown={(e) => {
              const isShortcut = e.metaKey || e.ctrlKey || e.altKey;
              const isLetter = /^[a-zA-Z]$/.test(e.key);
              const isGameKey =
                e.key === "Enter" || e.key === "Backspace" || isLetter;

              if (!isShortcut && isGameKey) {
                e.preventDefault();
                handleKey(e.key);
              }
            }}
            type="text"
          />

          <div className="grid gap-2" onClick={focusInput} role="presentation">
            {board.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`flex gap-2 justify-center ${
                  shakingRow === rowIndex ? "sevodal-shake" : ""
                }`}
              >
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
            <div className="px-4 py-2 rounded bg-gray-800 text-sm uppercase tracking-wide text-center">
              {toast}
            </div>
          ) : null}

          {gameOver ? (
            <div className="flex flex-col items-center gap-4">
              {renderLengthPicker("Play again?", "Choose your next word length")}
              {didWin ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    className="rounded-xl border border-sky-400/60 bg-sky-600 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:bg-sky-500"
                    onClick={handleShare}
                    type="button"
                  >
                    copy game and show friends
                  </button>
                  {shareMessage ? (
                    <p className="text-xs text-slate-300">{shareMessage}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {keyboardRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-2">
                {row.map((key) => {
                  const label =
                    key === "enter" ? "enter" : key === "backspace" ? "⌫" : key;
                  const widthClass =
                    key === "enter" || key === "backspace" ? "px-4" : "px-3";
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
        </>
      )}
    </main>
  );
}
