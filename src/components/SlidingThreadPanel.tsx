"use client";

import { useCallback, useEffect, useState } from "react";
import TweetTextCard from "@/components/TweetTextCard";
import TweetComment from "@/components/TweetComment";
import CommentDialog from "@/components/CommentDialog";
import { apiFetch } from "@/lib/api";
import Spinner from "./Spinner";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";

type SlidingThreadPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  tweetId?: number | null;
};

type TweetPayload = {
  id?: number;
  body: string;
  likes: number;
  replies: number;
  restacks: number;
  saves: number;
  userId: string;
  profileName: string;
  profileUrl?: string;
};

type Comment = {
  id?: number;
  userId?: string;
  profileName?: string;
  body?: string;
  likes?: number | string;
  replies?: number | string;
  profileUrl?: string;
};

export default function SlidingThreadPanel({ isOpen, onClose, tweetId }: SlidingThreadPanelProps) {
  const [tweet, setTweet] = useState<TweetPayload | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showError } = useToast();

  const fetchComments = useCallback(async (id: number) => {
    try {
      const result = await apiFetch<Comment[]>(`/tweet/${id}/comments`);
      setComments(Array.isArray(result) ? result : []);
    } catch {
      // Fallback to /comments endpoint
      try {
        const fallback = await apiFetch<Comment[]>(`/comments?tweetId=eq.${id}`);
        setComments(Array.isArray(fallback) ? fallback : []);
      } catch {
        setComments([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen || tweetId == null) return;
    (async () => {
      setLoading(true);
      try {
        const result = await apiFetch<TweetPayload>(`/tweet/${tweetId}`);
        const tweetObj = Array.isArray(result) ? result[0] : result;
        setTweet(tweetObj ?? null);
      } catch {
        setTweet(null);
      }
      await fetchComments(tweetId);
      setLoading(false);
    })();
  }, [isOpen, tweetId, fetchComments]);

  const handleCommentPosted = () => {
    if (tweetId != null) {
      fetchComments(tweetId);
    }
  };

  const handleOpenCommentDialog = () => {
    if (!isAuthenticated) return showError("Log in to comment");
    setIsCommentOpen(true);
  };

  return (
    <>
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
            {!loading && tweet && (
              <TweetTextCard
                fullWidth
                id={tweet.id}
                body={tweet.body}
                likes={tweet.likes}
                replies={tweet.replies}
                restacks={tweet.restacks}
                saves={tweet.saves}
                userId={tweet.userId}
                profileName={tweet.profileName}
                profileUrl={tweet.profileUrl}
              />
            )}
            {!loading && comments.length === 0 && (
              <p className="text-center text-sm text-white/40 py-4">
                Tweet has no comments!
              </p>
            )}
            {comments.map((c, idx) => (
              <TweetComment
                key={c.id ?? idx}
                fullWidth
                id={c.id}
                userId={c.userId}
                profileName={c.profileName}
                body={c.body}
                likes={c.likes}
                replies={c.replies}
              />
            ))}
          </div>
          <div className="border-t border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={handleOpenCommentDialog}
              className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
            >
              Add a comment
            </button>
          </div>
        </div>
      </div>
      <CommentDialog
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
        parentTweetId={tweetId ?? undefined}
        onPost={handleCommentPosted}
      />
    </>
  );
}
