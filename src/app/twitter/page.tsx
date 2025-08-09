import type { Metadata } from "next";
import TweetComposer from "@/components/TweetComposer";
import TweetTextCard from "@/components/TweetTextCard";

export const metadata: Metadata = {
  title: "Twitter",
};

export default function TwitterPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <TweetComposer />
      <TweetTextCard />
    </main>
  );
}


