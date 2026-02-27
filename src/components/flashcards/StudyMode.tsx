"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Deck } from "@/app/flashcards/page";
import type { Session } from "@supabase/supabase-js";
import { BACKEND_URL } from "@/lib/env";
import FlashCard from "./FlashCard";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type ReviewEntry = {
    cardId: number;
    remindValue: number;
    remindUnit: "min" | "hr" | "day";
    label: string;
    durationMs: number;
};

type SessionStats = {
    totalReviewed: number;
    timeSpentMs: number;
    reviews: ReviewEntry[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS = [
    {
        remindValue: 1,
        remindUnit: "min" as const,
        label: "Again",
        shortLabel: "1 min",
        key: "1",
        bg: "bg-red-700 hover:bg-red-600",
        bar: "bg-red-600",
    },
    {
        remindValue: 10,
        remindUnit: "min" as const,
        label: "Hard",
        shortLabel: "10 min",
        key: "2",
        bg: "bg-orange-700 hover:bg-orange-600",
        bar: "bg-orange-600",
    },
    {
        remindValue: 1,
        remindUnit: "day" as const,
        label: "Good",
        shortLabel: "1 day",
        key: "3",
        bg: "bg-blue-700 hover:bg-blue-600",
        bar: "bg-blue-600",
    },
    {
        remindValue: 7,
        remindUnit: "day" as const,
        label: "Easy",
        shortLabel: "1 week",
        key: "4",
        bg: "bg-green-700 hover:bg-green-600",
        bar: "bg-green-600",
    },
];

function storageKey(deckId: number, studyAll: boolean) {
    return `fc_session_${deckId}_${studyAll ? "all" : "due"}`;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function fmtTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtCountdown(seconds: number) {
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// ─── Keyboard shortcut pill ───────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded text-[10px] font-mono font-semibold bg-white/15 text-white/80 border border-white/20 shadow-sm">
            {children}
        </kbd>
    );
}

// ─── Session summary screen ───────────────────────────────────────────────────

function SessionSummary({
    stats,
    onExit,
}: {
    stats: SessionStats;
    onExit: () => void;
}) {
    const totalSec = Math.round(stats.timeSpentMs / 1000);
    const knownCount = stats.reviews.filter(
        (r) => r.remindUnit === "day" && r.remindValue >= 1
    ).length;
    const knownPct =
        stats.reviews.length > 0
            ? Math.round((knownCount / stats.reviews.length) * 100)
            : 0;
    const avgSec =
        stats.reviews.length > 0
            ? Math.round(
                  stats.reviews.reduce((s, r) => s + r.durationMs, 0) /
                      stats.reviews.length /
                      1000
              )
            : 0;

    return (
        <div className="max-w-xl mx-auto py-8 px-2">
            <div className="text-center mb-8">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-2xl font-bold">Session Complete!</h2>
                <p className="text-white/50 mt-1">Great work — here&apos;s how it went</p>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-sky-400">{stats.totalReviewed}</div>
                    <div className="text-xs text-white/50 mt-1">Cards Reviewed</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">{fmtTime(totalSec)}</div>
                    <div className="text-xs text-white/50 mt-1">Total Time</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">{knownPct}%</div>
                    <div className="text-xs text-white/50 mt-1">Known (Good + Easy)</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-orange-400">{fmtTime(avgSec)}</div>
                    <div className="text-xs text-white/50 mt-1">Avg. Time / Card</div>
                </div>
            </div>

            {/* Difficulty breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">
                    Difficulty Breakdown
                </h3>
                <div className="space-y-2">
                    {DIFFICULTY_OPTIONS.map((opt) => {
                        const count = stats.reviews.filter((r) => r.label === opt.label).length;
                        const pct =
                            stats.totalReviewed > 0
                                ? Math.round((count / stats.totalReviewed) * 100)
                                : 0;
                        return (
                            <div key={opt.label} className="flex items-center gap-3">
                                <div className="text-sm w-12 text-white/70">{opt.label}</div>
                                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${opt.bar} transition-all`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="text-sm text-white/50 w-8 text-right">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onExit}
                    className="bg-sky-600 text-white px-10 py-3 rounded-lg font-medium hover:bg-sky-500 transition"
                >
                    Back to Deck
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudyMode({
    deck,
    session,
    onExit,
    studyAll,
    onStartStudyAll,
}: StudyModeProps) {
    const [cards, setCards] = useState<StudyCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Session history & stats
    const [reviewHistory, setReviewHistory] = useState<ReviewEntry[]>([]);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [stats, setStats] = useState<SessionStats | null>(null);

    // Timestamps
    const sessionStartTime = useRef(Date.now());
    const [cardStartTime, setCardStartTime] = useState(Date.now());

    // UI toggles
    const [showShortcuts, setShowShortcuts] = useState(true);
    const [showTimer, setShowTimer] = useState(false);
    const [cardElapsed, setCardElapsed] = useState(0); // seconds
    const [isShuffled, setIsShuffled] = useState(false);

    // "I don't know" — highlight the Again button after auto-flip
    const [idkMode, setIdkMode] = useState(false);

    // Progress persistence
    const [resumeData, setResumeData] = useState<{
        cards: StudyCard[];
        index: number;
        history: ReviewEntry[];
    } | null>(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    // Timer interval
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const saveProgress = useCallback(
        (cardList: StudyCard[], idx: number, history: ReviewEntry[]) => {
            try {
                localStorage.setItem(
                    storageKey(deck.id, !!studyAll),
                    JSON.stringify({
                        cards: cardList,
                        currentIndex: idx,
                        reviewHistory: history,
                        savedAt: Date.now(),
                    })
                );
            } catch {
                /* ignore */
            }
        },
        [deck.id, studyAll]
    );

    const clearProgress = useCallback(() => {
        try {
            localStorage.removeItem(storageKey(deck.id, !!studyAll));
        } catch {
            /* ignore */
        }
    }, [deck.id, studyAll]);

    const resetCardTimer = useCallback(() => {
        setCardElapsed(0);
        setCardStartTime(Date.now());
    }, []);

    // ── Fetch cards ────────────────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            if (!session?.access_token) return;
            setLoading(true);
            try {
                const endpoint = studyAll
                    ? `${BACKEND_URL}/decks/${deck.id}/study-all`
                    : `${BACKEND_URL}/decks/${deck.id}/study?limit=20`;
                const res = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (!res.ok) return;
                const fetched: StudyCard[] = await res.json();

                // Check for saved session
                const saved = localStorage.getItem(storageKey(deck.id, !!studyAll));
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const age = Date.now() - (parsed.savedAt ?? 0);
                        if (age < 24 * 60 * 60 * 1000 && parsed.currentIndex < parsed.cards.length) {
                            setResumeData({
                                cards: parsed.cards,
                                index: parsed.currentIndex,
                                history: parsed.reviewHistory ?? [],
                            });
                            setCards(fetched);
                            setShowResumePrompt(true);
                            setLoading(false);
                            return;
                        }
                    } catch {
                        /* ignore */
                    }
                }

                setCards(fetched);
            } catch (err) {
                console.error("Failed to fetch study cards:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [deck.id, session?.access_token, studyAll]);

    // ── Card-level timer ───────────────────────────────────────────────────────

    useEffect(() => {
        if (!showTimer || sessionComplete) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => setCardElapsed((s) => s + 1), 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [showTimer, sessionComplete]);

    // ── Handle review ──────────────────────────────────────────────────────────

    const handleReview = useCallback(
        async (remindValue: number, remindUnit: "min" | "hr" | "day", label: string) => {
            const currentCard = cards[currentIndex];
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
                    const duration = Date.now() - cardStartTime;
                    const entry: ReviewEntry = {
                        cardId: currentCard.id,
                        remindValue,
                        remindUnit,
                        label,
                        durationMs: duration,
                    };
                    const newHistory = [...reviewHistory, entry];
                    const newIndex = currentIndex + 1;

                    setReviewHistory(newHistory);
                    setIsFlipped(false);
                    setIdkMode(false);
                    setCurrentIndex(newIndex);
                    resetCardTimer();

                    if (newIndex >= cards.length) {
                        clearProgress();
                        setStats({
                            totalReviewed: newHistory.length,
                            timeSpentMs: Date.now() - sessionStartTime.current,
                            reviews: newHistory,
                        });
                        setSessionComplete(true);
                    } else {
                        saveProgress(cards, newIndex, newHistory);
                    }
                }
            } catch (err) {
                console.error("Failed to schedule review:", err);
            } finally {
                setSubmitting(false);
            }
        },
        [
            cards,
            currentIndex,
            session?.access_token,
            submitting,
            cardStartTime,
            reviewHistory,
            clearProgress,
            saveProgress,
            resetCardTimer,
        ]
    );

    // ── Undo ──────────────────────────────────────────────────────────────────

    const handleUndo = useCallback(() => {
        if (currentIndex === 0 || reviewHistory.length === 0) return;
        const newIndex = currentIndex - 1;
        const newHistory = reviewHistory.slice(0, -1);
        setCurrentIndex(newIndex);
        setReviewHistory(newHistory);
        setIsFlipped(false);
        setIdkMode(false);
        resetCardTimer();
        saveProgress(cards, newIndex, newHistory);
    }, [currentIndex, reviewHistory, cards, saveProgress, resetCardTimer]);

    // ── I Don't Know ──────────────────────────────────────────────────────────

    const handleIDontKnow = useCallback(() => {
        if (isFlipped) return;
        setIsFlipped(true);
        setIdkMode(true);
    }, [isFlipped]);

    // ── Shuffle ───────────────────────────────────────────────────────────────

    const handleShuffle = useCallback(() => {
        const reviewed = cards.slice(0, currentIndex);
        const remaining = shuffle(cards.slice(currentIndex));
        const newCards = [...reviewed, ...remaining];
        setCards(newCards);
        setIsShuffled((s) => !s);
        saveProgress(newCards, currentIndex, reviewHistory);
    }, [cards, currentIndex, reviewHistory, saveProgress]);

    // ── Keyboard shortcuts ────────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            if (sessionComplete || loading || showResumePrompt) return;

            switch (e.key) {
                case " ":
                case "Enter":
                    e.preventDefault();
                    if (!isFlipped) setIsFlipped(true);
                    break;
                case "1":
                    if (isFlipped) handleReview(1, "min", "Again");
                    break;
                case "2":
                    if (isFlipped) handleReview(10, "min", "Hard");
                    break;
                case "3":
                    if (isFlipped) handleReview(1, "day", "Good");
                    break;
                case "4":
                    if (isFlipped) handleReview(7, "day", "Easy");
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    handleUndo();
                    break;
                case "k":
                case "K":
                    if (!isFlipped) handleIDontKnow();
                    break;
                case "u":
                case "U":
                    handleUndo();
                    break;
            }
        };

        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [
        isFlipped,
        sessionComplete,
        loading,
        showResumePrompt,
        handleReview,
        handleUndo,
        handleIDontKnow,
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Derived values
    // ─────────────────────────────────────────────────────────────────────────

    const currentCard = cards[currentIndex];
    const totalCards = cards.length;

    // ── Resume prompt ─────────────────────────────────────────────────────────

    if (showResumePrompt && resumeData) {
        const remaining = resumeData.cards.length - resumeData.index;
        return (
            <div className="max-w-md mx-auto text-center py-16 px-4">
                <div className="text-3xl mb-3">💾</div>
                <h2 className="text-xl font-semibold mb-2">Resume session?</h2>
                <p className="text-white/50 mb-6 text-sm">
                    You left off at card {resumeData.index + 1} of {resumeData.cards.length} —
                    {" "}{remaining} card{remaining !== 1 ? "s" : ""} remaining.
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => {
                            setCards(resumeData.cards);
                            setCurrentIndex(resumeData.index);
                            setReviewHistory(resumeData.history);
                            setShowResumePrompt(false);
                            setCardStartTime(Date.now());
                        }}
                        className="bg-sky-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-sky-500 transition"
                    >
                        Resume
                    </button>
                    <button
                        onClick={() => {
                            clearProgress();
                            setShowResumePrompt(false);
                        }}
                        className="border border-white/20 text-white/70 px-6 py-2 rounded-lg font-medium hover:bg-white/5 transition"
                    >
                        Start Fresh
                    </button>
                </div>
            </div>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-white/40">Loading cards…</p>
            </div>
        );
    }

    // ── No cards due ──────────────────────────────────────────────────────────

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

    // ── Session complete ──────────────────────────────────────────────────────

    if (sessionComplete && stats) {
        return <SessionSummary stats={stats} onExit={onExit} />;
    }

    // ── Active study ──────────────────────────────────────────────────────────

    return (
        <div className="max-w-2xl mx-auto">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-5">
                <button
                    onClick={onExit}
                    className="text-white/50 hover:text-white text-sm transition"
                >
                    ← Exit
                </button>

                <div className="flex items-center gap-2 text-sm text-white/60">
                    <span className="font-medium">
                        {currentIndex + 1} / {totalCards}
                    </span>
                    {studyAll && <span className="text-sky-400 text-xs">(all)</span>}
                    {showTimer && (
                        <span className="font-mono text-white/35 bg-white/5 px-2 py-0.5 rounded text-xs">
                            {fmtCountdown(cardElapsed)}
                        </span>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowTimer((t) => !t)}
                        title="Toggle card timer"
                        className={`text-sm px-2 py-1 rounded transition ${
                            showTimer
                                ? "bg-amber-600/25 text-amber-400"
                                : "text-white/30 hover:text-white/60 hover:bg-white/5"
                        }`}
                    >
                        ⏱
                    </button>
                    <button
                        onClick={handleShuffle}
                        title="Shuffle remaining cards"
                        className={`text-sm px-2 py-1 rounded transition ${
                            isShuffled
                                ? "bg-purple-600/25 text-purple-400"
                                : "text-white/30 hover:text-white/60 hover:bg-white/5"
                        }`}
                    >
                        ⇌
                    </button>
                    <button
                        onClick={() => setShowShortcuts((s) => !s)}
                        title="Toggle keyboard shortcuts"
                        className={`text-sm px-2 py-1 rounded transition ${
                            showShortcuts
                                ? "bg-white/10 text-white/70"
                                : "text-white/30 hover:text-white/60 hover:bg-white/5"
                        }`}
                    >
                        ⌨
                    </button>
                </div>
            </div>

            {/* ── Progress bar ── */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
                <div
                    className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                    style={{ width: `${(currentIndex / totalCards) * 100}%` }}
                />
            </div>

            {/* ── Keyboard shortcuts panel ── */}
            {showShortcuts && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-5">
                    <div className="text-[10px] text-white/35 uppercase tracking-widest mb-2">
                        Keyboard Shortcuts
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/60">
                        <span className="flex items-center gap-1.5">
                            <Kbd>Space</Kbd> flip
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd>1</Kbd> Again (1 min)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd>2</Kbd> Hard (10 min)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd>3</Kbd> Good (1 day)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd>4</Kbd> Easy (1 week)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd>K</Kbd> I don&apos;t know
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd>←</Kbd> or <Kbd>U</Kbd> undo
                        </span>
                    </div>
                </div>
            )}

            {/* ── Flash card ── */}
            <FlashCard
                front={currentCard.front}
                back={currentCard.back}
                isFlipped={isFlipped}
                onFlip={() => {
                    setIsFlipped((f) => !f);
                    if (!isFlipped) setIdkMode(false);
                }}
                onSwipeLeft={() => {
                    if (isFlipped) handleReview(1, "min", "Again");
                }}
                onSwipeRight={() => {
                    if (isFlipped) handleReview(7, "day", "Easy");
                }}
            />

            {/* ── Before flip: I don't know ── */}
            {!isFlipped && (
                <div className="flex justify-center mt-5">
                    <button
                        onClick={handleIDontKnow}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-red-950/40 hover:border-red-500/30 transition"
                    >
                        I don&apos;t know — show answer
                    </button>
                </div>
            )}

            {/* ── After flip: difficulty buttons ── */}
            {isFlipped && (
                <div className="mt-6">
                    {/* Mobile swipe hint */}
                    <div className="text-center text-xs text-white/30 mb-3 sm:hidden">
                        ← swipe for Again &nbsp;|&nbsp; swipe for Easy →
                    </div>

                    {idkMode && (
                        <div className="text-center text-xs text-amber-400/80 mb-3">
                            Marked as &apos;don&apos;t know&apos; — choose how soon to review again:
                        </div>
                    )}

                    <div className="flex items-stretch justify-center gap-2">
                        {DIFFICULTY_OPTIONS.map((opt) => {
                            const isHighlighted = idkMode && opt.label === "Again";
                            return (
                                <button
                                    key={opt.key}
                                    onClick={() =>
                                        handleReview(opt.remindValue, opt.remindUnit, opt.label)
                                    }
                                    disabled={submitting}
                                    className={`flex flex-col items-center px-3 py-3 rounded-xl text-white disabled:opacity-50 transition flex-1 ${opt.bg} ${
                                        isHighlighted
                                            ? "ring-2 ring-white/50 scale-105"
                                            : ""
                                    }`}
                                >
                                    <span className="text-[11px] opacity-55 mb-0.5 font-mono">
                                        [{opt.key}]
                                    </span>
                                    <span className="text-sm font-semibold">{opt.label}</span>
                                    <span className="text-[11px] opacity-65 mt-0.5">
                                        {opt.shortLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Undo */}
                    {currentIndex > 0 && (
                        <div className="flex justify-center mt-3">
                            <button
                                onClick={handleUndo}
                                className="text-xs text-white/30 hover:text-white/60 transition px-3 py-1.5 rounded border border-transparent hover:border-white/10 flex items-center gap-1.5"
                            >
                                <span>←</span>
                                <span>Undo last rating</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
