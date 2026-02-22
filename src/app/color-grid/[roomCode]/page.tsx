"use client";

import { use, useState, useEffect } from "react";
import { useColorGame } from "../use-color-game";
import ColorGridBoard from "../color-grid-board";
import type { GamePhase } from "../game-types";

export default function GameRoom({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = use(params);
  const [nickname, setNickname] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [joined, setJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("colorGameNickname");
    if (saved) {
      setNicknameInput(saved);
    }
    setIsCreator(sessionStorage.getItem("colorGameCreator") === roomCode);
  }, [roomCode]);

  function handleJoin() {
    const nick = nicknameInput.trim();
    if (!nick) return;
    sessionStorage.setItem("colorGameNickname", nick);
    setNickname(nick);
    setJoined(true);
  }

  if (!joined) {
    return (
      <>
        <h1 className="text-3xl font-bold text-white mb-2">Join Room</h1>
        <p className="text-gray-400 mb-6 font-mono text-lg">{roomCode}</p>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Your nickname"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
            maxLength={20}
            autoFocus
          />
          <button
            onClick={handleJoin}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Join
          </button>
        </div>
      </>
    );
  }

  return (
    <GameView roomCode={roomCode} nickname={nickname} isCreator={isCreator} />
  );
}

function GameView({
  roomCode,
  nickname,
  isCreator,
}: {
  roomCode: string;
  nickname: string;
  isCreator: boolean;
}) {
  const {
    gameState,
    myRole,
    myTargetCell,
    claimRole,
    releaseRole,
    pickTarget,
    makeGuess,
    returnToLobby,
  } = useColorGame(roomCode, nickname, isCreator);

  const { phase, players, guesses, countdownSeconds, lastRoundResult } =
    gameState;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-xl font-bold text-white">Color Grid</h1>
        <span className="font-mono text-gray-400 bg-gray-800 px-3 py-1 rounded text-sm">
          {roomCode}
        </span>
        <span className="text-gray-500 text-sm">
          {nickname} ({myRole.replace("_", " ")})
        </span>
      </div>

      {/* Players bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {players.map((p) => (
          <span
            key={p.nickname}
            className={`text-xs px-2 py-1 rounded-full ${
              p.role === "clue_maker"
                ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                : p.role === "guesser"
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/50"
                  : "bg-gray-700/50 text-gray-400 border border-gray-600/50"
            }`}
          >
            {p.nickname}
            {p.role !== "spectator" && ` (${p.role.replace("_", " ")})`}
          </span>
        ))}
      </div>

      {/* Phase-specific UI */}
      {phase === "lobby" && (
        <LobbyUI
          myRole={myRole}
          nickname={nickname}
          claimRole={claimRole}
          releaseRole={releaseRole}
          players={players}
        />
      )}

      {phase === "countdown" && (
        <CountdownUI
          seconds={countdownSeconds ?? 5}
          myRole={myRole}
          releaseRole={releaseRole}
        />
      )}

      {phase === "picking" && (
        <PickingUI myRole={myRole} pickTarget={pickTarget} />
      )}

      {phase === "guessing" && (
        <GuessingUI
          myRole={myRole}
          guesses={guesses}
          makeGuess={makeGuess}
          myTargetCell={myTargetCell}
          currentGuessNumber={gameState.currentGuessNumber}
        />
      )}

      {phase === "result" && lastRoundResult && (
        <ResultUI result={lastRoundResult} returnToLobby={returnToLobby} />
      )}
    </>
  );
}

// --- Sub-components for each phase ---

function LobbyUI({
  myRole,
  nickname,
  claimRole,
  releaseRole,
  players,
}: {
  myRole: string;
  nickname: string;
  claimRole: (role: "clue_maker" | "guesser") => void;
  releaseRole: () => void;
  players: { nickname: string; role: string }[];
}) {
  const clueMakerTaken = players.some(
    (p) => p.role === "clue_maker" && p.nickname !== nickname
  );
  const guesserTaken = players.some(
    (p) => p.role === "guesser" && p.nickname !== nickname
  );

  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      <p className="text-gray-300">Choose your role to start a game:</p>
      <div className="flex gap-4">
        {myRole === "clue_maker" ? (
          <button
            onClick={releaseRole}
            className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold ring-2 ring-purple-400"
          >
            Clue Maker (you)
          </button>
        ) : (
          <button
            onClick={() => claimRole("clue_maker")}
            disabled={clueMakerTaken}
            className="px-6 py-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {clueMakerTaken ? "Clue Maker (taken)" : "Clue Maker"}
          </button>
        )}

        {myRole === "guesser" ? (
          <button
            onClick={releaseRole}
            className="px-6 py-3 rounded-lg bg-amber-600 text-white font-semibold ring-2 ring-amber-400"
          >
            Guesser (you)
          </button>
        ) : (
          <button
            onClick={() => claimRole("guesser")}
            disabled={guesserTaken}
            className="px-6 py-3 rounded-lg bg-amber-600/30 hover:bg-amber-600/60 text-amber-200 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {guesserTaken ? "Guesser (taken)" : "Guesser"}
          </button>
        )}
      </div>
      <div className="opacity-50 mt-4 overflow-auto">
        <ColorGridBoard disabled />
      </div>
    </div>
  );
}

function CountdownUI({
  seconds,
  myRole,
  releaseRole,
}: {
  seconds: number;
  myRole: string;
  releaseRole: () => void;
}) {
  const canCancel = myRole === "clue_maker" || myRole === "guesser";

  return (
    <div className="flex flex-col items-center gap-6 my-12">
      <p className="text-3xl font-bold text-white">Game starting in</p>
      <p className="text-8xl font-bold text-blue-400 tabular-nums">
        {Math.max(0, seconds)}
      </p>
      {canCancel && (
        <button
          onClick={releaseRole}
          className="px-6 py-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function PickingUI({
  myRole,
  pickTarget,
}: {
  myRole: string;
  pickTarget: (row: string, col: number) => void;
}) {
  if (myRole === "clue_maker") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg text-purple-300 font-semibold">
          Pick your target color
        </p>
        <p className="text-gray-400 text-sm">
          Click a cell. Then describe the color to the guesser (out loud!)
        </p>
        <div className="overflow-auto">
          <ColorGridBoard onCellClick={pickTarget} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 my-12">
      <p className="text-xl text-amber-300">
        Waiting for clue maker to pick a color...
      </p>
      <div className="animate-pulse w-12 h-12 rounded-full bg-purple-500/30" />
      <div className="opacity-40 overflow-auto">
        <ColorGridBoard disabled />
      </div>
    </div>
  );
}

function GuessingUI({
  myRole,
  guesses,
  makeGuess,
  myTargetCell,
  currentGuessNumber,
}: {
  myRole: string;
  guesses: import("../game-types").Guess[];
  makeGuess: (row: string, col: number) => void;
  myTargetCell: { row: string; col: number } | null;
  currentGuessNumber: number;
}) {
  const remaining = 5 - guesses.length;
  const isGuesser = myRole === "guesser";

  return (
    <div className="flex flex-col items-center gap-3">
      {isGuesser ? (
        <>
          <p className="text-lg text-amber-300 font-semibold">
            Make your guess! ({remaining} remaining)
          </p>
          <p className="text-gray-400 text-sm">
            Click the cell you think the clue maker chose
          </p>
        </>
      ) : myRole === "clue_maker" ? (
        <>
          <p className="text-lg text-purple-300 font-semibold">
            Describe your color! ({remaining} guesses remaining)
          </p>
          <p className="text-gray-400 text-sm">
            The guesser is trying to find your cell
          </p>
        </>
      ) : (
        <p className="text-lg text-gray-300">
          Watching... ({remaining} guesses remaining)
        </p>
      )}
      <div className="overflow-auto">
        <ColorGridBoard
          onCellClick={isGuesser ? makeGuess : undefined}
          guesses={guesses}
          targetCell={myTargetCell}
          showTarget={myRole === "clue_maker"}
          disabled={!isGuesser}
        />
      </div>
    </div>
  );
}

function ResultUI({
  result,
  returnToLobby,
}: {
  result: import("../game-types").RoundResult;
  returnToLobby: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        {result.won ? (
          <p className="text-3xl font-bold text-green-400 mb-2">Correct!</p>
        ) : (
          <p className="text-3xl font-bold text-red-400 mb-2">Not found</p>
        )}
        <p className="text-gray-300">
          Target: <span className="font-mono">{result.targetCell.row}{result.targetCell.col}</span>
        </p>
        {result.won && (
          <p className="text-gray-300">
            Found on guess {result.guesses.length} &mdash;{" "}
            <span className="text-purple-300 font-semibold">
              {result.points} points
            </span>{" "}
            for {result.clueMaker}
          </p>
        )}
      </div>
      <div className="overflow-auto">
        <ColorGridBoard
          guesses={result.guesses}
          targetCell={result.targetCell}
          showTarget
          disabled
        />
      </div>
      <button
        onClick={returnToLobby}
        className="mt-4 px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
      >
        Return to Lobby
      </button>
    </div>
  );
}
