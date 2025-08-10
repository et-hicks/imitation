"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupForm() {
  const [profileName, setProfileName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("passwords do not match");
      return;
    }
    setError(null);
    // eslint-disable-next-line no-console
    console.log("create account:", { profileName, username });
    const { error } = await supabase.auth.signUp({
      email: username,
      password,
      options: {
        data: { full_name: profileName },
      },
    });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-gray-300" htmlFor="profilename">Profile name</label>
        <input
          id="profilename"
          type="text"
          className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-white outline-none placeholder-gray-400 focus:border-white/40"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-300" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-white outline-none placeholder-gray-400 focus:border-white/40"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="janedoe"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-300" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-white outline-none placeholder-gray-400 focus:border-white/40"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-gray-300" htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          type="password"
          className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-white outline-none placeholder-gray-400 focus:border-white/40"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-gray-200">
        Create account
      </button>
    </form>
  );
}


