import type { Metadata } from "next";
import TweetComposer from "@/components/TweetComposer";
import TweetTextCard from "@/components/TweetTextCard";

export const metadata: Metadata = {
  title: "Twitter",
};

export default function TwitterPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
        <br />
      <TweetComposer />
      <TweetTextCard />
      <div className="flex items-center justify-center py-20">
        <h1 className="text-white text-4xl font-semibold">Twitter</h1>
      </div>
    </main>
  );
}


