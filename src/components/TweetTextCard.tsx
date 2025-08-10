"use client";

import Image from "next/image";

type TweetTextCardProps = {
  onOpenThread?: () => void;
  fullWidth?: boolean;
  body?: string;
  likes?: number | string;
  replies?: number | string;
  restacks?: number | string;
  saves?: number | string;
  userId?: string;
  profileName?: string;
  profileUrl?: string;
};

export default function TweetTextCard({
  onOpenThread,
  fullWidth = false,
  body,
  likes,
  replies,
  restacks,
  saves,
  userId,
  profileName,
  profileUrl,
}: TweetTextCardProps) {
  // Basic prop validation to avoid rendering broken cards
  const isValid =
    typeof body === "string" &&
    (typeof likes === "number" || typeof likes === "string" || typeof likes === "undefined") &&
    (typeof replies === "number" || typeof replies === "string" || typeof replies === "undefined") &&
    (typeof restacks === "number" || typeof restacks === "string" || typeof restacks === "undefined") &&
    (typeof saves === "number" || typeof saves === "string" || typeof saves === "undefined") &&
    (typeof userId === "string" || typeof userId === "undefined") &&
    (typeof profileName === "string" || typeof profileName === "undefined") &&
    (typeof profileUrl === "string" || typeof profileUrl === "undefined");

  if (!isValid) {
    return null;
  }
  const handleLike = () => console.log("liked tweet");
  const handleRestack = () => console.log("restacked tweet");
  const handleSave = () => console.log("saved tweet");
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
              src={(profileUrl && profileUrl.trim().length > 0) ? profileUrl : "/images/profile.png"}
              alt="Profile"
              width={100}
              height={100}
              className="h-12 w-12 max-h-[100px] max-w-[100px] rounded-full object-cover"
            />
            <div className="leading-tight">
              <div className="font-medium">{profileName || "Jane Doe"}</div>
              <div className="text-xs text-gray-400">@{userId || "janedoe"}</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">1 hour ago</div>
        </div>
        <p className="text-sm leading-6 text-gray-200">
          {body || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
        </p>
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <button type="button" onClick={handleLike} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"<3"}</span>
              <span>{likes ?? "15k"}</span>
            </button>
            <button type="button" onClick={handleRestack} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"-><-"}</span>
              <span>{restacks ?? "50"}</span>
            </button>
            <button type="button" onClick={handleSave} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"|v|"}</span>
              <span>{saves ?? "1k"}</span>
            </button>
            <button type="button" onClick={handleComment} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"O>"}</span>
              <span>{replies ?? "32"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


