import dynamic from "next/dynamic";
import type { Metadata } from "next";

const SwaggerSurface = dynamic(() => import("@/components/SwaggerSurface"), { ssr: false });

export const metadata: Metadata = {
  title: "API Explorer",
  description: "Interactive documentation for the backend APIs.",
};

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black p-4">
      <div className="mx-auto max-w-6xl rounded-lg bg-white p-4 shadow-lg">
        <SwaggerSurface />
      </div>
    </main>
  );
}
