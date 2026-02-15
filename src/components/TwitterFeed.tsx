"use client";

import { useCallback, useEffect, useState } from "react";
import TweetComposer from "./TweetComposer";
import TweetTextCard from "./TweetTextCard";
import SlidingThreadPanel from "./SlidingThreadPanel";
import { apiFetch } from "@/lib/api";
import Spinner from "./Spinner";

type Tweet = {
  id: number;
  body: string;
  likes: number;
  replies: number;
  restacks: number;
  saves: number;
  userId: string;
  profileName: string;
  profileUrl?: string;
};

export default function TwitterFeed() {
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [activeTweetId, setActiveTweetId] = useState<number | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTweets = useCallback(async () => {
    try {
      const result = await apiFetch<Tweet[]>("/home");
      if (Array.isArray(result)) {
        setTweets(result.filter((item) => item && typeof item.body === "string"));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("GET /home failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  const handleTweetPosted = () => {
    fetchTweets();
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-black">
      <TweetComposer onTweetPosted={handleTweetPosted} />
      <div className="space-y-4">
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner size={28} />
          </div>
        )}
        {tweets.map((t) => (
          <TweetTextCard
            key={t.id}
            id={t.id}
            onOpenThread={() => {
              setActiveTweetId(t.id);
              setIsThreadOpen(true);
            }}
            body={t.body}
            likes={t.likes}
            replies={t.replies}
            restacks={t.restacks}
            saves={t.saves}
            userId={t.userId}
            profileName={t.profileName}
            profileUrl={t.profileUrl || ""}
          />
        ))}
      </div>
      <SlidingThreadPanel
        isOpen={isThreadOpen}
        onClose={() => setIsThreadOpen(false)}
        tweetId={activeTweetId}
      />
    </div>
  );
}
