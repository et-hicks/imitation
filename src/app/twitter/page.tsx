import type { Metadata } from "next";
import TwitterFeed from "@/components/TwitterFeed";

export const metadata: Metadata = {
  title: "Twitter",
};

export default function TwitterPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <TwitterFeed />
    </main>
  );
}


