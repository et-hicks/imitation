"use client";

import { useState } from "react";
import type { Deck } from "@/app/flashcards/page";

type DeckSidebarProps = {
    decks: Deck[];
    activeDeckId: number | null;
    onSelectDeck: (id: number) => void;
    onCreateDeck: (name: string, description: string) => void;
    loading: boolean;
};

export default function DeckSidebar({
    decks,
    activeDeckId,
    onSelectDeck,
    onCreateDeck,
    loading,
}: DeckSidebarProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");

    const handleCreate = () => {
        if (newName.trim()) {
            onCreateDeck(newName.trim(), newDesc.trim());
            setNewName("");
            setNewDesc("");
            setShowCreate(false);
        }
    };

    return (
        <aside className="w-56 border-r border-white/10 flex flex-col h-[calc(100vh-56px)]">
            <div className="p-4 border-b border-white/10">
                <h2 className="text-sm font-medium text-white/60 flex items-center gap-2">
                    <span className="text-pink-400">←</span> Decks
                </h2>
            </div>

            {/* Scrollable deck list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                    <p className="text-white/40 text-sm text-center py-4">Loading...</p>
                ) : decks.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-4">No decks yet</p>
                ) : (
                    decks.map((deck) => (
                        <button
                            key={deck.id}
                            onClick={() => onSelectDeck(deck.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${activeDeckId === deck.id
                                    ? "border-white/40 bg-white/10"
                                    : "border-white/20 hover:border-white/30 hover:bg-white/5"
                                }`}
                        >
                            <div className="font-medium text-sm truncate">{deck.name}</div>
                            <div className="flex gap-2 mt-1 text-xs">
                                {deck.new_count > 0 && (
                                    <span className="text-red-400">{deck.new_count}</span>
                                )}
                                {deck.learning_count > 0 && (
                                    <span className="text-yellow-400">{deck.learning_count}</span>
                                )}
                                {deck.reviewed_count > 0 && (
                                    <span className="text-green-400">{deck.reviewed_count}</span>
                                )}
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Add Deck */}
            <div className="p-3 border-t border-white/10">
                {showCreate ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Deck Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40"
                        />
                        <input
                            type="text"
                            placeholder="Subject (optional)"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreate}
                                className="flex-1 bg-white text-black rounded py-1 text-sm font-medium hover:bg-gray-200"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 border border-white/20 rounded py-1 text-sm hover:bg-white/10"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-full text-left text-sm text-white/60 hover:text-white py-2"
                    >
                        + Add Deck
                    </button>
                )}
            </div>
        </aside>
    );
}
