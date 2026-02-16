'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BACKEND_URL } from "@/lib/env";

import { DEFAULT_WORD_LENGTH, WORD_LISTS } from "./word-lists";

type SevodalStat = {
  word_length: number;
  total_games: number;
  wins: number;
  avg_guesses: string | null;
};

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
  const { session } = useAuth();
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
  const [stats, setStats] = useState<SevodalStat[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const shakeTimeoutRef = useRef<number | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/sevodal`);
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const saveGameResult = useCallback(async (
    wl: number, sol: string, guessBoard: string[][], statusGrid: Status[][], won: boolean, guessCount: number
  ) => {
    if (!session?.access_token) return;
    try {
      await fetch(`${BACKEND_URL}/sevodal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word_length: wl,
          solution: sol,
          guesses: guessBoard.slice(0, guessCount).map(r => r.join("")),
          statuses: statusGrid.slice(0, guessCount),
          did_win: won,
          num_guesses: guessCount,
        }),
      });
      fetchStats();
    } catch { /* ignore */ }
  }, [session?.access_token, fetchStats]);

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
    const remainingCounts: Record<string, number> = {};

    for (let i = 0; i < wordLength; i++) {
      const solutionLetter = solution[i];
      remainingCounts[solutionLetter] = (remainingCounts[solutionLetter] ?? 0) + 1;
    }

    // First pass: mark exact matches
    for (let i = 0; i < wordLength; i++) {
      const letter = guess[i];
      if (letter === solution[i]) {
        newStatuses[activeRow][i] = "correct";
        remainingCounts[letter] -= 1;
      }
    }

    // Second pass: mark present/absent using remaining counts
    for (let i = 0; i < wordLength; i++) {
      if (newStatuses[activeRow][i] === "correct") continue;
      const letter = guess[i];
      if (remainingCounts[letter] > 0) {
        newStatuses[activeRow][i] = "present";
        remainingCounts[letter] -= 1;
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
      saveGameResult(wordLength, solution, board, newStatuses, true, activeRow + 1);
      return;
    }

    if (activeRow === ROWS - 1) {
      setToast("better luck next time");
      setDidWin(false);
      setShareMessage(null);
      setGameOver(true);
      saveGameResult(wordLength, solution, board, newStatuses, false, ROWS);
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

  const statsPanel = stats.length > 0 ? (
    <div className="w-full lg:w-64 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">Rankings</h2>
      {stats.map((s) => (
        <div key={s.word_length} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/40 mb-1">{s.word_length} letters</div>
          <div className="flex justify-between text-sm">
            <span>{s.total_games} games</span>
            <span className="text-green-400">{s.wins > 0 ? Math.round((s.wins / s.total_games) * 100) : 0}% win</span>
          </div>
          {s.avg_guesses && (
            <div className="text-xs text-white/50 mt-1">avg {s.avg_guesses} guesses</div>
          )}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex flex-col lg:flex-row items-start justify-center text-white gap-8 p-4">
      <div className="flex flex-col items-center justify-center gap-8 flex-1">
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
      </div>
      {statsPanel}
    </main>
  );
}
