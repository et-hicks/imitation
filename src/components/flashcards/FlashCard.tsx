"use client";

type FlashCardProps = {
    front: string;
    back: string;
    isFlipped: boolean;
    onFlip: () => void;
};

export default function FlashCard({ front, back, isFlipped, onFlip }: FlashCardProps) {
    return (
        <div
            className="cursor-pointer select-none"
            onClick={onFlip}
            style={{ perspective: "1200px" }}
        >
            <div
                className="relative w-full h-80 transition-transform duration-600"
                style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transitionDuration: "600ms",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 flex items-center justify-center p-8 rounded-2xl"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
                        border: "2px solid rgba(99, 102, 241, 0.3)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                >
                    <p className="text-2xl text-center font-light tracking-wide text-white">
                        {front}
                    </p>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 flex items-center justify-center p-8 rounded-2xl"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
                        border: "2px solid rgba(34, 197, 94, 0.3)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                >
                    <p className="text-xl text-center text-white/90 leading-relaxed">
                        {back}
                    </p>
                </div>
            </div>

            <p className="text-center text-white/30 text-xs mt-4 uppercase tracking-wider">
                Click to {isFlipped ? "see question" : "reveal answer"}
            </p>
        </div>
    );
}
