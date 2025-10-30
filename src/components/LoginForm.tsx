"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function LoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  const preventSpaceKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === " ") {
      event.preventDefault();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "login failed" }));
        setError(data.error ?? "login failed");
        return;
      }
      await refresh();
      router.push("/");
    } catch (err) {
      console.error("login failed", err);
      setError("unexpected error logging in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm text-gray-300" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
          onKeyDown={preventSpaceKey}
          className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-white outline-none placeholder-gray-400 focus:border-white/40"
          placeholder="Enter username"
          autoComplete="username"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-300" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\s+/g, ""))}
            onKeyDown={preventSpaceKey}
            className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 pr-20 text-white outline-none placeholder-gray-400 focus:border-white/40"
            placeholder="Enter password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-xs text-white hover:bg-white/10"
          >
            {passwordVisible ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <button
          type="submit"
          className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-gray-200 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Signing In..." : "Sign In"}
        </button>
      </div>
    </form>
  );
}
