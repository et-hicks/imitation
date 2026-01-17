"use client";

import { useState, useEffect } from "react";
import type { Deck, Card } from "@/app/flashcards/page";
import type { Session } from "@supabase/supabase-js";
import { BACKEND_URL } from "@/lib/env";
import FlashCard from "./FlashCard";

type StudyModeProps = {
    deck: Deck;
    session: Session | null;
    onExit: () => void;
};

type StudyCard = {
    id: number;
    front: string;
    back: string;
    status: string;
    review_count: number;
};

export default function StudyMode({ deck, session, onExit }: StudyModeProps) {
    const [cards, setCards] = useState<StudyCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [remindValue, setRemindValue] = useState(1);
    const [remindUnit, setRemindUnit] = useState<"min" | "hr" | "day">("day");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchStudyCards = async () => {
            if (!session?.access_token) return;
            setLoading(true);
            try {
                const res = await fetch(`${BACKEND_URL}/decks/${deck.id}/study?limit=20`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (res.ok) {
                    setCards(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch study cards:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudyCards();
    }, [deck.id, session?.access_token]);

    const currentCard = cards[currentIndex];
    const totalCards = cards.length;
    const isComplete = currentIndex >= totalCards;

    const handleRemindMe = async () => {
        if (!currentCard || !session?.access_token || submitting) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/cards/${currentCard.id}/review`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    remind_value: remindValue,
                    remind_unit: remindUnit,
                }),
            });

            if (res.ok) {
                setIsFlipped(false);
                setCurrentIndex((prev) => prev + 1);
            }
        } catch (err) {
            console.error("Failed to schedule review:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-white/40">Loading cards...</p>
            </div>
        );
    }

    if (totalCards === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">No cards due!</h2>
                <p className="text-white/60 mb-6">All caught up. Check back later.</p>
                <button
                    onClick={onExit}
                    className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
                >
                    Back to Deck
                </button>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">🎉 Session Complete!</h2>
                <p className="text-white/60 mb-6">
                    You reviewed {totalCards} card{totalCards !== 1 ? "s" : ""}.
                </p>
                <button
                    onClick={onExit}
                    className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
                >
                    Back to Deck
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onExit}
                    className="text-white/60 hover:text-white text-sm"
                >
                    ← Exit
                </button>
                <div className="text-lg font-medium">
                    Study {currentIndex + 1}/{totalCards}
                </div>
                <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Flashcard */}
            <FlashCard
                front={currentCard.front}
                back={currentCard.back}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
            />

            {/* Navigation dots */}
            <div className="flex justify-center gap-2 my-6">
                {cards.slice(0, Math.min(10, totalCards)).map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-3 h-3 rounded-full border ${idx === currentIndex
                                ? "bg-white border-white"
                                : idx < currentIndex
                                    ? "bg-green-500 border-green-500"
                                    : "border-white/30"
                            }`}
                    />
                ))}
                {totalCards > 10 && <span className="text-white/40">...</span>}
            </div>

            {/* Remind Me Controls */}
            <div className="flex items-center justify-center gap-4">
                <span className="text-white/60">remind me:</span>
                <input
                    type="number"
                    min={1}
                    max={999}
                    value={remindValue}
                    onChange={(e) => setRemindValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-black border border-white/30 rounded px-3 py-2 text-center focus:outline-none focus:border-white"
                />
                <select
                    value={remindUnit}
                    onChange={(e) => setRemindUnit(e.target.value as "min" | "hr" | "day")}
                    className="bg-black border border-white/30 rounded px-3 py-2 focus:outline-none focus:border-white"
                >
                    <option value="min">min</option>
                    <option value="hr">hr</option>
                    <option value="day">day</option>
                </select>
                <button
                    onClick={handleRemindMe}
                    disabled={submitting}
                    className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                    {submitting ? "..." : "Next →"}
                </button>
            </div>
        </div>
    );
}
