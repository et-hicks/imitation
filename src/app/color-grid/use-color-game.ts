"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  GameState,
  GameEvent,
  Guess,
  Player,
  RoundResult,
} from "./game-types";
import { INITIAL_GAME_STATE, POINTS_BY_GUESS, MAX_GUESSES } from "./game-types";

export function useColorGame(
  roomCode: string,
  nickname: string,
  isCreator: boolean
) {
  const [gameState, setGameState] = useState<GameState>({
    ...INITIAL_GAME_STATE,
    players: [],
  });
  const [myTargetCell, setMyTargetCell] = useState<{
    row: string;
    col: number;
  } | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const stateRef = useRef(gameState);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const myRole = gameState.players.find((p) => p.nickname === nickname)?.role ?? "spectator";

  // Broadcast helper
  const broadcast = useCallback((event: GameEvent) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "game_event",
      payload: event,
    });
  }, []);

  // Update state and broadcast sync (creator only)
  const updateState = useCallback(
    (updater: (prev: GameState) => GameState) => {
      setGameState((prev) => {
        const next = updater(prev);
        if (isCreator) {
          // Broadcast the sync after a microtask so the state is set
          setTimeout(() => {
            channelRef.current?.send({
              type: "broadcast",
              event: "game_event",
              payload: { type: "state_sync", state: next } as GameEvent,
            });
          }, 0);
        }
        return next;
      });
    },
    [isCreator]
  );

  // Clear countdown
  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Handle incoming events
  const handleEvent = useCallback(
    (event: GameEvent) => {
      switch (event.type) {
        case "player_joined": {
          updateState((prev) => {
            if (prev.players.some((p) => p.nickname === event.nickname))
              return prev;
            const newPlayer: Player = {
              nickname: event.nickname,
              role: "spectator",
            };
            return { ...prev, players: [...prev.players, newPlayer] };
          });
          // Creator sends full state to new joiner
          if (isCreator) {
            setTimeout(() => {
              broadcast({
                type: "state_sync",
                state: stateRef.current,
              });
            }, 100);
          }
          break;
        }

        case "player_left": {
          updateState((prev) => {
            const leaving = prev.players.find(
              (p) => p.nickname === event.nickname
            );
            const newPlayers = prev.players.filter(
              (p) => p.nickname !== event.nickname
            );
            // If an active player left during a game, go back to lobby
            if (
              leaving &&
              (leaving.role === "clue_maker" || leaving.role === "guesser") &&
              prev.phase !== "lobby" &&
              prev.phase !== "result"
            ) {
              clearCountdown();
              return {
                ...prev,
                players: newPlayers.map((p) => ({ ...p, role: "spectator" as const })),
                phase: "lobby" as const,
                guesses: [],
                currentGuessNumber: 0,
                countdownSeconds: null,
              };
            }
            return { ...prev, players: newPlayers };
          });
          break;
        }

        case "role_claimed": {
          updateState((prev) => {
            // Check if role is already taken by someone else
            const existing = prev.players.find(
              (p) => p.role === event.role && p.nickname !== event.nickname
            );
            if (existing) return prev;

            const newPlayers = prev.players.map((p) =>
              p.nickname === event.nickname ? { ...p, role: event.role } : p
            );

            const hasClueMaker = newPlayers.some(
              (p) => p.role === "clue_maker"
            );
            const hasGuesser = newPlayers.some((p) => p.role === "guesser");

            // If both roles filled, start countdown
            if (hasClueMaker && hasGuesser && prev.phase === "lobby") {
              return {
                ...prev,
                players: newPlayers,
                phase: "countdown" as const,
                countdownSeconds: 5,
              };
            }

            return { ...prev, players: newPlayers };
          });
          break;
        }

        case "role_released": {
          clearCountdown();
          updateState((prev) => ({
            ...prev,
            players: prev.players.map((p) =>
              p.nickname === event.nickname
                ? { ...p, role: "spectator" as const }
                : p
            ),
            phase: prev.phase === "countdown" ? ("lobby" as const) : prev.phase,
            countdownSeconds:
              prev.phase === "countdown" ? null : prev.countdownSeconds,
          }));
          break;
        }

        case "countdown_tick": {
          updateState((prev) => ({
            ...prev,
            countdownSeconds: event.seconds,
          }));
          // If countdown hits 0, transition to picking
          if (event.seconds <= 0) {
            clearCountdown();
            updateState((prev) => ({
              ...prev,
              phase: "picking" as const,
              countdownSeconds: null,
            }));
          }
          break;
        }

        case "countdown_cancel": {
          clearCountdown();
          updateState((prev) => ({
            ...prev,
            phase: "lobby" as const,
            countdownSeconds: null,
          }));
          break;
        }

        case "target_confirmed": {
          updateState((prev) => ({
            ...prev,
            phase: "guessing" as const,
            currentGuessNumber: 1,
            guesses: [],
          }));
          break;
        }

        case "guess_made": {
          updateState((prev) => ({
            ...prev,
            guesses: [...prev.guesses, event.guess],
            currentGuessNumber: prev.currentGuessNumber + 1,
          }));
          break;
        }

        case "game_over": {
          clearCountdown();
          updateState((prev) => ({
            ...prev,
            phase: "result" as const,
            lastRoundResult: event.result,
          }));
          break;
        }

        case "return_to_lobby": {
          updateState((prev) => ({
            ...prev,
            phase: "lobby" as const,
            players: prev.players.map((p) => ({
              ...p,
              role: "spectator" as const,
            })),
            guesses: [],
            currentGuessNumber: 0,
            countdownSeconds: null,
          }));
          break;
        }

        case "state_sync": {
          // Non-creators accept the authoritative state
          if (!isCreator) {
            setGameState((prev) => {
              // Preserve our own player entry if we're already in the list
              const syncState = event.state;
              const meInSync = syncState.players.find(
                (p) => p.nickname === nickname
              );
              if (!meInSync) {
                return {
                  ...syncState,
                  players: [
                    ...syncState.players,
                    { nickname, role: "spectator" as const },
                  ],
                };
              }
              return syncState;
            });
          }
          break;
        }
      }
    },
    [isCreator, nickname, updateState, broadcast, clearCountdown]
  );

  // Subscribe to channel
  useEffect(() => {
    const channel = supabase.channel(`color-game:${roomCode}`, {
      config: { broadcast: { self: true } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "game_event" }, ({ payload }) => {
        handleEvent(payload as GameEvent);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Add ourselves
          broadcast({ type: "player_joined", nickname });
          // Creator initializes with themselves
          if (isCreator) {
            updateState((prev) => ({
              ...prev,
              players: [{ nickname, role: "spectator" }],
            }));
          }
        }
      });

    return () => {
      broadcast({ type: "player_left", nickname });
      clearCountdown();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, nickname]);

  // Creator manages countdown timer
  useEffect(() => {
    if (!isCreator) return;
    if (gameState.phase === "countdown" && !countdownRef.current) {
      const startTime = Date.now();
      const startSeconds = gameState.countdownSeconds ?? 5;
      countdownRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = startSeconds - elapsed;
        broadcast({ type: "countdown_tick", seconds: remaining });
        if (remaining <= 0) {
          clearCountdown();
        }
      }, 1000);
    } else if (gameState.phase !== "countdown") {
      clearCountdown();
    }
  }, [gameState.phase, gameState.countdownSeconds, isCreator, broadcast, clearCountdown]);

  // Actions
  const claimRole = useCallback(
    (role: "clue_maker" | "guesser") => {
      broadcast({ type: "role_claimed", nickname, role });
    },
    [broadcast, nickname]
  );

  const releaseRole = useCallback(() => {
    broadcast({ type: "role_released", nickname });
  }, [broadcast, nickname]);

  const pickTarget = useCallback(
    (row: string, col: number) => {
      setMyTargetCell({ row, col });
      broadcast({ type: "target_confirmed" });
    },
    [broadcast]
  );

  const makeGuess = useCallback(
    (row: string, col: number) => {
      const guessNum = stateRef.current.currentGuessNumber;
      const guess: Guess = { row, col, guessNumber: guessNum };
      broadcast({ type: "guess_made", guess });

      // Check if correct — clue maker checks locally
      // But we also need to handle the case where the guesser doesn't know the target
      // The clue maker will broadcast game_over when appropriate
    },
    [broadcast]
  );

  // Clue maker watches guesses and determines game_over
  useEffect(() => {
    if (myRole !== "clue_maker" || !myTargetCell) return;
    if (gameState.phase !== "guessing") return;
    if (gameState.guesses.length === 0) return;

    const lastGuess = gameState.guesses[gameState.guesses.length - 1];
    const isCorrect =
      lastGuess.row === myTargetCell.row && lastGuess.col === myTargetCell.col;
    const isLastGuess = lastGuess.guessNumber >= MAX_GUESSES;

    if (isCorrect || isLastGuess) {
      const clueMaker = gameState.players.find(
        (p) => p.role === "clue_maker"
      )?.nickname ?? "";
      const guesser = gameState.players.find(
        (p) => p.role === "guesser"
      )?.nickname ?? "";

      const result: RoundResult = {
        targetCell: myTargetCell,
        guesses: gameState.guesses,
        points: isCorrect ? POINTS_BY_GUESS[lastGuess.guessNumber] : 0,
        clueMaker,
        guesser,
        won: isCorrect,
      };

      // Small delay so the guess renders first
      setTimeout(() => {
        broadcast({ type: "game_over", result });

        // Persist scores
        fetch("/api/color-game/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            nickname: clueMaker,
            role: "clue_maker",
            points: result.points,
            guessNumber: isCorrect ? lastGuess.guessNumber : null,
            targetCell: `${myTargetCell.row}${myTargetCell.col}`,
          }),
        }).catch(() => {});

        fetch("/api/color-game/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            nickname: guesser,
            role: "guesser",
            points: 0,
            guessNumber: isCorrect ? lastGuess.guessNumber : null,
            targetCell: `${myTargetCell.row}${myTargetCell.col}`,
          }),
        }).catch(() => {});

        setMyTargetCell(null);
      }, 500);
    }
  }, [gameState.guesses, gameState.phase, gameState.players, myRole, myTargetCell, broadcast, roomCode]);

  const returnToLobby = useCallback(() => {
    broadcast({ type: "return_to_lobby" });
  }, [broadcast]);

  return {
    gameState,
    myRole,
    myTargetCell,
    claimRole,
    releaseRole,
    pickTarget,
    makeGuess,
    returnToLobby,
  };
}
