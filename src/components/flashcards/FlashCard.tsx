"use client";

import React, { useRef } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

type FlashCardProps = {
    front: string;
    back: string;
    isFlipped: boolean;
    onFlip: () => void;
    /** Called when user swipes left (after flip) — typically "hard" */
    onSwipeLeft?: () => void;
    /** Called when user swipes right (after flip) — typically "easy" */
    onSwipeRight?: () => void;
};

/** Returns true if the text contains markdown syntax or newlines. */
function isMarkdown(text: string): boolean {
    return /[*_`#\[!\n]/.test(text) || text.includes("```");
}

export default function FlashCard({
    front,
    back,
    isFlipped,
    onFlip,
    onSwipeLeft,
    onSwipeRight,
}: FlashCardProps) {
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        e.preventDefault(); // block the synthetic click event

        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        const isHorizontalSwipe = absDx > absDy && absDx > 50;
        const isTap = absDx < 15 && absDy < 15;
        const isVerticalSwipe = absDy > absDx && absDy > 50;

        if (!isFlipped) {
            // Before flip: any gesture flips the card
            if (isHorizontalSwipe || isVerticalSwipe || isTap) {
                onFlip();
            }
        } else {
            // After flip: horizontal swipe rates difficulty
            if (isHorizontalSwipe) {
                if (dx < 0) {
                    onSwipeLeft?.();
                } else {
                    onSwipeRight?.();
                }
            } else if (isTap) {
                onFlip();
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
    };

    const frontIsMarkdown = isMarkdown(front);
    const backIsMarkdown = isMarkdown(back);

    return (
        <div>
            {/* 3D card */}
            <div
                className="cursor-pointer select-none"
                onClick={onFlip}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{ perspective: "1200px" }}
            >
                <div
                    className="relative w-full h-80 transition-transform"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        transitionDuration: "600ms",
                        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                >
                    {/* Front face */}
                    <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
                            border: "2px solid rgba(99, 102, 241, 0.3)",
                            boxShadow:
                                "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                        }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center p-6 overflow-auto">
                            {frontIsMarkdown ? (
                                <MarkdownRenderer
                                    content={front}
                                    className="text-white text-sm text-left w-full"
                                />
                            ) : (
                                <p className="text-2xl text-center font-light tracking-wide text-white">
                                    {front}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Back face */}
                    <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
                            border: "2px solid rgba(34, 197, 94, 0.3)",
                            boxShadow:
                                "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                        }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center p-6 overflow-auto">
                            {backIsMarkdown ? (
                                <MarkdownRenderer
                                    content={back}
                                    className="text-white/90 text-sm text-left w-full"
                                />
                            ) : (
                                <p className="text-xl text-center text-white/90 leading-relaxed">
                                    {back}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hint row */}
            <div className="flex items-center justify-between mt-3 px-1 text-xs text-white/25 select-none">
                <span className="hidden sm:block">
                    {isFlipped
                        ? "← swipe hard  |  swipe easy →"
                        : "swipe or tap to flip"}
                </span>
                <span className="sm:hidden">
                    {isFlipped ? "← hard  |  easy →" : "tap to flip"}
                </span>
                <span className="uppercase tracking-wider">
                    {isFlipped ? "showing answer" : "showing question"}
                </span>
            </div>
        </div>
    );
}
