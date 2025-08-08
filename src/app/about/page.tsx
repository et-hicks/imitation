import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex items-center justify-center">
      <h1 className="text-white text-4xl font-semibold">About</h1>
    </main>
  );
}


