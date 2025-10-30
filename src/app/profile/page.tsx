"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type TwitterUser = {
  id: number;
  username: string;
  bio?: string | null;
};

export default function ProfilePage() {
  const { user, isAuthenticated, refresh, loading } = useAuth();
  const router = useRouter();
  const display = user?.username || "User";
  const [activeTab, setActiveTab] = useState<"twitter" | "other">("twitter");
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (activeTab === "twitter" && !twitterUser) {
      fetch("/user/1")
        .then((res) => res.json())
        .then((data: TwitterUser) => setTwitterUser(data))
        .catch(() => setTwitterUser(null));
    }
  }, [activeTab, twitterUser]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <div className="mx-auto max-w-xl px-4 py-10 text-white">
        <h1 className="mb-4 text-2xl font-semibold">Hello, this is your profile</h1>
        <p className="mb-8 text-sm text-white/80">Signed in as {display}</p>

        <div className="mb-8 flex border-b border-white/20">
          <button
            className={`px-4 py-2 text-sm ${
              activeTab === "twitter" ? "border-b-2 border-white" : "text-white/60"
            }`}
            onClick={() => setActiveTab("twitter")}
          >
            twitter
          </button>
          <button
            className={`px-4 py-2 text-sm ${
              activeTab === "other" ? "border-b-2 border-white" : "text-white/60"
            }`}
            onClick={() => setActiveTab("other")}
          >
            other information
          </button>
        </div>

        {activeTab === "twitter" ? (
          twitterUser ? (
            <div className="mb-8">
              <p className="mb-2">Username: {twitterUser.username}</p>
              <p className="mb-2">User ID: {twitterUser.id}</p>
              <p>{twitterUser.bio || "missing bio text, edit here"}</p>
            </div>
          ) : (
            <p className="mb-8">Loading...</p>
          )
        ) : (
          <div className="mb-8">
            <p>Other information goes here.</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-white px-4 py-2 text-black hover:bg-gray-200"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
