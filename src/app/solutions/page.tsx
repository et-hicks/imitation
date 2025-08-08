import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solutions",
};

export default function SolutionsPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex items-center justify-center">
      <h1 className="text-white text-4xl font-semibold">Solutions</h1>
    </main>
  );
}


