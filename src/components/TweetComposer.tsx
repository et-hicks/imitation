"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";

export default function TweetComposer() {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { isAuthenticated, user } = useAuth();
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
    if (!user?.id) return showError("Authentication error");

    setIsPosting(true);

    try {
      // Simulate posting locally until a tweet service is available.
      await new Promise((resolve) => setTimeout(resolve, 400));
      console.log("Tweet draft saved", { userId: user.id, body: content.trim() });
      setContent("");
      showSuccess("Tweet saved locally.");
    } catch (error) {
      console.error("Error posting tweet:", error);
      showError("Failed to save tweet. Please try again.");
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


