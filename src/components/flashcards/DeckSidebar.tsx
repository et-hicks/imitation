"use client";

import { useState } from "react";
import type { Deck } from "@/app/flashcards/page";

type DeckSidebarProps = {
    decks: Deck[];
    activeDeckId: number | null;
    onSelectDeck: (id: number) => void;
    onCreateDeck: (name: string, description: string) => void;
    onDeleteDeck: (id: number) => void;
    onReorder: (newDecks: Deck[]) => void;
    onRefresh: () => void;
    loading: boolean;
};

export default function DeckSidebar({
    decks,
    activeDeckId,
    onSelectDeck,
    onCreateDeck,
    onDeleteDeck,
    onReorder,
    onRefresh,
    loading,
}: DeckSidebarProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };
    const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    const handleCreate = () => {
        if (newName.trim()) {
            onCreateDeck(newName.trim(), newDesc.trim());
            setNewName("");
            setNewDesc("");
            setShowCreate(false);
        }
    };

    const handleDrop = (toIdx: number) => {
        if (dragSrcIdx === null || dragSrcIdx === toIdx) return;
        const newDecks = [...decks];
        const [moved] = newDecks.splice(dragSrcIdx, 1);
        newDecks.splice(toIdx, 0, moved);
        onReorder(newDecks);
        setDragSrcIdx(null);
        setDragOverIdx(null);
    };

    return (
        <aside className="w-60 border-r border-white/10 flex flex-col h-[calc(100vh-56px)] bg-[#0a0a0a]">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                    Decks
                </h2>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition text-sm disabled:opacity-30"
                        title="Refresh decks"
                    >
                        <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition text-lg leading-none"
                        title="Create new deck"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Create deck inline form */}
            {showCreate && (
                <div className="p-3 border-b border-white/10 bg-white/5 space-y-2">
                    <input
                        type="text"
                        placeholder="Deck name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500/60"
                    />
                    <input
                        type="text"
                        placeholder="Subject (optional)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500/60"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            className="flex-1 bg-sky-600 text-white rounded-lg py-1.5 text-sm font-medium hover:bg-sky-500 transition"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="flex-1 border border-white/20 rounded-lg py-1.5 text-sm hover:bg-white/10 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Scrollable deck list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <p className="text-white/40 text-sm text-center py-4">Loading...</p>
                ) : decks.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-4">No decks yet</p>
                ) : (
                    decks.map((deck, i) => {
                        const isActive = activeDeckId === deck.id;
                        const isDragging = dragSrcIdx === i;
                        const isOver = dragOverIdx === i && dragSrcIdx !== i;
                        const total = deck.new_count + deck.learning_count + deck.reviewed_count;
                        return (
                            <div
                                key={deck.id}
                                draggable
                                onDragStart={(e) => {
                                    setDragSrcIdx(i);
                                    e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                    if (dragOverIdx !== i) setDragOverIdx(i);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleDrop(i);
                                }}
                                onDragEnd={() => {
                                    setDragSrcIdx(null);
                                    setDragOverIdx(null);
                                }}
                                className={`group relative w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer select-none ${
                                    isActive
                                        ? "bg-sky-600/20 border border-sky-500/40 text-white"
                                        : "border border-transparent hover:bg-white/5 text-white/80"
                                } ${isDragging ? "opacity-40" : ""} ${
                                    isOver ? "border-t-2 border-t-sky-400" : ""
                                }`}
                                onClick={() => onSelectDeck(deck.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="opacity-0 group-hover:opacity-30 text-white mr-1.5 text-xs cursor-grab active:cursor-grabbing">
                                        ⠿
                                    </span>
                                    <div className="font-medium text-sm truncate flex-1">{deck.name}</div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete deck "${deck.name}" and all its cards?`)) {
                                                onDeleteDeck(deck.id);
                                            }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition text-sm px-1 ml-1"
                                        title="Delete deck"
                                    >
                                        &times;
                                    </button>
                                </div>
                                <div className="flex gap-3 mt-1 text-xs">
                                    {deck.new_count > 0 && (
                                        <span className="text-blue-400">{deck.new_count} new</span>
                                    )}
                                    {deck.learning_count > 0 && (
                                        <span className="text-orange-400">{deck.learning_count} due</span>
                                    )}
                                    {total === 0 && (
                                        <span className="text-white/30">empty</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
}
