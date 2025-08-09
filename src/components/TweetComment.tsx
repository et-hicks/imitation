"use client";

import Image from "next/image";

type TweetCommentProps = {
  onOpenThread?: () => void;
  fullWidth?: boolean;
};

export default function TweetComment({ onOpenThread, fullWidth = false }: TweetCommentProps) {
  const handleLike = () => console.log("liked tweet");
  const handleComment = () => console.log("commented on tweet");

  return (
    <div className={`${fullWidth ? "w-full" : "w-full sm:w-2/3 lg:w-[35%]"} mx-auto mt-4`}>
      <div
        className="rounded-xl border-[6px] border-white/10 bg-black/80 p-4 text-white shadow-md cursor-pointer"
        onClick={onOpenThread}
        role={onOpenThread ? "button" : undefined}
        tabIndex={onOpenThread ? 0 : undefined}
        onKeyDown={(e) => {
          if (!onOpenThread) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenThread();
          }
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/profile.png"
              alt="Profile"
              width={100}
              height={100}
              className="h-10 w-10 max-h-[100px] max-w-[100px] rounded-full object-cover"
            />
            <div className="leading-tight">
              <div className="font-medium">Jane Doe</div>
              <div className="text-xs text-gray-400">@janedoe</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">1 hour ago</div>
        </div>
        <p className="text-sm leading-6 text-gray-200">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <button type="button" onClick={handleLike} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"<3"}</span>
              <span>15k</span>
            </button>
            <div className="flex-1" />
            <button type="button" onClick={handleComment} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"O>"}</span>
              <span>32</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


