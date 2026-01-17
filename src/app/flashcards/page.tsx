"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BACKEND_URL } from "@/lib/env";
import DeckSidebar from "@/components/flashcards/DeckSidebar";
import DeckHome from "@/components/flashcards/DeckHome";
import StudyMode from "@/components/flashcards/StudyMode";

export type Deck = {
    id: number;
    name: string;
    description: string | null;
    card_count: number;
    new_count: number;
    learning_count: number;
    reviewed_count: number;
};

export type Card = {
    id: number;
    deck_id: number;
    front: string;
    back: string;
    status: string;
    review_count?: number;
};

export default function FlashcardsPage() {
    const { session, isAuthenticated } = useAuth();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [activeDeckId, setActiveDeckId] = useState<number | null>(null);
    const [isStudying, setIsStudying] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchDecks = useCallback(async () => {
        if (!session?.access_token) return;

        try {
            const res = await fetch(`${BACKEND_URL}/decks`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDecks(data);
                if (data.length > 0 && !activeDeckId) {
                    setActiveDeckId(data[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch decks:", err);
        } finally {
            setLoading(false);
        }
    }, [session?.access_token, activeDeckId]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchDecks();
        }
    }, [isAuthenticated, fetchDecks]);

    const handleCreateDeck = async (name: string, description: string) => {
        if (!session?.access_token) return;

        try {
            const res = await fetch(`${BACKEND_URL}/decks`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, description }),
            });
            if (res.ok) {
                const newDeck = await res.json();
                setDecks((prev) => [...prev, newDeck]);
                setActiveDeckId(newDeck.id);
            }
        } catch (err) {
            console.error("Failed to create deck:", err);
        }
    };

    const activeDeck = decks.find((d) => d.id === activeDeckId) || null;

    if (!isAuthenticated) {
        return (
            <main className="min-h-[calc(100vh-56px)] bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold mb-4">Flashcards</h1>
                    <p className="text-white/60">Please log in to access your flashcards.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-56px)] bg-black text-white flex">
            {/* Deck Sidebar */}
            <DeckSidebar
                decks={decks}
                activeDeckId={activeDeckId}
                onSelectDeck={(id) => {
                    setActiveDeckId(id);
                    setIsStudying(false);
                }}
                onCreateDeck={handleCreateDeck}
                loading={loading}
            />

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-auto">
                {activeDeck ? (
                    isStudying ? (
                        <StudyMode
                            deck={activeDeck}
                            session={session}
                            onExit={() => {
                                setIsStudying(false);
                                fetchDecks();
                            }}
                        />
                    ) : (
                        <DeckHome
                            deck={activeDeck}
                            session={session}
                            onStartStudy={() => setIsStudying(true)}
                            onRefresh={fetchDecks}
                        />
                    )
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-white/40">
                            {loading ? "Loading..." : "Select a deck or create a new one"}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
