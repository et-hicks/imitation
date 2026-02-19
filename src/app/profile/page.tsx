"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdating(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    }
  };

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

        {passwordSuccess && (
          <p className="mb-4 text-sm text-green-400">{passwordSuccess}</p>
        )}

        {showPasswordForm ? (
          <form onSubmit={handleChangePassword} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
                required
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-400">{passwordError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isUpdating}
                className="rounded-md bg-white px-4 py-2 text-black hover:bg-gray-200 disabled:opacity-50"
              >
                {isUpdating ? "Updating…" : "Update Password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordError("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="rounded-md border border-white/30 px-4 py-2 text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowPasswordForm(true)}
            className="mb-4 rounded-md border border-white/30 px-4 py-2 text-white hover:bg-white/10"
          >
            Change Password
          </button>
        )}

        <div>
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
      </div>
    </main>
  );
}
