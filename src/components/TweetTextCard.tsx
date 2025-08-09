"use client";

export default function TweetTextCard() {
  const handleLike = () => console.log("liked tweet");
  const handleRestack = () => console.log("restacked tweet");
  const handleSave = () => console.log("saved tweet");
  const handleComment = () => console.log("commented on tweet");
  return (
    <div className="w-full sm:w-2/3 lg:w-[35%] mx-auto mt-4">
      <div className="rounded-xl border-[6px] border-white/10 bg-black/80 p-4 text-white shadow-md">
        <p className="text-sm leading-6 text-gray-200">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <button type="button" onClick={handleLike} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"<3"}</span>
              <span>15k</span>
            </button>
            <button type="button" onClick={handleRestack} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"-><-"}</span>
              <span>50</span>
            </button>
            <button type="button" onClick={handleSave} className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-white/10">
              <span>{"|v|"}</span>
              <span>1k</span>
            </button>
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


