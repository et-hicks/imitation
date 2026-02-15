"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const preventSpaceKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === " ") {
      event.preventDefault();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Intentionally allow empty username here; caller can add validation later
    // Log username to console as requested
    // eslint-disable-next-line no-console
    console.log(`user ${email} signed in`);
    // Basic example using email/password with Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("login failed", error);
      return;
    }
    router.push("/");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm text-gray-300" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ""))}
          onKeyDown={preventSpaceKey}
          className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-white outline-none placeholder-gray-400 focus:border-white/40"
          placeholder="Enter email"
          autoComplete="email"
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
      <div>
        <button
          type="submit"
          className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-gray-200"
        >
          Sign In
        </button>
      </div>
    </form>
  );
}


