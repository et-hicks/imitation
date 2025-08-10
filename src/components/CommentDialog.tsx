"use client";

import { useEffect, useRef, useState } from "react";

type CommentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onPost?: (text: string) => void;
};

export default function CommentDialog({ isOpen, onClose, onPost }: CommentDialogProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContent("");
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handlePost = () => {
    onPost?.(content);
    onClose();
    setContent("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-11/12 max-w-md rounded-xl border-[6px] border-white/10 bg-black/90 p-4 pb-14 shadow-lg">
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
          className="absolute bottom-2 right-3 rounded-md bg-white px-4 py-1 text-sm font-medium text-black transition hover:bg-gray-200"
        >
          Post
        </button>
      </div>
    </div>
  );
}

