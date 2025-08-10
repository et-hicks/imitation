"use client";

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();
  const display = user?.user_metadata?.full_name || user?.email || "User";

  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <div className="mx-auto max-w-xl px-4 py-10 text-white">
        <h1 className="mb-4 text-2xl font-semibold">Hello, this is your profile</h1>
        <p className="mb-8 text-sm text-white/80">Signed in as {display}</p>
        <button
          type="button"
          onClick={async () => { await supabase.auth.signOut(); location.href = "/"; }}
          className="rounded-md bg-white px-4 py-2 text-black hover:bg-gray-200"
        >
          Logout
        </button>
      </div>
    </main>
  );
}


