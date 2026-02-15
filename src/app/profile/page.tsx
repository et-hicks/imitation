"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null && !isAuthenticated) {
      router.replace("/login");
    }
  }, [user, isAuthenticated, router]);

  if (!user) {
    return null;
  }

  const displayName = user.user_metadata?.full_name || "—";
  const email = user.email || "—";

  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <div className="mx-auto max-w-xl px-4 py-10 text-white">
        <h1 className="mb-8 text-2xl font-semibold">Profile</h1>

        <div className="mb-8 space-y-4">
          <div>
            <p className="text-sm text-white/60">Display name</p>
            <p className="text-lg">{displayName}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">Email</p>
            <p className="text-lg">{email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
          }}
          className="rounded-md bg-white px-4 py-2 text-black hover:bg-gray-200"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
