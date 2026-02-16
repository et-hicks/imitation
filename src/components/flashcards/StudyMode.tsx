"use client";

import { useState, useEffect } from "react";
import type { Deck } from "@/app/flashcards/page";
import type { Session } from "@supabase/supabase-js";
import { BACKEND_URL } from "@/lib/env";
import FlashCard from "./FlashCard";

type StudyModeProps = {
    deck: Deck;
    session: Session | null;
    onExit: () => void;
    studyAll?: boolean;
    onStartStudyAll?: () => void;
};

type StudyCard = {
    id: number;
    front: string;
    back: string;
    status: string;
    review_count: number;
};

export default function StudyMode({ deck, session, onExit, studyAll, onStartStudyAll }: StudyModeProps) {
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
                const endpoint = studyAll
                    ? `${BACKEND_URL}/decks/${deck.id}/study-all`
                    : `${BACKEND_URL}/decks/${deck.id}/study?limit=20`;
                const res = await fetch(endpoint, {
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
    }, [deck.id, session?.access_token, studyAll]);

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
                <div className="flex justify-center gap-3">
                    <button
                        onClick={onExit}
                        className="border border-white/20 text-white/70 px-6 py-2 rounded-lg font-medium hover:bg-white/5 transition"
                    >
                        Back to Deck
                    </button>
                    {!studyAll && onStartStudyAll && (
                        <button
                            onClick={onStartStudyAll}
                            className="bg-sky-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-sky-500 transition"
                        >
                            Study All
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">Session Complete!</h2>
                <p className="text-white/60 mb-6">
                    You reviewed {totalCards} card{totalCards !== 1 ? "s" : ""}.
                </p>
                <button
                    onClick={onExit}
                    className="bg-sky-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-sky-500 transition"
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
                    className="text-white/60 hover:text-white text-sm transition"
                >
                    Exit
                </button>
                <div className="text-sm font-medium text-white/60">
                    {currentIndex + 1} / {totalCards}
                    {studyAll && <span className="ml-2 text-sky-400">(all)</span>}
                </div>
                <div className="w-12" />
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
                />
            </div>

            {/* Flashcard */}
            <FlashCard
                front={currentCard.front}
                back={currentCard.back}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
            />

            {/* Remind Me Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
                <span className="text-white/40 text-sm">remind me in</span>
                <input
                    type="number"
                    min={1}
                    max={999}
                    value={remindValue}
                    onChange={(e) => setRemindValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-black border border-white/20 rounded-lg px-3 py-2 text-center text-sm focus:outline-none focus:border-sky-500/60"
                />
                <select
                    value={remindUnit}
                    onChange={(e) => setRemindUnit(e.target.value as "min" | "hr" | "day")}
                    className="bg-black border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500/60"
                >
                    <option value="min">min</option>
                    <option value="hr">hr</option>
                    <option value="day">day</option>
                </select>
                <button
                    onClick={handleRemindMe}
                    disabled={submitting}
                    className="bg-sky-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-sky-500 disabled:opacity-50 transition"
                >
                    {submitting ? "..." : "Next"}
                </button>
            </div>
        </div>
    );
}
