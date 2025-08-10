"use client";

import { useEffect, useState } from "react";
import TweetComposer from "./TweetComposer";
import TweetTextCard from "./TweetTextCard";
import TweetComment from "./TweetComment";
import SlidingThreadPanel from "./SlidingThreadPanel";
import { apiFetch } from "@/lib/api";

export default function TwitterFeed() {
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [activeTweetId, setActiveTweetId] = useState<string | number | null>(null);
  const [tweets, setTweets] = useState<
    Array<{
      body: string;
      likes: number;
      replies: number;
      restacks: number;
      saves: number;
      userId: string;
      profileName: string;
      profileUrl?: string;
    }>
  >([]);

  function isValidTweet(item: any): item is {
    body: string;
    likes: number;
    replies: number;
    restacks: number;
    saves: number;
    userId: string;
    profileName: string;
    profileUrl?: string;
  } {
    // return true;
    return (
      item &&
      typeof item.body === "string"
      // typeof item.likes === "number" &&
      // typeof item.replies === "number" &&
      // typeof item.restacks === "number" &&
      // typeof item.saves === "number" &&
      // typeof item.userId === "string" &&
      // typeof item.profileName === "string" &&
      // (typeof item.profileUrl === "string" || typeof item.profileUrl === "undefined")
    );
  }
  useEffect(() => {
    (async () => {
      try {
        const result = await apiFetch<any>("/home");
        // eslint-disable-next-line no-console
        console.log("GET /home result:", result);

        if (Array.isArray(result)) {
          const valid = result.filter(isValidTweet);
          if (valid.length !== result.length) {
            // eslint-disable-next-line no-console
            console.warn(
              `Some items from /home were invalid and were skipped: ${result.length - valid.length}`
            );
          }
          setTweets(valid);
        } else {
          // eslint-disable-next-line no-console
          console.warn("/home did not return an array; nothing to render.");
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("GET /home failed:", error);
      }
    })();
  }, []);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-black">
      <TweetComposer />
      <div className="space-y-4">
        {tweets.map((t, idx) => (
          <TweetTextCard
            key={`${t.userId}-${idx}`}
            onOpenThread={() => {
              // eslint-disable-next-line no-console
              console.log("open tweet thread:", { id: idx, userId: t.userId });
              setActiveTweetId(idx);
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
      <SlidingThreadPanel isOpen={isThreadOpen} onClose={() => setIsThreadOpen(false)} tweetId={activeTweetId} />
    </div>
  );
}


