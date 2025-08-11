"use client";

import { useEffect, useState } from "react";
import TweetTextCard from "@/components/TweetTextCard";
import TweetComment from "@/components/TweetComment";
import { apiFetch } from "@/lib/api";
import Spinner from "./Spinner";

type SlidingThreadPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  tweetId?: string | number | null;
};

export default function SlidingThreadPanel({ isOpen, onClose, tweetId }: SlidingThreadPanelProps) {
  type TweetPayload = {
    id?: string | number;
    body: string;
    likes: number;
    replies: number;
    restacks: number;
    saves: number;
    userId: string;
    profileName: string;
    profileUrl?: string;
  };

  const [tweet, setTweet] = useState<TweetPayload | null>(null);
  const [comments, setComments] = useState<
    Array<{
      userId?: string;
      profileName?: string;
      body?: string;
      likes?: number | string;
      replies?: number | string;
      profileUrl?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function isValidTweetPayload(data: any): data is TweetPayload {
    return (
      true
      // data &&
      // typeof data.body === "string" &&
      // typeof data.likes === "number" &&
      // typeof data.replies === "number" &&
      // typeof data.restacks === "number" &&
      // typeof data.saves === "number" &&
      // typeof data.userId === "string" &&
      // typeof data.profileName === "string" &&
      // (typeof data.profileUrl === "string" || typeof data.profileUrl === "undefined")
    );
  }

  useEffect(() => {
    if (!isOpen || tweetId === undefined || tweetId === null) return;
    (async () => {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result = await apiFetch<any>(`/tweet/${tweetId}`);
        } catch (primaryErr) {
          // eslint-disable-next-line no-console
          console.warn(`Primary tweet fetch failed, trying fallback:`, primaryErr);
          try {
            // Fallback for APIs that use query filtering instead of RESTful path
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const alt = await apiFetch<any>(`/tweet?id=eq.${tweetId}`);
            result = alt;
          } catch (altErr) {
            // eslint-disable-next-line no-console
            console.error(`Fallback tweet fetch failed:`, altErr);
            result = null;
          }
        }

        // Coerce result into an object if the API returns an array wrapper
        const tweetObj = Array.isArray(result) ? result[0] : (result && result.data ? result.data : result);
        // eslint-disable-next-line no-console
        console.log(`Tweet detail resolved:`, tweetObj);

        if (isValidTweetPayload(tweetObj)) {
          setTweet(tweetObj);
        } else {
          // eslint-disable-next-line no-console
          console.warn("Tweet payload invalid; not rendering:", tweetObj);
          setTweet(null);
        }

        // Extract the canonical tweet id from the payload if present; fall back to the requested id
        const commentsId = (tweetObj && (tweetObj.id as string | number | undefined)) ?? tweetId;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let commentsRes: any = null;
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            commentsRes = await apiFetch<any>(`/tweet/${commentsId}/comments`);
          } catch (commentsPrimaryErr) {
            // eslint-disable-next-line no-console
            console.warn(`Primary comments fetch failed, trying fallback:`, commentsPrimaryErr);
            try {
              // Fallback for APIs that expose a comments table filtered by tweet id
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              commentsRes = await apiFetch<any>(`/comments?tweetId=eq.${commentsId}`);
            } catch (commentsAltErr) {
              // eslint-disable-next-line no-console
              console.error(`Fallback comments fetch failed:`, commentsAltErr);
              commentsRes = null;
            }
          }
          // eslint-disable-next-line no-console
          console.log(`GET /tweet/${commentsId}/comments result:`, commentsRes);
          const arr = Array.isArray(commentsRes) ? commentsRes : [];
          setComments(arr);
        } catch (commentsErr) {
          // eslint-disable-next-line no-console
          console.error(`GET /tweet/${commentsId}/comments failed:`, commentsErr);
          setComments([]);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`GET /tweet/${tweetId} failed:`, error);
        setTweet(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, tweetId]);
  return (
    <div
      className={`fixed right-0 top-14 bottom-0 z-50 w-full sm:w-[420px] bg-black/95 border-l border-white/10 transform transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-medium text-white">Thread</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm text-white hover:bg-white/10"
            aria-label="Close thread"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4 space-y-4">
          {loading && (
            <div className="flex justify-center py-6">
              <Spinner size={24} />
            </div>
          )}
          <TweetTextCard
            fullWidth
            body={tweet?.body}
            likes={tweet?.likes}
            replies={tweet?.replies}
            restacks={tweet?.restacks}
            saves={tweet?.saves}
            userId={tweet?.userId}
            profileName={tweet?.profileName}
            profileUrl={tweet?.profileUrl}
          />
          {comments.map((c, idx) => (
            <TweetComment
              key={idx}
              fullWidth
              userId={c.userId}
              profileName={c.profileName}
              body={c.body}
              likes={c.likes}
              replies={c.replies}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


