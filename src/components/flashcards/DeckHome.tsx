"use client";

import { useState, useEffect } from "react";
import type { Deck, Card } from "@/app/flashcards/page";
import type { Session } from "@supabase/supabase-js";
import { BACKEND_URL } from "@/lib/env";

type DeckHomeProps = {
    deck: Deck;
    session: Session | null;
    onStartStudy: () => void;
    onStartStudyAll: () => void;
    onRefresh: () => void;
};

export default function DeckHome({ deck, session, onStartStudy, onStartStudyAll, onRefresh }: DeckHomeProps) {
    const [cards, setCards] = useState<Card[]>([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [newFront, setNewFront] = useState("");
    const [newBack, setNewBack] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCards = async () => {
            if (!session?.access_token) return;
            setLoading(true);
            try {
                const res = await fetch(`${BACKEND_URL}/decks/${deck.id}/cards`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (res.ok) {
                    setCards(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch cards:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCards();
    }, [deck.id, session?.access_token]);

    const handleAddCard = async () => {
        if (!newFront.trim() || !newBack.trim() || !session?.access_token) return;

        try {
            const res = await fetch(`${BACKEND_URL}/decks/${deck.id}/cards`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ front: newFront.trim(), back: newBack.trim() }),
            });
            if (res.ok) {
                const newCard = await res.json();
                setCards((prev) => [...prev, newCard]);
                setNewFront("");
                setNewBack("");
                setShowAddCard(false);
                onRefresh();
            }
        } catch (err) {
            console.error("Failed to add card:", err);
        }
    };

    const totalCards = deck.card_count;
    const dueCards = deck.new_count + deck.learning_count;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold mb-2">{deck.name}</h1>
                {deck.description && (
                    <p className="text-white/60">{deck.description}</p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                    <div className="text-3xl font-bold text-blue-400">{deck.new_count}</div>
                    <div className="text-xs text-white/60 mt-1">New</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                    <div className="text-3xl font-bold text-orange-400">{deck.learning_count}</div>
                    <div className="text-xs text-white/60 mt-1">Due</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">{deck.reviewed_count}</div>
                    <div className="text-xs text-white/60 mt-1">Done</div>
                </div>
            </div>

            {/* Study Buttons */}
            <div className="flex gap-3 mb-8">
                {dueCards > 0 ? (
                    <button
                        onClick={onStartStudy}
                        className="flex-1 bg-sky-600 text-white font-medium py-3 rounded-lg hover:bg-sky-500 transition"
                    >
                        Study Now ({dueCards} due)
                    </button>
                ) : (
                    <div className="flex-1 text-center py-3 rounded-lg bg-white/5 border border-white/10 text-white/40 text-sm">
                        All caught up!
                    </div>
                )}
                {totalCards > 0 && (
                    <button
                        onClick={onStartStudyAll}
                        className="px-6 py-3 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition font-medium"
                    >
                        Study All
                    </button>
                )}
            </div>

            {/* Cards List */}
            <div className="border border-white/10 rounded-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-sm text-white/60">{totalCards} cards</span>
                    <button
                        onClick={() => setShowAddCard(true)}
                        className="text-sm text-sky-400 hover:text-sky-300 transition"
                    >
                        + Add Card
                    </button>
                </div>

                {showAddCard && (
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <input
                            type="text"
                            placeholder="Front (question)"
                            value={newFront}
                            onChange={(e) => setNewFront(e.target.value)}
                            autoFocus
                            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-sky-500/60"
                        />
                        <input
                            type="text"
                            placeholder="Back (answer)"
                            value={newBack}
                            onChange={(e) => setNewBack(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-sky-500/60"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddCard}
                                className="flex-1 bg-sky-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-sky-500 transition"
                            >
                                Add Card
                            </button>
                            <button
                                onClick={() => setShowAddCard(false)}
                                className="flex-1 border border-white/20 rounded-lg py-2 text-sm hover:bg-white/10 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="p-8 text-center text-white/40">Loading cards...</div>
                ) : cards.length === 0 ? (
                    <div className="p-8 text-center text-white/40">
                        No cards yet. Add your first card!
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {cards.map((card) => (
                            <div key={card.id} className="px-4 py-3 flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{card.front}</div>
                                    <div className="text-sm text-white/50 mt-1">{card.back}</div>
                                </div>
                                <span
                                    className={`text-xs px-2 py-1 rounded ${card.status === "new"
                                            ? "bg-blue-500/20 text-blue-400"
                                            : card.status === "learning"
                                                ? "bg-orange-500/20 text-orange-400"
                                                : "bg-green-500/20 text-green-400"
                                        }`}
                                >
                                    {card.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
