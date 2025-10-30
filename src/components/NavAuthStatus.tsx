"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function NavAuthStatus() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="rounded-md border border-white/20 px-4 py-1.5 hover:bg-white/10">
        Login
      </Link>
    );
  }

  return (
    <Link href="/profile" className="rounded-md border border-white/20 px-4 py-1.5 hover:bg-white/10">
      Profile
    </Link>
  );
}
