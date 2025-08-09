"use client";

import { useState } from "react";
import TweetComposer from "./TweetComposer";
import TweetTextCard from "./TweetTextCard";
import TweetComment from "./TweetComment";
import SlidingThreadPanel from "./SlidingThreadPanel";

export default function TwitterFeed() {
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-black">
      <TweetComposer />
      <TweetTextCard onOpenThread={() => setIsThreadOpen(true)} />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <TweetComment key={idx} onOpenThread={() => setIsThreadOpen(true)} />
        ))}
      </div>
      <SlidingThreadPanel isOpen={isThreadOpen} onClose={() => setIsThreadOpen(false)} />
    </div>
  );
}


