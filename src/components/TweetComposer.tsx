"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { BACKEND_URL } from "@/lib/env";

type TweetComposerProps = {
  onTweetPosted?: () => void;
};

export default function TweetComposer({ onTweetPosted }: TweetComposerProps) {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { isAuthenticated, session, user } = useAuth();
  const { showError, showSuccess } = useToast();

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize();
  }, [content]);

  const handlePostClick = async () => {
    if (!isAuthenticated) return showError("cannot make tweet when not logged in");
    if (content.trim().length < 1) return;
    if (!session?.access_token || !user?.id) return showError("Authentication error");

    setIsPosting(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/create-tweet/user/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: content.trim(),
          is_comment: false,
          parent_tweet_id: null
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to post tweet: ${response.status}`);
      }

      setContent("");
      showSuccess("Tweet posted successfully!");
      onTweetPosted?.();
    } catch (error) {
      console.error("Error posting tweet:", error);
      showError("Failed to post tweet. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };
  return (
    <div className="w-full sm:w-2/3 lg:w-[35%] mx-auto">
      <div className="relative rounded-xl border-[6px] border-white/10 bg-black/80 p-4 pb-16 shadow-md">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={1}
          placeholder="What's happening?"
          className="block w-full resize-none overflow-hidden bg-transparent p-0 pr-28 text-white placeholder-gray-400 outline-none focus:ring-0"
        />
        <button
          type="button"
          onClick={handlePostClick}
          disabled={isPosting || content.trim().length < 1}
          className="absolute bottom-[10px] right-[10px] rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPosting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}


