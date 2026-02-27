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

type EditState = {
    front: string;
    back: string;
};

export default function DeckHome({ deck, session, onStartStudy, onStartStudyAll, onRefresh }: DeckHomeProps) {
    const [cards, setCards] = useState<Card[]>([]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [newFront, setNewFront] = useState("");
    const [newBack, setNewBack] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingCardId, setEditingCardId] = useState<number | null>(null);
    const [editState, setEditState] = useState<EditState>({ front: "", back: "" });
    const [savingEdit, setSavingEdit] = useState(false);

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

    const handleDeleteCard = async (cardId: number) => {
        if (!session?.access_token) return;
        if (!confirm("Delete this card?")) return;

        try {
            const res = await fetch(`${BACKEND_URL}/cards/${cardId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                setCards((prev) => prev.filter((c) => c.id !== cardId));
                onRefresh();
            }
        } catch (err) {
            console.error("Failed to delete card:", err);
        }
    };

    const startEditing = (card: Card) => {
        setEditingCardId(card.id);
        setEditState({ front: card.front, back: card.back });
    };

    const cancelEditing = () => {
        setEditingCardId(null);
        setEditState({ front: "", back: "" });
    };

    const handleSaveEdit = async (cardId: number) => {
        if (!session?.access_token || savingEdit) return;
        if (!editState.front.trim() || !editState.back.trim()) return;

        setSavingEdit(true);
        try {
            const res = await fetch(`${BACKEND_URL}/cards/${cardId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    front: editState.front.trim(),
                    back: editState.back.trim(),
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
                setEditingCardId(null);
                setEditState({ front: "", back: "" });
            }
        } catch (err) {
            console.error("Failed to update card:", err);
        } finally {
            setSavingEdit(false);
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
                        onClick={() => {
                            setShowAddCard(true);
                            setEditingCardId(null);
                        }}
                        className="text-sm text-sky-400 hover:text-sky-300 transition"
                    >
                        + Add Card
                    </button>
                </div>

                {/* Add card form */}
                {showAddCard && (
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">New Card — supports **markdown** and `code`</div>
                        <textarea
                            placeholder="Front — question or prompt"
                            value={newFront}
                            onChange={(e) => setNewFront(e.target.value)}
                            autoFocus
                            rows={3}
                            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-sky-500/60 resize-y font-mono"
                        />
                        <textarea
                            placeholder="Back — answer (supports markdown, code blocks, image URLs)"
                            value={newBack}
                            onChange={(e) => setNewBack(e.target.value)}
                            rows={3}
                            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-sky-500/60 resize-y font-mono"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddCard}
                                className="flex-1 bg-sky-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-sky-500 transition"
                            >
                                Add Card
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddCard(false);
                                    setNewFront("");
                                    setNewBack("");
                                }}
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
                            <div key={card.id}>
                                {editingCardId === card.id ? (
                                    /* ── Inline edit form ── */
                                    <div className="px-4 py-3 bg-white/5">
                                        <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">Edit Card</div>
                                        <textarea
                                            value={editState.front}
                                            onChange={(e) => setEditState((s) => ({ ...s, front: e.target.value }))}
                                            autoFocus
                                            rows={3}
                                            placeholder="Front"
                                            className="w-full bg-black border border-sky-500/40 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-sky-500/60 resize-y font-mono"
                                        />
                                        <textarea
                                            value={editState.back}
                                            onChange={(e) => setEditState((s) => ({ ...s, back: e.target.value }))}
                                            rows={3}
                                            placeholder="Back"
                                            className="w-full bg-black border border-sky-500/40 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-sky-500/60 resize-y font-mono"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveEdit(card.id)}
                                                disabled={savingEdit}
                                                className="flex-1 bg-sky-600 text-white rounded-lg py-1.5 text-sm font-medium hover:bg-sky-500 transition disabled:opacity-50"
                                            >
                                                {savingEdit ? "Saving…" : "Save"}
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="flex-1 border border-white/20 rounded-lg py-1.5 text-sm hover:bg-white/10 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Card row ── */
                                    <div className="px-4 py-3 flex justify-between items-start group">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{card.front}</div>
                                            <div className="text-xs text-white/40 truncate mt-0.5">{card.back}</div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${
                                                    card.status === "new"
                                                        ? "bg-blue-500/20 text-blue-400"
                                                        : card.status === "learning"
                                                        ? "bg-orange-500/20 text-orange-400"
                                                        : "bg-green-500/20 text-green-400"
                                                }`}
                                            >
                                                {card.status}
                                            </span>
                                            {/* Edit button */}
                                            <button
                                                onClick={() => startEditing(card)}
                                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-sky-400 transition text-xs px-1.5 py-1 rounded hover:bg-sky-400/10"
                                                title="Edit card"
                                            >
                                                ✎
                                            </button>
                                            {/* Delete button */}
                                            <button
                                                onClick={() => handleDeleteCard(card.id)}
                                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition text-sm px-1"
                                                title="Delete card"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Markdown hint */}
            <p className="text-xs text-white/25 mt-3 text-center">
                Cards support{" "}
                <span className="font-mono">**bold**</span>,{" "}
                <span className="font-mono">*italic*</span>,{" "}
                <span className="font-mono">`code`</span>, code blocks, lists, and image URLs
            </p>
        </div>
    );
}
