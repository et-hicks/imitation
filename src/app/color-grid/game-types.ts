export type Role = "clue_maker" | "guesser" | "spectator";
export type GamePhase =
  | "lobby"
  | "countdown"
  | "picking"
  | "guessing"
  | "result";

export interface Player {
  nickname: string;
  role: Role;
}

export interface Guess {
  row: string; // "a"-"p"
  col: number; // 1-30
  guessNumber: number; // 1-5
}

export interface RoundResult {
  targetCell: { row: string; col: number };
  guesses: Guess[];
  points: number;
  clueMaker: string;
  guesser: string;
  won: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  guesses: Guess[];
  currentGuessNumber: number;
  countdownSeconds: number | null;
  lastRoundResult: RoundResult | null;
}

export const INITIAL_GAME_STATE: GameState = {
  phase: "lobby",
  players: [],
  guesses: [],
  currentGuessNumber: 0,
  countdownSeconds: null,
  lastRoundResult: null,
};

export const POINTS_BY_GUESS: Record<number, number> = {
  1: 10,
  2: 8,
  3: 6,
  4: 4,
  5: 2,
};

export const MAX_GUESSES = 5;

// Broadcast event types
export type GameEvent =
  | { type: "player_joined"; nickname: string }
  | { type: "player_left"; nickname: string }
  | { type: "role_claimed"; nickname: string; role: "clue_maker" | "guesser" }
  | { type: "role_released"; nickname: string }
  | { type: "countdown_tick"; seconds: number }
  | { type: "countdown_cancel" }
  | { type: "target_confirmed" }
  | { type: "guess_made"; guess: Guess }
  | {
      type: "game_over";
      result: RoundResult;
    }
  | { type: "return_to_lobby" }
  | { type: "state_sync"; state: GameState };
