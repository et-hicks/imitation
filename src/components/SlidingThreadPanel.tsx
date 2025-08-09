"use client";

import TweetTextCard from "@/components/TweetTextCard";
import TweetComment from "@/components/TweetComment";

type SlidingThreadPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SlidingThreadPanel({ isOpen, onClose }: SlidingThreadPanelProps) {
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
          <TweetTextCard fullWidth />
          {Array.from({ length: 6 }).map((_, idx) => (
            <TweetComment key={idx} fullWidth />
          ))}
        </div>
      </div>
    </div>
  );
}


