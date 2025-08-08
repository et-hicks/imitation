import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
};

export default function CareersPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex items-center justify-center">
      <h1 className="text-white text-4xl font-semibold">Careers</h1>
    </main>
  );
}


