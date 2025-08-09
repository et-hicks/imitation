import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solutions",
};

export default function SolutionsPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-white text-3xl font-semibold mb-8">Solutions</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/twitter"
            className="rounded-xl border border-white/10 bg-black/80 p-6 text-white shadow-md transition hover:bg-white/10"
          >
            <h2 className="text-xl font-medium">Twitter</h2>
            <p className="mt-2 text-sm text-gray-300">Compose posts and view content.</p>
          </Link>
          <Link
            href="/predictions"
            className="rounded-xl border border-white/10 bg-black/80 p-6 text-white shadow-md transition hover:bg-white/10"
          >
            <h2 className="text-xl font-medium">Predictions</h2>
            <p className="mt-2 text-sm text-gray-300">Explore predictive insights.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}


