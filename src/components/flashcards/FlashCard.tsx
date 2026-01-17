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
            className="perspective-1000 cursor-pointer"
            onClick={onFlip}
            style={{ perspective: "1000px" }}
        >
            <div
                className="relative w-full h-80 transition-transform duration-500"
                style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 flex items-center justify-center p-8 bg-black/80 border-4 border-white/20 rounded-2xl backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <p className="text-2xl text-center font-light tracking-wide">
                        {front}
                    </p>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 flex items-center justify-center p-8 bg-black/80 border-4 border-white/20 rounded-2xl backface-hidden"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    <p className="text-xl text-center text-white/80 leading-relaxed">
                        {back}
                    </p>
                </div>
            </div>

            <p className="text-center text-white/40 text-sm mt-4">
                Click to {isFlipped ? "see question" : "reveal answer"}
            </p>
        </div>
    );
}
