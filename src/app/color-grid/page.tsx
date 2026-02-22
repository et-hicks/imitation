"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRoomCode } from "./room-utils";
import ColorGridBoard from "./color-grid-board";

export default function ColorGridLanding() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  function handleCreate() {
    if (!nickname.trim()) {
      setError("Enter a nickname first");
      return;
    }
    const code = generateRoomCode();
    sessionStorage.setItem("colorGameNickname", nickname.trim());
    sessionStorage.setItem("colorGameCreator", code);
    router.push(`/color-grid/${code}`);
  }

  function handleJoin() {
    if (!nickname.trim()) {
      setError("Enter a nickname first");
      return;
    }
    if (!joinCode.trim()) {
      setError("Enter a room code");
      return;
    }
    sessionStorage.setItem("colorGameNickname", nickname.trim());
    router.push(`/color-grid/${joinCode.trim().toLowerCase()}`);
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-white mb-2">Color Grid</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        One player picks a color. The other guesses. Can you describe a color
        well enough for someone to find it?
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-lg">
        <input
          type="text"
          placeholder="Your nickname"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError("");
          }}
          className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
          maxLength={20}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full max-w-lg">
        <button
          onClick={handleCreate}
          className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
        >
          Create Room
        </button>
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="cat-the"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-green-500 focus:outline-none font-mono"
          />
          <button
            onClick={handleJoin}
            className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
          >
            Join
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="mt-4 opacity-60 overflow-auto">
        <ColorGridBoard disabled />
      </div>
    </>
  );
}
