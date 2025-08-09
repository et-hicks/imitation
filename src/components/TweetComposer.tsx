"use client";

import { useEffect, useRef, useState } from "react";

export default function TweetComposer() {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize();
  }, [content]);

  const handlePostClick = () => {
    console.log("Post clicked");
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
          className="absolute bottom-[10px] right-[10px] rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-200"
        >
          Post
        </button>
      </div>
    </div>
  );
}


