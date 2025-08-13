"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { BACKEND_URL } from "@/lib/env";

type CommentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onPost?: (text: string) => void;
  parentTweetId?: string | number;
};

export default function CommentDialog({ isOpen, onClose, onPost, parentTweetId }: CommentDialogProps) {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { session, user } = useAuth();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      setContent("");
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const isValid = content.trim().length > 1;

  const handlePost = async () => {
    if (!isValid) return;
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
          is_comment: true,
          parent_tweet_id: parentTweetId || null
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to post comment: ${response.status}`);
      }

      onPost?.(content);
      setContent("");
      onClose();
      showSuccess("Comment posted successfully!");
    } catch (error) {
      console.error("Error posting comment:", error);
      showError("Failed to post comment. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-11/12 max-w-md rounded-xl border-[6px] border-white/10 bg-black/90 p-4 pb-14 shadow-lg">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-sm text-white hover:bg-white/10"
        >
          Exit
        </button>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Write a comment..."
          className="block w-full resize-none bg-transparent text-white placeholder-gray-400 outline-none focus:ring-0"
        />
        <div className="absolute bottom-3 left-4 text-xs text-gray-400">
          {content.length}
        </div>
        <button
          type="button"
          onClick={handlePost}
          className={`absolute bottom-2 right-3 rounded-md px-4 py-1 text-sm font-medium transition ${
            isValid && !isPosting ? "bg-white text-black hover:bg-gray-200" : "bg-white/30 text-black/50 cursor-not-allowed"
          }`}
          disabled={!isValid || isPosting}
        >
          {isPosting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}

